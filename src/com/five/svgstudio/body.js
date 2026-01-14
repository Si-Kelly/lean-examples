import { XY } from '../core/ui-utils.js';
import { Assets } from './assets.js';
/**
* @description Class representing a body that can be animated. The body is split into a tree of segments that can each be rotated around a pivot point.
*/
export class Body {
    
    /**
     * @type {Segment|null}
     * @description Represents the root segment of the SVG body. It is initially set to null.
     */
    rootSegment = null;
    nextId = 0;
    key;
    type = 'Model';

    constructor(name, key = Assets.generateKey()) {
        console.log('loading body id=', key);
        this.key = key;
        this.name = name;
    }
    static fromData(data) {
        const body = new Body(data.name, data.key);
        body.nextId = data.nextId;
        if (data.rootSegment) {
            body.rootSegment = Segment.fromData(body, data.rootSegment);
        }
        return body;
    }

    //flat list of segments
    get segments() {
        return this.rootSegment ? this.getSegments(this.rootSegment, []) : [];
    }
    getSegments(segment, list) {
        list.push(segment);
        if (segment.children) {
            segment.children.forEach(child => {
                this.getSegments(child, list);
            });
        }
        return list;
    }
    getParent(segment) {
        return this.segments.find(s => s.id === segment.parentId);
    }
}
export class Segment {
    shape = null;
    origin = XY.of({ x: 0, y: 0 });
    pivotPoint = XY.of({ x: 0, y: 0 });
    children = [];

    constructor(body, shape, pivotPoint, origin, rotation,id) {
        this.origin = XY.of(origin);
        this.pivotPoint = XY.of(pivotPoint);
        this.rotation = rotation;
        this.shape = shape;
        console.log('loading segment id=', id);
        this.id = id ?? body.nextId++;
    }
    static fromData(body, data) {
        const shape = data.shape ? Shape.fromData(body, data.shape) : null;
        const segment = new Segment(body, shape, data.pivotPoint, data.origin, data.rotation, data.id);
        const children = data.children.map(child => Segment.fromData(body, child));
        children.forEach(child => {
            segment.addChild(child);
        });
        return segment;
    }
    addChild(segment) {
        this.children.push(segment);
        segment.setParent(this);
    }
    setParent(parent) {
        this.parentId = parent.id;
    }
}

/**
 * Represents a generic shape.
 */
export class Shape {
    /**
     * Creates an instance of Shape.
     * @param {Body} body - The body object containing the nextId property.
     * @param {string} name - The name of the shape.
     * @param {Object} attributes - The attributes of the shape.
     */
    constructor(body, name, attributes, id) {
        this.name = name;
        this.attributes = attributes;
        this.id = id ?? body.nextId++;
    }

    /**
     * Creates a Shape instance from data.
     * @param {Body} body - The body object containing the nextId property.
     * @param {Shape} data - The data object containing the shape information.
     * @returns {Shape} A new Shape instance.
     */
    static fromData(body, data) {
        if (data.name === 'path') {
            return Path.fromData(body, data);
        }
        return new Shape(body, data.name, data.attributes, data.id);
    }

    getAttribute(key) {
        return this.attributes[key];
    }
}
export class Path extends Shape {
    constructor(body, commands, attributes) {
        super(body, 'path', attributes);
        this.commands = commands;
    }

    /**
     * Creates a new Path instance from the provided data.
     *
     * @param {Body} body - The body object to associate with the Path.
     * @param {Path} data - The data object containing commands and attributes.
     * @returns {Path} A new Path instance.
     */
    static fromData(body, data) {
        return new Path(body, data.commands, data.attributes);
    }
}