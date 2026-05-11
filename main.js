/**
 * CEIA Juanita Zúñiga - Protocol Management System
 * Interactive Dashboard Implementation
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

    // First Level: Dashboard of sections
    renderDashboard() {
        const data = this.getProtocolData();
        const sections = this.processSections(data.contenido_completo);

        this.ui.modalContent.innerHTML = `
            <div class="modal-header">
                <span class="protocol-badge">Menú de Secciones</span>
                <h1>${data.titulo}</h1>
            </div>
            <div class="modal-body">
                <div class="section-grid">
                    ${sections.map((sec, index) => `
                        <div class="section-tile" onclick="ProtocolApp.renderDetail(${index})">
                            <h3>${sec.title}</h3>
                            <div class="tile-footer">Leer más</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },

    // Second Level: Full text of a specific section
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
        
        // Reset scroll to top
        this.ui.modalContent.querySelector('.modal-body').scrollTop = 0;
    },

    processSections(paragraphs) {
        const sections = [];
        let currentSection = null;

        paragraphs.forEach(para => {
            const isTitle = para === para.toUpperCase() && para.length > 5;
            const isNumbered = /^[0-9]+(\.-|\.)|^(a|b|c|f|h)\)|^[0-9]+°/.test(para);

            if (isTitle || isNumbered) {
                if (currentSection) sections.push(currentSection);
                currentSection = {
                    title: para,
                    content: []
                };
            } else if (currentSection) {
                currentSection.content.push(para);
            } else {
                // Intro text
                sections.push({ title: 'Introducción y Contexto', content: [para] });
            }
        });

        if (currentSection) sections.push(currentSection);
        return sections;
    }
};

// Global reference for onclick handlers
window.ProtocolApp = ProtocolApp;

document.addEventListener('DOMContentLoaded', () => ProtocolApp.init());
