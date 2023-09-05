import { vec2 } from "gl-matrix";
import { LineCurve } from "./line.js";
import { BBox, Curve } from "./curve.js";
import { FFD } from "./ffd.js";
import { getRoots } from "./equation.js";

export class QuadraticCurve extends Curve {
    controlPoint1: vec2;
    constructor(startPoint: vec2, controlPoint1: vec2, endPoint: vec2) {
        super(startPoint, endPoint);
        this.controlPoint1 = controlPoint1;
        this.endPoint = endPoint;
    }
    static fromLineCurve(lineCurve: LineCurve): QuadraticCurve {
        const startPoint = lineCurve.startPoint;
        const endPoint = lineCurve.endPoint;
        const controlPoint1 = vec2.fromValues((startPoint[0] + endPoint[0]) / 2, (startPoint[1] + endPoint[1]) / 2);
        return new QuadraticCurve(startPoint, controlPoint1, endPoint);
    }
    applyFFD(ffd: FFD): void {
        this.startPoint = ffd.transformPoint(this.startPoint);
        this.endPoint = ffd.transformPoint(this.endPoint);
        const newPoint = ffd.transformPoint(this.controlPoint1);
        const diff = vec2.sub(newPoint, newPoint, this.startPoint);
        vec2.scale(diff, diff, 2);
        this.controlPoint1 = vec2.add(this.controlPoint1, this.controlPoint1, diff);
    }
    getPosition(t: number): vec2 {
        const x = t * t * this.startPoint[0] + 2 * t * (1 - t) * this.controlPoint1[0] + (1 - t) * (1 - t) * this.endPoint[0];
        const y = t * t * this.startPoint[1] + 2 * t * (1 - t) * this.controlPoint1[1] + (1 - t) * (1 - t) * this.endPoint[1];
        return vec2.fromValues(x, y);
    }
    // 通过采样点计算长度
    getLen(): number {
        let len = 0;
        let lastPoint = this.getPosition(0);
        for (let i = 1; i <= 100; i++) {
            let point = this.getPosition(i / 100);
            len += vec2.distance(lastPoint, point);
            lastPoint = point;
        }
        return len;
    }
    getBBox(): BBox {
        const x0 = this.startPoint[0];
        const y0 = this.startPoint[1];
        const x1 = this.controlPoint1[0];
        const y1 = this.controlPoint1[1];
        const x2 = this.endPoint[0];
        const y2 = this.endPoint[1];

        const xDerivation = [2 * (x0 - 2 * x1 + x2), 2 * (x1 - x2)];
        const yDerivation = [2 * (y0 - 2 * y1 + y2), 2 * (y1 - y2)];
        const xRoots = getRoots(xDerivation);
        const yRoots = getRoots(yDerivation);
        const xRootsFiltered = xRoots.filter((root) => root > 0 && root < 1).concat([0, 1]);
        const yRootsFiltered = yRoots.filter((root) => root > 0 && root < 1).concat([0, 1]);
        const xValues = xRootsFiltered.map((root) => this.getPosition(root)[0]);
        const yValues = yRootsFiltered.map((root) => this.getPosition(root)[1]);
        const xMin = Math.min(...xValues);
        const xMax = Math.max(...xValues);
        const yMin = Math.min(...yValues);
        const yMax = Math.max(...yValues);
        return {
            x: xMin,
            y: yMin,
            width: xMax - xMin,
            height: yMax - yMin,
        };
    }
    applyTransform(fn: (point: vec2) => void): void {
        fn(this.startPoint);
        fn(this.controlPoint1);
        fn(this.endPoint);
    }
    toPathString(digits = 0): string {
        return `Q ${this.controlPoint1[0].toFixed(digits)} ${this.controlPoint1[1].toFixed(digits)} ${this.endPoint[0].toFixed(digits)} ${this.endPoint[1].toFixed(digits)}`;
    }
}
