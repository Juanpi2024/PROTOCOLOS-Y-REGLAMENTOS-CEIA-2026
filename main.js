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
            <section class="section-card">
                <h2 class="section-title">⚖️ Marco Normativo</h2>
                <p class="content-text">${data.marco_legal}</p>
            </section>

            <section class="section-card">
                <h2 class="section-title">🎯 Objetivo</h2>
                <p class="content-text">${data.objetivo}</p>
            </section>

            ${data.introduccion ? `
            <section class="section-card">
                <h2 class="section-title">📝 Introducción</h2>
                <p class="content-text">${data.introduccion}</p>
            </section>` : ''}
    `;

    if (key === 'telefonos') {
        html += `
            <section class="section-card">
                <h2 class="section-title">💡 Excepciones Autorizadas</h2>
                <div class="highlight-grid">
                    ${data.excepciones.map(ex => `
                        <div class="highlight-item">
                            <h4>${ex.titulo}</h4>
                            <p>${ex.descripcion}</p>
                        </div>
                    `).join('')}
                </div>
            </section>

            <section class="section-card">
                <h2 class="section-title">⏰ Horarios de Uso (Recreos)</h2>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Jornada Mañana</th>
                            <th>Jornada Tarde</th>
                            <th>Vespertina</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>${data.horarios_permitidos.mañana.join('<br>')}</td>
                            <td>${data.horarios_permitidos.tarde.join('<br>')}</td>
                            <td>${data.horarios_permitidos.vespertina.join('<br>')}</td>
                        </tr>
                    </tbody>
                </table>
            </section>

            <section class="section-card">
                <h2 class="section-title">⚠️ Medidas Disciplinarias</h2>
                <div class="highlight-grid">
                    ${data.medidas_disciplinarias.map(m => `
                        <div class="highlight-item">
                            <h4 style="color: var(--warning)">${m.falta}</h4>
                            <p>${m.acciones}</p>
                        </div>
                    `).join('')}
                </div>
            </section>
        `;
    } else {
        html += `
            <section class="section-card">
                <h2 class="section-title">📍 Ubicaciones Monitoreadas</h2>
                <div class="highlight-grid">
                    ${data.ubicaciones_autorizadas.map(u => `
                        <div class="highlight-item">
                            <p>${u}</p>
                        </div>
                    `).join('')}
                </div>
            </section>

            <section class="section-card">
                <h2 class="section-title">🔒 Custodia y Resguardo</h2>
                <div class="highlight-item">
                    <h4>Responsables</h4>
                    <p>${data.custodia.responsables.join(', ')}</p>
                </div>
                <div class="highlight-item" style="margin-top: 1rem;">
                    <h4>Plazo de Almacenamiento</h4>
                    <p>${data.custodia.almacenamiento}</p>
                </div>
            </section>

            <section class="section-card">
                <h2 class="section-title">🚫 Restricciones</h2>
                <div class="highlight-grid">
                    ${data.restricciones_uso.map(r => `
                        <div class="highlight-item" style="border-left: 4px solid var(--danger)">
                            <p>${r}</p>
                        </div>
                    `).join('')}
                </div>
            </section>
        `;
    }

    html += `</div>`; // Close modal-body-scroll
    
    modalContent.innerHTML = html;
    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden'; // Disable scroll on body
}

function closeModal() {
    modalOverlay.classList.remove('active');
    document.body.style.overflow = 'auto'; // Enable scroll on body
}

// Listeners
document.getElementById('btn-telefonos').addEventListener('click', () => openModal('telefonos'));
document.getElementById('btn-camaras').addEventListener('click', () => openModal('camaras'));
modalClose.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
});

loadData();
