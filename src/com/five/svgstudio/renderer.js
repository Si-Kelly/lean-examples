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

    /**
     * 
     * @param {SVGGElement} layer 
     * @param {SVGSVGElement} svgElement 
     */
    constructor(layer, svgElement) {
        this.svgEl = svgElement;
        this.layer = layer;
    }
    render(body, actions) {
        this.nodes = [];
        this.body = body;
        this.actions = actions;
        this.layer.innerHTML = '';
        if (body) {
            this.layer.dataset.bodyKey = body.key;
            this.layer.dataset.bodyName = body.name;
            this.actions.forEach(action => {
                this.layer.appendChild(this.createTranslationAnimationNode(action));
            });
            const bodyEl = this.createGroupElement(body.rootSegment);
            this.layer.appendChild(bodyEl);
        }
        this.update();
    }
    update(action, frame, timeOffset) {
        //  window.requestAnimationFrame((t) => {
        this.body.segments.forEach(segment => {
            this.updateGroupElement(segment, action, frame, timeOffset);
        });
        this.updateBodyOffsetAnimation(action);
        // })
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
        groupEl.dataset.segmentId = segment.id;
        if (segment.shape) {
            groupEl.appendChild(this.createShapeElement(segment.shape));
        }
        if (this.actions) {
            this.actions.forEach(action => {
                groupEl.appendChild(this.createRotateAnimationNode(action));

            });
        }
        segment.children.forEach(child => {
            groupEl.appendChild(this.createGroupElement(child));
        });

        this.#mapDomNode(segment, groupEl);
        return groupEl;
    }

    createShapeElement(shape) {
        const shapeEl = document.createElementNS('http://www.w3.org/2000/svg', shape.name);
        for (const key in shape.attributes) {
            shapeEl.setAttribute(key, shape.attributes[key]);
        }
        if (shape.name === 'path') {
            const d = SVGUtil.createDString(shape.commands, true);
            shapeEl.setAttribute('d', d);
        }
        return shapeEl;
    }

    createRotateAnimationNode(action) {
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

    createTranslationAnimationNode(action) {
        const translationEl = document.createElementNS('http://www.w3.org/2000/svg', 'animateTransform');
        translationEl.dataset.actionKey = action.key;
        translationEl.dataset.actionName = action.name;
        translationEl.setAttribute('attributeName', 'transform');
        translationEl.setAttribute('type', 'translate');
        translationEl.setAttribute('dur', `${action.getDuration()}s`);
        translationEl.setAttribute('begin', 'indefinite');
        translationEl.setAttribute('additive', 'sum');
        return translationEl;
    }

    startAnimations() {
        this.startGroupAnimations(this.body.rootSegment);
        this.layer.querySelector(':scope >animateTransform').beginElement();
    }
    startGroupAnimations(segment) {
        this.playing = true;
        this.update();
        segment.children.forEach(child => {
            this.startGroupAnimations(child);
        });
        const domNode = this.getDomNode(segment);
        const animationElements = domNode.querySelectorAll(':scope > animateTransform');
        animationElements.forEach(animEl => {
            animEl.beginElement();
        });
    }
    stopAnimations(action, frame) {
        this.playing = false;
        this.endAnimations(this.body.rootSegment);
        const translateAnimation = this.layer.querySelector(':scope >animateTransform');
        if (translateAnimation)
            translateAnimation.endElement();
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
    updateBodyOffsetAnimation(action) {
        if (action) {
            const translationEl = this.layer.querySelector(`animateTransform[data-action-key='${action.key}'][type='translate']`);
            translationEl.setAttribute('values', action.frames.map((_, index) => {
                const frame = action.frames[index];
                return `${(-frame.xOffset).toFixed(2)} ${(-frame.yOffset).toFixed(2)}`;
            }).join(';'));
            let totalDuration = action.getDuration();
            //last frame must start at 1, so we reduce the total length accordingly
            totalDuration -= action.frames[action.frames.length - 1].duration;
            translationEl.setAttribute('keyTimes', action.frames.map((_, index) => {
                return (action.getFrameStartTime(index) / totalDuration).toFixed(2);
            }).join(';'));
        }
    }
    /**
     * 
     * @param {Segment} segment 
     * @param {Action} action 
     * @param {number} frameIndex 
     * @param {number} timeOffset 
     */
    updateGroupElement(segment, action, frameIndex, timeOffset) {
        const node = this.getDomNode(segment);
        node.style.transformOrigin = `${this.px(segment.pivotPoint.x)} ${this.px(segment.pivotPoint.y)}`;
        node.dataset.pivotPointX = `${segment.pivotPoint.x.toFixed(2)}`;
        node.dataset.pivotPointY = `${segment.pivotPoint.y.toFixed(2)}`;
        node.dataset.originX = `${segment.origin.x.toFixed(2)}`;
        node.dataset.originY = `${segment.origin.y.toFixed(2)}`;
        node.dataset.rotation = segment.rotation.toFixed(2);

        if (this.playing) {
            node.setAttribute('transform', SVGUtil.getTranslationMatrix(segment.origin));
            node.style.transform = null;
        }
        else if (timeOffset != undefined && action) {
            frameIndex = frameIndex ?? action.getFrameAtTime(timeOffset);
            const frame = action.frames[frameIndex];
            let angle = action.getAngle(frameIndex, segment.id);
            let angleNext = action.getAngle(Math.min(frameIndex + 1, action.frames.length - 1), segment.id);
            angle = AnimationUtil.lerpA(angle, angleNext, AnimationUtil.clamp((timeOffset - frame.startTime) / frame.duration, 0, 1));
            node.setAttribute('transform', SVGUtil.getTransformMatrix(angle, segment.origin));
            node.style.transform = null;
        }
        else if (frameIndex != undefined && action) {
            const angle = action.getAngle(frameIndex, segment.id);
            node.setAttribute('transform', SVGUtil.getTransformMatrix(angle, segment.origin));
            node.style.transform = null;
        }
        else {
            // node.style.transform = `translate(${this.px(segment.origin.x)}, ${this.px(segment.origin.y)})`;
            // node.setAttribute('transform', '');
            node.setAttribute('transform', SVGUtil.getTranslationMatrix(segment.origin));
            node.style.transform = null;
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
        const rotationEl = this.getDomNode(segment).querySelector(`animateTransform[data-action-key='${action.key}'][type='rotate']`);
        rotationEl.setAttribute('values', action.frames.map((_, index) => {
            const angleDegrees = SVGUtil.toDegrees(action.getAngle(index, segment.id));
            return `${angleDegrees.toFixed(2)}`;
        }).join(';'));
        let totalDuration = action.getDuration();
        //last frame must start at 1, so we reduce the total length accordingly
        totalDuration -= action.frames[action.frames.length - 1].duration;
        rotationEl.setAttribute('keyTimes', action.frames.map((_, index) => {
            return (action.getFrameStartTime(index) / totalDuration).toFixed(2);
        }).join(';'));
    }
}