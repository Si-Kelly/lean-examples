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
            return newFrame;
        });
        return action;
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
        return this.frames.slice(0, frameIndex + 1).reduce((acc, frame) => acc + frame.getAngle(id), 0);
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
        else if (this.frames[frameIndex].getAngle(id) === undefined) {
            console.warn('no angle for id', id, 'at frame index', frameIndex);
        }
        return this.frames[frameIndex]?.getAngle(id) ?? 0;
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

}
class Frame {
    /**
     * @type {Object.<string, number>}
     */
    angles = {};
    /**
     * @type {number
     */
    duration = 0.25; //seconds
    /**
     * @type {ImageContext}
     */
    image = null;
    /**
     * @param {string} id
     * @param {number} angle
     */
    setAngle(id, angle) {
        console.log('frame setAngle', id, angle);
        this.angles[id] = angle;
    }
    /**
     * @param {string} id
     * @param {number} angle
     */
    addAngle(id, angle) {
        this.angles[id] = (this.angles[id] ?? 0) + angle;
    }
    /**
     * @param {string} id
     * @returns {number}
     */
    getAngle(id) {
        if (this.angles[id] === undefined) {
           // console.warn('no angle for id', id);
        }
        return this.angles[id] ?? 0;
    }
    /**
     * @param {ImageContext} image
     */
    setImage(image) {
        this.image = image;
    }
}