import BaseComponent from "../core/base-component.js";

export default class Gallery extends BaseComponent {
    static observedAttributes = [];
    images;
    constructor() {
        super(/*html*/`
            <style>
                .gallery {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
                    gap: 1em;
                }
                .pic {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5em;
                }
            </style>
            <div>
                <h1>Gallery</h1>
                <div data-name="waitingMessageEl">Waiting for images</div>
                <div data-name="gallery"></div>
                <template data-name="picTemplate">
                    <div class="pic">
                        <img data-name="pic" />
                        <div data-name="caption"></div>
                    </div>
                </template>
            </div>
        `);
    }
    connectedCallback() {
        super.connectedCallback();
    }
    updateUI() {
        this.waitingMessageEl.style.display = this.images == undefined ? '' : 'none';
        this.gallery.style.display = this.images == undefined ? 'none' : '';
        this.gallery.innerHTML = '';

        if (this.images == undefined) return;
        this.images.forEach(image => {
            const imgEl = this.picTemplate.clone();
            imgEl.querySelector('img').src = image.src;
            imgEl.querySelector('div').innerText = image.caption;
            this.gallery.appendChild(imgEl);
            imgEl.addEventListener('click', () => {
                this.dispatchEvent(new CustomEvent('imageSelected', { detail: image }));
            });
        });
    }
    setImages(images) {
        this.images = images;
        this.updateUI();
    }
    // Add additional methods here
}
customElements.define('five-gallery', Gallery);