import { vec2 } from "gl-matrix";
import { BBox, Curve, SplitData } from "./curve";
import { FFD } from "./ffd";

export class LineCurve extends Curve {
    _normal: vec2 | null = null;
    _tangent: vec2 | null = null;

    divideAt(t: number): [Curve, Curve] {
        const startPoint = this.startPoint;
        const endPoint = this.endPoint;
        const middlePoint = vec2.lerp(vec2.create(), startPoint, endPoint, t);
        const leftCurve = new LineCurve(startPoint, middlePoint);
        const rightCurve = new LineCurve(vec2.clone(middlePoint), endPoint);
        return [leftCurve, rightCurve];
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
    applyFFD(ffd: FFD): void {
        this.startPoint = ffd.transformPoint(this.startPoint);
        this.endPoint = ffd.transformPoint(this.endPoint);
        this._isDirty = true;
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

    applyTransform(fn: (point: vec2) => void): void {
        fn(this.startPoint);
        fn(this.endPoint);
    }
    toPathString(digits = 0): string {
        return `L ${this.endPoint[0].toFixed(digits)} ${this.endPoint[1].toFixed(digits)}`;
    }
}

// 计算两条线段的交点
export function lineInterSection(p0: vec2, p1: vec2, p2: vec2, p3: vec2) {
    const [x1, y1] = p0;
    const [x2, y2] = [p1[0] - p0[0], p1[1] - p0[1]];
    const [x3, y3] = p2;
    const [x4, y4] = [p3[0] - p2[0], p3[1] - p2[1]];

    // solve equation x1 + t*x2 = x3 + u * x4; y1 + t*y2 = y3 + u * y4

    const denominator = x4 * y2 - x2 * y4;
    console.log(denominator);

    if (denominator < 1e-6 && denominator > -1e-6) {
        // 射线平行，没有交点
        return null;
    }

    const t = ((x1 - x3) * y4 - (y1 - y3) * x4) / denominator;
    const u = ((x1 - x3) * y2 - (y1 - y3) * x2) / denominator;

    console.log(p0.toString(), p1.toString(), p2.toString(), p3.toString());
    console.log(t, u);
    if (t > 0 && t < 1 && u > 0 && u < 1) {
        return vec2.fromValues(x1 + t * x2, y1 + t * y2);
    }
    return null;
}
