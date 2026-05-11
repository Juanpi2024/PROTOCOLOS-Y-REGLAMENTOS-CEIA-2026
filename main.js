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
            <div class="badge">Copia Fiel y Oficial CEIA 2026</div>
            <h1>${data.titulo}</h1>
        </div>

        <div class="modal-body-scroll">
            <div class="full-content-wrapper">
                ${data.contenido_completo.map(para => {
                    // Detect if it looks like a title/subtitle (all caps or numbered)
                    const isTitle = para === para.toUpperCase() && para.length > 5;
                    const isNumbered = /^[0-9](\.-|\.)|^(a|b|c|f)\)/i.test(para);
                    
                    if (isTitle) {
                        return `<h2 class="full-content-title">${para}</h2>`;
                    } else if (isNumbered) {
                        return `<h3 class="full-content-subtitle">${para}</h3>`;
                    } else {
                        return `<p class="full-content-text">${para.replace(/\n/g, '<br>')}</p>`;
                    }
                }).join('')}
            </div>
        </div>
    `;

    modalContent.innerHTML = html;
    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden'; 
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
