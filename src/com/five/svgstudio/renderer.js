import { SVGUtil, XY, AnimationUtil } from "../core/ui-utils.js";
import { Action } from "./action.js";
import { Segment } from "./body.js";
const G2D = 180 / Math.PI;

export class FrameRenderer {
    /**
     * @type{SVGSVGElement}
     * */
    svgEl;
    /** @type {SVGGElement} */
    layer;
    /*Body*/ body;
    /*Action[]*/ actions;

    /**
     * @type {Array<SVGGElement>} */
    nodes = [];

    playing = false;

    constructor(layer, svgElement) {
        this.svgEl = svgElement;
        this.layer=layer;   
    }
    render(body, actions) {
        this.nodes = [];
        this.body = body;
        this.actions = actions;
       this.layer.innerHTML = '';
        if (body) {
           this.layer.appendChild(this.createGroupElement(body.rootSegment));
        }
        this.update();
    }
    update(action, frame) {
        this.body.segments.forEach(segment => {
            this.updateGroupElement(segment, action, frame);
        });
    }
    interpolate(action, timeOffset) {
    
    }

    start() {
        this.svgEl.unpauseAnimations();
    }
    pause() {
        this.svgEl.pauseAnimations();
    }

    #mapDomNode(segment, domNode) {
        this.nodes[segment.id] = domNode;
    }
    /**
     * 
     * @param {Segment} segment 
     * @returns {SVGGElement}
     */
    getDomNode(segment) {
        return this.nodes[segment.id];
    }
    getViewXY(xy, segment) {
        const bcr = this.svgEl.getBoundingClientRect();
        return xy.transform(this.getDomNode(segment).getScreenCTM()).subtract(new XY(bcr.left, bcr.top));
    }
    getPivotPointNode(segment) {
        const node = this.getDomNode(segment);
        return node.querySelector('.pivot-point');
    }
    createGroupElement(segment) {
        const groupEl = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        if (segment.shape) {
            groupEl.appendChild(this.createShapeElement(segment.shape, segment.origin));
        }
        if (this.actions) {
            this.actions.forEach(action => {
                groupEl.appendChild(this.createAnimationNode(action));
            });
        }
        segment.children.forEach(child => {
            groupEl.appendChild(this.createGroupElement(child));
        });

        this.#mapDomNode(segment, groupEl);
        return groupEl;
    }

    createShapeElement(shape, xy) {
        const shapeEl = document.createElementNS('http://www.w3.org/2000/svg', shape.name);
        for (const key in shape.attributes) {
            shapeEl.setAttribute(key, shape.attributes[key]);
        }
        if (shape.name === 'path') {
            const d = SVGUtil.createDString(shape.commands, true);
            shapeEl.setAttribute('d', d);
        }
        this.#mapDomNode(shape, shapeEl);
        return shapeEl;
    }

    createAnimationNode(action) {
        const rotationEl = document.createElementNS('http://www.w3.org/2000/svg', 'animateTransform');
        rotationEl.dataset.actionKey = action.key;
        rotationEl.dataset.actionName = action.name;
        rotationEl.setAttribute('attributeName', 'transform');
        rotationEl.setAttribute('type', 'rotate');
        rotationEl.setAttribute('dur', `${action.getDuration()}s`);
        rotationEl.setAttribute('begin', 'indefinite');
        rotationEl.setAttribute('additive', 'sum');
        return rotationEl;
    }

    startAnimations(segment = this.body.rootSegment) {
        this.playing = true;
        this.update();
        segment.children.forEach(child => {
            this.startAnimations(child);
        });
        const domNode = this.getDomNode(segment);
        const animationElements = domNode.querySelectorAll('animateTransform');
        animationElements.forEach(animEl => {
            animEl.beginElement();
        });
    }
    stopAnimations(action, frame) {
        this.playing = false;
        this.endAnimations(this.body.rootSegment);
        this.update(action, frame);
    }

    endAnimations(segment) {
        segment.children.forEach(child => {
            this.endAnimations(child);
        });
        const domNode = this.getDomNode(segment);
        const animationElements = domNode.querySelectorAll('animateTransform');
        animationElements.forEach(animEl => {
            animEl.endElement();
        });
    }
    updateGroupElement(segment, action, frameIndex, timeOffset) {
        const node = this.getDomNode(segment);
        node.style.transformOrigin = `${this.px(segment.pivotPoint.x)} ${this.px(segment.pivotPoint.y)}`;

        if (this.playing) {
            node.setAttribute('transform', SVGUtil.getTranslationMatrix(segment.origin));
            node.style.transform = null;
        }
        else if (timeOffset != undefined && action) {
            frameIndex = frameIndex ?? action.getFrameAtTime(timeOffset);
            const frame = action.frames[frameIndex];
            let angle = action.getAngle(frameIndex, segment.id);
            let angleNext = action.getAngle(Math.min(frameIndex + 1, action.frames.length - 1), segment.id);
            let accumulatedTime = 0;
            for (let i = 0; i < frameIndex; i++) {
                accumulatedTime += action.frames[i].duration;
            }
            angle = AnimationUtil.lerp(angle, angleNext, AnimationUtil.clamp((timeOffset - accumulatedTime) / frame.duration, 0, 1));
            node.setAttribute('transform', SVGUtil.getTransformMatrix(angle, segment.origin));
            node.style.transform = null;
        }
        else if (frameIndex != undefined && action) {
            const angle = action.getAngle(frameIndex, segment.id);
            node.setAttribute('transform', SVGUtil.getTransformMatrix(angle, segment.origin));
            node.style.transform = null;
        } 
        else {
            node.style.transform = `translate(${this.px(segment.origin.x)}, ${this.px(segment.origin.y)})`;
            node.setAttribute('transform', '');
        }
        segment.children.forEach(child => {
            this.updateGroupElement(child, action, frameIndex, timeOffset);
        });
        node.classList.toggle('selected', segment.selected == true);
        node.style.display = 'none';
        node.style.display = '';
        if (action) {
            this.updateAnimationNode(segment, action);
        }
    }

    /**
     * @param {number} val 
     * @returns 
     */
    px(val) {
        return `${val.toFixed(2)}px`;
    }
    /**
     * 
     * @param {Segment} segment 
     * @param {Action} action 
     */
    updateAnimationNode(segment, action) {
        const rotationEl = this.getDomNode(segment).querySelector(`animateTransform[data-action-key='${action.key}']`);
        rotationEl.setAttribute('values', action.frames.map((_, index) => {
            const angleDegrees = SVGUtil.toDegrees(action.getAngle(index, segment.id));
            return `${angleDegrees.toFixed(2)}`;
        }).join(';'));
        let totalDuration = action.getDuration();
        //last frame must start at 1, so we reduce the total length accordingly
        totalDuration-= action.frames[action.frames.length - 1].duration;
        rotationEl.setAttribute('keyTimes', action.frames.map((_, index) => {
            return (action.getFrameStartTime(index) / totalDuration).toFixed(2);
        }).join(';'));
    }
}