/**
 * CEIA Juanita Zúñiga - Protocol Management System
 * Senior Implementation: Bug Fixes and UX Refinement
 */

const ProtocolApp = {
    state: {
        data: null,
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
        document.getElementById('btn-telefonos')?.addEventListener('click', () => this.openModal('telefonos'));
        document.getElementById('btn-camaras')?.addEventListener('click', () => this.openModal('camaras'));
        document.getElementById('modal-close')?.addEventListener('click', () => this.closeModal());
        
        this.ui.modalOverlay.addEventListener('click', (e) => {
            if (e.target === this.ui.modalOverlay) this.closeModal();
        });

        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.state.isModalOpen) this.closeModal();
        });
    },

    openModal(key) {
        if (!this.state.data) return;
        const protocolKey = key === 'telefonos' ? 'protocolo_telefonos' : 'protocolo_camaras';
        const data = this.state.data[protocolKey];
        if (!data) return;

        this.renderProtocol(data);
        this.ui.modalOverlay.classList.add('active');
        this.ui.body.style.overflow = 'hidden';
        this.state.isModalOpen = true;

        // Ensure scroll starts at top
        const modalBody = this.ui.modalContent.querySelector('.modal-body');
        if (modalBody) modalBody.scrollTop = 0;
    },

    closeModal() {
        this.ui.modalOverlay.classList.remove('active');
        this.ui.body.style.overflow = '';
        this.state.isModalOpen = false;
        
        // Clear content after animation to prevent layout shifts
        setTimeout(() => {
            if (!this.state.isModalOpen) {
                this.ui.modalContent.innerHTML = '';
            }
        }, 400);
    },

    renderProtocol(data) {
        const cards = [];
        let currentCard = null;

        data.contenido_completo.forEach(para => {
            const isTitle = para === para.toUpperCase() && para.length > 5;
            const isNumbered = /^[0-9]+(\.-|\.)|^(a|b|c|f|h)\)|^[0-9]+°/.test(para);

            if (isTitle || isNumbered) {
                if (currentCard) cards.push(currentCard);
                currentCard = {
                    title: para,
                    content: [],
                    type: isTitle ? 'section' : 'point'
                };
            } else if (currentCard) {
                currentCard.content.push(para);
            } else {
                cards.push({ title: '', content: [para], type: 'intro' });
            }
        });
        
        if (currentCard) cards.push(currentCard);

        const cardsHtml = cards.map(card => `
            <div class="content-card ${card.type}">
                ${card.title ? `<h3 class="${card.type === 'section' ? 'full-content-title' : 'full-content-subtitle'}">${card.title}</h3>` : ''}
                ${card.content.map(p => `<p class="full-content-text">${p.replace(/\n/g, '<br>')}</p>`).join('')}
            </div>
        `).join('');

        this.ui.modalContent.innerHTML = `
            <div class="modal-header">
                <span class="protocol-badge">Documento Oficial CEIA</span>
                <h1>${data.titulo}</h1>
            </div>
            <div class="modal-body">
                <div class="full-content-wrapper">
                    ${cardsHtml}
                </div>
            </div>
        `;
    }
};

document.addEventListener('DOMContentLoaded', () => ProtocolApp.init());
