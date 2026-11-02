import { normalizeText } from './document-search.js';

// Related expressions are used to retrieve existing sections, never to invent answers.
const concepts = [
    ['inasistencia', 'inasistencias', 'ausencia', 'ausencias', 'faltar', 'falto', 'falte', 'falté', 'no asisti', 'no asistir', 'justificacion', 'justificativo'],
    ['evaluacion', 'evaluaciones', 'prueba', 'pruebas', 'examen', 'examenes', 'evaluativo', 'evaluativos'],
    ['calificacion', 'calificaciones', 'nota', 'notas', 'promedio', 'rendimiento'],
    ['promocion', 'promover', 'promovidos', 'pasar de curso', 'aprobar'],
    ['repitencia', 'repetir', 'repitentes', 'reprobacion'],
    ['celular', 'celulares', 'telefono', 'telefonos', 'movil', 'moviles', 'dispositivos', 'smartwatch'],
    ['acoso', 'bullying', 'hostigamiento', 'ciberacoso', 'cyberbullying'],
    ['violencia', 'agresion', 'agresiones', 'maltrato', 'pelea', 'peleas'],
    ['embarazo', 'embarazada', 'embarazadas', 'maternidad', 'paternidad', 'lactancia'],
    ['sancion', 'sanciones', 'castigo', 'castigos', 'disciplinarias', 'suspension'],
    ['apelacion', 'apelar', 'reconsideracion', 'debido proceso'],
    ['matricula', 'matricular', 'admision', 'ingreso', 'inscripcion'],
    ['camara', 'camaras', 'grabacion', 'grabaciones', 'televigilancia'],
    ['privacidad', 'confidencialidad', 'datos personales', 'intimidad'],
    ['sismo', 'terremoto', 'temblor'],
    ['incendio', 'incendios', 'fuego'],
    ['evacuacion', 'evacuar', 'salida de emergencia', 'zona de seguridad'],
    ['accidente', 'accidentes', 'seguro escolar', 'lesion'],
    ['drogas', 'droga', 'alcohol', 'sustancias', 'consumo'],
    ['derechos', 'derecho', 'garantias'],
    ['deberes', 'deber', 'obligaciones', 'responsabilidades'],
    ['participacion', 'ciudadania', 'ciudadana', 'democracia', 'democratico'],
    ['mision', 'proposito institucional'],
    ['vision', 'aspiracion institucional'],
    ['inclusion', 'diversidad', 'discriminacion', 'inclusivo'],
    ['asistencia', 'asistir', 'porcentaje de asistencia'],
];
const stopwords = new Set(normalizeText('a al algo ante cual cuales como con cuanto cuando de del dentro documento el ella en es ese esta este esto hay la las le lo los me mi necesito o para por puede puedo que quien quiero reglamento saber se si sin sobre su sus tema tengo tiene un una unos unas y yo pasa caso hacer capitulos capitulo apartados apartado').split(' '));

function termsFor(query) {
    let remaining = normalizeText(query).replace(/[^a-z0-9\s%]/g, ' ');
    const groups = [];
    for (const variants of concepts) {
        if (variants.some(term => new RegExp(`\\b${term}\\b`).test(remaining))) {
            groups.push(variants);
            for (const term of variants) remaining = remaining.replace(new RegExp(`\\b${term}\\b`, 'g'), ' ');
        }
    }
    for (const word of remaining.split(/\s+/)) {
        if ((word.length > 2 || /^\d+$/.test(word)) && !stopwords.has(word)) groups.push([word]);
    }
    return groups;
}

export function rankSections(sections, query) {
    const groups = termsFor(query);
    if (!groups.length) return [];
    return sections.map(section => {
        const title = normalizeText(section.title);
        const body = normalizeText(section.text);
        const contains = (text, term) => new RegExp(`(?:^|[^a-z0-9])${term}(?:$|[^a-z0-9])`).test(text);
        const matched = groups.filter(group => group.some(term => contains(title + ' ' + body, term)));
        const titleMatches = groups.filter(group => group.some(term => contains(title, term))).length;
        const score = matched.length / groups.length * 100 + titleMatches * 15;
        return { ...section, score, matched, coverage: matched.length / groups.length };
    }).filter(section => section.matched.length && section.coverage >= .6)
      .sort((a, b) => b.score - a.score || a.order - b.order);
}

export function collectSections(root) {
    const blocks = [...root.querySelector('.document-text').children];
    const sections = [];
    let current;
    let chapter = '';
    for (const block of blocks) {
        if (/^H[23]$/.test(block.tagName) || !current) {
            const heading = /^H[23]$/.test(block.tagName);
            const title = heading ? block.textContent.replace(/\s+/g, ' ').trim().split(/\s+ART\.?\s*\d/i)[0].slice(0, 220) : 'Presentación';
            if (block.tagName === 'H2') chapter = title;
            current = { title, chapter, target: block, blocks: [], text: '', order: sections.length };
            sections.push(current);
        }
        current.blocks.push(block);
        current.text += ' ' + block.textContent;
    }
    // Parent chapters include their subsections; consecutive index headings are omitted.
    for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        if (section.target.tagName !== 'H2') continue;
        for (let j = i + 1; j < sections.length && sections[j].target.tagName !== 'H2'; j++) {
            section.text += ' ' + sections[j].text;
            section.blocks.push(...sections[j].blocks);
        }
    }
    return sections.filter(section => section.blocks.length > 1 || section.text.length > section.title.length + 80);
}

export function bindDocumentSearch(root, keywords = []) {
    const input = root.querySelector('#document-search-input');
    const status = root.querySelector('#document-search-status');
    const results = root.querySelector('#document-search-results');
    const suggestions = root.querySelector('#document-keywords');
    const sections = collectSections(root);
    const previous = root.querySelector('#document-search-previous');
    const next = root.querySelector('#document-search-next');
    let found = [];
    let active = -1;

    function navigate(index) {
        if (!found.length) return;
        root.querySelectorAll('.search-current').forEach(item => item.classList.remove('search-current'));
        active = (index + found.length) % found.length;
        const section = found[active];
        section.target.classList.add('search-current');
        section.target.scrollIntoView({block: 'start', behavior: 'smooth'});
        status.textContent = `Apartado ${active + 1} de ${found.length}: ${section.title}`;
    }

    function render() {
        root.querySelectorAll('.search-current').forEach(item => item.classList.remove('search-current'));
        const query = input.value.trim();
        found = query ? rankSections(sections, query) : sections;
        active = -1;
        results.replaceChildren();
        previous.disabled = next.disabled = !found.length;
        status.textContent = query ? `${found.length} apartados relacionados con tu consulta.` : `${sections.length} capítulos y apartados. Elige uno o busca un tema.`;
        if (!found.length) {
            const message = document.createElement('p');
            message.textContent = 'No se encontraron apartados relacionados. Prueba con otro tema o revisa el índice de capítulos.';
            results.append(message);
        }
        found.forEach((section, index) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'topic-result';
            const title = document.createElement('strong');
            title.textContent = section.title;
            button.append(title);
            if (section.chapter && section.chapter !== section.title) {
                const context = document.createElement('small');
                context.textContent = section.chapter;
                button.append(context);
            }
            if (query) {
                const paragraph = section.blocks.find(block => section.matched.some(group => group.some(term => normalizeText(block.textContent).includes(term)))) || section.target;
                const text = paragraph.textContent.replace(/\s+/g, ' ').trim();
                const firstTerm = section.matched.flat().find(term => normalizeText(text).includes(term));
                const position = firstTerm ? normalizeText(text).indexOf(firstTerm) : 0;
                const start = Math.max(0, position - 70);
                const excerpt = document.createElement('span');
                excerpt.textContent = (start ? '…' : '') + text.slice(start, start + 250) + (text.length > start + 250 ? '…' : '');
                button.append(excerpt);
            }
            button.addEventListener('click', () => navigate(index));
            results.append(button);
        });
    }
    keywords.forEach(keyword => {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = keyword;
        button.addEventListener('click', () => { input.value = keyword; render(); });
        suggestions.append(button);
    });
    input.addEventListener('input', render);
    input.addEventListener('keydown', event => {
        if (event.key === 'Enter') { event.preventDefault(); navigate(active + (event.shiftKey ? -1 : 1)); }
    });
    previous.addEventListener('click', () => navigate(active < 0 ? found.length - 1 : active - 1));
    next.addEventListener('click', () => navigate(active + 1));
    root.querySelector('#document-search-clear').addEventListener('click', () => { input.value = ''; render(); input.focus(); });
    render();
}
