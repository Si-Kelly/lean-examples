import BaseComponent from "../core/base-component.js";
import { AssetBrowser, Asset } from "./browser.js";
import { Assets } from "./assets.js";
import { Action } from "./action.js";
import { Body, Segment, Shape, Path } from "./body.js";
import SVGParser from "./parser.js";

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
                    <button data-name="openModelButton">Open model</button>
                </div>
                <asset-browser asset-title="Models" asset-type="models" asset-path="models"></asset-browser>
                <div style="display:none" data-name="tempEl"></div>
            </div>
        `);
    }
    connectedCallback() {
        super.connectedCallback();
        this.newModelButton.addEventListener('click', () => {
            this.importModel();
        });
        this.openModelButton.addEventListener('click', () => {
            this.openFile();
        });
        this.updateUI();
    }
    updateUI() { }
    loadNewBody(body) {
        Assets.saveBody(body);
        this.loadBody(body);
    }
    loadBody(body) {
        window.location.href = `models/${body.key}`;
    }
    importModel() {
        const svgStr = prompt('Enter svg code');
        const name = prompt('Enter model name');
        this.loadNewBody(SVGParser.parseBodySVG(svgStr, name));
    }

    async openFile() {
        const [filehandle] = await window.showOpenFilePicker({
            multiple: false,
            types: [
                {
                    description: "SVG Model",
                    accept: {
                        "image/svg+xml": [".model.svg"],
                    },
                }
            ]
        });
        this.filehandle = filehandle;
        const file = await filehandle.getFile();
        const svgContent = await file.text();
        // const parser = new DOMParser( );
        // const parsedSVG = parser.parseFromString(svgContent,'text/svg');
        this.tempEl.innerHTML = svgContent;
        const g = this.tempEl.querySelector(`g`);
        this.loadNewBody(Body.fromSVG(g, file.name));
    }



}
customElements.define('svg-studio', SVGStudio);