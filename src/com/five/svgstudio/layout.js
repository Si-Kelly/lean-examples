import BaseComponent from "../core/base-component.js";
import IconComponent from "../shared/icon-component.js";

let contextPath = '';
try {
    const api = await import('/five/api');
    contextPath = api.contextPath;
} catch (error) {
    console.error(error);
}

export default class Layout extends BaseComponent {
    static observedAttributes = [];
    constructor() {
        super(/*html*/`
            <header>
                <div class="breadcrumb">
                    <a href="${contextPath}/svgstudio" data-name="linkBack"><five-icon key="navigateLeft"></five-icon>Back</a>
                </div>
                <h3>
                    <slot name="page-title"></slot>
                </h3>
            </header>
            <article>
                <slot name="content"></slot>
            </article>
        `);

    }
    connectedCallback() {
        super.connectedCallback();
        const queryParams = new URLSearchParams(window.location.search);
        if (queryParams.has('modelKey')) {
            this.modelKey = queryParams.get('modelKey');
            this.updateUI();
        }
        this.addEventListener('modelLoaded', ({detail:key}) => {
            this.modelKey = key;
            this.updateUI();
        });
    }
    setModelKey(key) {
        this.modelKey = key;
        this.updateUI();
    }
    updateUI() {
        this.linkBack.href = this.modelKey ? `${contextPath}/svgstudio/models/${this.modelKey}` : `${contextPath}/svgstudio`;
    }
    // Add additional methods here
}
customElements.define('five-studio-layout', Layout);