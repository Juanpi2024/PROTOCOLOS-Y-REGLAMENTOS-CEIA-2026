/**
 * CEIA Juanita Zúñiga - Protocol Management System
 * UX Refinement: Dashboard Cards (Summary vs Detail)
 */

const ProtocolApp = {
    state: {
        data: null,
        activeProtocolKey: null,
        isModalOpen: false
    },

    ui: {
        modalOverlay: document.getElementById('modal-overlay'),
        modalContent: document.getElementById('modal-content'),
        body: document.body
    },

    async init() {
        await this.loadData();
        this.bindEvents();
    },

    async loadData() {
        try {
            const response = await fetch('./data/protocolos.json');
            this.state.data = await response.json();
        } catch (error) {
            console.error('Error loading protocols:', error);
        }
    },

    bindEvents() {
        document.getElementById('btn-telefonos')?.addEventListener('click', () => this.openProtocol('telefonos'));
        document.getElementById('btn-camaras')?.addEventListener('click', () => this.openProtocol('camaras'));
        document.getElementById('modal-close')?.addEventListener('click', () => this.closeModal());
        
        this.ui.modalOverlay.addEventListener('click', (e) => {
            if (e.target === this.ui.modalOverlay) this.closeModal();
        });

        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.state.isModalOpen) this.closeModal();
        });
    },

    openProtocol(key) {
        if (!this.state.data) return;
        this.state.activeProtocolKey = key;
        this.state.isModalOpen = true;
        this.ui.modalOverlay.classList.add('active');
        this.ui.body.style.overflow = 'hidden';
        
        this.renderDashboard();
    },

    closeModal() {
        this.ui.modalOverlay.classList.remove('active');
        this.ui.body.style.overflow = '';
        this.state.isModalOpen = false;
    },

    getProtocolData() {
        const key = this.state.activeProtocolKey === 'telefonos' ? 'protocolo_telefonos' : 'protocolo_camaras';
        return this.state.data[key];
    },

    renderDashboard() {
        const data = this.getProtocolData();
        const sections = this.processSections(data.contenido_completo);

        this.ui.modalContent.innerHTML = `
            <div class="modal-header">
                <span class="protocol-badge">Menú Principal de Secciones</span>
                <h1>${data.titulo}</h1>
            </div>
            <div class="modal-body">
                <div class="section-grid">
                    ${sections.map((sec, index) => {
                        // Create a concise preview
                        const preview = sec.title.length > 80 
                            ? sec.title.substring(0, 80) + '...' 
                            : sec.title;
                        
                        return `
                        <div class="section-tile" onclick="ProtocolApp.renderDetail(${index})">
                            <div class="tile-header-area">
                                <h3>${preview}</h3>
                                <p class="tile-preview-text">${sec.content[0] ? sec.content[0].substring(0, 60) + '...' : 'Ver detalles de la sección'}</p>
                            </div>
                            <div class="tile-footer">Profundizar sección →</div>
                        </div>
                    `}).join('')}
                </div>
            </div>
        `;
    },

    renderDetail(index) {
        const data = this.getProtocolData();
        const sections = this.processSections(data.contenido_completo);
        const section = sections[index];

        this.ui.modalContent.innerHTML = `
            <div class="modal-header">
                <div class="detail-header">
                    <button class="btn-back" onclick="ProtocolApp.renderDashboard()">
                        ← Volver al Menú
                    </button>
                </div>
                <h1>${section.title}</h1>
            </div>
            <div class="modal-body detail-view">
                <div class="detail-content">
                    <div class="detail-text">${section.content.join('\n\n')}</div>
                </div>
            </div>
        `;
        
        this.ui.modalContent.querySelector('.modal-body').scrollTop = 0;
    },

    processSections(paragraphs) {
        const sections = [];
        let introSection = { title: 'INTRODUCCIÓN Y MARCO GENERAL', content: [] };
        let currentSection = null;

        const titleRegex = /^[A-ZÁÉÍÓÚÑ\s]{4,}(\.|$)/;
        const numberRegex = /^[0-9]+(\.[0-9]+)*(\.|\.-|\s|$)/;
        const letterRegex = /^[a-z]\)/i;

        paragraphs.forEach(para => {
            const isTitle = titleRegex.test(para);
            const isPoint = numberRegex.test(para) || letterRegex.test(para);

            if (isTitle || isPoint) {
                if (currentSection) sections.push(currentSection);
                currentSection = {
                    title: para,
                    content: []
                };
            } else {
                if (currentSection) {
                    currentSection.content.push(para);
                } else {
                    introSection.content.push(para);
                }
            }
        });

        if (currentSection) sections.push(currentSection);
        if (introSection.content.length > 0) sections.unshift(introSection);
        
        return sections;
    }
};

window.ProtocolApp = ProtocolApp;
document.addEventListener('DOMContentLoaded', () => ProtocolApp.init());
