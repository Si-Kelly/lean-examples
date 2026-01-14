import BaseComponent from "../core/base-component.js";
import { AssetBrowser, Asset } from "./browser.js";
import { Assets } from "./assets.js";
import { Action } from "./action.js";
import { Body, Segment, Shape, Path } from "./body.js";

export default class SVGStudio extends BaseComponent {
    static observedAttributes = [];
    constructor() {
        super(/*html*/`
            <div class="container">
                <div class="toolbar">
                    <button data-name="newModelButton" title="New model">
                        <five-icon key="create"></five-icon>
                        New model
                    </button>
                </div>
                <asset-browser asset-title="Models" asset-type="models" asset-path="models"></asset-browser>
            </div>
        `);
    }
    connectedCallback() {
        super.connectedCallback();
        this.newModelButton.addEventListener('click', () => {
            const name = window.prompt('Enter name for new model');
            //handle cancel
            if (!name) return;
            const content = window.prompt('Enter SVG content');
            //handle cancel
            if (!content) return;

            const body = this.parseBodySVG(content, name);
            Assets.saveBody(body);
            this.loadBody(body);
        });
        this.updateUI();
    }
    loadBody(body) {
        window.location.href = `models/${body.key}`;
    }
    updateUI() { }

    parseBodySVG(svgStr, name) {
        const body = new Body(name);
        //parse svg string
        const tempNode = document.createElement('div');
        this.shadowRoot.appendChild(tempNode);
        tempNode.innerHTML = svgStr;
        let group;
        const svgEl = tempNode.querySelector('svg');
        if (svgEl) {
            group = svgEl.querySelector(':scope > g');
        } else {
            group = tempNode.querySelector('g');
        } if (!group) {
            alert('No group found in SVG');
            return;
        }
        body.rootSegment = this.parseGroupNode(group, body);
        return body;
    }
    


}
customElements.define('svg-studio', SVGStudio);