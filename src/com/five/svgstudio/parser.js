import { Body, Segment, Shape, Path } from "./body.js";

export default class SVGParser {

    static parseBodySVG(svgStr, name) {
        const body = new Body(name);
        //parse svg string
        const tempNode = document.createElement('div');
        this.shadowRoot.appendChild(tempNode);
        tempNode.innerHTML = svgStr;
        let group;
        const svgEl = tempNode.querySelector('svg');
        if (svgEl) {
            group = svgEl.querySelector(':scope > g');
        } else {
            group = tempNode.querySelector('g');
        } if (!group) {
            alert('No group found in SVG');
            return;
        }
        body.rootSegment = this.parseGroupNode(group, body);
        return body;
    }
    static parseGroupNode(group, body, parentSegment = null) {
        const shapeEl = group.querySelector(':scope > path, :scope > circle, :scope > rect, :scope > ellipse, :scope > line, :scope > polyline, :scope > polygon');
        let shape;
        if (shapeEl) {
            shape = this.parseShapeNode(body, shapeEl);
        }
        const pivotPoint = { x: 0, y: 0 };
        const rotation = 0;
        if (group.hasAttribute('transform')) {
            const transform = group.getAttribute('transform');
            const matrix = this.parseTransformMatrixStr(transform);
            group.angle = matrix[0];
        }
        const offsetXY = { x: shape?.offsetX ?? 0, y: shape?.offsetY ?? 0 };
        const origin = { x: offsetXY.x - (parentSegment?.offsetXY.x ?? 0), y: offsetXY.y - (parentSegment?.offsetXY.y ?? 0) };
        const segment = new Segment(body, shape, pivotPoint, origin, rotation);
        segment.offsetXY = offsetXY;
        const children = group.querySelectorAll(':scope > g');
        children.forEach(child => {
            segment.addChild(this.parseGroupNode(child, body, segment));
        });
        return segment;
    }
    static parseTransformMatrixStr(transform) {
        const operation = transform.split('(')[0];
        const values = transform.split('(')[1].split(')')[0].split(' ');
        switch (operation) {
            case 'matrix':
                return values.map(value => parseFloat(value));
            case 'rotate':
                return [values[0], 0, 0, values[1], values[2], values[3]];
            case 'translate':
                return [1, 0, 0, 1, values[0], values[1]];
        }
    }
    static parseShapeNode(body, shapeEl) {
        const shape = shapeEl.tagName;
        if (shape === 'path') {
            const commands = this.parseCommands(shapeEl.getAttribute('d'));
            const { minX, minY } = this.getMinXY(commands);
            const path = new Path(body, this.offsetPath(commands, -minX, -minY), this.parseShapeAttributes(shapeEl));
            path.offsetX = minX;
            path.offsetY = minY;
            return path;
        }
        return new Shape(body, shape, this.parseShapeAttributes(shapeEl));

    }
    static getMinXY(commands) {
        const minX = commands.reduce((min, cmd) => Math.min(min, cmd.x), Infinity);
        const minY = commands.reduce((min, cmd) => Math.min(min, cmd.y), Infinity);
        return { minX, minY };
    }
    static parseShapeAttributes(shapeEl) {
        const shape = shapeEl.tagName;
        switch (shape) {
            case 'circle':
                return { r: shapeEl.getAttribute('r'), cx: shapeEl.getAttribute('cx'), cy: shapeEl.getAttribute('cy') };
            case 'rect':
                return { x: shapeEl.getAttribute('x'), y: shapeEl.getAttribute('y'), width: shapeEl.getAttribute('width'), height: shapeEl.getAttribute('height') };
            case 'ellipse':
                return { rx: shapeEl.getAttribute('rx'), ry: shapeEl.getAttribute('ry'), cx: shapeEl.getAttribute('cx'), cy: shapeEl.getAttribute('cy') };
            case 'line':
                return { x1: shapeEl.getAttribute('x1'), y1: shapeEl.getAttribute('y1'), x2: shapeEl.getAttribute('x2'), y2: shapeEl.getAttribute('y2') };
            case 'polyline':
                return { points: shapeEl.getAttribute('points') };
            case 'polygon':
                return { points: shapeEl.getAttribute('points') };
        }
    }

    static parseCommands(d) {
        // Split the command string into parts based on command letters
        const parts = d.match(/[a-zA-Z][^a-zA-Z]*/g);
        let x = 0, y = 0;
        let path = [];

        parts.forEach(part => {
            const command = part.charAt(0);
            const coords = part.slice(1).trim().split(/[\s,]+/).map(Number);

            switch (command) {
                case 'M':
                case 'L':
                    // Move and Line commands expect pairs of coordinates
                    for (let i = 0; i < coords.length; i += 2) {
                        x = coords[i];
                        y = coords[i + 1];
                        path.push({ command, x, y });
                    }
                    break;
                case 'C':
                    // Cubic bezier commands expect three pairs of coordinates
                    for (let i = 0; i < coords.length; i += 6) {
                        const x1 = coords[i];
                        const y1 = coords[i + 1];
                        const x2 = coords[i + 2];
                        const y2 = coords[i + 3];
                        x = coords[i + 4];
                        y = coords[i + 5];
                        path.push({ command, x1, y1, x2, y2, x, y });
                    }
                    break;
            }
        });


        return path;
    }

    // Offsets all points in the path by x and y
    static offsetPath(commands, offsetX, offsetY) {
        commands.map(cmd => {
            if (cmd.command === 'M' || cmd.command === 'L') {
                cmd.x += offsetX;
                cmd.y += offsetY;
            } else if (cmd.command === 'C') {
                cmd.x1 += offsetX;
                cmd.y1 += offsetY;
                cmd.x2 += offsetX;
                cmd.y2 += offsetY;
                cmd.x += offsetX;
                cmd.y += offsetY;
            }
            return cmd;
        });
    }
    static rotatePath(path, angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        path.forEach(cmd => {
            if (cmd.command === 'M' || cmd.command === 'L') {
                const x = cmd.x;
                const y = cmd.y;
                cmd.x = x * cos - y * sin;
                cmd.y = x * sin + y * cos;
            } else if (cmd.command === 'C') {
                const x1 = cmd.x1;
                const y1 = cmd.y1;
                const x2 = cmd.x2;
                const y2 = cmd.y2;
                const x = cmd.x;
                const y = cmd.y;
                cmd.x1 = x1 * cos - y1 * sin;
                cmd.y1 = x1 * sin + y1 * cos;
                cmd.x2 = x2 * cos - y2 * sin;
                cmd.y2 = x2 * sin + y2 * cos;
                cmd.x = x * cos - y * sin;
                cmd.y = x * sin + y * cos;
            }
        });
    }
}