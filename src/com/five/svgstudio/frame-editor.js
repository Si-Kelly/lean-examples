import BaseComponent from "../core/base-component.js";
import { SVGUtil, AnimationUtil, Drag, XY } from '../core/ui-utils.js';
import { FrameRenderer } from "./renderer.js";
const DESIGN = 0, ANIMATE = 1, PLAY = 2, VIEW = 3;
const FPS = 5;
export default class FrameEditor extends BaseComponent {
    /**
     * @type {Body}
     * @description the current model being edited.
     */
    body = null;
    /**
     * @type {0|1|2|3}
     * @description the current mode of the viewer.
     */
    mode = DESIGN;
    /**
     * @type {Action}
     * @description the current Action being edited.
     */
    action = null;
    /**
     * @type {SVGUtil}
     * @description the utility class for manipulating the SVG elements.
     */
    svgUtil;

    /**
     * @type {FrameRenderer}
     * @description the renderer for displaying the SVG elements.
     */
    renderer;

    /**
     * @type {boolean}
     */
    additiveMode = true;

    /**
     * @type {number}
     * @description the current frame index.
     */
    frame = 0;
    /**
     * @type {Drag}
     */
    drag = null;
    /**
     * @type {number}
     */
    viewportWidth = 1000;
    /**
     * @type {number}
     */
    viewportHeight = 500;
    /**
     * @type {number}
     */
    viewportWidth0 = 1000;
    /**
     * @type {number}
     */
    viewportHeight0 = 500;
    /**
     * @type {number}
     */
    viewportXOffset = 0;
    /**
     * @type {number}
     */
    viewportYOffset = 0;
    /**
     * @type {number}
     */
    gridWidth = 6000;
    /**
     * @type {number}
     */
    gridHeight = 3000;

    /**
     * @type {number}
     */
    currentZoomFactor = 1;

    constructor() {
        super(/*html*/`
            <style>
                .container {
                    position: relative;
                    display: flex;
                    gap: 1em;
                }
                svg {
                    width: 100%;
                    height: 100%;
                }
                svg:not(:root) {
                    overflow: visible;
                }
                svg:not(:root).outer{
                    overflow: hidden;
                }
                .body{
                    path{
                        fill-opacity: 0.8;
                        fill: #30bced;
                        stroke: #30bced;
                    }
                    .selected path{
                        stroke:white;
                        stroke-width:2;
                    }
                    .pivot-point {
                        fill: red;
                    }
                    .locked path{
                        stroke: #303030;
                    }
                    .locked .pivot-point {
                        fill: #303030;
                    }
                }
                .grid{
                    .grid-lines{
                        stroke: #ccc;
                        stroke-width: 0.5;
                        vector-effect: non-scaling-stroke;
                        fill:none;
                    }
                    .centre-lines{
                        vector-effect: non-scaling-stroke;
                        stroke: #888;
                        stroke-width: 1;
                    }
                    &.pan-indicator-additive .grid-lines{
                        stroke: red;
                    }
                    &.pan-indicator .grid-lines{
                        stroke: green;
                    }
                }
               
            </style>
            <div class="container">
                <svg data-name="svgEl" class="body outer" width="1000" height="500" viewbox="0 0 1000 500">
                    <g data-name="gridEl" class="grid" >
                    </g>
                    <g data-name="bodyEl" class="body" ></g>
                </svg>
            </div>
        `);
    }
    // SETUP
    connectedCallback() {
        this.svgUtil = new SVGUtil(this.svgEl);
        this.renderer = new FrameRenderer(this.bodyEl, this.svgEl);

        this.shadowRoot.addEventListener('mousemove', (e) => {
            if (this.drag) {
                var xy = e.changedTouches && e.changedTouches.length == 1 ?
                    new XY(e.changedTouches[0].offsetX, e.changedTouches[0].offsetY) :
                    new XY(e.offsetX, e.offsetY);
                this.drag.nextXY(this.svgUtil.getSVGXY(xy));
                e.preventDefault();
            } else if (e.shiftKey) {
                this.shiftPressed = true;
                this.updateUI();
            } else if (this.shiftPressed) {
                this.shiftPressed = false;
                this.updateUI();
            }
        });
        this.shadowRoot.addEventListener('mouseup', (e) => {
            if (this.drag) {
                this.drag.done();
                this.drag = undefined;
                e.stopPropagation();
                e.preventDefault();
            } else {
                this.clearSelection();
            }
        });
        //add wheelmouse listener for zooming
        this.svgEl.addEventListener('wheel', (e) => {
            if (e.deltaY != 0) {
                const zoomFactor = Math.exp(e.deltaY * 0.001);
                const mouseSVGXY = this.svgUtil.getSVGXY(new XY(e.offsetX, e.offsetY));
                this.zoom(mouseSVGXY, zoomFactor);

                e.preventDefault();
            }
        });

        document.addEventListener('keydown', this.keyDownListener = (e) => {
            if (e.key === ' ') {
                this.spacePressed = true;
                this.updateUI();
                e.preventDefault();
            }
        });
        document.addEventListener('keyup', this.keyUpListener = (e) => {
            if (e.key === 'Escape') {
                if (this.drag) {
                    this.drag = undefined;
                }
                this.clearSelection();
                this.updateUI();
            }
            if (e.key == 'ArrowUp' && this.mode == ANIMATE) {
                this.selectParentSegment();
            }
            if (e.key == 'ArrowDown' && this.mode == ANIMATE) {
                this.selectChildSegment();
            }
            if (e.key === ' ') {
                this.spacePressed = false;
                this.updateUI();
                e.preventDefault();
            }
        });
        this.svgEl.addEventListener('mousedown', (e) => {
            if (this.mode != DESIGN && this.mode != ANIMATE) return;
            e.stopPropagation();
            e.preventDefault();
            //if middle mouse button or space key is held down
            if (e.button === 1 || e.buttons === 4 || this.spacePressed) {
                this.beginPanViewport();
            } else if (e.shiftKey) {
                this.beginMoveGrid();
            }
        });
        this.pivotPointEl = this.createPivotPointEl();
        this.svgEl.append(this.pivotPointEl);
    }
    disconnectedCallback() {
        //clean up event listeners
        document.removeEventListener('keyup', this.keyUpListener);
    }
    //UPDATES TO DOM
    updateUI() {
        this.svgEl.setAttribute('viewBox', `0 0 ${this.viewportWidth} ${this.viewportHeight}`);
        this.svgEl.classList.toggle('locked', !(this.mode == DESIGN || this.mode == ANIMATE));

        if (!this.body) return;
        this.updatePivotPoint(this.selectedSegment);
        this.svgEl.setAttribute('viewBox', `${this.viewportXOffset} ${this.viewportYOffset} ${this.viewportWidth} ${this.viewportHeight}`);
        //update grid position
        this.redrawGrid();
        this.gridEl.style.visibility = (this.mode == DESIGN || this.mode == ANIMATE) ? 'visible' : 'hidden';
        this.style.cursor = this.drag?.type === 'pan-viewport' || this.drag?.type === 'pan-grid' ? 'grabbing'
            : this.drag?.type === 'move-segment' || this.drag?.type === 'move-pivot-point' ? 'move'
                : this.drag?.type === 'rotate-segment' ? 'rotate'
                    : this.mode == ANIMATE && (this.spacePressed || this.shiftPressed) ? 'grab' : 'default';
        this.gridEl.classList.toggle('pan-indicator-additive', this.mode == ANIMATE && this.shiftPressed == true && this.additiveMode == true);
        this.gridEl.classList.toggle('pan-indicator', this.mode == ANIMATE && this.shiftPressed == true && !this.additiveMode);
    }
    getFrameOffset() {
        let frameGridXOffset = 0;
        let frameGridYOffset = 0;
        if (this.action && this.frame != null) {
            const frame = this.action.frames[this.frame];
            if (this.timeOffset != null) {//when scrubbing
                let x0 = frame.xOffset;
                let x1 = this.action.frames[Math.min(this.frame + 1, this.action.frames.length - 1)].xOffset;
                frameGridXOffset = AnimationUtil.lerp(x0, x1, AnimationUtil.clamp((this.timeOffset - frame.startTime) / frame.duration, 0, 1));
                let y0 = frame.yOffset;
                let y1 = this.action.frames[Math.min(this.frame + 1, this.action.frames.length - 1)].yOffset;
                frameGridYOffset = AnimationUtil.lerp(y0, y1, AnimationUtil.clamp((this.timeOffset - frame.startTime) / frame.duration, 0, 1));
            } else {
                frameGridXOffset = (frame.xOffset ?? 0);
                frameGridYOffset = (frame.yOffset ?? 0);
            }
        }
        return { frameGridXOffset, frameGridYOffset };
    }
    redrawGrid() {

        const gridDef = [{
            spacing: 100,
            strokeWidth: 0.5,
            stroke: '#ccc'
        },
        {
            spacing: 500,
            strokeWidth: 1,
            stroke: '#888'
        },
        {
            spacing: 1000,
            strokeWidth: 1.5,
            stroke: '#555'
        }];
        this.gridEl.innerHTML = '';
        const { frameGridXOffset, frameGridYOffset } = this.getFrameOffset();
        const gridYOffset = this.viewportYOffset + frameGridYOffset;
        const gridXOffset = this.viewportXOffset + frameGridXOffset;

        gridDef.forEach(def => {
            const vlineX = gridXOffset - (this.viewportXOffset % def.spacing) - 2 * def.spacing;
            const hlineY = gridYOffset - (this.viewportYOffset % def.spacing) - 2 * def.spacing;
            //vertical lines
            for (let x = vlineX; x < vlineX + this.viewportWidth + 3 * def.spacing; x += def.spacing) {
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', this.px(x));
                line.setAttribute('y1', this.px(-800000));
                line.setAttribute('x2', this.px(x));
                line.setAttribute('y2', this.px(800000));
                line.classList.add('grid-lines');
                line.setAttribute('stroke-width', def.strokeWidth.toString());
                line.setAttribute('stroke', def.stroke);
                this.gridEl.appendChild(line);
            }
            //horizontal lines
            for (let y = hlineY; y < hlineY + this.viewportHeight + 3 * def.spacing; y += def.spacing) {
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', this.px(-800000));
                line.setAttribute('y1', this.px(y));
                line.setAttribute('x2', this.px(800000));
                line.setAttribute('y2', this.px(y));
                line.classList.add('grid-lines');
                line.setAttribute('stroke-width', def.strokeWidth.toString());
                line.setAttribute('stroke', def.stroke);
                this.gridEl.appendChild(line);
            }
        });
    }

    beginMoveGrid() {
        this.drag = new Drag({
            next: (dxy) => {
                if (this.action) {
                    const newXOffset = (this.action.frames[this.frame].xOffset ?? 0) + dxy.x * this.currentZoomFactor;
                    const newYOffset = (this.action.frames[this.frame].yOffset ?? 0) + dxy.y * this.currentZoomFactor;
                    if (this.additiveMode)
                        this.action.setOffset(this.frame, newXOffset, newYOffset);
                    else
                        this.action.setFrameOffset(this.frame, newXOffset, newYOffset);
                }
                this.renderer.update(this.action, this.frame);
                this.updateUI();
            },
            done: (dxy) => {
            }
        }, 'pan-grid');
    }
    beginPanViewport() {
        this.drag = new Drag({
            next: (dxy) => {
                this.svgEl.classList.add('panning');
                this.viewportXOffset -= dxy.x * this.currentZoomFactor;
                this.viewportYOffset -= dxy.y * this.currentZoomFactor;
                this.updateUI();
            },
            done: (dxy) => {
                this.svgEl.classList.remove('panning');
            }
        }, 'pan-viewport');
    }
    zoom(mouseSVGXY, zoomFactor) {
        this.currentZoomFactor *= zoomFactor;
        const newViewportWidth = this.viewportWidth0 * this.currentZoomFactor;
        const newViewportHeight = this.viewportHeight0 * this.currentZoomFactor;
        this.viewportXOffset = mouseSVGXY.x - (mouseSVGXY.x - this.viewportXOffset) * (newViewportWidth / this.viewportWidth);
        this.viewportYOffset = mouseSVGXY.y - (mouseSVGXY.y - this.viewportYOffset) * (newViewportHeight / this.viewportHeight);
        this.viewportWidth = newViewportWidth;
        this.viewportHeight = newViewportHeight;
        this.updateUI();
    }
    addGroupListeners(segment) {
        const groupEl = this.renderer.getDomNode(segment);
        segment.children.forEach(child => {
            this.addGroupListeners(child);
        });

        groupEl.addEventListener('mousedown', (e) => {
            if (this.mode != DESIGN && this.mode != ANIMATE) return;
            this.selectSegment(segment);
            this.updateUI();
            if (this.mode == ANIMATE) {
                this.beginRotateSegment(segment);
                this.fireEvent('animateActionPerformed');
            } else {
                this.beginMoveSegment(segment);
            }
            e.stopPropagation();
        });

        return groupEl;
    }
    createPivotPointEl() {
        //add circle to indicate pivot point
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('r', 5);
        circle.classList.add('pivot-point');
        circle.addEventListener('mousedown', (e) => {
            if (this.mode != DESIGN || !this.selectedSegment) return;
            e.stopPropagation();
            this.beginMovePivotPoint(this.selectedSegment);
            this.surpressClick = true;
        });
        return circle;
    }

    updatePivotPoint(segment) {
        //move pivot point into segment group
        this.pivotPointEl.style.display = segment ? '' : 'none';
        if (!segment) return;

        const segmentNode = this.renderer.getDomNode(segment);
        this.pivotPointEl.remove();
        segmentNode.appendChild(this.pivotPointEl);
        this.pivotPointEl.setAttribute('cx', this.px(segment.pivotPoint.x));
        this.pivotPointEl.setAttribute('cy', this.px(segment.pivotPoint.y));
    }
    fireBodyUpdated() {
        this.fireEvent('bodyUpdated', this.body);
    }



    getSegmentAngle(segment) {
        return this.action.getAngle(this.frame, segment.id);
    }

    get selectedSegment() {
        return this.body.segments.find(s => s.selected);
    }

    setAdditiveMode(additive) {
        this.additiveMode = additive;
        this.updateUI();
    }

    selectParentSegment() {
        const segment = this.selectedSegment;
        if (!segment) return;
        const parent = this.body.getParent(segment);
        if (segment && parent) {
            this.selectSegment(parent);
        }
    }
    selectChildSegment() {
        const segment = this.selectedSegment;
        if (segment && segment.children.length > 0) {
            this.selectSegment(segment.children[0]);
        }
    }

    //MANIPULATION FUNCTIONS
    beginMoveSegment(segment) {
        this.drag = new Drag({
            next: (dxy) => {
                segment.origin.x += dxy.x;
                segment.origin.y += dxy.y;
                this.renderer.update(this.action, this.frame);
                this.updateUI();
            },
            done: (dxy) => {
                this.fireBodyUpdated();
                this.renderer.update(this.action, this.frame);
                this.updateUI();
            }
        }, 'move-segment');
    }
    beginMovePivotPoint(segment) {
        this.drag = new Drag({
            next: (dxy) => {
                segment.pivotPoint = segment.pivotPoint.add(dxy);
                this.renderer.update(this.action, this.frame);
                this.updateUI();
            },
            done: (dxy) => {
                this.fireBodyUpdated();
                this.renderer.update(this.action, this.frame);
                this.updateUI();
            }
        }, 'move-pivot-point');
    }
    beginRotateSegment(segment) {
        let startAngle;
        const initialRotation = this.action.getFrameAngle(this.frame, segment.id);
        this.drag = new Drag({
            next: () => {
                const pivot = this.renderer.getViewXY(segment.pivotPoint, segment);
                const angle = pivot.angleToR(this.drag.thisXY);
                if (!startAngle) {
                    startAngle = angle;
                }
                const rotation = startAngle - angle;
                if (!this.additiveMode) {
                    this.action.setFrameAngle(this.frame, segment.id, initialRotation + rotation);
                } else {
                    this.action.setAngle(this.frame, segment.id, initialRotation + rotation);
                }
                this.renderer.update(this.action, this.frame);
                this.updateUI();
            },
            done: (dxy) => {
                this.fireBodyUpdated();
                this.renderer.update(this.action, this.frame);
                this.updateUI();
            }
        }, 'rotate-segment');
    }
    setModeAnimate() {
        this.mode = ANIMATE;
        this.renderer.stopAnimations(this.action, this.frame);
        this.updateUI();
    }
    setModeDesign() {
        this.mode = DESIGN;
        this.renderer.stopAnimations(this.action, this.frame);
        this.clearSelection();
        this.updateUI();
    }
    setModePlay() {
        this.mode = PLAY;
        this.clearSelection();
        this.renderer.startAnimations();
        this.updateUI();
    }
    setModeView() {
        this.mode = VIEW;
        this.updateUI();
    }
    setCurrentFrame(frame) {
        this.frame = frame;
        this.timeOffset = null;
        this.renderer.update(this.action, this.frame);
        this.updateUI();
    }
    scrubToTime(timeOffset) {
        if (!this.action) return;
        const frameIndex = this.action.getFrameAtTime(timeOffset);
        this.frame = frameIndex;
        this.timeOffset = timeOffset;
        this.renderer.stopAnimations(this.action, this.frame);
        this.renderer.update(this.action, this.frame, timeOffset);
        this.updateUI();
    }

    /**
     * @param {Action} action
     * @returns 
     */
    setData({ action, body }) {
        this.body = body;
        this.action = action;
        this.renderer.render(this.body, [this.action]);
        this.body.segments.forEach(segment => {
            this.addGroupListeners(segment);
        });
        this.svgEl.append(this.pivotPointEl);
        this.updateUI();
    }
    setBody(body) {
        this.body = body;
        this.renderer.render(this.body, this.action ? [this.action] : []);
        this.body.segments.forEach(segment => {
            this.addGroupListeners(segment);
        });
        this.svgEl.append(this.pivotPointEl);
        this.updateUI();
    }
    selectSegment(segment) {
        if (this.body && (this.mode == DESIGN || this.mode == ANIMATE)) {
            this.body.segments.forEach(s => s.selected = false);
            segment.selected = true;
            this.renderer.update(this.action, this.frame);
            this.updateUI();
            this.fireEvent('selectionChanged');
        }
    }
    clearSelection() {
        if (this.body) {
            this.body.segments.forEach(s => s.selected = false);
            this.renderer.update(this.action, this.frame);
            this.updateUI();
            this.fireEvent('selectionChanged');
        }
    }
    /**
 * @param {number} val 
 * @returns 
 */
    px(val) {
        return `${val.toFixed(2)}px`;
    }

}
customElements.define('frame-editor', FrameEditor);