import BaseComponent from "../core/base-component.js";
import { ImageContext, Drag, XY } from "../core/ui-utils.js";
import { Body, Segment, Shape, Path } from './body.js';
import './editor.js';
import { Action } from './action.js';
import { NONE, MOVE_IMAGE, RESIZE_IMAGE, ROTATE_IMAGE } from "./image-toolbar.js";
import { Assets } from "./assets.js";

const DESIGN = 0, IMAGE_DROP_OVER = 2, ANIMATE = 3, BACKGROUND = 4, PREVIEW = 5;


export default class ModelEditor extends BaseComponent {

    static observedAttributes = ['model-key'];

    body = null;
    currentFrame = 0;
    mode = DESIGN;
    imageMenuShowing = false;
    tool = NONE;


    constructor() {
        super(/*html*/`
            <style>
                .studio-layout{
                    flex-direction: column;
                    width: fit-content;
                }
                .container {
                    display: flex;
                    position: relative;
                }
                .main-viewer{
                    max-width:1000px;
                }
                .viewer-wrapper{
                    position: relative;
                    min-width: 1000px;
                    max-width:1000px;
                    min-height: 500px;
                }
                .toolbar{
                    gap:0.5em;
                    padding: 0.25em 0.5em;
                    font-size: 0.9em;
                }

                .container.main-viewer{
                    overflow:auto;
                    position: relative;
                    width: 100%;
                    height: 500px;
                    background: black;
                    border: 1px solid white;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }
                .image-toolbar{
                    position: absolute;
                    top:0;
                }
            </style>
            <div data-name="containerEl" class="container studio-layout">
                <div class="container toolbar" data-name="toolbarEl">
                    <button data-name="importModelButton">
                        <five-icon key="import"></five-icon>
                        Import model
                    </button>
                    <button data-name="newActionButton" title="New action">
                        <five-icon key="create"></five-icon>
                        New action
                    </button>
                </div>
                <div class="container main-viewer" data-name="svgViewerContainer">
                    <svg-background data-name="svgBackground"></svg-background>
                    <div class="viewer-wrapper">
                        <frame-editor data-name="svgViewer"></frame-editor>
                    </div>
                </div>
            </div>
        `);
        this.addAttributeChangeListener('model-key', (newValue) => {
            if (newValue) {
                this.body = Assets.loadBody(newValue);
                this.dispatchEvent(new CustomEvent('modelLoaded', { detail: this.body, bubbles: true }));
                this.updateUI();
            }
        });
    }

    connectedCallback() {
        super.connectedCallback();

        this.importModelButton.addEventListener('click', () => this.importModel());

        this.svgViewer.addEventListener('bodyUpdated', (e) => {
            Assets.saveBody(this.body);
            this.updateUI();
        });
        this.newActionButton.addEventListener('click', () => {
            const name = window.prompt('Enter action name');
            const action = new Action(name, this.body.key);
            action.addFrame();
            action.addFrame();
            Assets.saveAction(action, this.body.key);
            this.navigateToEditor(action.key);
        });

        this.updateUI();

    }
    updateUI() {
        if (this.body) {
            this.svgViewer.setBody(this.body);
            this.svgViewer.setModeDesign();
        }
    }
    newAction(name, bodyKey) {
        const action = new Action(name, bodyKey);
        action.addFrame();
        action.addFrame();
        this.setAction(action);
        this.setCurrentFrame(0);
    }
    navigateToEditor(actionKey) {
        //navigate to editor
        window.location.href = `../actions/${actionKey}`;
    }
    importModel() {
        const svgStr = prompt('Enter svg code');
        const name = prompt('Enter model name');
        this.body = this.parseBodySVG(svgStr, name);
        this.updateUI();
    }

}
customElements.define('model-editor', ModelEditor);