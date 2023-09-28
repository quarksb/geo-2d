import { vec2 } from "gl-matrix";
import { FFD } from "./ffd";
import { QuadraticCurve } from "./quadratic";
import { BBox, SplitData } from "./curve";
import { getRoots } from "./equation";
import { LineCurve } from "./line";

export class BezierCurve extends QuadraticCurve {
    controlPoint2: vec2;
    controlPointOffsetScale = 4 / 3;
    private _spritCurves: BezierCurve[] | null = null;
    constructor(startPoint: vec2, controlPoint1: vec2, controlPoint2: vec2, endPoint: vec2) {
        super(startPoint, controlPoint1, endPoint);
        this.controlPoint2 = controlPoint2;
    }

    divideAt(t: number): [BezierCurve, BezierCurve] {
        const startPoint = this.startPoint;
        const endPoint = this.endPoint;
        const controlPoint1 = this.controlPoint1;
        const controlPoint2 = this.controlPoint2;
        const middlePoint1 = vec2.lerp(vec2.create(), startPoint, controlPoint1, t);
        const middlePoint2 = vec2.lerp(vec2.create(), controlPoint1, controlPoint2, t);
        const middlePoint3 = vec2.lerp(vec2.create(), controlPoint2, endPoint, t);
        const middlePoint4 = vec2.lerp(vec2.create(), middlePoint1, middlePoint2, t);
        const middlePoint5 = vec2.lerp(vec2.create(), middlePoint2, middlePoint3, t);
        const middlePoint = vec2.lerp(vec2.create(), middlePoint4, middlePoint5, t);
        const leftCurve = new BezierCurve(startPoint, middlePoint1, middlePoint4, middlePoint);
        const rightCurve = new BezierCurve(vec2.clone(middlePoint), middlePoint5, middlePoint3, endPoint);
        return [leftCurve, rightCurve];
    }
    applyFFD(ffd: FFD): void {
        this.startPoint = ffd.transformPoint(this.startPoint);
        this.endPoint = ffd.transformPoint(this.endPoint);

        {
            const newPoint = ffd.transformPoint(this.controlPoint1);
            const diff = vec2.sub(newPoint, newPoint, this.startPoint);
            vec2.scale(diff, diff, this.controlPointOffsetScale);
            this.controlPoint1 = vec2.add(this.controlPoint1, this.controlPoint1, diff);
        }
        {
            const newPoint = ffd.transformPoint(this.controlPoint2);
            const diff = vec2.sub(newPoint, newPoint, this.endPoint);
            vec2.scale(diff, diff, this.controlPointOffsetScale);
            this.controlPoint2 = vec2.add(this.controlPoint2, this.controlPoint2, diff);
        }
        this._isDirty = true;
    }

    applyTransform(fn: (point: vec2) => void) {
        fn(this.startPoint);
        fn(this.controlPoint1);
        fn(this.controlPoint2);
        fn(this.endPoint);
        this._isDirty = true;
    }

    get bbox(): BBox {
        if (!this._bbox || this._isDirty) {
            this._bbox = this._getBBox();
        }
        return this._bbox;
    }
    /**
     * get BBox by control points, using derivation
     * @returns
     */
    private _getBBox(): BBox {
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

    getSplitT(data: SplitData): number[] {
        const { x, y, width, height } = this.bbox;
        const { mode, val } = data;
        const i = mode === "x" ? 0 : 1;

        if (val < [x, y][i] || val > [x + width, y + height][i]) {
            return [];
        } else {
            const derivation = [
                3 * this.startPoint[i] - 9 * this.controlPoint1[i] + 9 * this.controlPoint2[i] - 3 * this.endPoint[i],
                6 * this.controlPoint1[i] - 12 * this.controlPoint2[i] + 6 * this.endPoint[i],
                3 * this.controlPoint2[i] - 3 * this.endPoint[i],
            ];
            const roots = getRoots(derivation);
            return roots.filter((root) => root > 0 && root < 1);
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

    getTangent(t: number): vec2 {
        let a = 3 * t ** 2;
        let b = 6 * t * (1 - t);
        let c = 3 * (1 - t) ** 2;
        let x = a * this.startPoint[0] + b * this.controlPoint1[0] + c * this.endPoint[0];
        let y = a * this.startPoint[1] + b * this.controlPoint1[1] + c * this.endPoint[1];

        const vector = vec2.fromValues(x, y);
        return vec2.normalize(vector, vector);
    }

    getNormal(t: number): vec2 {
        const [x, y] = this.getTangent(t);
        const normal = vec2.fromValues(y, -x);
        return normal;
    }

    get spritCurves() {
        if (!this._spritCurves) {
            this._spritCurves = this.split(0.5);
        }
        return this._spritCurves;
    }

    split(t: number): BezierCurve[] {
        const p0 = vec2.clone(this.startPoint);
        const p1 = this.controlPoint1;
        const p2 = this.controlPoint2;
        const p3 = vec2.clone(this.endPoint);
        const p01 = vec2.lerp(vec2.create(), p0, p1, t);
        const p12 = vec2.lerp(vec2.create(), p1, p2, t);
        const p23 = vec2.lerp(vec2.create(), p2, p3, t);
        const p012 = vec2.lerp(vec2.create(), p01, p12, t);
        const p123 = vec2.lerp(vec2.create(), p12, p23, t);
        const p0123 = vec2.lerp(vec2.create(), p012, p123, t);
        return [new BezierCurve(p0, p01, p012, p0123), new BezierCurve(p0123, p123, p23, p3)];
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
