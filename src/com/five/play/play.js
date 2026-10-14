

export default class SVGPlay extends HTMLElement {
    connectedCallback() {
        this.svgEl = this.querySelector('svg');
        this.src = this.getAttribute('src');
        this.layerId = this.getAttribute('layer-id');
        this.load();
    }
    async load() {
        const r = await fetch(this.src, {});
        const content = await r.text();
        const tempEl = document.createElement('div');
        tempEl.style.display = 'none';
        this.append(tempEl);
        tempEl.innerHTML = content;
        const g = tempEl.querySelector(`g[id='${this.layerId}']`);
        g.remove();
        this.svgEl.append(g);
        tempEl.remove();
    }
    updateUI() {
    }
}
customElements.define('svg-play', SVGPlay);