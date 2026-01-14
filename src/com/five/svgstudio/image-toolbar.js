import BaseComponent from "../core/base-component.js";

export const NONE = 0, MOVE_IMAGE = 1, RESIZE_IMAGE = 2, ROTATE_IMAGE = 3;
export const ROTATE_90 = 0, FLIP_HORIZONTAL = 1;

export default class ImageToolbar extends BaseComponent {
    static observedAttributes = [];
    tool = NONE;
    constructor() {
        super(/*html*/`
            <style>
                .toolbar{
                    position: absolute;
                    top:0;
                    display: flex;
                    gap: 0.5em;
                    flex-direction: column;
                    padding: 0.5em;
                }
                .toolbar button{
                    opacity: 0.2;
                }
                .toolbar:hover button{
                    opacity: 0.8;
                }
                .toolbar button.selected{
                    opacity: 1;
                    color: white;
                }
            </style>
            <div class="toolbar" data-name="toolbar">
                <button class="not-button" data-name="imageDeleteButton">
                    <five-icon key="delete"></five-icon>
                </button>
                <button class="not-button" data-name="imageRotate90Button">
                    <five-icon key="rotateRight"></five-icon>
                </button>
                <button class="not-button" data-name="imageFlipButton">
                    <five-icon key="flipHorizontal"></five-icon>
                </button>
                <button class="not-button" data-name="imageResizeButton">
                    <five-icon key="scale"></five-icon>
                </button>
                <button class="not-button" data-name="imageRotateButton">
                    <five-icon key="rotate"></five-icon>
                </button>
                <button class="not-button" data-name="imageMoveButton">
                    <five-icon key="move"></five-icon>
                </button>
            </div>
        `);
    }
    connectedCallback() {
        super.connectedCallback();
        this.imageDeleteButton.addEventListener('click', () => {
            this.fireEvent('deleteImage');
            this.updateUI();
        });
        this.imageRotate90Button.addEventListener('click', () => {
            this.fireEvent('operationRequested', ROTATE_90);
            this.updateUI();
        });
        this.imageFlipButton.addEventListener('click', () => {
            this.fireEvent('operationRequested', FLIP_HORIZONTAL);
            this.updateUI();
        });
        this.imageResizeButton.addEventListener('click', () => {
            this.fireEvent('toolSelected', RESIZE_IMAGE);
            this.tool = RESIZE_IMAGE;
            this.updateUI();
        });
        this.imageRotateButton.addEventListener('click', () => {
            this.fireEvent('toolSelected', ROTATE_IMAGE);
            this.tool = ROTATE_IMAGE;
            this.updateUI();
        });
        this.imageMoveButton.addEventListener('click', () => {
            this.fireEvent('toolSelected', MOVE_IMAGE);
            this.tool = MOVE_IMAGE;
            this.updateUI();
        });
    }
    updateUI() {
        this.imageResizeButton.classList.toggle('selected', this.tool === RESIZE_IMAGE);
        this.imageRotateButton.classList.toggle('selected', this.tool === ROTATE_IMAGE);
        this.imageMoveButton.classList.toggle('selected', this.tool === MOVE_IMAGE);
    }
    done() {
        this.tool = NONE;
        this.updateUI();
    }
}
customElements.define('image-toolbar', ImageToolbar);