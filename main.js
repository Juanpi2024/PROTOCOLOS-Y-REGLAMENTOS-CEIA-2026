/**
 * CEIA Juanita Zúñiga - Protocol Management System
 * Senior Implementation: Modularity, Error Handling, and UX Refinement
 */

const ProtocolApp = {
    // State management
    state: {
        data: null,
        isModalOpen: false,
        activeProtocol: null
    },

    // UI Elements
    ui: {
        modalOverlay: document.getElementById('modal-overlay'),
        modalContent: document.getElementById('modal-content'),
        body: document.body
    },

    // Initialization
    async init() {
        console.log('🚀 Initializing Protocol App...');
        await this.loadData();
        this.bindEvents();
    },

    // Data handling
    async loadData() {
        try {
            const response = await fetch('./data/protocolos.json');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            this.state.data = await response.json();
            console.log('✅ Protocols loaded successfully');
        } catch (error) {
            console.error('❌ Failed to load protocols:', error);
            this.showErrorMessage();
        }
    },

    // Event binding
    bindEvents() {
        // Card clicks
        document.getElementById('btn-telefonos')?.addEventListener('click', () => this.openModal('telefonos'));
        document.getElementById('btn-camaras')?.addEventListener('click', () => this.openModal('camaras'));

        // Modal close triggers
        document.getElementById('modal-close')?.addEventListener('click', () => this.closeModal());
        
        this.ui.modalOverlay.addEventListener('click', (e) => {
            if (e.target === this.ui.modalOverlay) this.closeModal();
        });

        // Keyboard support
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.state.isModalOpen) this.closeModal();
        });
    },

    // Modal Logic
    openModal(key) {
        if (!this.state.data) return;
        
        const protocolKey = key === 'telefonos' ? 'protocolo_telefonos' : 'protocolo_camaras';
        const data = this.state.data[protocolKey];
        
        if (!data) return;

        this.state.activeProtocol = key;
        this.renderProtocol(data);
        
        this.ui.modalOverlay.classList.add('active');
        this.ui.body.style.overflow = 'hidden';
        this.state.isModalOpen = true;
    },

    closeModal() {
        this.ui.modalOverlay.classList.remove('active');
        this.ui.body.style.overflow = '';
        this.state.isModalOpen = false;
        
        // Reset scroll for next opening
        setTimeout(() => {
            this.ui.modalContent.closest('.modal-body').scrollTop = 0;
        }, 400);
    },

    // Rendering Engine
    renderProtocol(data) {
        const contentHtml = data.contenido_completo.map(para => {
            const isTitle = para === para.toUpperCase() && para.length > 5;
            const isNumbered = /^[0-9](\.-|\.)|^(a|b|c|f)\)/i.test(para);
            
            if (isTitle) {
                return `<h2 class="full-content-title">${para}</h2>`;
            } else if (isNumbered) {
                return `<h3 class="full-content-subtitle">${para}</h3>`;
            } else {
                return `<p class="full-content-text">${para.replace(/\n/g, '<br>')}</p>`;
            }
        }).join('');

        this.ui.modalContent.innerHTML = `
            <div class="modal-header">
                <span class="protocol-badge">Documento Oficial</span>
                <h1>${data.titulo}</h1>
            </div>
            <div class="modal-body">
                <div class="full-content-wrapper">
                    ${contentHtml}
                </div>
            </div>
        `;
    },

    showErrorMessage() {
        alert('Lo sentimos, no pudimos cargar los protocolos. Por favor, intenta refrescar la página.');
    }
};

// Start application
document.addEventListener('DOMContentLoaded', () => ProtocolApp.init());
