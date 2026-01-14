import BaseComponent from "../core/base-component.js";
import { SVGUtil, Drag, XY } from '../core/ui-utils.js';
import { FrameRenderer } from "./renderer.js";
const DESIGN = 0, ANIMATE = 1, PLAY = 2, VIEW = 3;
const FPS = 5;
export default class Editor extends BaseComponent {
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
                        fill:none;
                    }
                    .centre-lines{
                        stroke: #888;
                        stroke-width: 1;
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
        this.createGridBackground();

        this.shadowRoot.addEventListener('mousemove', (e) => {
            if (this.drag) {
                var xy = e.changedTouches && e.changedTouches.length == 1 ?
                    new XY(e.changedTouches[0].offsetX, e.changedTouches[0].offsetY) :
                    new XY(e.offsetX, e.offsetY);
                this.drag.nextXY(this.svgUtil.getSVGXY(xy));
                e.preventDefault();
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
        });
        this.pivotPointEl = this.createPivotPointEl();
        this.svgEl.append(this.pivotPointEl);
    }
    disconnectedCallback() {
        //clean up event listeners
        document.removeEventListener('keyup', this.keyUpListener);
    }
    createGridBackground() {
        const gridSize = 50;
        const pattern = document.createElementNS('http://www.w3.org/2000/svg', 'pattern');
        pattern.setAttribute('id', 'gridPattern');
        pattern.setAttribute('width', gridSize);
        pattern.setAttribute('height', gridSize);
        pattern.setAttribute('patternUnits', 'userSpaceOnUse');
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', `M ${gridSize} 0 L 0 0 0 ${gridSize}`);
        path.classList.add('grid-lines');
        pattern.appendChild(path);
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        defs.appendChild(pattern);
        this.gridEl.appendChild(defs);
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('width', '100%');
        rect.setAttribute('height', '100%');
        rect.setAttribute('fill', 'url(#gridPattern)');
        this.gridEl.appendChild(rect);
        //add centre lines
        const centreLines = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        centreLines.setAttribute('d', `M ${this.svgEl.getAttribute('width') / 2} 0 L ${this.svgEl.getAttribute('width') / 2} ${this.svgEl.getAttribute('height')} M 0 ${ 2 * this.svgEl.getAttribute('height') / 3} L ${this.svgEl.getAttribute('width')} ${2 * this.svgEl.getAttribute('height') / 3}`);
        centreLines.setAttribute('class', 'centre-lines');
        this.gridEl.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            this.startMoveGrid();
        });
        this.gridEl.appendChild(centreLines);
    }
    startMoveGrid() {
        this.drag = new Drag({
            next: (dxy) => {
                this.gridOffsetX = (this.gridOffsetX ?? 0) + dxy.x;
                this.gridOffsetY = (this.gridOffsetY ?? 0) + dxy.y;
                this.updateUI();
            },
            done: (dxy) => {
            }
        });
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


    //UPDATES TO DOM
    updateUI() {
        this.svgEl.classList.toggle('locked', !(this.mode == DESIGN || this.mode == ANIMATE));

        if (!this.body) return;
        this.updatePivotPoint(this.selectedSegment);
        // if(this.gridOffsetX!=undefined || this.gridOffsetY!=undefined){
        //     this.gridEl.style.transform = `translate(${this.px(this.gridOffsetX??0)}, ${this.px(this.gridOffsetY??0)})`;
        // } else {
        //     this.gridEl.style.transform = '';
        // }
    }

    updatePivotPoint(segment) {
        this.pivotPointEl.style.display = segment ? '' : 'none';
        if (!segment) return;
        const circle = this.pivotPointEl;
        const xy = this.renderer.getViewXY(segment.pivotPoint, segment);
        circle.setAttribute('cx', xy.x.toFixed(2));
        circle.setAttribute('cy', xy.y.toFixed(2));
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
        });
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
        });
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
                if(!this.additiveMode){
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
        });
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
        this.renderer.update(this.action, this.frame);
        this.updateUI();
    }
    /**
     * 
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
        this.renderer.render(this.body, this.action?[this.action]:[]);
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
customElements.define('frame-editor', Editor);