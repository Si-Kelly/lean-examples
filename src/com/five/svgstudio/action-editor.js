import BaseComponent from "../core/base-component.js";
import { ImageContext, Drag, XY } from "../core/ui-utils.js";
import './frame-editor.js';
import { Action } from './action.js';
import { NONE, MOVE_IMAGE, RESIZE_IMAGE, ROTATE_IMAGE } from "./image-toolbar.js";
import { Assets } from "./assets.js";
import FrameNav from "./frame-nav.js";
import Timeline from "./timeline.js";
import ImageToolbar from "./image-toolbar.js";
import FrameEditor from "./frame-editor.js";

const IMAGE_DROP_OVER = 2, ANIMATE = 3, PREVIEW = 5;


const defaultSvg = /*html*/``;
export default class ActionEditor extends BaseComponent {
    static observedAttributes = ['action-key'];

    body = null;
    currentFrame = 0;
    mode = ANIMATE;
    imageMenuShowing = false;
    action = new Action();
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
                .middle{
                    flex:1;
                    gap:1em;
                    flex-grow: 1;
                }
                .toolbar{
                    gap:0.5em;
                    padding: 0.25em 0.5em;
                    font-size: 0.9em;
                }
                .tabs button{
                    border: none;
                    background: none;

                }
                .tabs button.selected, .tabs button.selected:hover{
                        background: #00756b;
                        color: white;
                }
                .image-drop-target{
                    position: absolute;
                    top:0;
                    left:0;
                    width:100%;
                    height:100%;
                    background: rgba(0,0,0,0.5);
                }
                .image-drop-active{
                    border: 2px dashed white;
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
                .timeline{
                    flex-direction:column;
                    gap:0.5em;
                }
            </style>
            <five-studio-layout data-name="layout">
                <div slot="page-title">Action editor</div>
                <div slot="content">
                    <div data-name="containerEl" class="container studio-layout">
                        <div class="container toolbar" data-name="toolbarEl">
                            <div class="tabs">
                                <button data-name="animateModeButton">Animate</button>
                                <button data-name="previewModeButton">Preview</button>
                            </div>
                            <div>
                                <button data-name="addFrameButton">
                                    <five-icon key="add"></five-icon>
                                    Add frame
                                </button>
                                <button data-name="deleteFrameButton">
                                    <five-icon key="delete"></five-icon>
                                    Delete frame
                                </button>
                                <button data-name="duplicateFrameButton">
                                    <five-icon key="duplicate"></five-icon>
                                    Duplicate frame
                                </button>
                                <button data-name="importImagesButton">
                                    <five-icon key="import"></five-icon>
                                    Import reference images
                                </button>
                                <label>
                                    <input type="checkbox" data-name="additiveCB" checked>
                                    Additive
                                </label>
                            </div>
                        </div>
                        <div class="container middle">

                            <div class="container main-viewer" data-name="svgViewerContainer">
                                <svg-background data-name="svgBackground"></svg-background>
                                <div class="viewer-wrapper">
                                    <image-overlay data-name="imageOverlay"></image-overlay>
                                    <frame-editor data-name="editor"></frame-editor>
                                    <image-toolbar class="image-toolbar" data-name="imageToolbar"></image-toolbar>
                                </div>
                                <div class="image-drop-target" data-name="imageDropTargetEl">
                                    Drop image here
                                </div>
                            </div>

                        </div>
                        <div class="container timeline">
                            <div style="flex-grow:1">
                                <svg-timeline data-name="timelineNav"></svg-timeline>
                            </div>
                            <div style="flex-grow:1">
                                <frame-nav data-name="frameNav"></frame-nav>
                            </div>
                        </div>
                    </div>
                </div>
            </five-studio-layout>
        `);
        this.addAttributeChangeListener('action-key', (newValue) => {
            this.action = Assets.loadAction(newValue);
            this.body = Assets.loadBody(this.action.bodyKey);
        });
    }

    connectedCallback() {
        super.connectedCallback();

        if (!this.body) {
            // this.body = this.parseBodySVG(defaultSvg, 'cat');
            // this.newAction('walk', this.body.key);
        }
        if (this.action && this.body) {
            this.setData({ action: this.action, body: this.body });
            this.setCurrentFrame(0);
        }
        this.additiveCB.addEventListener('change', (e) => {
            const additive = e.target.checked;
            this.editor.setAdditiveMode(additive);
        });
        this.addFrameButton.addEventListener('click', () => this.addFrame());
        this.deleteFrameButton.addEventListener('click', () => this.deleteFrame());
        this.duplicateFrameButton.addEventListener('click', () => this.duplicateFrame());
        this.importImagesButton.addEventListener('click', () => this.importImages());
        this.animateModeButton.addEventListener('click', () => {
            this.setMode(ANIMATE);
            this.updateUI();
        });
        this.previewModeButton.addEventListener('click', () => {
            this.setMode(PREVIEW);
            this.setCurrentFrame(0);
            this.updateUI();
        });
        this.frameNav.addEventListener('navigateLeft', (e) => {
            this.previousFrame();
        });
        this.frameNav.addEventListener('navigateRight', (e) => {
            this.nextFrame();
        });
        this.frameNav.addEventListener('frameSelected', (e) => {
            this.setMode(ANIMATE);
            this.setCurrentFrame(e.detail);

        });
        this.imageOverlay.addEventListener('deleteImage', (e) => {
            this.action.setImage(this.currentFrame, null);
            this.updateUI();
        });
        this.imageOverlay.addEventListener('imageUpdated', (e) => {
            this.imageToolbar.done();
            this.tool = NONE;
            this.updateUI();
        });
        this.imageToolbar.addEventListener('toolSelected', (e) => {
            this.tool = e.detail;
            this.imageOverlay.setEditing(true);
            this.updateUI();
        });
        this.imageToolbar.addEventListener('operationRequested', (e) => {
            this.imageOverlay.applyOperation(e.detail);
            this.updateUI();
        });
        this.imageToolbar.addEventListener('delete', (e) => {
            this.action.setImage(this.currentFrame, null);
            this.updateUI();
        });
        this.addEventListener('mousedown', (e) => {
            switch (this.tool) {
                case MOVE_IMAGE:
                    this.imageOverlay.startImageMove();
                    e.preventDefault();
                    break;
                case RESIZE_IMAGE:
                    this.imageOverlay.startImageScale();
                    e.preventDefault();
                    break;
                case ROTATE_IMAGE:
                    this.imageOverlay.startImageRotation();
                    e.preventDefault();
                    break;
                default:
                    // Handle default case here
                    break;
            }
        });
        this.addEventListener('mouseup', (e) => {
            if (this.tool !== NONE) {
                this.imageOverlay.done();
                e.stopPropagation();
                e.preventDefault();
            }
        });
        this.editor.addEventListener('mousemove', (e) => {
            if (this.tool !== NONE) {
                var xy = e.changedTouches && e.changedTouches.length == 1 ?
                    new XY(e.changedTouches[0].offsetX, e.changedTouches[0].offsetY) :
                    new XY(e.offsetX, e.offsetY);
                this.imageOverlay.next(xy);
                e.preventDefault();
            }
        });
        //exit tool on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.tool = NONE;
                this.updateUI();
            }
        });


        this.editor.addEventListener('bodyUpdated', (e) => {
            console.log('saving body and action');
            Assets.saveBody(this.body);
            Assets.saveAction(this.action, this.body.key);
            this.timelineNav.setData({ action: this.action, body: this.body });
            this.updateUI();
        });
        this.editor.addEventListener('selectionChanged', (e) => {
            this.updateUI();
        });
        this.timelineNav.addEventListener('scrubToTime', (e) => {
            const time = e.detail;
            this.scrubToTime(time);
        });
        this.setMode(this.mode);
        this.updateUI();

    }
    updateUI() {


        this.imageDropTargetEl.style.display = this.mode == IMAGE_DROP_OVER ? '' : 'none';
        this.imageDropTargetEl.classList.toggle('image-drop-active', this.mode === IMAGE_DROP_OVER);
        this.imageOverlay.style.display = this.mode === ANIMATE ? '' : 'none';
        this.imageOverlay.style.cursor = this.tool === MOVE_IMAGE ? 'move' : this.tool === RESIZE_IMAGE ? 'nesw-resize' : this.tool === ROTATE_IMAGE ? 'crosshair' : 'default';
        this.imageOverlay.setImageContext(this.action.getImage(this.currentFrame));

        this.animateModeButton.classList.toggle('selected', this.mode === ANIMATE);


        const compBounds = this.imageOverlay.getBoundingClientRect();
        const imgBounds = this.imageOverlay.shadowRoot.querySelector('img').getBoundingClientRect();
        this.imageToolbar.style.top = `${imgBounds.top - compBounds.top}px`;
        this.imageToolbar.style.left = `${imgBounds.left + imgBounds.width - compBounds.left}px`;
        this.imageToolbar.style.display = this.mode == ANIMATE && this.action.getImage(this.currentFrame) && !this.editor.selectedSegment ? '' : 'none';

        this.previewModeButton.classList.toggle('selected', this.mode === PREVIEW);


    }
    newAction(name, bodyKey) {
        const action = new Action(name, bodyKey);
        action.addFrame();
        action.addFrame();
        this.setAction(action);
        this.setCurrentFrame(0);
    }
    setMode(mode) {
        this.mode = mode;
        switch (mode) {
            case ANIMATE:
                this.editor.setModeAnimate();
                break;
            case PREVIEW:
                this.editor.setModePlay();
                break;
            default:
                break;
        }
        this.updateUI();
    }
    addFrame() {
        this.action.addFrame();
        this.nextFrame();
        Assets.saveAction(this.action, this.body.key);
        this.updateUI();
    }
    deleteFrame() {
        this.action.deleteFrame(this.currentFrame);
        this.previousFrame();
        Assets.saveAction(this.action, this.body.key);
        this.updateUI();
    }
    duplicateFrame() {
        this.action.duplicateFrame(this.currentFrame);
        this.nextFrame();
        Assets.saveAction(this.action, this.body.key);
        this.updateUI();
    }

    importModel() {
        const svgStr = prompt('Enter svg code');
        const name = prompt('Enter model name');
        this.body = this.parseBodySVG(svgStr, name);
        this.updateUI();
    }
    importImages() {
        const bounds = this.svgViewerContainer.getBoundingClientRect();
        //open file browser for multiple images to be imported
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.accept = 'image/*';
        input.addEventListener('change', (e) => {
            const files = e.target.files;
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                this.insertImageFile(file, bounds);
            }
            input.remove();
        });
        this.shadowRoot.appendChild(input);
        input.click();
        this.updateUI();
    }
    dropImage(e) {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        this.insertImageFile(file);
    }
    insertImageFile(file, bounds) {
        const reader = new FileReader();
        if (!this.action.hasFrame(this.currentFrame)) {
            this.addFrame();
        }
        else if (this.action.getImage(this.currentFrame)) {
            if (!this.action.hasFrame(this.currentFrame + 1)) {
                this.addFrame();
            } else {
                this.nextFrame();
            }
        }
        console.log('adding image to frame', this.currentFrame, bounds);

        const imgCtx = new ImageContext();
        this.action.setImage(this.currentFrame, imgCtx);
        Assets.saveAction(this.action, this.body.key);
        reader.onload = (e) => {
            imgCtx.setSrc(e.target.result);
            const img = new Image();
            //get the actual image size
            img.onload = () => {
                //move imgae to centre of screen
                imgCtx.centerImage(bounds.width, bounds.height, img.width, img.height);
                this.updateUI();
            }
            img.src = imgCtx.src;
        }
        reader.readAsDataURL(file);
    }
    setAction(action) {
        this.setData({ action, body: this.body });
        this.setCurrentFrame(0);
    }
    setBody(body) {
        this.body = body;
        this.editor.setBody(body);
        if (this.layout.setModelKey)
            this.layout.setModelKey(this.body.key);
        this.updateUI();
    }
    setData({ action, body }) {
        this.body = body;
        this.action = action;
        this.editor.setData({ action, body });
        this.frameNav.setData({ action, body });
        this.timelineNav.setData({ action, body });
        if (this.layout.setModelKey)
            this.layout.setModelKey(this.body.key);
        this.updateUI();
    }

    nextFrame() {
        if (!this.action.hasFrame(this.currentFrame + 1)) return;
        this.setCurrentFrame(this.currentFrame + 1);
    }

    previousFrame() {
        if (this.currentFrame == 0) return;
        this.setCurrentFrame(this.currentFrame - 1);
    }
    /**
     * 
     * @param {number} frame 
     */
    setCurrentFrame(frame) {
        if (frame >= 0 && frame < this.action.frames.length) {
            this.currentFrame = frame;
            this.editor.setCurrentFrame(frame);
            this.frameNav.setCurrentFrame(frame);
            this.timelineNav.setCurrentFrame(frame);
            this.updateUI();
        }
    }
    scrubToTime(time) {
        this.currentFrame = this.action.getFrameAtTime(time);
        this.editor.scrubToTime(time);
        this.timelineNav.scrubToTime(time);
        console.log('scrubbing to time', time);
        this.frameNav.setCurrentFrame(this.currentFrame);  
        this.updateUI(); 
    }

    loaded() {
        this.updateUI();
    }

}
customElements.define('action-editor', ActionEditor);