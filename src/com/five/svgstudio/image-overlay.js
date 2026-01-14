import BaseComponent from "../core/base-component.js";
import { Drag, XY, ImageContext } from "../core/ui-utils.js";
import { ROTATE_90, FLIP_HORIZONTAL } from "./image-toolbar.js";


export default class ImageOverlay extends BaseComponent {

    imageContext = null;
    editable = true;
    editing = false;
    scale = 1;

    constructor() {
        super(/*html*/`
            <style>

                .image-overlay{
                    position: absolute;
                    top:0;
                    left:0;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    opacity: 0.5;
                }
                .image-overlay img{
                    top:0;
                    left:0;
                    position:absolute;
                }
                .image-overlay.active{
                    opacity: 0.6;
                }
                .image-overlay.active img{
                    border : 2px solid cyan;
                    opacity: 1;
                }
                .image-drop-active{
                    border: 2px dashed white;
                }

            </style>
                <div data-name="imageOverlay" class="image-overlay">
                    <img data-name="overlayImage" src="" alt="">

                </div>
        `);
    }
    connectedCallback() {


        this.updateUI();
    }
    updateUI() {
        if (this.imageContext) {
            this.overlayImage.src = this.imageContext.src;
            const { translateX, translateY, scaleX, scaleY, rotate } = this.imageContext.transform;
            const transformStr = `
                scale(${scaleX}, ${scaleY})
                rotate(${rotate}deg)
            `;
            this.overlayImage.style.transform = transformStr;
            this.overlayImage.style.left = `${translateX}px`;
            this.overlayImage.style.top = `${translateY}px`;
        } else {
            this.overlayImage.src = '';
        }
        this.imageOverlay.style.pointerEvents = (!this.editable || this.editing) ? '' : 'none';
        this.imageOverlay.style.transform = `scale(${this.scale})`;
    }

    getCenterXY() {
        const { width, height, top, left } = this.overlayImage.getBoundingClientRect();
        return new XY(left + width / 2, top + height / 2);
    }
    startImageMove() {
        this.drag = new Drag({
            next: (dxy) => {
                this.imageContext.move(dxy);
                this.updateUI();
            },
            done: () => {
                this.drag = null;
                this.editing = false;
                this.fireEvent('imageUpdated', this.currentFrame);
                this.updateUI();
            }
        });
    }
    startImageScale() {
        let lastDistance;
        this.drag = new Drag({
            next: () => {
                const centerXY = this.getCenterXY();
                if (!lastDistance) {
                    lastDistance = centerXY.distanceTo(this.drag.firstXY);
                }
                const distance = centerXY.distanceTo(this.drag.thisXY);
                const sf = distance / lastDistance;
                this.imageContext.scale(sf);
                lastDistance = distance;
                this.updateUI();
            },
            done: () => {
                this.drag = null;
                this.editing = false;
                this.fireEvent('imageUpdated', this.currentFrame);
                this.updateUI();
            }
        });
    }
    startImageRotation() {
        let startAngle;
        this.drag = new Drag({
            next: () => {
                const imgCtx = this.imageContext;
                if (!startAngle) {
                    startAngle = this.drag.firstXY.angleTo(this.getCenterXY());
                }
                let a = this.drag.thisXY.angleTo(this.getCenterXY());
                a = imgCtx.isFlipped() ? startAngle - a : a - startAngle;
                imgCtx.setAngle(a);
                this.updateUI();
            },
            done: () => {
                this.drag = null;
                this.editing = false;
                this.fireEvent('imageUpdated', this.currentFrame);
                this.updateUI();
            }
        });
    }
    setImageContext(imgCtx) {
        this.imageContext = imgCtx;
        this.updateUI();
    }
    setEditable(editable) {
        this.editable = editable;
        this.updateUI();
    }
    setScale(scale) {
        this.scale = scale;
        this.updateUI();
    }
    applyOperation(operation) {
        switch (operation) {
            case ROTATE_90:
                this.imageContext.rotate90();
                break;
            case FLIP_HORIZONTAL:
                this.imageContext.flipHorizontal();
                break;
        }
        this.fireEvent('imageUpdated', this.currentFrame);
        this.updateUI();
    }
    next(xy) {
        if (this.drag) {
            this.drag.nextXY(xy);
        }
    }
    done() {
        if (this.drag) {
            this.drag.done();
        }
    }
    setEditing(editing) {
        this.editing = editing;
        this.updateUI();
    }
}
customElements.define('image-overlay', ImageOverlay);