import { vec2 } from "gl-matrix";
import { FFD } from "./ffd";
import { QuadraticCurve } from "./quadratic";
import { BBox } from "./curve";
import { getRoots } from "./equation";

export class BezierCurve extends QuadraticCurve {
    controlPoint2: vec2;
    constructor(startPoint: vec2, controlPoint1: vec2, controlPoint2: vec2, endPoint: vec2) {
        super(startPoint, controlPoint1, endPoint);
        this.controlPoint2 = controlPoint2;
        this.endPoint = endPoint;
    }

    applyFFD(ffd: FFD): void {
        this.startPoint = ffd.transformPoint(this.startPoint);
        this.endPoint = ffd.transformPoint(this.endPoint);
        const scale = 4 / 3;
        {
            const newPoint = ffd.transformPoint(this.controlPoint1);
            const diff = vec2.sub(newPoint, newPoint, this.startPoint);
            vec2.scale(diff, diff, scale);
            this.controlPoint1 = vec2.add(this.controlPoint1, this.controlPoint1, diff);
        }
        {
            const newPoint = ffd.transformPoint(this.controlPoint2);
            const diff = vec2.sub(newPoint, newPoint, this.endPoint);
            vec2.scale(diff, diff, scale);
            this.controlPoint2 = vec2.add(this.controlPoint2, this.controlPoint2, diff);
        }
    }
    getPosition(t: number): vec2 {
        let a = t ** 3;
        let b = 3 * t * t * (1 - t);
        let c = 3 * t * (1 - t) * (1 - t);
        let d = (1 - t) ** 3;
        let x = a * this.startPoint[0] + b * this.controlPoint1[0] + c * this.controlPoint2[0] + d * this.endPoint[0];
        let y = a * this.startPoint[1] + b * this.controlPoint1[1] + c * this.controlPoint2[1] + d * this.endPoint[1];
        return vec2.fromValues(x, y);
    }
    /**
     * get BBox by control points, using derivation
     * @returns
     */
    getBBox(): BBox {
        const x0 = this.startPoint[0];
        const y0 = this.startPoint[1];
        const x1 = this.controlPoint1[0];
        const y1 = this.controlPoint1[1];
        const x2 = this.controlPoint2[0];
        const y2 = this.controlPoint2[1];
        const x3 = this.endPoint[0];
        const y3 = this.endPoint[1];

        const xDerivation = [3 * x0 - 9 * x1 + 9 * x2 - 3 * x3, 6 * x1 - 12 * x2 + 6 * x3, 3 * x2 - 3 * x3];
        const yDerivation = [3 * y0 - 9 * y1 + 9 * y2 - 3 * y3, 6 * y1 - 12 * y2 + 6 * y3, 3 * y2 - 3 * y3];
        const xRoots = getRoots(xDerivation);
        const yRoots = getRoots(yDerivation);
        const xRootsFiltered = xRoots.filter((root) => root >= 0 && root <= 1).concat([0, 1]);
        const yRootsFiltered = yRoots.filter((root) => root >= 0 && root <= 1).concat([0, 1]);
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

    applyTransform(fn: (point: vec2) => void) {
        fn(this.startPoint);
        fn(this.controlPoint1);
        fn(this.controlPoint2);
        fn(this.endPoint);
    }

    toPathString(digits = 0): string {
        return `C ${this.controlPoint1[0].toFixed(digits)} ${this.controlPoint1[1].toFixed(digits)} ${this.controlPoint2[0].toFixed(digits)} ${this.controlPoint2[1].toFixed(
            digits
        )} ${this.endPoint[0].toFixed(digits)} ${this.endPoint[1].toFixed(digits)}`;
    }

    toString(): string {
        return `BezierCurve(${this.startPoint}, ${this.controlPoint1}, ${this.controlPoint2}, ${this.endPoint})`;
    }
}
