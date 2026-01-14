import BaseComponent from "./core/base-component.js";
import IconComponent from "./shared/icon-component.js";

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
                    <a href="${contextPath}/"><five-icon key="navigateLeft"></five-icon>More</a>
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
        // Add connectedCallback logic here
    }
    updateUI() {
        // Add updateUI logic here
    }
    // Add additional methods here
}
customElements.define('five-layout', Layout);