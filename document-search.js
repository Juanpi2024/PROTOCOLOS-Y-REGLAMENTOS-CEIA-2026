export function normalizeText(text) {
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
}

// Keep original offsets so accents and repeated whitespace can be highlighted safely.
export function findRanges(text, query) {
    let normalized = '';
    const offsets = [];
    for (let i = 0; i < text.length; i++) {
        const character = normalizeText(text[i]) || (/\s/.test(text[i]) ? ' ' : '');
        if (character === ' ' && normalized.endsWith(' ')) continue;
        for (const part of character) {
            normalized += part;
            offsets.push(i);
        }
    }
    const needle = normalizeText(query);
    const ranges = [];
    if (!needle) return ranges;
    let start = normalized.indexOf(needle);
    while (start !== -1) {
        ranges.push([offsets[start], offsets[start + needle.length - 1] + 1]);
        start = normalized.indexOf(needle, start + needle.length);
    }
    return ranges;
}

export function bindDocumentSearch(root, keywords = []) {
    const input = root.querySelector('#document-search-input');
    const status = root.querySelector('#document-search-status');
    const previous = root.querySelector('#document-search-previous');
    const next = root.querySelector('#document-search-next');
    const suggestions = root.querySelector('#document-keywords');
    const blocks = [...root.querySelectorAll('.document-text h2, .document-text h3, .document-text p, .document-text .indent-item, .document-text th, .document-text td')];
    let matches = [];
    let active = -1;

    function navigate(direction) {
        if (!matches.length) return;
        matches[active]?.classList.remove('search-current');
        active = (active + direction + matches.length) % matches.length;
        matches[active].classList.add('search-current');
        matches[active].scrollIntoView({ block: 'center', behavior: 'smooth' });
        status.textContent = `Fragmento ${active + 1} de ${matches.length}`;
    }

    function search() {
        root.querySelectorAll('mark.document-match').forEach(mark => mark.replaceWith(document.createTextNode(mark.textContent)));
        blocks.forEach(block => { block.classList.remove('search-current'); block.normalize(); });
        matches = [];
        active = -1;
        const query = normalizeText(input.value);
        if (query) blocks.forEach(block => {
            const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
            const nodes = [];
            let text = '';
            while (walker.nextNode()) {
                if (walker.currentNode.nodeType === 1) {
                    if (walker.currentNode.tagName === 'BR') text += ' ';
                    continue;
                }
                nodes.push({ node: walker.currentNode, offset: text.length });
                text += walker.currentNode.textContent;
            }
            const ranges = findRanges(text, query);
            if (!ranges.length) return;
            matches.push(block);
            nodes.forEach(({ node, offset }) => {
                const fragment = document.createDocumentFragment();
                let cursor = 0;
                ranges.forEach(([start, end]) => {
                    const from = Math.max(0, start - offset);
                    const to = Math.min(node.length, end - offset);
                    if (from >= to) return;
                    fragment.append(node.textContent.slice(cursor, from));
                    const mark = document.createElement('mark');
                    mark.className = 'document-match';
                    mark.textContent = node.textContent.slice(from, to);
                    fragment.append(mark);
                    cursor = to;
                });
                fragment.append(node.textContent.slice(cursor));
                node.replaceWith(fragment);
            });
        });
        previous.disabled = next.disabled = !matches.length;
        status.textContent = query ? 'No se encontraron coincidencias en este documento.' : 'Escribe una palabra o frase, o elige un tema.';
        if (matches.length) navigate(1);
    }

    keywords.forEach(keyword => {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = keyword;
        button.addEventListener('click', () => { input.value = keyword; search(); });
        suggestions.append(button);
    });
    input.addEventListener('input', search);
    input.addEventListener('keydown', event => {
        if (event.key === 'Enter') { event.preventDefault(); navigate(event.shiftKey ? -1 : 1); }
    });
    previous.addEventListener('click', () => navigate(-1));
    next.addEventListener('click', () => navigate(1));
    root.querySelector('#document-search-clear').addEventListener('click', () => { input.value = ''; search(); input.focus(); });
    search();
}
