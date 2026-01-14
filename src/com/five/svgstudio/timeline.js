import BaseComponent from "../core/base-component.js";

export default class Timeline extends BaseComponent {
    static observedAttributes = [];
    margin = 5;
    constructor() {
        super(/*html*/`
        <style>
            svg{
                line, path, rect{
                    stroke:red;
                    fill:none;
                    vector-effect: non-scaling-stroke;
                }
            }
        </style>
        <div class="timeline-container">
            <svg style="width: 100%; height: 50px; display: block;" preserveAspectRatio="none" data-name="timelineSvg" viewBox="0 0 100 50" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <g id="frameMarkerTemplate">
                        <rect x="0" y="0" width="100" height="50" class="frame-rect"></rect>
                        <line x1="0" y1="0" x2="0" y2="50" class="frame-line" style="stroke:red;stroke-width:5"></line>
                    </g>
                </defs>
                <rect x="0" y="0" width="100" height="50" class="frame-rect"></rect>
                <line data-name="timeline" x1="0" y1="25" x2="100" y2="25"></line>
                <!-- Rectangle with pointy top marker -->

            </svg>

            <svg viewBox="0 0 20 50" width="20" height="50" xmlns="http://www.w3.org/2000/svg" style="position:absolute; left:0; top:0;">
            <path data-name="playhead" d="M 0 35 L 10 25 L 20 35 L 20 50 L 0 50 L 0 35 Z" style="fill: red;"></path>
            </svg>
        </div>
        `);
    }
    connectedCallback() {
        super.connectedCallback();
    }
    updateUI() {
        if (!this.body || !this.action) return;
        const totalDuration = this.action.getDuration();
        this.action.frames.forEach((frame, index) => {
           let el = this.timelineSvg.querySelector(`use[data-frame-index='${index}']`);
           if(!el){
               el = document.createElementNS('http://www.w3.org/2000/svg', 'use');
               el.setAttributeNS('http://www.w3.org/1999/xlink', 'href', '#frameMarkerTemplate');
               el.dataset.frameIndex = index;
               this.timelineSvg.appendChild(el);
            }
           const frameStartTime = this.action.getFrameStartTime(index);
           el.setAttribute('x', `${this.margin + (frameStartTime / totalDuration) * (100 - this.margin * 2)}`);
           el.setAttribute('y', `0`);
        });
    }
    setData({ action, body, currentFrame }) {
        this.action = action;
        this.body = body;
        this.currentFrame = currentFrame;
        this.updateUI();
    }
}
customElements.define('svg-timeline', Timeline);