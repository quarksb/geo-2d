import { vec2 } from "gl-matrix";
import { LineCurve } from "./line";
import { Curve, PointFn, SplitData } from "./curve";
import { getRoots } from "../equation";
import { BBox } from "../BBox";

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
    divideAt(t: number): QuadraticCurve[] {
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
    divideAtArray(tArr: number[]): QuadraticCurve[] {
        tArr.sort((a, b) => a - b);
        let currentCurve: QuadraticCurve = this;
        const curves: QuadraticCurve[] = [];
        tArr.forEach((t) => {
            const [leftCurve, rightCurve] = currentCurve.divideAt(t);
            curves.push(leftCurve);
            currentCurve = rightCurve;
        });
        curves.push(currentCurve);
        return curves;
    }

    applyFn(fn: PointFn): void {
        fn(this.startPoint);
        fn(this.endPoint);
        fn(this.controlPoint1);
        this._isDirty = true;
    }

    applyFFDFn(fn: PointFn): void {
        this.applyFn(fn);
        const diff = vec2.fromValues(this.controlPoint1[0] - 0.5 * (this.startPoint[0] + this.endPoint[0]), this.controlPoint1[1] - 0.5 * (this.startPoint[1] + this.endPoint[1]));
        vec2.add(this.controlPoint1, this.controlPoint1, diff);
        this._isDirty = true;
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
    split(splitData: SplitData): QuadraticCurve[] {
        const tArr = this.getSplitT(splitData);
        return this.divideAtArray(tArr);
    }
    toPathString(digits = 0): string {
        return `Q ${this.controlPoint1[0].toFixed(digits)} ${this.controlPoint1[1].toFixed(digits)} ${this.endPoint[0].toFixed(digits)} ${this.endPoint[1].toFixed(digits)}`;
    }
    toDebugPathString(digits?: number | undefined): string {
        return `M ${this.startPoint[0].toFixed(digits)} ${this.startPoint[1].toFixed(digits)} L ${this.controlPoint1[0].toFixed(digits)} ${this.controlPoint1[1].toFixed(
            digits
        )} L ${this.endPoint[0].toFixed(digits)} ${this.endPoint[1].toFixed(digits)}`;
    }
    /**### 用折线拟合曲线 */
    toPoints(count = 10): vec2[] {
        const points: vec2[] = new Array(count);
        const step = 1 / count;
        for (let i = 1; i <= count; i++) {
            const point = this.getPosition(i * step);
            points[i - 1] = point;
        }
        return points.reverse();
    }
}
