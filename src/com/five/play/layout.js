import BaseComponent from "../core/base-component.js";
import IconComponent from "../shared/icon-component.js";



export default class PlayLayout extends BaseComponent {
    static observedAttributes = [];
    constructor() {
        super(/*html*/`
            <header>
                <h3>
                    <slot name="page-title"></slot>
                </h3>
            </header>
            <main>
                <slot name="content"></slot>
            </main>
        `);

    }
    connectedCallback() {
        super.connectedCallback();
    }
    updateUI() {
    }
}
customElements.define('play-layout', PlayLayout);