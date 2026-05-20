/**
 * CEIA Juanita Zúñiga - Protocol Management System
 * Features: Dynamic card generation, real-time search, category filters, 
 *           sticky two-column modal layout, print/PDF system, smart parser
 */

const ProtocolApp = {
    state: {
        data: null,
        activeProtocolKey: null,
        isModalOpen: false,
        isLoading: true,
        searchQuery: '',
        selectedCategory: 'all'
    },

    ui: {
        modalOverlay: null,
        modalContent: null,
        body: null,
        protocolContainer: null,
        searchInput: null,
        searchClear: null,
        filterTabs: null
    },

    async init() {
        this.cacheUI();
        await this.loadData();
        this.updateFilterCounts();
        this.filterAndRenderCards();
        this.bindEvents();
        this.updateURLFromHash();
    },

    cacheUI() {
        this.ui.modalOverlay = document.getElementById('modal-overlay');
        this.ui.modalContent = document.getElementById('modal-content');
        this.ui.body = document.body;
        this.ui.protocolContainer = document.getElementById('protocol-container');
        this.ui.searchInput = document.getElementById('search-input');
        this.ui.searchClear = document.getElementById('search-clear');
        this.ui.filterTabs = document.getElementById('filter-tabs');
    },

    async loadData() {
        this.state.isLoading = true;
        this.renderLoading();
        try {
            const response = await fetch('./data/protocolos.json');
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            this.state.data = await response.json();
            this.validateData();
        } catch (error) {
            console.error('Error loading protocols:', error);
            this.renderError(error.message);
        } finally {
            this.state.isLoading = false;
        }
    },

    validateData() {
        if (!this.state.data || typeof this.state.data !== 'object') {
            throw new Error('Invalid data structure');
        }
    },

    renderLoading() {
        if (!this.ui.protocolContainer) return;
        this.ui.protocolContainer.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 4rem 2rem;">
                <div style="font-size: 3rem; margin-bottom: 1.5rem; animation: spin 1.5s linear infinite;">⏳</div>
                <p style="font-size: 1.2rem; color: var(--text-muted); font-weight: 500;">Cargando reglamentos y protocolos oficiales...</p>
            </div>
        `;
    },

    renderError(message) {
        if (!this.ui.protocolContainer) return;
        this.ui.protocolContainer.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 3rem; background: #fff5f5; border-radius: 20px; border: 1px solid rgba(220, 38, 38, 0.15); box-shadow: var(--shadow-premium);">
                <div style="font-size: 3rem; margin-bottom: 1rem;">❌</div>
                <h3 style="font-size: 1.5rem; color: #dc2626; margin-bottom: 0.5rem;">Error al cargar la información</h3>
                <p style="color: var(--text-muted);">${this.escapeHtml(message)}</p>
                <button onclick="location.reload()" style="margin-top: 1.5rem; padding: 0.8rem 2rem; background: var(--primary); color: white; border: none; border-radius: 12px; font-weight: 600; cursor: pointer; transition: var(--transition);">Reintentar</button>
            </div>
        `;
    },

    escapeHtml(text) {
        if (typeof text !== 'string') return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    updateFilterCounts() {
        if (!this.state.data) return;
        
        const entries = Object.values(this.state.data);
        const total = entries.length;
        const documentos = entries.filter(e => e.tipo === 'documento').length;
        const protocolos = entries.filter(e => e.tipo === 'protocolo').length;
        
        const countAll = document.getElementById('count-all');
        const countDoc = document.getElementById('count-documento');
        const countProt = document.getElementById('count-protocolo');
        
        if (countAll) countAll.textContent = total;
        if (countDoc) countDoc.textContent = documentos;
        if (countProt) countProt.textContent = protocolos;
    },

    updateSearchClearButton() {
        if (!this.ui.searchClear) return;
        if (this.state.searchQuery.length > 0) {
            this.ui.searchClear.style.display = 'flex';
        } else {
            this.ui.searchClear.style.display = 'none';
        }
    },

    filterAndRenderCards() {
        if (!this.ui.protocolContainer || !this.state.data) return;

        const query = this.state.searchQuery.toLowerCase().trim();
        const category = this.state.selectedCategory;
        
        let filteredEntries = Object.entries(this.state.data).filter(([key, protocol]) => {
            // Category filter
            if (category !== 'all' && protocol.tipo !== category) {
                return false;
            }
            
            // Search query filter
            if (query) {
                const matchTitle = protocol.titulo.toLowerCase().includes(query);
                const matchContent = protocol.contenido_completo.some(p => {
                    if (typeof p === 'string') {
                        return p.toLowerCase().includes(query);
                    } else if (p && typeof p === 'object' && p.type === 'table') {
                        const inHeaders = p.headers ? p.headers.some(h => h.toLowerCase().includes(query)) : false;
                        const inRows = p.rows ? p.rows.some(row => row.some(cell => cell.toLowerCase().includes(query))) : false;
                        return inHeaders || inRows;
                    }
                    return false;
                });
                return matchTitle || matchContent;
            }
            
            return true;
        });

        this.renderFilteredCards(filteredEntries);
    },

    renderFilteredCards(entries) {
        this.ui.protocolContainer.innerHTML = '';
        
        if (entries.length === 0) {
            this.ui.protocolContainer.innerHTML = `
                <div class="no-results-card" style="grid-column: 1/-1; text-align: center; padding: 4rem 2rem; background: var(--bg-dark-alt); border-radius: 24px; border: 1px solid var(--glass-border); box-shadow: var(--shadow-premium);">
                    <div style="font-size: 3.5rem; margin-bottom: 1.5rem; animation: pulse 2s infinite;">🔍</div>
                    <h3 style="font-size: 1.5rem; color: var(--primary); margin-bottom: 0.5rem;">No se encontraron resultados</h3>
                    <p style="color: var(--text-muted); max-width: 450px; margin: 0 auto 1.5rem;">
                        No pudimos encontrar reglamentos o protocolos que coincidan con "${this.escapeHtml(this.state.searchQuery)}". Intenta con otras palabras clave.
                    </p>
                    <button id="btn-reset-search" class="btn-premium" style="padding: 0.6rem 1.8rem; font-size: 0.95rem; cursor: pointer;">Limpiar Filtros</button>
                </div>
            `;
            
            document.getElementById('btn-reset-search')?.addEventListener('click', () => {
                if (this.ui.searchInput) {
                    this.ui.searchInput.value = '';
                    this.state.searchQuery = '';
                    this.updateSearchClearButton();
                }
                this.state.selectedCategory = 'all';
                this.ui.filterTabs?.querySelectorAll('.filter-tab').forEach(t => {
                    t.classList.remove('active');
                    if (t.dataset.category === 'all') t.classList.add('active');
                });
                this.filterAndRenderCards();
            });
            return;
        }

        entries.forEach(([key, protocol]) => {
            const card = document.createElement('article');
            card.className = 'protocol-card';
            card.setAttribute('role', 'button');
            card.setAttribute('tabindex', '0');
            card.setAttribute('aria-label', `Ver ${protocol.titulo}`);
            card.dataset.key = key;
            
            const isDoc = protocol.tipo === 'documento';
            const badgeHtml = `<span class="card-badge ${isDoc ? 'badge-doc' : 'badge-proto'}">${isDoc ? '🏛️ Documento' : '🛡️ Protocolo'}</span>`;
            
            const iconSrc = protocol.icono || 'https://cdn-icons-png.flaticon.com/512/3330/3330316.png';
            const hasExternalLink = !!protocol.url_externa;
            
            // Limit card title cleanly to keep grids perfectly aligned
            let shortTitle = protocol.titulo;
            if (shortTitle.includes(':')) {
                shortTitle = shortTitle.split(':')[0];
            } else if (shortTitle.includes(' - ')) {
                shortTitle = shortTitle.split(' - ')[0];
            }
            if (shortTitle.length > 55) {
                shortTitle = shortTitle.substring(0, 52) + '...';
            }
            
            card.innerHTML = `
                ${badgeHtml}
                <div class="icon-wrapper">
                    <img src="${this.escapeHtml(iconSrc)}" alt="Icono" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>📄</text></svg>'">
                </div>
                <h2>${this.escapeHtml(shortTitle)}</h2>
                <p>${hasExternalLink ? 'Enlace externo disponible' : 'Documento completo interactivo'}</p>
                <button class="btn-premium">${hasExternalLink ? 'Ver Documento ↗' : 'Acceder al Protocolo'}</button>
            `;
            
            card.addEventListener('click', () => this.openProtocol(key));
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.openProtocol(key);
                }
            });
            
            this.ui.protocolContainer.appendChild(card);
        });
    },

    bindEvents() {
        // Search Input events
        this.ui.searchInput?.addEventListener('input', (e) => {
            this.state.searchQuery = e.target.value;
            this.updateSearchClearButton();
            this.filterAndRenderCards();
        });

        this.ui.searchClear?.addEventListener('click', () => {
            if (this.ui.searchInput) {
                this.ui.searchInput.value = '';
                this.state.searchQuery = '';
                this.updateSearchClearButton();
                this.filterAndRenderCards();
                this.ui.searchInput.focus();
            }
        });

        // Category tabs events
        this.ui.filterTabs?.querySelectorAll('.filter-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.ui.filterTabs.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.state.selectedCategory = tab.dataset.category;
                this.filterAndRenderCards();
            });
        });

        // Modal events
        document.getElementById('modal-close')?.addEventListener('click', () => this.closeModal());
        
        this.ui.modalOverlay.addEventListener('click', (e) => {
            if (e.target === this.ui.modalOverlay) this.closeModal();
        });

        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.state.isModalOpen) this.closeModal();
        });
        
        window.addEventListener('hashchange', () => this.updateURLFromHash());
    },

    updateURLFromHash() {
        const hash = window.location.hash.slice(1);
        if (hash && this.state.data && this.state.data[hash]) {
            this.openProtocol(hash, false);
        }
    },

    openProtocol(key, updateHash = true) {
        if (!this.state.data || !this.state.data[key]) return;
        
        this.state.activeProtocolKey = key;
        this.state.isModalOpen = true;
        this.ui.modalOverlay.classList.add('active');
        this.ui.body.style.overflow = 'hidden';
        
        if (updateHash) {
            window.location.hash = key;
        }
        
        this.renderProtocol();
    },

    closeModal() {
        this.ui.modalOverlay.classList.remove('active');
        this.ui.body.style.overflow = '';
        this.state.isModalOpen = false;
        
        if (window.location.hash) {
            history.pushState('', document.title, window.location.pathname + window.location.search);
        }
    },

    getProtocolData() {
        return this.state.data[this.state.activeProtocolKey];
    },

    renderProtocol() {
        const data = this.getProtocolData();
        if (!data) return;
        
        const paragraphs = data.contenido_completo;
        const hasExternalLink = !!data.url_externa;

        let htmlContent = '';
        let tocHtml = '';
        let indexCount = 0;

        // Smart classification keywords for H2
        const majorHeadings = [
            "PROYECTO EDUCATIVO INSTITUCIONAL",
            "VISIÓN INSTITUCIONAL",
            "MISIÓN",
            "PRINCIPIOS Y VALORES INSTITUCIONALES",
            "OBJETIVOS ESTRATÉGICOS",
            "PERFIL DEL EGRESADO",
            "LÍNEAS DE ACCIÓN PRIORITARIAS",
            "VIGENCIA",
            "DOCUMENTO OFICIAL MINEDUC",
            "INTRODUCCIÓN",
            "OBJETIVOS DEL REGLAMENTO INTERNO",
            "MARCO NORMATIVO LEGAL",
            "ESTRATEGIAS PREVENTIVAS",
            "PLANIFICACIÓN DE ACTIVIDAD CON DISPOSITIVOS TECNOLÓGICOS",
            "MODO AULA",
            "SOLICITUD DE EXCEPCIÓN"
        ];

        paragraphs.forEach(para => {
            if (para && typeof para === 'object' && para.type === 'table') {
                let tableHtml = `<div class="table-container"><table class="premium-table">`;
                if (para.headers && para.headers.length > 0) {
                    tableHtml += `<thead><tr>`;
                    para.headers.forEach(header => {
                        tableHtml += `<th>${this.escapeHtml(header)}</th>`;
                    });
                    tableHtml += `</tr></thead>`;
                }
                if (para.rows && para.rows.length > 0) {
                    tableHtml += `<tbody>`;
                    para.rows.forEach(row => {
                        tableHtml += `<tr>`;
                        row.forEach(cell => {
                            const cellHtml = this.escapeHtml(cell).replace(/\n/g, '<br>').replace(/\\n/g, '<br>');
                            tableHtml += `<td>${cellHtml}</td>`;
                        });
                        tableHtml += `</tr>`;
                    });
                    tableHtml += `</tbody>`;
                }
                tableHtml += `</table></div>`;
                htmlContent += tableHtml;
                return;
            }

            if (typeof para !== 'string') return;
            const trimmed = para.trim();
            if (!trimmed) return;

            // Sanitize text and replace newline marks with HTML breaks
            let sanitizedText = this.escapeHtml(trimmed).replace(/\\n/g, '<br>');

            // Classification logic
            let isH2 = false;
            let isH3 = false;
            let isLi = false;

            // Check H2 major heading conditions
            const isChapter = /^(CAPITULO|CAPÍTULO|ANEXO\s*\d*)/i.test(trimmed);
            const isKnownMajor = majorHeadings.some(h => trimmed.toUpperCase().includes(h));
            
            if (isChapter || (isKnownMajor && trimmed === trimmed.toUpperCase() && trimmed.length < 120)) {
                isH2 = true;
            } 
            // Check H3 subheading conditions
            else {
                // Decimal numbering like 2.1.- or 6.2.-
                const isDecimalNumber = /^\s*[0-9]+\.[0-9]+(\.[0-9]+)*(\.-|\.|\s)/.test(trimmed);
                // Numbered headings like 1. OBJETIVO. (short, uppercase)
                const isNumberedHeading = /^\s*([0-9]+)\.\s+[A-ZÁÉÍÓÚÑ]/.test(trimmed) && trimmed === trimmed.toUpperCase() && trimmed.length < 90;

                if (isDecimalNumber || isNumberedHeading) {
                    isH3 = true;
                } else if (/^[-•]/.test(trimmed) || /^[a-z]\)/i.test(trimmed)) {
                    // Indented lists or letter-number lists (like a) or -)
                    isLi = true;
                }
            }

            if (isH2) {
                const id = `section-${indexCount++}`;
                htmlContent += `<h2 id="${id}">${sanitizedText}</h2>`;
                
                // Extract clean text for index link
                let cleanTitle = trimmed.replace(/^(CAPITULO|CAPÍTULO)\s*[0-9]+:?\s*/i, '').trim();
                if (cleanTitle.length > 55) {
                    cleanTitle = cleanTitle.substring(0, 52) + '...';
                }
                tocHtml += `<li><a href="#${id}" class="toc-link">${this.escapeHtml(cleanTitle)}</a></li>`;
            } else if (isH3) {
                const id = `section-${indexCount++}`;
                htmlContent += `<h3 id="${id}">${sanitizedText}</h3>`;
                
                let cleanSub = trimmed.replace(/^\s*[0-9]+(\.[0-9]+)*(\.-|\.|\s)\s*/, '').trim();
                if (cleanSub.length > 60) {
                    cleanSub = cleanSub.substring(0, 57) + '...';
                }
                tocHtml += `<li><a href="#${id}" class="toc-link toc-sublink">${this.escapeHtml(cleanSub)}</a></li>`;
            } else if (isLi) {
                // Remove bullet markers at start for dynamic clean lists
                const listText = sanitizedText.replace(/^[-•]\s*/, '').replace(/^[a-z]\)\s*/i, '');
                htmlContent += `<div class="indent-item">${listText}</div>`;
            } else {
                htmlContent += `<p>${sanitizedText}</p>`;
            }
        });

        // Build index section for the sidebar (desktop) and accordion (mobile)
        let sidebarHtml = '';
        let mobileTocHtml = '';
        if (tocHtml) {
            // Sidebar for desktop
            sidebarHtml = `
                <aside class="modal-sidebar">
                    <h3 class="sidebar-title">📋 Índice</h3>
                    <ul class="sidebar-toc-list">
                        ${tocHtml}
                    </ul>
                </aside>
            `;
            
            // Accordion for mobile (collapsible using details)
            mobileTocHtml = `
                <details class="mobile-toc-details">
                    <summary class="mobile-toc-summary">
                        <span>📋 Índice de Contenidos</span>
                        <svg class="accordion-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </summary>
                    <div class="mobile-toc-content">
                        <ul class="mobile-toc-list">
                            ${tocHtml}
                        </ul>
                    </div>
                </details>
            `;
        }

        const externalLinkHtml = hasExternalLink ? `
            <div class="external-link-card">
                <p>📎 Documento Original:</p>
                <a href="${this.escapeHtml(data.url_externa)}" target="_blank" rel="noopener noreferrer" class="btn-premium">
                    Abrir documento oficial ↗
                </a>
            </div>
        ` : '';

        // Render full modular layout inside the modal content
        this.ui.modalContent.innerHTML = `
            <div class="modal-header">
                <div class="modal-header-main">
                    <span class="protocol-badge">${data.tipo === 'documento' ? 'Documento' : 'Protocolo'} Oficial</span>
                    <h1>${this.escapeHtml(data.titulo)}</h1>
                </div>
                <div class="modal-header-actions">
                    <button class="btn-print" id="modal-print" aria-label="Imprimir o guardar PDF">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                        <span>Imprimir / PDF</span>
                    </button>
                </div>
            </div>
            <div class="modal-layout-container">
                ${sidebarHtml}
                <div class="modal-body document-view">
                    <div class="document-content">
                        ${mobileTocHtml}
                        ${htmlContent}
                        ${externalLinkHtml}
                    </div>
                </div>
            </div>
        `;
        
        // Reset scroll position on opening
        const modalBody = this.ui.modalContent.querySelector('.modal-body');
        if (modalBody) modalBody.scrollTop = 0;

        // Bind smooth scrolling to all TOC links
        this.ui.modalContent.querySelectorAll('.toc-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                const targetElement = document.getElementById(targetId);
                const currentModalBody = this.ui.modalContent.querySelector('.modal-body');
                
                if (targetElement && currentModalBody) {
                    // Safe browser-agnostic bounding scroll Math
                    const targetPosition = targetElement.getBoundingClientRect().top - currentModalBody.getBoundingClientRect().top + currentModalBody.scrollTop - 20;
                    currentModalBody.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                    
                    // Collapse accordion automatically on mobile click
                    const mobileDetails = this.ui.modalContent.querySelector('.mobile-toc-details');
                    if (mobileDetails && mobileDetails.hasAttribute('open')) {
                        mobileDetails.removeAttribute('open');
                    }
                }
            });
        });

        // Bind Print/PDF action
        const printBtn = this.ui.modalContent.querySelector('#modal-print');
        if (printBtn) {
            printBtn.addEventListener('click', () => {
                window.print();
            });
        }
    }
};

window.ProtocolApp = ProtocolApp;
document.addEventListener('DOMContentLoaded', () => ProtocolApp.init());
