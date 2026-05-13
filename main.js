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
        
        this.renderProtocol();
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

    renderProtocol() {
        const data = this.getProtocolData();
        const paragraphs = data.contenido_completo;

        let htmlContent = '';

        const titleRegex = /^[A-ZÁÉÍÓÚÑ\s]{4,}(\.|$|:)/;
        const numberTitleRegex = /^[0-9]+(\.[0-9]+)*(\.|\.-|\s)/;
        const letterRegex = /^[a-z]\)/i;
        const dashRegex = /^-/;

        paragraphs.forEach(para => {
            // Unify lines that end up with \n explicitly if the json parses them
            const textParts = para.split('\\n').join('<br>');

            if (titleRegex.test(para) && para === para.toUpperCase() && para.length < 150) {
                htmlContent += `<h2>${textParts}</h2>`;
            } else if (numberTitleRegex.test(para)) {
                htmlContent += `<h3>${textParts}</h3>`;
            } else if (letterRegex.test(para) || dashRegex.test(para)) {
                htmlContent += `<div class="indent-item">${textParts}</div>`;
            } else {
                htmlContent += `<p>${textParts}</p>`;
            }
        });

        this.ui.modalContent.innerHTML = `
            <div class="modal-header">
                <span class="protocol-badge">Documento Oficial</span>
                <h1>${data.titulo}</h1>
            </div>
            <div class="modal-body document-view">
                <div class="document-content">
                    ${htmlContent}
                </div>
            </div>
        `;
        
        this.ui.modalContent.querySelector('.modal-body').scrollTop = 0;
    }
};

window.ProtocolApp = ProtocolApp;
document.addEventListener('DOMContentLoaded', () => ProtocolApp.init());
