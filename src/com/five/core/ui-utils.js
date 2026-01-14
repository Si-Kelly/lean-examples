export class SVGUtil {
    constructor(svgEl) {
        this.svgEl = svgEl;
        this.svgPoint = this.svgEl.createSVGPoint();
        this.inverseCTM = this.svgEl.getCTM().inverse();
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
    static of(xy) {
        return new XY(xy.x, xy.y);
    }
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
    constructor(events) {
        this.events = events;
        this.hasMoved = false;
    }
    done() {
        this.events.done(this.totalDXY);
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
        this.events.next(this.dxy, this.thisXY);
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
    static clamp(val, min, max) {
        return Math.min(Math.max(val, min), max);
    }
}
