import BaseComponent from "../core/base-component.js";
import { Assets } from "./assets.js";

export class AssetBrowser extends BaseComponent {
    static observedAttributes = ['asset-type', 'asset-key', 'asset-title', 'asset-path'];
    assets = [];
    constructor() {
        super(/*html*/`
            <style>
        .button-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
            grid-auto-rows: 100px;
            gap: 1em;
        }
        .button-grid a.button {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 0.5em;
            justify-content: center;
        }
            </style>
            <div class="container">
                <div class="toolbar">
                    <button data-name="navUpButton" title="Up">
                        <five-icon key="navigateUp"></five-icon>
                    </button>
                    <div class="title" data-name="titleEl"></div>
                </div>
                <div class="button-grid" data-name="assetContainer">
                </div>
                <template data-name="assetTemplate">
                    <a class="button">
                        <div data-name="assetName" class="asset-name"></div>
                    </a>
                </template>
            </div>
        `);
        this.addAttributeChangeListener('asset-key', (newVal) => {
            this.assetKey = newVal;
            this.loadAssets();
            this.updateUI();
        });
        this.addAttributeChangeListener('asset-type', (newVal) => {
            this.assetType = newVal;
            this.loadAssets();
            this.updateUI();
        });
        this.addAttributeChangeListener('asset-path', (path) => {
            this.path = path;
            this.updateUI();
        });
        this.addAttributeChangeListener('asset-title', (newVal) => {
            this.title = newVal;
            this.updateUI();
        });
    }
    connectedCallback() {
        super.connectedCallback();
        this.navUpButton.addEventListener('click', () => {
            this.navigateUp();
        });
        this.updateUI();
    }
    updateUI() {
        this.titleEl.innerText = this.title;
        this.assetContainer.innerHTML = '';
        this.assets.forEach(asset => {
            const assetEl = this.assetTemplate.clone({ assetType: asset.type, assetName: asset.name });
            assetEl.href = `${this.path}/${asset.key}`;
            this.assetContainer.appendChild(assetEl);
        });
        this.navUpButton.style.display = this.parent ? '' : 'none';
    }
    loadAssets() {
        if (!this.assetType) return;
        this.setAssets(Assets.loadAssets(this.assetType, this.assetKey));
    }

    setAssets(assetList) {
        this.assets = assetList;
        this.updateUI();
    }
    setTitle(title) {
        this.title = title;
        this.updateUI();
    }
    setParent(parent) {
        this.parent = parent;
        this.updateUI();
    }
    navigateUp() {
        this.fireEvent('navigateUp');
    }
}
export class Asset {
    parent;
    constructor(name, type, url, parent) {
        this.name = name;
        this.type = type;
        this.url = url;
        this.parent = parent;
    }
}
customElements.define('asset-browser', AssetBrowser);