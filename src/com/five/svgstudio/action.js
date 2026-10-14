import { ImageContext } from '../core/ui-utils.js';
import { Assets } from './assets.js';

export class Action {
    /**
     * @type {Frame[]}
     */
    frames = [];
    /**
     * @type {string}
     */
    name;
    /**
     * @type {string}
     */
    bodyKey;
    /**
     * @type {string}
     */
    type = "Action";

    /**
     * 
     * @param {string} name 
     * @param {string} bodyKey 
     * @param {string} key 
     */
    constructor(name, bodyKey, key = Assets.generateKey()) {
        console.log('loading action id=', key, 'linked body=', bodyKey);
        this.name = name;
        this.bodyKey = bodyKey;
        this.key = key;
    }
    static fromData(data) {
        const action = new Action(data.name, data.bodyKey, data.key);
        action.frames = data.frames.map(frame => {
            const newFrame = new Frame();
            newFrame.angles = frame.angles ?? newFrame.angles;
            newFrame.duration = frame.duration ?? newFrame.duration;

            if (frame.angles) {
                console.log('loading frame angles', frame.angles);
            }
            if (frame.image) {
                newFrame.image = ImageContext.fromData(frame.image);
            }
            newFrame.xOffset = frame.xOffset ?? newFrame.xOffset;
            newFrame.yOffset = frame.yOffset ?? newFrame.yOffset;
            return newFrame;
        });
        action.recalc();
        return action;
    }
    /**
     * 
     * @param {SVGGElement} svgElement 
     * @param {string} name 
     * @param {string} bodyKey 
     */
    static fromSVG(svgElement, name, bodyKey) {
        const actions = [];
        const rotationElements = svgElement.querySelectorAll('animateTransform[data-action-name][attributeName="transform"][type="rotate"]');
        //see how many different actions there are
        const actionNames = Array.from(rotationElements).reduce((acc, rotEl) => {
            const actionName = rotEl.dataset.actionName;
            if (actionName && !acc.includes(actionName)) {
                acc.push(actionName);
            }
            return acc;
        }, []);
        // go through each action and create an Action object
        actionNames.forEach(actionName => {
            const actionRotElements = Array.from(rotationElements).filter(rotEl => rotEl.dataset.actionName === actionName);
            if (actionRotElements.length > 0) {
                console.log('found action rotation elements for action', actionName, actionRotElements);
                const action = new Action(actionName, bodyKey);
                const keyTimes = [];
                actionRotElements.forEach(rotEl => {
                    const frame = new Frame();
                    const id = rotEl.dataset.segmentId;
                    const values = rotEl.getAttribute('values').split(';').map(v => parseFloat(v));
                    //calculate angles between frames
                    for (let i = 0; i < values.length - 1; i++) {
                        const angleDiff = values[i + 1] - values[i];
                        frame.addAngle(id, angleDiff);
                    }
                    const dur = parseFloat(rotEl.getAttribute('dur'));
                    frame.duration = isNaN(dur) ? frame.duration : dur / (values.length - 1);
                    action.frames.push(frame);
                    const keyTimesStr = rotEl.getAttribute('keyTimes');
                    if (keyTimesStr) {
                        keyTimesStr.split(';').forEach(kt => {
                            const ktNum = parseFloat(kt);
                            if (!keyTimes.includes(ktNum)) {
                                keyTimes.push(ktNum);
                            }
                        }); 
                    }
                });
                if (keyTimes.length != action.frames.length + 1) {
                    console.warn('keyTimes length does not match frames for action', actionName);
                }
                action.recalc();
                actions.push(action);
            }
        });       
        return actions;
    }

    addFrame() {
        this.frames.push(new Frame());
    }
    insertFrameAfter(frameIndex) {
        this.frames.splice(frameIndex, 0, new Frame());
    }
    insertFrameBefore(frameIndex) {
        this.frames.splice(frameIndex - 1, 0, new Frame());
    }
    deleteFrame(frameIndex) {
        this.frames.splice(frameIndex, 1);
    }
    duplicateFrame(frameIndex) {
        this.frames.splice(frameIndex, 0, this.frames[frameIndex]);
    }
    /**
     * Get the final angle of the object at the given frame index
     * @param {number} frameIndex 
     * @param {string} id 
     * @returns {number} angle
     */
    getAngle(frameIndex, id) {
        return this.frames.slice(0, frameIndex + 1).reduce((acc, frame) => acc + (frame.angles[id]??0), 0);
    }
    /**
     * Get the angle of rotation applying to the object at the given frame index
     * @param {number} frameIndex
     * @param {string} id
     * @returns {number} angle
     */
    getFrameAngle(frameIndex, id) {
        if (this.frames[frameIndex] === undefined) {
            console.warn('no frame at index', frameIndex);
        }
        else if (this.frames[frameIndex].angles[id] === undefined) {
            console.warn('no angle for id', id, 'at frame index', frameIndex);
        }
        return this.frames[frameIndex]?.angles[id] ?? 0;
    }
    getFrameAtTime(timeOffset) {
        let accumulatedTime = 0;
        for (let i = 0; i < this.frames.length; i++) {
            accumulatedTime += this.frames[i].duration;
            if (timeOffset < accumulatedTime) {
                return i;
            }
        }
        return this.frames.length - 1;
    }
    getImage(frameIndex) {
        return this.frames[frameIndex]?.image;
    }
    setAngle(frameIndex, id, angle) {
        console.log('setting angle', frameIndex, id, angle);
        this.frames[frameIndex].setAngle(id, angle);
    }
    setFrameAngle(frameIndex, id, angle) {
        const currentAngle = this.getFrameAngle(frameIndex, id);
        const angleDiff = angle - currentAngle;
        console.log('setting frame angle', frameIndex, id, angle);
        //set the current frame angle only, so need to update the next frame angle to offset the change
        this.setAngle(frameIndex, id, angle);
        if (this.frames[frameIndex + 1]) {
            const nextFrameAngle = this.getFrameAngle(frameIndex + 1, id);
            this.setAngle(frameIndex + 1, id, nextFrameAngle - angleDiff);
        }
    }
    setFrameOffset(frameIndex, xOffset, yOffset) {
        this.frames[frameIndex].setOffset(xOffset, yOffset);
    }
    setOffset(frameIndex, xOffset, yOffset) {

        this.frames[frameIndex].setOffset(xOffset, yOffset);
        //add the offset to the next frames to maintain position
        for (let i = frameIndex + 1; i < this.frames.length; i++) {
            const currentDeltaX = this.frames[i].xOffset - this.frames[i - 1].xOffset;
            const currentDeltaY = this.frames[i].yOffset - this.frames[i - 1].yOffset;
            xOffset += currentDeltaX;
            yOffset += currentDeltaY;
            this.frames[i].setOffset(xOffset, yOffset);
        }
    }
    addAngle(frameIndex, id, angle) {
        this.frames[frameIndex].addAngle(id, angle);
    }
    setImage(frameIndex, image) {
        this.frames[frameIndex].setImage(image);
    }
    hasFrame(frameIndex) {
        return !!this.frames[frameIndex];
    }
    getDuration() {
        return this.frames.reduce((acc, frame) => acc + frame.duration, 0);
    }
    getFrameStartTime(frameIndex) {
        return this.frames.slice(0, frameIndex).reduce((acc, frame) => acc + frame.duration, 0);
    }
    setFrameStartTime(frameIndex, startTime) {
        if (frameIndex === 0) {
            console.warn('cannot set start time of first frame');
            return;
        }
        const currentStartTime = this.getFrameStartTime(frameIndex);
        const timeDiff = startTime - currentStartTime;
        if (timeDiff === 0) return;
        this.frames[frameIndex - 1].duration += timeDiff;
        this.recalc();
    }
    recalc(){
        this.frames.forEach((f,i)=>{
            f.startTime = this.getFrameStartTime(i);
        });
        this.duration = this.getDuration();
    }

}
class Frame {
    /**
     * @type {Object.<string, number>}
     */
    angles = {};
    /**
     * @type {number}
     */
    duration = 0.25; //seconds
    /**
     * @type {ImageContext}
     */
    image = null;
    /**
     * @type {number}
     */
    xOffset = 0;
    /**
     * @type {number}
     */
    yOffset = 0;
    /**
     * @param {string} id
     * @param {number} angle
     */
    setAngle(id, angle) {
        console.log('frame setAngle', id, angle);
        this.angles[id] = angle;
    }
    /** 
     * @param {number} xOffset
     * @param {number} yOffset  
     */
    setOffset(xOffset, yOffset) {
        this.xOffset = xOffset;
        this.yOffset = yOffset;
    }
    /**
     * @param {string} id
     * @param {number} angle
     */
    addAngle(id, angle) {
        this.angles[id] = (this.angles[id] ?? 0) + angle;
    }
 
    /**
     * @param {ImageContext} image
     */
    setImage(image) {
        this.image = image;
    }
}