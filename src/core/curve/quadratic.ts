import { vec2 } from "gl-matrix";
import { LineCurve, lineInterSection } from "./line";
import { BBox, Curve, SplitData } from "./curve";
import { FFD } from "./ffd.js";
import { getRoots } from "./equation";

export class QuadraticCurve extends Curve {
    controlPoint1: vec2;
    controlPointOffsetScale = 2;
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
    divideAt(t: number): [QuadraticCurve, QuadraticCurve] {
        const startPoint = this.startPoint;
        const endPoint = this.endPoint;
        const controlPoint1 = this.controlPoint1;
        const middlePoint1 = vec2.lerp(vec2.create(), startPoint, controlPoint1, t);
        const middlePoint2 = vec2.lerp(vec2.create(), controlPoint1, endPoint, t);
        const middlePoint = vec2.lerp(vec2.create(), middlePoint1, middlePoint2, t);
        const leftCurve = new QuadraticCurve(startPoint, middlePoint1, middlePoint);
        const rightCurve = new QuadraticCurve(vec2.clone(middlePoint), middlePoint2, endPoint);
        return [leftCurve, rightCurve];
    }
    applyFFD(ffd: FFD): void {
        this.startPoint = ffd.transformPoint(this.startPoint);
        this.endPoint = ffd.transformPoint(this.endPoint);
        const newPoint = ffd.transformPoint(this.controlPoint1);
        const diff = vec2.sub(newPoint, newPoint, this.startPoint);
        vec2.scale(diff, diff, this.controlPointOffsetScale);
        this.controlPoint1 = vec2.add(this.controlPoint1, this.controlPoint1, diff);
    }
    applyTransform(fn: (point: vec2) => void): void {
        fn(this.startPoint);
        fn(this.controlPoint1);
        fn(this.endPoint);
    }

    getRoughBBox(): BBox {
        const x0 = this.startPoint[0];
        const y0 = this.startPoint[1];
        const x1 = this.controlPoint1[0];
        const y1 = this.controlPoint1[1];
        const x2 = this.endPoint[0];
        const y2 = this.endPoint[1];
        const xMin = Math.min(x0, x1, x2);
        const xMax = Math.max(x0, x1, x2);
        const yMin = Math.min(y0, y1, y2);
        const yMax = Math.max(y0, y1, y2);
        return {
            x: xMin,
            y: yMin,
            width: xMax - xMin,
            height: yMax - yMin,
        };
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
    get bbox(): BBox {
        if (!this._bbox || this._isDirty) {
            this._bbox = this.getBBox();
        }
        return this._bbox;
    }
    getSplitT(data: SplitData): number[] {
        const { x, y, width, height } = this.bbox;
        const { mode, val } = data;
        if (mode === "x") {
            if (val < x || val > x + width) {
                return [];
            } else {
                const derivation = [this.startPoint[0] - 2 * this.controlPoint1[0] + this.endPoint[0], 2 * (this.controlPoint1[0] - this.endPoint[0]), this.endPoint[0] - val];
                const roots = getRoots(derivation);
                return roots.filter((root) => root > 0 && root < 1);
            }
        } else {
            if (val < y || val > y + height) {
                return [];
            } else {
                const derivation = [this.startPoint[1] - 2 * this.controlPoint1[1] + this.endPoint[1], 2 * (this.controlPoint1[1] - this.endPoint[1]), this.endPoint[1] - val];
                const roots = getRoots(derivation);
                return roots.filter((root) => root > 0 && root < 1);
            }
        }
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

    getPosition(t: number): vec2 {
        const x = t * t * this.startPoint[0] + 2 * t * (1 - t) * this.controlPoint1[0] + (1 - t) * (1 - t) * this.endPoint[0];
        const y = t * t * this.startPoint[1] + 2 * t * (1 - t) * this.controlPoint1[1] + (1 - t) * (1 - t) * this.endPoint[1];
        return vec2.fromValues(x, y);
    }
    getTangent(t: number): vec2 {
        const x = 2 * t * (this.controlPoint1[0] - this.startPoint[0]) + 2 * (1 - t) * (this.endPoint[0] - this.controlPoint1[0]);
        const y = 2 * t * (this.controlPoint1[1] - this.startPoint[1]) + 2 * (1 - t) * (this.endPoint[1] - this.controlPoint1[1]);
        const tangent = vec2.fromValues(x, y);
        vec2.normalize(tangent, tangent);
        return tangent;
    }
    getNormal(t: number): vec2 {
        const [x, y] = this.getTangent(t);
        const normal = vec2.fromValues(y, -x);
        return normal;
    }
    // 分割贝塞尔曲线，计算起点、中点、拆分点延其法向量偏移的位置，返回根据这些点确定的两条贝塞尔曲线
    offset(distance: number): QuadraticCurve[] {
        return this.splitAndOffset(distance);
    }
    baseOffset(distance: number): QuadraticCurve {
        const startPointAfterOffset = vec2.scaleAndAdd(vec2.create(), this.startPoint, this.getNormal(0), distance);
        const endPointAfterOffset = vec2.scaleAndAdd(vec2.create(), this.endPoint, this.getNormal(1), distance);
        const center = this.getPosition(0.5);
        const centerAfterOffset = vec2.scaleAndAdd(vec2.create(), center, this.getNormal(0.5), distance);
        const centerAfterOffsetScala2 = vec2.scale(centerAfterOffset, centerAfterOffset, 2);
        const midPoint = vec2.lerp(vec2.create(), this.controlPoint1, centerAfterOffsetScala2, 0.5);
        const controlPoint1AfterOffset = vec2.subtract(centerAfterOffsetScala2, centerAfterOffsetScala2, midPoint);
        return new QuadraticCurve(startPointAfterOffset, controlPoint1AfterOffset, endPointAfterOffset);
    }
    split(t: number): QuadraticCurve[] {
        const p0 = vec2.clone(this.startPoint);
        const p1 = this.controlPoint1;
        const p2 = vec2.clone(this.endPoint);
        const p01 = vec2.lerp(vec2.create(), p0, p1, t);
        const p12 = vec2.lerp(vec2.create(), p1, p2, t);
        const p012 = vec2.lerp(vec2.create(), p01, p12, t);
        return [new QuadraticCurve(p0, p01, p012), new QuadraticCurve(p012, p12, p2)];
    }
    splitAndOffset(distance: number): QuadraticCurve[] {
        const [curve1, curve2] = this.split(0.5);
        const curve1AfterOffset = curve1.baseOffset(distance);
        const curve2AfterOffset = curve2.baseOffset(distance);
        return [curve1AfterOffset, curve2AfterOffset];
    }
    toPathString(digits = 0): string {
        return `Q ${this.controlPoint1[0].toFixed(digits)} ${this.controlPoint1[1].toFixed(digits)} ${this.endPoint[0].toFixed(digits)} ${this.endPoint[1].toFixed(digits)}`;
    }
}
