import BaseComponent from "../core/base-component.js";
import Editor from "./editor.js";
import ImageOverlay from "./image-overlay.js";
import { ImageContext } from "../core/ui-utils.js";
import { FrameRenderer } from "./renderer.js";

export default class FrameNav extends BaseComponent {
    /**
     * @type {number}
     * @description the current frame index.
     */
    currentFrame = 0;
    /**
     * @type {Body}
     * @description the body being animated.
     */
    body;
    /**
     * @type {Action}
     * @description the action being displayed.
     */
    action;


    constructor() {
        super(/*html*/`
            <style>
                .container {
                    display: flex;
                    gap: 1em;
                    overflow:auto;
                }
                .frame-preview-container {
                    max-width:1000px;
                    display: flex;
                    gap: 1em;
                    overflow: auto;
                    align-items: center;
                }
                .frame-preview {
                    position: relative;
                    border: 1px solid #808080;
                    border-radius: 5px;
                    min-width: 200px;
                    max-width: 200px;
                    height: 100px;
                }
                .current-frame {
                    border: 2px solid red;
                }

            </style>
            <div class="container">
                <div class="container frame-preview-container" data-name="framePreviewContainerEl">

                </div>
                <template data-name="framePreviewTemplate">
                    <button class="frame-preview">
                        <image-overlay data-name="imageOverlay"></image-overlay>
                        <svg data-name="svgEl" width="200" height="100" viewbox="0 0 1000 500"></svg>
                    </button>
                </template>
            </div>
        `);
    }
    connectedCallback() {
        super.connectedCallback();
        this.currentFrame = 0;
    }
    updateUI() {
        const framePreviewTemplate = this.framePreviewTemplate;
        const framePreviewContainerEl = this.framePreviewContainerEl;
        framePreviewContainerEl.innerHTML = '';

        this.action.frames.forEach((frame, frameIndex) => {
            const framePreview = framePreviewTemplate.clone();
            framePreviewContainerEl.appendChild(framePreview);
            // const imageOverlay = framePreview.querySelector('[data-name="imageOverlay"]');
            // imageOverlay.setEditable(false);
            // imageOverlay.setScale(0.2);
            // if (frame.image) {
            //     imageOverlay.setImageContext(frame.image);
            // }
            if (this.body && this.action) {
                // const frameViewer = framePreview.querySelector('[data-name="frameViewer"]');
                // frameViewer.setModeView();
                // frameViewer.setAction(this.action);
                // frameViewer.setCurrentFrame(frameIndex);
                // frameViewer.setBody(this.body);
                // let frame = frameIndex;
                framePreview.onclick = () => {
                    this.dispatchEvent(new CustomEvent('frameSelected', { detail: frameIndex }));
                };
                const renderer = new FrameRenderer(framePreview.querySelector('[data-name="svgEl"]'));
                renderer.render(this.body, [this.action]);
                renderer.update(this.action, frameIndex);
            }
            if (frameIndex === this.currentFrame) {
                framePreview.classList.add('current-frame');
                //framePreview.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
            }
        });

    }
    setCurrentFrame(currentFrame) {
        this.currentFrame = currentFrame;
        this.updateUI();
    }
    setFrameImages(frameImages) {
        this.frameImages = frameImages;
        this.updateUI();
    }
    setData({ action, body }) {
        this.action = action;
        this.body = body;
        this.updateUI();
    }
}
customElements.define('frame-nav', FrameNav);