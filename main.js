/**
 * CEIA Juanita Zúñiga - Protocol Management System
 * Features: Dynamic card generation, search, external links, loading states, accessibility
 */

const ProtocolApp = {
    state: {
        data: null,
        activeProtocolKey: null,
        isModalOpen: false,
        isLoading: true
    },

    ui: {
        modalOverlay: null,
        modalContent: null,
        body: null,
        protocolContainer: null
    },

    async init() {
        this.cacheUI();
        await this.loadData();
        this.renderCards();
        this.bindEvents();
        this.updateURLFromHash();
    },

    cacheUI() {
        this.ui.modalOverlay = document.getElementById('modal-overlay');
        this.ui.modalContent = document.getElementById('modal-content');
        this.ui.body = document.body;
        this.ui.protocolContainer = document.getElementById('protocol-container');
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
            <div style="grid-column: 1/-1; text-align: center; padding: 3rem;">
                <div style="font-size: 2rem; margin-bottom: 1rem;">⏳</div>
                <p>Cargando protocolos...</p>
            </div>
        `;
    },

    renderError(message) {
        if (!this.ui.protocolContainer) return;
        this.ui.protocolContainer.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 3rem; background: #fee; border-radius: 12px;">
                <div style="font-size: 2rem; margin-bottom: 1rem;">❌</div>
                <p style="color: #c00;">Error al cargar los protocolos: ${this.escapeHtml(message)}</p>
                <button onclick="location.reload()" style="margin-top: 1rem; padding: 0.8rem 2rem; background: var(--primary); color: white; border: none; border-radius: 8px; cursor: pointer;">Reintentar</button>
            </div>
        `;
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    renderCards() {
        if (!this.ui.protocolContainer || !this.state.data) return;
        
        this.ui.protocolContainer.innerHTML = '';
        
        Object.entries(this.state.data).forEach(([key, protocol]) => {
            const card = document.createElement('article');
            card.className = 'protocol-card';
            card.setAttribute('role', 'button');
            card.setAttribute('tabindex', '0');
            card.setAttribute('aria-label', `Ver ${protocol.titulo}`);
            card.dataset.key = key;
            
            const iconSrc = protocol.icono || 'https://cdn-icons-png.flaticon.com/512/3330/3330316.png';
            const hasExternalLink = !!protocol.url_externa;
            
            card.innerHTML = `
                <div class="icon-wrapper">
                    <img src="${this.escapeHtml(iconSrc)}" alt="Icono" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>📄</text></svg>'">
                </div>
                <h2>${this.escapeHtml(protocol.titulo.split(':')[0].substring(0, 50))}${protocol.titulo.length > 50 ? '...' : ''}</h2>
                <p>${hasExternalLink ? 'Documento externo disponible en línea' : 'Protocolo institucional'}</p>
                <button class="btn-premium">${hasExternalLink ? 'Ver Documento' : 'Acceder al Protocolo'}</button>
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

        const titleRegex = /^[A-ZÁÉÍÓÚÑ\s]{4,}(\.|$|:)/;
        const numberTitleRegex = /^[0-9]+(\.[0-9]+)*(\.|\.-|\s)/;
        const letterRegex = /^[a-z]\)/i;
        const dashRegex = /^-/;

        paragraphs.forEach(para => {
            const textParts = para.split('\\n').join('<br>');
            const sanitizedText = this.escapeHtml(para).replace(/\\n/g, '<br>');

            if (titleRegex.test(para) && para === para.toUpperCase() && para.length < 150) {
                htmlContent += `<h2>${sanitizedText}</h2>`;
            } else if (numberTitleRegex.test(para)) {
                htmlContent += `<h3>${sanitizedText}</h3>`;
            } else if (letterRegex.test(para) || dashRegex.test(para)) {
                htmlContent += `<div class="indent-item">${sanitizedText}</div>`;
            } else if (para.trim()) {
                htmlContent += `<p>${sanitizedText}</p>`;
            }
        });

        const externalLinkHtml = hasExternalLink ? `
            <div style="margin-top: 2rem; padding: 1.5rem; background: #f0f9ff; border-radius: 12px; border-left: 4px solid var(--primary);">
                <p style="margin: 0 0 1rem 0; font-weight: 600;">📎 Documento Original:</p>
                <a href="${this.escapeHtml(data.url_externa)}" target="_blank" rel="noopener noreferrer" 
                   style="display: inline-block; padding: 0.8rem 1.5rem; background: var(--primary); color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
                    Abrir documento oficial ↗
                </a>
            </div>
        ` : '';

        this.ui.modalContent.innerHTML = `
            <div class="modal-header">
                <span class="protocol-badge">${data.tipo === 'documento' ? 'Documento' : 'Protocolo'} Oficial</span>
                <h1>${this.escapeHtml(data.titulo)}</h1>
            </div>
            <div class="modal-body document-view">
                <div class="document-content">
                    ${htmlContent}
                    ${externalLinkHtml}
                </div>
            </div>
        `;
        
        this.ui.modalContent.querySelector('.modal-body').scrollTop = 0;
    }
};

window.ProtocolApp = ProtocolApp;
document.addEventListener('DOMContentLoaded', () => ProtocolApp.init());
