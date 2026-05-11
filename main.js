import './style.css'

let protocolsData = null;

async function loadData() {
    try {
        const response = await fetch('./data/protocolos.json');
        protocolsData = await response.json();
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

const modalOverlay = document.getElementById('modal-overlay');
const modalContent = document.getElementById('modal-content');
const modalClose = document.getElementById('modal-close');

function openModal(key) {
    if (!protocolsData) return;
    
    const data = key === 'telefonos' ? protocolsData.protocolo_telefonos : protocolsData.protocolo_camaras;
    
    let html = `
        <div class="header">
            <div class="badge">Protocolo Oficial CEIA 2026</div>
            <h1>${data.titulo}</h1>
        </div>

        <div class="modal-body-scroll">
            ${data.secciones.map(sec => `
                <section class="section-card">
                    <h2 class="section-title">${sec.titulo}</h2>
                    <p class="content-text">${sec.contenido}</p>
                </section>
            `).join('')}
        </div>
    `;

    modalContent.innerHTML = html;
    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden'; 
    
    // Smooth scroll to top of modal
    modalOverlay.scrollTop = 0;
}

function closeModal() {
    modalOverlay.classList.remove('active');
    document.body.style.overflow = 'auto';
}

document.getElementById('btn-telefonos').addEventListener('click', () => openModal('telefonos'));
document.getElementById('btn-camaras').addEventListener('click', () => openModal('camaras'));
modalClose.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
});

loadData();
