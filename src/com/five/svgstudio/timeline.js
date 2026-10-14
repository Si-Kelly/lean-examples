import BaseComponent from "../core/base-component.js";
import { SVGUtil, Drag, XY } from '../core/ui-utils.js';

export default class Timeline extends BaseComponent {
    static observedAttributes = [];
    margin = 0;;
    constructor() {
        super(/*html*/`
        <style>
            svg{
                line, path, rect{
                    stroke:red;
                    fill:none;
                    vector-effect: non-scaling-stroke;
                    &.timeline-line, &.frame-rect{
                        stroke: #808080;
                        stroke-width: 1;
                    }
                }
                .playhead path{
                    fill: #30bced;
                    stroke: #007fae;
                }
            }
        </style>
        <div class="timeline-container">
            <svg style="width: 100%; height: 50px; display: block;" preserveAspectRatio="none" data-name="timelineSvg" viewBox="0 0 100 50" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <g id="frameMarkerTemplate">
                        <line x1="0" y1="0" x2="0" y2="50" class="frame-line" style="stroke:red;stroke-width:1"></line>
                    </g>
                </defs>
                <rect x="0" y="0" width="100" height="50" class="frame-rect"></rect>
                <line data-name="timeline" class="timeline-line" x1="0" y1="25" x2="100" y2="25"></line>
                <g data-name="framesContainer"></g>
                <g data-name="playhead" class="playhead" width="20" height="50" x="10" y="0">
                <path d="M 0 35 L 10 25 L 20 35 L 20 50 L 0 50 L 0 35 Z" ></path>
                </g>
            </svg>

        </div>
        `);
    }
    connectedCallback() {
        super.connectedCallback();
        this.currentFrame = this.currentFrame ?? 0;
        this.svgUtil = new SVGUtil(this.timelineSvg);
        this.moveListener = (e) => {
            if (!this.drag) return;
            var xy = e.changedTouches && e.changedTouches.length == 1 ?
                new XY(e.changedTouches[0].offsetX, e.changedTouches[0].offsetY) :
                new XY(e.offsetX, e.offsetY);
            this.drag.nextXY(this.svgUtil.getSVGXY(xy));
            e.stopPropagation();
            e.preventDefault();
        }
        document.addEventListener('mousemove', this.moveListener);
        this.upListener = (e) => {
            if (this.drag) {
                this.drag.done();
                this.drag = null;
                e.stopPropagation();
                e.preventDefault();
            }
        };
        document.addEventListener('mouseup', this.upListener);
        this.playhead.addEventListener('mousedown', (e) => {
            this.beginScrub();
            e.stopPropagation();
            e.preventDefault();
        });
    }
    disconnectedCallback() {
        super.disconnectedCallback();
        document.removeEventListener('mousemove', this.moveListener);
        document.removeEventListener('mouseup', this.upListener);
    }
    updateUI() {
        if (!this.body || !this.action) return;
        window.requestAnimationFrame(() => {
            this.updatePlayheadUI();
            this.action.frames.forEach((frame, index) => {
                let el = this.timelineSvg.querySelector(`use[data-frame-index='${index}']`);
                if (!el) {
                    el = document.createElementNS('http://www.w3.org/2000/svg', 'use');
                    el.setAttributeNS('http://www.w3.org/1999/xlink', 'href', '#frameMarkerTemplate');
                    el.dataset.frameIndex = index;
                    el.onmousedown = (e) => {
                        //start drag to move frame start time
                        this.beginDragFrame(index);
                        e.stopPropagation();
                    };
                    this.framesContainer.append(el);
                }
                const frameStartTime = this.action.frames[index].startTime;
                el.setAttribute('x', `${this.margin + (frameStartTime / this.action.duration) * (100 - this.margin * 2)}`);
                el.setAttribute('y', `0`);
            });
        });
    }
    updatePlayheadUI() {
        //scale playhead to 20px wide
        const sf = 1 / this.svgUtil.screenRatio;
        const frameTime = this.scrubTime ?? this.action.frames[this.currentFrame].startTime;
        this.playhead.setAttribute('transform', ` translate(${this.margin + (frameTime / this.action.duration) * (100 - this.margin * 2)}, 0) scale(${sf}, 1) translate(-10, 0)`);
    }
    beginDragFrame(frameIndex) {
        this.drag = new Drag({
            next: (dxy) => {
                this.updateUI();
                const currentStartTime = this.action.getFrameStartTime(frameIndex);
                this.action.setFrameStartTime(frameIndex, currentStartTime + (dxy.x / (100 - this.margin * 2)) * this.action.getDuration());
            }, done: () => {

            },

        }, 'move-frame');
    }
    beginScrub() {
        const fireEvent = Drag.throttle(() => {
            this.dispatchEvent(new CustomEvent('scrubToTime', { detail: this.scrubTime }));
        }, 80);
        const initialFrameTime = this.scrubTime ?? this.action.frames[this.currentFrame].startTime;
        this.drag = new Drag({
            next: (_, thisXY) => {
                const totalDXY = thisXY.diff(this.drag.firstXY);
                this.scrubTime = initialFrameTime + (totalDXY.x / 100) * this.action.duration;
                this.updatePlayheadUI();
                fireEvent();
            }, done: () => {

            },
            stop: () => {
                this.scrubTime = null;
                this.drag = null;
                this.updateUI();
            }

        }, 'scrub-timeline');
    }
    scrubToTime(time) {
        if (!this.drag) {
            this.scrubTime = time;
            this.updateUI();
        }
    }
    setData({ action, body, currentFrame = 0 }) {
        this.action = action;
        this.body = body;
        this.currentFrame = currentFrame;
        this.updateUI();
    }
    setCurrentFrame(currentFrame) {
        this.scrubTime = null;
        this.currentFrame = currentFrame;
        if (this.drag) {
            this.drag.stop();
        }
        this.updateUI();
    }
}
customElements.define('svg-timeline', Timeline);