import BaseComponent from '../core/base-component.js';

const letters = ['5', 'HTML'];
const redShades = ['black', '#9a031e', '#9a031e', 'black', '#9a031e'];
export default class MainTitle extends BaseComponent {
    offset = 0;
    constructor() {
        super(/*html*/`
            <style>
                .main-title {
                    display:flex;
                    justify-content: left;
                    width:100%;
                    gap:4px;
                    height: fit-content;
                    font-family: 'Roboto', sans-serif;
                    font-style: italic;
                    font-weight: 900;
                    color: black;
                    overflow: hidden;
                }
                .title-letter {
                    font-size:4em;
                    width:fit-content;
                }
            </style>
            <div class="main-title" data-name="mainTitle">5html5</div>
           <template data-name="letterTemplate">
            <div class="title-letter"></div>
           </template>
        `);
    }
    connectedCallback() {
        super.connectedCallback();
        this.resize = () => this.updateUI();
        window.addEventListener('resize', this.resize);
        this.updateUI();
    }
    disconnectCallback() {
        window.removeEventListener('resize', this.resize);
    }

    updateUI() {
        this.mainTitle.innerHTML = '';
        const pageWidth = this.mainTitle.getBoundingClientRect().width;
        let x = 0, offset = 0;
        while (x < pageWidth) {
            letters.forEach((letter, i) => {
                let color = redShades[offset % redShades.length];
                if (x > pageWidth) {
                    return;
                }
                const letterEl = this.letterTemplate.clone();
                letterEl.textContent = letter;
                letterEl.style.color = color;
                this.mainTitle.append(letterEl);
                x += letterEl.offsetWidth + 4;
                offset++;
            });
        }
    }
}
customElements.define('five-main-title', MainTitle);