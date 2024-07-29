import { vec2 } from "gl-matrix";
import { QuadraticCurve } from "./quadratic";
import { PointFn, SplitData } from "./curve";
import { getRoots } from "../math/equation";
import { LineCurve } from ".";
import { BBox } from "../base/bbox";

export class BezierCurve extends QuadraticCurve {
    controlPoint2: vec2;
    constructor (startPoint: vec2, controlPoint1: vec2, controlPoint2: vec2, endPoint: vec2) {
        super(startPoint, controlPoint1, endPoint);
        this.controlPoint2 = controlPoint2;
    }

    divideAt(t: number): BezierCurve[] {
        const startPoint = this.startPoint;
        const endPoint = this.endPoint;
        const controlPoint1 = this.controlPoint1;
        const controlPoint2 = this.controlPoint2;
        const middlePoint1 = vec2.lerp(vec2.create(), startPoint, controlPoint1, t);
        const middlePoint2 = vec2.lerp(vec2.create(), controlPoint1, controlPoint2, t);
        const middlePoint3 = vec2.lerp(vec2.create(), controlPoint2, endPoint, t);
        const middlePoint4 = vec2.lerp(vec2.create(), middlePoint1, middlePoint2, t);
        const middlePoint5 = vec2.lerp(vec2.create(), middlePoint2, middlePoint3, t);
        // const middlePoint = vec2.lerp(vec2.create(), middlePoint4, middlePoint5, t);
        const middlePoint = this.getPosition(t);

        const leftCurve = new BezierCurve(startPoint, middlePoint1, middlePoint4, middlePoint);
        const rightCurve = new BezierCurve(vec2.clone(middlePoint), middlePoint5, middlePoint3, endPoint);
        return [leftCurve, rightCurve];
    }
    /**曲线砍n刀生成 n+1 段曲线 */
    divideAtArray(tArr: number[]): BezierCurve[] {
        tArr.sort((a, b) => a - b);
        let currentCurve: BezierCurve = this;
        const curves: BezierCurve[] = new Array(tArr.length + 1);
        let lastT = 0
        for (let i = 0; i < tArr.length; i++) {
            let t = tArr[i];
            t = (t - lastT) / (1 - lastT);
            lastT = tArr[i];
            const dividedCurves = currentCurve.divideAt(t);
            curves[i] = dividedCurves[0];
            currentCurve = dividedCurves[1];
        }
        curves[tArr.length] = currentCurve;
        return curves;
    }

    applyFn(fn: PointFn) {
        fn(this.startPoint);
        fn(this.endPoint);
        fn(this.controlPoint1);
        fn(this.controlPoint2);
        this._isDirty = true;
    }

    applyFFDFn(fn: PointFn): void {
        // todo, consider use solver equations to calculate the control point position
        const originControlPoint1 = vec2.clone(this.controlPoint1);
        const originControlPoint2 = vec2.clone(this.controlPoint2);
        this.applyFn(fn);
        // todo 理解为何 1/2 更符合直觉
        // const k = 1 / 2;
        // const diff1 = vec2.subtract(vec2.create(), this.controlPoint1, originControlPoint1);
        // vec2.scaleAndAdd(this.controlPoint1, this.controlPoint1, diff1, k);
        // const diff2 = vec2.subtract(vec2.create(), this.controlPoint2, originControlPoint2);
        // vec2.scaleAndAdd(this.controlPoint2, this.controlPoint2, diff2, k);
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
        const [x0, y0] = this.startPoint;
        const [x1, y1] = this.controlPoint1;
        const [x2, y2] = this.controlPoint2;
        const [x3, y3] = this.endPoint;

        const xDerivation = [-3 * x0 + 9 * x1 - 9 * x2 + 3 * x3, 6 * x0 - 12 * x1 + 6 * x2, 3 * x1 - 3 * x0];
        const yDerivation = [-3 * y0 + 9 * y1 - 9 * y2 + 3 * y3, 6 * y0 - 12 * y1 + 6 * y2, 3 * y1 - 3 * y0];
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
        const i = mode === "y" ? 1 : 0;

        if (val < [x, y][i] || val > [x + width, y + height][i]) {
            return [];
        } else {
            const derivation = [
                -this.startPoint[i] + 3 * this.controlPoint1[i] - 3 * this.controlPoint2[i] + this.endPoint[i],
                3 * this.startPoint[i] - 6 * this.controlPoint1[i] + 3 * this.controlPoint2[i],
                -3 * this.startPoint[i] + 3 * this.controlPoint1[i],
                this.startPoint[i] - val,
            ];
            const roots = getRoots(derivation);
            const delta = 1e-8;
            return roots.filter((root) => root > delta && root < 1 - delta);
        }
    }

    getPosition(t: number): vec2 {
        let a = (1 - t) ** 3;
        let b = 3 * t * (1 - t) * (1 - t);
        let c = 3 * t * t * (1 - t);
        let d = t ** 3;
        let x = a * this.startPoint[0] + b * this.controlPoint1[0] + c * this.controlPoint2[0] + d * this.endPoint[0];
        let y = a * this.startPoint[1] + b * this.controlPoint1[1] + c * this.controlPoint2[1] + d * this.endPoint[1];
        return vec2.fromValues(x, y);
    }

    getTangent(t: number): vec2 {
        let a = -3 * ((1 - t) ** 2);
        let b = 3 * (1 - 4 * t + 3 * t ** 2);
        let c = 3 * (2 * t - 3 * t ** 2);
        let d = 3 * t ** 2;
        let x = a * this.startPoint[0] + b * this.controlPoint1[0] + c * this.controlPoint2[0] + d * this.endPoint[0];
        let y = a * this.startPoint[1] + b * this.controlPoint1[1] + c * this.controlPoint2[1] + d * this.endPoint[1];

        const vector = vec2.fromValues(x, y);
        return vec2.normalize(vector, vector);
    }

    getNormal(t: number): vec2 {
        const [x, y] = this.getTangent(t);
        const normal = vec2.fromValues(y, -x);
        return normal;
    }

    static fromLineCurve(lineCurve: LineCurve): BezierCurve {
        const startPoint = lineCurve.startPoint;
        const endPoint = lineCurve.endPoint;
        const controlPoint1 = vec2.lerp(vec2.create(), startPoint, endPoint, 1 / 3);
        const controlPoint2 = vec2.lerp(vec2.create(), startPoint, endPoint, 2 / 3);
        return new BezierCurve(startPoint, controlPoint1, controlPoint2, endPoint);
    }

    split(splitData: SplitData): BezierCurve[] {
        const tArr = this.getSplitT(splitData);
        return this.divideAtArray(tArr);
    }

    toPathString(digits = 0): string {
        return `C ${this.controlPoint1[0].toFixed(digits)} ${this.controlPoint1[1].toFixed(digits)} ${this.controlPoint2[0].toFixed(digits)} ${this.controlPoint2[1].toFixed(
            digits
        )} ${this.endPoint[0].toFixed(digits)} ${this.endPoint[1].toFixed(digits)}`;
    }

    toDebugPathString(digits?: number | undefined): string {
        return `M ${this.startPoint[0].toFixed(digits)} ${this.startPoint[1].toFixed(digits)} L ${this.controlPoint1[0].toFixed(digits)} ${this.controlPoint1[1].toFixed(
            digits
        )} L ${this.controlPoint2[0].toFixed(digits)} ${this.controlPoint2[1].toFixed(digits)} L ${this.endPoint[0].toFixed(digits)} ${this.endPoint[1].toFixed(digits)}`;
    }
}

// 源码内的测试套件
// if (import.meta.vitest) {
//     const { it, expect } = import.meta.vitest;
//     const TestDataArr = [
//         [74.87, 127.58, -74.96, 39.46, 39.85, -38.02, 78.87, 20.89],
//         [0, 0, 0, 2, 2, 2, 2, 0],
//     ];

//     const AnsDataArr = [{}, { x: 0, y: 0, width: 2, height: 4 / 3 }];
//     it("bbox", () => {
//         for (const testData of TestDataArr) {
//             const startPoint = vec2.fromValues(testData[0], testData[1]);
//             const controlPoint1 = vec2.fromValues(testData[2], testData[3]);
//             const controlPoint2 = vec2.fromValues(testData[4], testData[5]);
//             const endPoint = vec2.fromValues(testData[6], testData[7]);
//             const bezierCurve = new BezierCurve(startPoint, controlPoint1, controlPoint2, endPoint);
//             expect(bezierCurve.bbox).toEqual({ x: 0, y: 0, width: 2, height: 2 });
//         }
//     });
// }