import BaseComponent from "../core/base-component.js";
import { ImageContext, Drag, XY } from "../core/ui-utils.js";
import { Body, Segment, Shape, Path } from './body.js';
import './frame-editor.js';
import { Action } from './action.js';
import { NONE, MOVE_IMAGE, RESIZE_IMAGE, ROTATE_IMAGE } from "./image-toolbar.js";
import { Assets } from "./assets.js";
import SVGParser from "./parser.js";
import { FrameRenderer } from "./renderer.js";

const DESIGN = 0, IMAGE_DROP_OVER = 2, ANIMATE = 3, BACKGROUND = 4, PREVIEW = 5;


export default class ModelEditor extends BaseComponent {

    static observedAttributes = ['model-key'];

    /**
     * @type {Body}
     */
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
                    <button data-name="saveModelButton" title="Save model">
                        <five-icon key="save"></five-icon>
                        Save
                    </button>
                    <button data-name="saveAsModelButton" title="Save as...">
                        <five-icon key="saveAs"></five-icon>
                        Save as...
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
                this.setBody(Assets.loadBody(newValue));
                this.dispatchEvent(new CustomEvent('modelLoaded', { detail: this.body, bubbles: true }));
                this.updateUI();
            }
        });
    }

    connectedCallback() {
        super.connectedCallback();

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
        this.saveAsModelButton.onclick = () => {
            this.saveAs();
        }
        this.saveModelButton.onclick = () => {
            this.save();
        }

        this.updateUI();

    }
    updateUI() {
    }
    setBody(body) {
        this.body = body;
        this.svgViewer.setBody(this.body);
        this.svgViewer.setModeDesign();
        this.updateUI();
    }
    async saveAs() {
        //choose directory to save file
        this.fileHandle = await window.showSaveFilePicker({
            suggestedName: `${this.body.name}.model.svg`,
            types: [{ description: 'Model', accept: { 'image/svg+xml': ['.model.svg'] } }]
        });
        this.save();
    }
    async save() {
        if(!this.fileHandle){
            await this.saveAs();
            return;
        }
        await this.#saveTo(this.fileHandle);
    }
    /**
     * @param {FileSystemFileHandle} fileHandle
     */
    async #saveTo(fileHandle) {
        const writable = await fileHandle.createWritable();
        await writable.write(this.getSVGContent())
        await writable.close();
    }
    setFileHandle(fileHandle) {
        this.fileHandle = fileHandle;
        this.updateUI();
    }
    getSVGContent() {
        const tempEl = document.createElement('svg');
        const layer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        tempEl.append(layer);
        const renderer = new FrameRenderer(layer, tempEl);
        renderer.render(this.body, Assets.loadActions(this.body.key));
        return /*svg*/`<?xml version="1.0" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 20010904//EN" "http://www.w3.org/TR/2001/REC-SVG-20010904/DTD/svg10.dtd">
        <svg version="1.0" xmlns="http://www.w3.org/2000/svg" viewbox="0 0 1000 500">
        ${tempEl.innerHTML}
        </svg>
        `;
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


}
customElements.define('model-editor', ModelEditor);