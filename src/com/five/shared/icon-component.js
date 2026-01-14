import BaseComponent from "../core/base-component.js";
import Icons from "../core/icons.js";

export default class IconComponent extends BaseComponent {
    static observedAttributes = ['key'];
    constructor() {
        super(/*html*/`
            <i data-name="iconEl"></i>
        `);
        this.addAttributeChangeListener('key', key => {
            this.icon = Icons[key];
            this.updateUI();
        });
    }
    updateUI() {
        this.iconEl.className = `icon-fixed-width ${this.icon ? this.icon.className : ''}`;
        this.iconEl.setAttribute('title', this.icon ? this.icon.title : '');
    }
    setIcon(icon) {
        this.icon = icon;
        this.updateUI();
    }
}
customElements.define('five-icon', IconComponent);