
import { Segment } from '../svgstudio/body.js';

const RADIANS_TO_DEGREES = 180 / Math.PI;
export class SVGUtil {
    constructor(svgEl) {
        this.svgEl = svgEl;
        this.svgPoint = this.svgEl.createSVGPoint();
        this.inverseCTM = this.svgEl.getCTM().inverse();
        this.svgWidth = this.svgEl.clientWidth;
        const viewbox = this.viewbox();
        this.screenRatio = this.svgWidth / viewbox[2];
    }
    viewbox() {
        return this.svgEl.getAttribute('viewBox').split(' ').map(x => parseFloat(x))
    }
    getSVGXY(xy) {
        if (!this.svgPoint) {
            return new XY(0, 0);
        }
        this.svgPoint.x = xy.x;
        this.svgPoint.y = xy.y;
        return new XY(this.svgPoint.matrixTransform(this.inverseCTM).x, this.svgPoint.matrixTransform(this.inverseCTM).y);
    }
    getScreenRatio() {
        const viewbox = this.viewbox();
        return this.svgWidth / viewbox[2];
    }
    static getElementXY(xy, el, svgEl) {
        const svgPoint = svgEl.createSVGPoint();
        const inverseCTM = el.getCTM();
        svgPoint.x = xy.x;
        svgPoint.y = xy.y;
        return new XY(svgPoint.matrixTransform(inverseCTM).x, svgPoint.matrixTransform(inverseCTM).y);
    }
    static getXYA(x, y, el) {
        if (el.transform.baseVal.length == 0) {
            return new XYA(x, y, 0);
        }
        var transforms = el.transform.baseVal;
        var a;

        for (var transform of transforms) {
            if (transform.type == SVGTransform.SVG_TRANSFORM_TRANSLATE) {
                x = transform.matrix.e + x;
                y = transform.matrix.f + y;
            }
            if (transform.type == SVGTransform.SVG_TRANSFORM_ROTATE) {
                a = transform.angle;
            }
        }
        return new XYA(x, y, a);
    }
    static createDString(path, closePath = false) {
        let dString = '';

        path.forEach(command => {
            switch (command.command) {
                case 'M':
                case 'L':
                    dString += `${command.command} ${this.formatNumber(command.x)} ${this.formatNumber(command.y)} `;
                    break;
                case 'C':
                    dString += `${command.command} ${this.formatNumber(command.x1)} ${this.formatNumber(command.y1)} ${this.formatNumber(command.x2)} ${this.formatNumber(command.y2)} ${this.formatNumber(command.x)} ${this.formatNumber(command.y)} `;
                    break;
            }
        });

        if (closePath) {
            dString += 'Z';
        }

        return dString.trim();
    }
    static formatNumber(num, decimals = 2) {
        return num.toFixed(decimals);
    }

    static getTransformMatrix(angle, xy, scale = 1) {
        const matrix = Matrix.translation(xy).rotate(angle).scale(scale, scale);
        return matrix.toSVGMatrixString();
    }
    static getTranslationMatrix(xy) {
        return `translate(${xy.x.toFixed(2)} ${xy.y.toFixed(2)})`;
    }

    static toDegrees(angleRadians) {
        let angleDegrees = -(angleRadians * G2D % 360);
        if (angleDegrees > 180) {
            angleDegrees -= 360;
        }
        if (angleDegrees < -180) {
            angleDegrees += 360;
        }
        return angleDegrees;
    }
}
export class Matrix {
    constructor(a, b, c, d, e, f) {
        this.a = a;
        this.b = b;
        this.c = c;
        this.d = d;
        this.e = e;
        this.f = f;
    }
    static translation(XY) {
        return new Matrix(1, 0, 0, 1, XY.x, XY.y);
    }
    static scale(scaleX, scaleY) {
        return new Matrix(scaleX, 0, 0, scaleY, 0, 0);
    }
    static rotation(angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return new Matrix(cos, -sin, sin, cos, 0, 0);
    }
    multiply(matrix) {
        return new Matrix(
            this.a * matrix.a + this.c * matrix.b,
            this.b * matrix.a + this.d * matrix.b,
            this.a * matrix.c + this.c * matrix.d,
            this.b * matrix.c + this.d * matrix.d,
            this.a * matrix.e + this.c * matrix.f + this.e,
            this.b * matrix.e + this.d * matrix.f + this.f
        );
    }
    translate(x, y) {
        return this.multiply(new Matrix(1, 0, 0, 1, x, y));
    }
    rotate(angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return this.multiply(new Matrix(cos, -sin, sin, cos, 0, 0));
    }
    rotateAbout(angle, xy) {
        return this.translate(xy.x, xy.y).rotate(angle).translate(-xy.x, -xy.y);
    }
    scale(scaleX, scaleY) {
        return this.multiply(new Matrix(scaleX, 0, 0, scaleY, 0, 0));
    }
    transform(xy) {
        return new XY(
            this.a * xy.x + this.c * xy.y + this.e,
            this.b * xy.x + this.d * xy.y + this.f
        );
    }
    static identity() {
        return new Matrix(1, 0, 0, 1, 0, 0);
    }
    static fromSVGMatrix(svgMatrix) {
        return new Matrix(svgMatrix.a, svgMatrix.b, svgMatrix.c, svgMatrix.d, svgMatrix.e, svgMatrix.f);
    }
    toSVGMatrix() {
        return this;
    }
    toSVGMatrixString() {
        return `matrix(${this.a.toFixed(2)},${this.b.toFixed(2)},${this.c.toFixed(2)},${this.d.toFixed(2)},${this.e.toFixed(2)},${this.f.toFixed(2)})`;
    }
}
export const G2D = 180 / Math.PI;
export class XY {

    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    /**
     * 
     * @param {{x:number, y:number}} xy 
     * @returns 
     */
    static of(xy) {
        return new XY(xy.x, xy.y);
    }
    /**
     * 
     * @param {XY} xy 
     * @returns {XY} The difference between this and xy
     */
    diff(xy) {
        return this.subtract(xy);
    }
    subtract(xy) {
        return new XY(this.x - xy.x, this.y - xy.y);
    }
    add(xy) {
        return new XY(this.x + xy.x, this.y + xy.y);
    }
    eq(xy) {
        return xy.x === this.x && xy.y === this.y;
    }
    distanceTo(xy) {
        return Math.sqrt(Math.pow(this.x - xy.x, 2) + Math.pow(this.y - xy.y, 2));
    }
    angleTo(xy) {
        return this.angleToR(xy) * G2D;
    }
    getAngle() {
        return this.getAngleR() * G2D;
    }
    angleToR(xy) {
        return Math.atan2(this.y - xy.y, this.x - xy.x);
    }
    getAngleR() {
        return Math.atan2(this.y, this.x);
    }
    rotate(angle) {
        const a = angle;
        const x = this.x * Math.cos(a) - this.y * Math.sin(a);
        const y = this.x * Math.sin(a) + this.y * Math.cos(a);
        return new XY(x, y);
    }
    rotateAbout(xy, angle) {
        console.log('rotating', xy, angle);
        return this.subtract(xy).rotate(angle).add(xy);
    }
    transform(ctm) {
        return new XY(ctm.a * this.x + ctm.c * this.y + ctm.e, ctm.b * this.x + ctm.d * this.y + ctm.f);
    }
}
export class XYA {
    constructor(x, y, a) {
        this.x = x;
        this.y = y;
        this.a = a;
    }
}
export class Drag {

    /**
     * @type {XY}
     */
    thisXY = null;
    /**
     * @type {XY}
     */
    firstXY = null;
    /**
     * @type {XY}
     */
    lastXY = null;

    /**
     * 
     * @param {{done:()=>{},next:(dxy:XY, xy:XY)=>{},stop:()=>{}}} events 
     * @param {*} type 
     * @param {*} delay 
     */
    constructor(events, type, delay) {
        this.type = type;
        this.events = events;
        this.hasMoved = false;
        this.delay = delay;
    }
    done() {
        this.events.done(this.totalDXY);
    }
    stop() {
        if (this.events.stop) {
            this.events.stop();
        }
    }
    nextXY(xy) {
        if (!this.firstXY) {
            this.firstXY = xy;
        }
        this.lastXY = this.thisXY;
        this.thisXY = xy;
        if (!this.firstXY.eq(this.thisXY)) {
            this.hasMoved = true;
        }
        if (this.delay) {
            this.debounce(() => {
                this.events.next(this.dxy, this.thisXY);
            }, this.delay)();
        } else {
            this.events.next(this.dxy, this.thisXY);
        }
    }
    get dxy() {
        if (this.thisXY && this.lastXY) {
            return this.thisXY.diff(this.lastXY);
        }
        return new XY(0, 0);
    }
    get totalDXY() {
        if (this.thisXY && this.firstXY) {
            return this.thisXY.diff(this.firstXY);
        }
        return new XY(0, 0);
    }
    static debounce(callback, wait) {
        let timeoutId = null;
        return (...args) => {
            window.clearTimeout(timeoutId);
            timeoutId = window.setTimeout(() => {
                callback.apply(null, args);
            }, wait);
        };
    }
    static throttle(cb, delay = 250) {
        let shouldWait = false

        return (...args) => {
            if (shouldWait) return

            cb(...args)
            shouldWait = true
            setTimeout(() => {
                shouldWait = false
            }, delay)
        }
    }
}
export class ImageContext {
    src = '';
    constructor() {
        this.transform = {
            translateX: 0,
            translateY: 0,
            scaleX: 1,
            scaleY: 1,
            rotate: 0
        };
    }
    static fromData(data) {
        const imageContext = new ImageContext();
        imageContext.src = data.src;
        imageContext.transform = data.transform;
        return imageContext;
    }
    setSrc(src) {
        this.src = src;
    }

    move(dXY) {
        this.transform.translateX += dXY.x;
        this.transform.translateY += dXY.y;
    }
    setPosition(x, y) {
        this.transform.translateX = x;
        this.transform.translateY = y;
    }
    centerImage(containerW, containerH, imageW, imageH) {
        const x = (containerW - imageW) / 2;
        const y = (containerH - imageH) / 2;
        this.setPosition(x, y);
    }

    scale(factor) {
        this.transform.scaleX *= factor;
        this.transform.scaleY *= factor;
    }
    setScale(scaleFactor) {
        this.transform.scaleX = scaleFactor;
        this.transform.scaleY = scaleFactor;
    }
    setAngle(angle) {
        this.transform.rotate = angle;
    }
    rotate(angle) {
        this.transform.rotate += angle;
    }
    flipHorizontal() {
        this.transform.scaleX *= -1;
    }
    flipVertical() {
        this.transform.scaleY *= -1;
    }
    isFlipped() {
        return this.transform.scaleX < 0 || this.transform.scaleY < 0;
    }
    rotate90() {
        this.transform.rotate += 90;
    }

    reset() {
        this.transform = {
            translateX: 0,
            translateY: 0,
            scaleX: 1,
            scaleY: 1,
            rotate: 0
        };
    }


}
export class AnimationUtil {
    static lerp(start, end, t) {
        return start + (end - start) * t;
    }
    static lerpA(start, end, t) {
        let CS = (1 - t) * Math.cos(start) + t * Math.cos(end);
        let SN = (1 - t) * Math.sin(start) + t * Math.sin(end);
        return Math.atan2(SN, CS);
    }
    static clamp(val, min, max) {
        return Math.min(Math.max(val, min), max);
    }
    static getShortestRotationDirection(startAngle, endAngle) {
        // Convert radians to degrees for calculation
        let startDeg = startAngle * G2D;
        let endDeg = endAngle * G2D;
        let difference = endDeg - startDeg;
        difference = ((difference + 180) % 360) - 180;
        return difference >= 0 ? 1 : -1;
    }
}

export class PlankSVG {
    static circle(svgEl, world) {
        var xya = SVGUtil.getXYA(svgEl.cx.baseVal.value, svgEl.cy.baseVal.value, svgEl);
        svgEl.body = world.createBody({
            allowSleep: true,
            type: svgEl.dataset.type,
            position: Vec2(xya.x, xya.y),
            angle: xya.a / RADIANS_TO_DEGREES
        });
        svgEl.body.createFixture(pl.Circle(Vec2(0, 0), svgEl.r.baseVal.value), {
            density: 1,
            restitution: 0.6,
            friction: 0.6
        });
        svgEl.setAttribute('cx', '0');
        svgEl.setAttribute('cy', '0');
        return svgEl;
    }

    static rect(svgEl, world) {
        var width = svgEl.width.baseVal.value;
        var height = svgEl.height.baseVal.value;
        var xya = SVGUtil.getXYA(svgEl.x.baseVal.value, svgEl.y.baseVal.value, svgEl);
        svgEl.body = world.createBody({
            allowSleep: true,
            type: svgEl.dataset.type,
            position: Vec2(xya.x, xya.y),
            angle: xya.a / RADIANS_TO_DEGREES
        });
        svgEl.body.createFixture(pl.Box(width / 2, height / 2, Vec2(width / 2, height / 2)), {
            density: 1,
            friction: 0.6
        });
        svgEl.setAttribute('x', '0');
        svgEl.setAttribute('y', '0');
        return svgEl;

    }

    static line(svgEl, world) {
        var xya1 = SVGUtil.getXYA(svgEl.x1.baseVal.value, svgEl.y1.baseVal.value, svgEl);
        var xya2 = SVGUtil.getXYA(svgEl.x2.baseVal.value, svgEl.y2.baseVal.value, svgEl);
        svgEl.body = world.createBody({
            type: svgEl.dataset.type,
            allowSleep: true
        });
        svgEl.body.createFixture(pl.Edge(Vec2(xya1.x, xya1.y), Vec2(xya2.x, xya2.y)), 0.0);
        svgEl.setAttribute('x', '0');
        svgEl.setAttribute('y', '0');
        return svgEl;
    }
    /**
     * 
     * @param {SVGPathElement} svgEl - Must be a closed path
     * 
     * @param {World} world 
     */
    static shape(svgEl, world) {
        const xya = SVGUtil.getXYA(svgEl.x.baseVal.value, svgEl.y.baseVal.value, svgEl);
        svgEl.body = world.createBody({
            type: svgEl.dataset.type,
            position: Vec2(xya.x, xya.y),
            angle: xya.a / RADIANS_TO_DEGREES,
            allowSleep: true
        });
        const vertices = [];
        const pathLength = svgEl.getTotalLength();
        const maxVertices = 8;
        const numPoints = Math.min(Math.ceil(pathLength / 10), maxVertices);

        if (numPoints < 3) {
            throw new Error('Not enough vertices to form a shape');
        }
        if (numPoints === 3) {
            //triangle, just get the 3 points
            for (let i = 0; i < 3; i++) {
                const point = svgEl.getPointAtLength((i / 3) * pathLength);
                vertices.push(Vec2(point.x, point.y));
            }
            svgEl.body.createFixture(pl.Polygon(vertices), {
                density: 1,
                friction: 0.6
            });
            return;
        }

        for (let i = 0; i <= numPoints; i++) {
            const point = svgEl.getPointAtLength((i / numPoints) * pathLength);
            vertices.push(Vec2(point.x, point.y));
        }
        //ensure shape is convex
        //use Andrew's monotone chain algorithm for convex hull
        vertices.sort((a, b) => a.x - b.x || a.y - b.y);
        const lower = [];
        // Build lower hull
        const cross = this.cross;
        for (let v of vertices) {
            while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], v) <= 0) {
                lower.pop();
            }
            lower.push(v);
        }
        // Build upper hull 
        const upper = [];
        for (let i = vertices.length - 1; i >= 0; i--) {
            const v = vertices[i];
            while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], v) <= 0) {
                upper.pop();
            }
            upper.push(v);
        }
        // Remove the last point of each half because it's repeated at the beginning of the other half
        // Combine lower and upper hull to get the full convex hull
        //throw error if not enough vertices to form a shape
        if (lower.length + upper.length - 2 < 3) {
            throw new Error('Not enough vertices to form a shape');
        }
        vertices.length = 0;
        for (let i = 0; i < lower.length - 1; i++) {
            vertices.push(lower[i]);
        }
        for (let i = 0; i < upper.length - 1; i++) {
            vertices.push(upper[i]);
        }

        svgEl.body.createFixture(pl.Polygon(vertices), {
            density: 1,
            friction: 0.6
        });
    }
    static cross(o, a, b) {
        return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
    }
    static lineFromPath(svgEl, world) {
        var pathLength = svgEl.getTotalLength();
        var numSegments = Math.ceil(pathLength / 10);
        var points = [];
        for (var i = 0; i <= numSegments; i++) {
            var point = svgEl.getPointAtLength((i / numSegments) * pathLength);
            points.push(Vec2(point.x, point.y));
        }
        svgEl.body = world.createBody({
            type: svgEl.dataset.type,
            allowSleep: true
        });
        for (var i = 0; i < points.length - 1; i++) {
            svgEl.body.createFixture(pl.Edge(points[i], points[i + 1]), 0.0);
        }
        return svgEl;
    }
    static isShapeClosed(svgEl) {
        const pathLength = svgEl.getTotalLength();
        const startPoint = svgEl.getPointAtLength(0);
        const endPoint = svgEl.getPointAtLength(pathLength);
        const distance = Math.sqrt(Math.pow(endPoint.x - startPoint.x, 2) + Math.pow(endPoint.y - startPoint.y, 2));
        return distance < 1; //consider closed if start and end points are within 1 unit
    }
    static createBody(g) {

    }
    /**
     * 
     * @param {SVGElement} svgEl 
     * @param {Segment} rootSegment 
     * @param {World} world 
     * @returns 
     */
    static createAll(svgEl, world) {
        const gameObjects = [];
        svgEl.getElementsByTagName('circle').forEach(c => {
            gameObjects.push(circle(c, world));
        });
        svgEl.getElementsByTagName('rect').forEach(r => {
            gameObjects.push(rect(r, world));
        });
        svgEl.getElementsByTagName('line').forEach(l => {
            gameObjects.push(line(l, world));
        });
        svgEl.getElementsByTagName('path').forEach(p => {
            if (this.isShapeClosed(p)) {
                gameObjects.push(shape(p, world));
            } else {
                gameObjects.push(lineFromPath(p, world));
            }
        });
        gameObjects.forEach(obj => {
            obj.body.userData = obj;
            obj.bodyType = obj.body.getType();
        });
        return gameObjects;
    }
}
