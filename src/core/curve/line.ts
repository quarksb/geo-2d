import { vec2 } from "gl-matrix";
import { Curve, PointFn, SplitData } from "./curve";
import { BBox } from "../BBox";

export class LineCurve extends Curve {
    _normal: vec2 | null = null;
    _tangent: vec2 | null = null;

    divideAt(t: number): LineCurve[] {
        const startPoint = this.startPoint;
        const endPoint = this.endPoint;
        const middlePoint = vec2.lerp(vec2.create(), startPoint, endPoint, t);
        const leftCurve = new LineCurve(startPoint, middlePoint);
        const rightCurve = new LineCurve(vec2.clone(middlePoint), endPoint);
        return [leftCurve, rightCurve];
    }
    divideAtArray(tArr: number[]): LineCurve[] {
        tArr.sort((a, b) => a - b);
        const startPoint = this.startPoint;
        const curves: LineCurve[] = [];
        let currentPoint = startPoint;
        tArr.forEach((t) => {
            const endPoint = this.getPosition(t);
            const leftCurve = new LineCurve(currentPoint, endPoint);
            curves.push(leftCurve);
            currentPoint = vec2.clone(endPoint);
        });
        const rightCurve = new LineCurve(vec2.clone(currentPoint), this.endPoint);
        curves.push(rightCurve);
        return curves;
    }
    get tangent(): vec2 {
        if (this._tangent === null) {
            const vector = vec2.sub(vec2.create(), this.endPoint, this.startPoint);
            vec2.normalize(vector, vector);
            this._tangent = vector;
        }
        return this._tangent;
    }
    getTangent(): vec2 {
        return this.tangent;
    }

    constructor(startPoint: vec2, endPoint: vec2) {
        super(startPoint, endPoint);
    }

    getPosition(t: number): vec2 {
        const x = this.startPoint[0] + (this.endPoint[0] - this.startPoint[0]) * t;
        const y = this.startPoint[1] + (this.endPoint[1] - this.startPoint[1]) * t;
        return vec2.fromValues(x, y);
    }
    get normal(): vec2 {
        if (this._normal === null) {
            const [x, y] = this.tangent;
            const normal = vec2.fromValues(y, -x);
            this._normal = normal;
        }
        return this._normal;
    }
    get bbox(): BBox {
        if (!this._bbox || this._isDirty) {
            this._bbox = this.getBBox();
        }
        return this._bbox;
    }

    getNormal(): vec2 {
        return this.normal;
    }
    getLen(): number {
        return vec2.distance(this.startPoint, this.endPoint);
    }
    getBBox(): BBox {
        let x, y, width, height;
        if (this.startPoint[0] < this.endPoint[0]) {
            x = this.startPoint[0];
            width = this.endPoint[0] - this.startPoint[0];
        } else {
            x = this.endPoint[0];
            width = this.startPoint[0] - this.endPoint[0];
        }
        if (this.startPoint[1] < this.endPoint[1]) {
            y = this.startPoint[1];
            height = this.endPoint[1] - this.startPoint[1];
        } else {
            y = this.endPoint[1];
            height = this.startPoint[1] - this.endPoint[1];
        }

        return {
            x,
            y,
            width,
            height,
        };
    }
    isPointOnCurve(point: vec2): boolean {
        const [x, y] = point;
        const [x1, y1] = this.startPoint;
        const [x2, y2] = this.endPoint;
        const minX = Math.min(x1, x2);
        const maxX = Math.max(x1, x2);
        const minY = Math.min(y1, y2);
        const maxY = Math.max(y1, y2);
        if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
            return true;
        } else {
            return false;
        }
    }

    getSplitT(data: SplitData): number[] {
        const { x, y, width, height } = this.bbox;
        const { mode, val } = data;
        if (mode === "x" && val >= x && val <= x + width) {
            return [(val - x) / width];
        } else if (mode === "y" && val >= y && val <= y + height) {
            return [(val - y) / height];
        }
        return [];
    }

    applyFn(fn: PointFn): void {
        fn(this.startPoint);
        fn(this.endPoint);
    }
    applyFFDFn(fn: PointFn): void {
        this.applyFn(fn);
    }
    split(splitData: SplitData): LineCurve[] {
        const tArr = this.getSplitT(splitData);
        return this.divideAtArray(tArr);
    }
    toPathString(digits = 0): string {
        return `L ${this.endPoint[0].toFixed(digits)} ${this.endPoint[1].toFixed(digits)}`;
    }
    toDebugPathString(digits?: number | undefined): string {
        return this.toPathString(digits);
    }
}
