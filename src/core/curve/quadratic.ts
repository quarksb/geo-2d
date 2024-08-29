import { vec2 } from "gl-matrix";
import { LineCurve } from "./line";
import { PointFn, CoordData, Curve } from "./curve";
import { getRoots } from "../math/equation";
import { BBox } from "../base";

const SPLIT_COUNT = 100;
export const QuadraticCurveType = "curve-quadratic";
/**
 * ## QuadraticCurve
 * Represents a quadratic curve in a 2D space.
 */
export class QuadraticCurve extends LineCurve {
    /** the first control point of the curve */
    protected _CPoint1: vec2 = vec2.create();

    /**
     * The length of the curve at each split point.
     */
    protected _lenArr: number[] = new Array(SPLIT_COUNT).fill(0);
    constructor (startPoint: vec2, controlPoint1: vec2, endPoint: vec2) {
        super(startPoint, endPoint);
        this.type = QuadraticCurveType;
        this.CPoint1 = controlPoint1;
        this.inDir = vec2.normalize(vec2.create(), vec2.sub(vec2.create(), controlPoint1, startPoint));
        this.ouDir = vec2.normalize(vec2.create(), vec2.sub(vec2.create(), endPoint, controlPoint1));
    }

    set CPoint1(val: vec2) {
        this._isDirty ||= !vec2.exactEquals(this._CPoint1, val);
        this._CPoint1 = val;
    }

    get CPoint1(): vec2 {
        return this._CPoint1;
    }

    protected update(): void {
        super.update();
        this.inDir = this.getTangent(0);
        this.ouDir = this.getTangent(1);
    }

    getRoughBBox(): BBox {
        const [x0, y0] = this.SPoint;
        const [x1, y1] = this.CPoint1;
        const [x2, y2] = this.EPoint
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

    protected _getBBox(): BBox {
        const x0 = this.SPoint[0];
        const y0 = this.SPoint[1];
        const x1 = this.CPoint1[0];
        const y1 = this.CPoint1[1];
        const x2 = this.EPoint[0];
        const y2 = this.EPoint[1];

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

    // 通过采样点计算长度
    protected _getLen(): number {
        let len = 0;
        let lastPoint = this.getPosition(0);
        for (let i = 1; i <= SPLIT_COUNT; i++) {
            let point = this.getPosition(i / 100);
            len += vec2.distance(lastPoint, point);
            lastPoint = point;
            this._lenArr[i - 1] = len;
        }
        return len;
    }

    getPosition(t: number): vec2 {
        const a = (1 - t) ** 2;
        const b = 2 * t * (1 - t);
        const c = t ** 2;
        const x = a * this.SPoint[0] + b * this.CPoint1[0] + c * this.EPoint[0];
        const y = a * this.SPoint[1] + b * this.CPoint1[1] + c * this.EPoint[1];
        return vec2.fromValues(x, y);
    }

    // todo 溢出部分 per < 0 || per > 1 时 pos is not correct
    getPosDataByPer(per: number): { pos: vec2, tan: vec2 } {
        // 二分查找
        let left = 0;
        let right = this._lenArr.length - 1;
        let mid;
        const currentLen = this.len * per;
        while (left < right) {
            mid = Math.floor((left + right) / 2);
            if (this._lenArr[mid] < currentLen) {
                left = mid + 1;
            } else {
                right = mid;
            }
        }
        const preLen = this._lenArr[left - 1] || 0;
        let t = left / SPLIT_COUNT

        t += (currentLen - preLen) / (this._lenArr[left] - preLen) / SPLIT_COUNT;

        const pos = this.getPosition(t);
        const tan = this.getTangent(t);
        return { pos, tan };
    }

    getTangent(t: number): vec2 {
        const vector = this.getDerivative(t);
        return vec2.normalize(vector, vector);
    }

    getNormal(t: number): vec2 {
        const [x, y] = this.getTangent(t);
        const normal = vec2.fromValues(y, -x);
        return normal;
    }

    getSplitT(data: CoordData): number[] {
        const { x, y, width, height } = this.bbox;
        const { mode, val } = data;
        if (mode === "x") {
            if (val >= x && val <= x + width) {
                const derivation = [this.SPoint[0] - 2 * this.CPoint1[0] + this.EPoint[0], 2 * (this.CPoint1[0] - this.EPoint[0]), this.EPoint[0] - val];
                const roots = getRoots(derivation);
                return roots.filter((root) => root > 0 && root < 1);
            }
        } else {
            if (val >= y && val <= y + height) {
                const derivation = [this.SPoint[1] - 2 * this.CPoint1[1] + this.EPoint[1], 2 * (this.CPoint1[1] - this.EPoint[1]), this.EPoint[1] - val];
                const roots = getRoots(derivation);
                return roots.filter((root) => root > 0 && root < 1);
            }
        }
        return [];
    }

    getLineIntersects(line: LineCurve): vec2[] {
        const intersections: vec2[] = [];

        const [x1, y1] = this.SPoint;
        const [x2, y2] = this.CPoint1;
        const [x3, y3] = this.EPoint;
        const [x4, y4] = line.SPoint;

        const ax0 = x1 - 2 * x2 + x3;
        const ay0 = y1 - 2 * y2 + y3;

        const bx0 = 2 * (x2 - x1);
        const by0 = 2 * (y2 - y1);

        const cx0 = x1;
        const cy0 = y1;

        const [lx0, ly0] = vec2.sub(vec2.create(), line.EPoint, line.SPoint);

        const a = lx0 * ay0 - ly0 * ax0;
        const b = lx0 * by0 - ly0 * bx0;
        const c = lx0 * cy0 - ly0 * cx0 - lx0 * y4 + ly0 * x4;

        const roots = getRoots([a, b, c]);

        for (const t of roots) {
            if (t >= 0 && t <= 1) {
                const x = (1 - t) ** 2 * x1 + 2 * t * (1 - t) * x2 + t ** 2 * x3;
                const y = (1 - t) ** 2 * y1 + 2 * t * (1 - t) * y2 + t ** 2 * y3;
                intersections.push(vec2.fromValues(x, y));
            }
        }

        return intersections;
    }

    /**
     * Gets the distance from a given point to the quadratic curve.
     * @param pos 
     * @returns 
     */
    getDisToPos(pos: vec2): number {
        const [x1, y1] = this.SPoint;
        const [x2, y2] = this.CPoint1;
        const [x3, y3] = this.EPoint;
        const [x4, y4] = pos;

        const ax0 = x1 - 2 * x2 + x3;
        const ay0 = y1 - 2 * y2 + y3;

        const bx0 = 2 * (x2 - x1);
        const by0 = 2 * (y2 - y1);

        const cx0 = x1;
        const cy0 = y1;

        const a = ax0 ** 2 + ay0 ** 2;
        const b = 2 * (ax0 * bx0 + ay0 * by0);
        const c = bx0 ** 2 + by0 ** 2;
        const d = 2 * (ax0 * (cx0 - x4) + ay0 * (cy0 - y4));
        const e = 2 * (bx0 * (cx0 - x4) + by0 * (cy0 - y4));

        const t = (a * e - b * d) / (b ** 2 - 4 * a * c);
        const pedal = this.getPosition(t);
        return vec2.distance(pos, pedal);
    }

    getDerivative(t: number): vec2 {
        const x = 2 * (1 - t) * (this.CPoint1[0] - this.SPoint[0]) + 2 * t * (this.EPoint[0] - this.CPoint1[0]);
        const y = 2 * (1 - t) * (this.CPoint1[1] - this.SPoint[1]) + 2 * t * (this.EPoint[1] - this.CPoint1[1]);
        return vec2.fromValues(x, y);
    }

    getSecondDerivative(_?: number): vec2 {
        const x = 2 * (this.EPoint[0] - 2 * this.CPoint1[0] + this.SPoint[0]);
        const y = 2 * (this.EPoint[1] - 2 * this.CPoint1[1] + this.SPoint[1]);
        return vec2.fromValues(x, y);
    }

    /**
     * 计算曲率半径
     */
    getCurvature(t: number): number {
        const [x, y] = this.getDerivative(t);
        const [x2, y2] = this.getSecondDerivative(t);
        const dominator = x ** 2 + y ** 2;
        const k = dominator < 1E-20 ? Infinity : (x * y2 - y * x2) / dominator ** 1.5;
        return k;
    }

    /**
     *### 数值法计算曲率极值点对应的参数，可以是多个 
     * @param limit - 曲率半径极值的阈值 @default 1E-2
     * @returns 曲率半径极值点对应的参数 
     */
    getCusps(limit = 1E-2): number[] {
        const count = 100;
        // 计算 count 个点的曲率
        /**curvature array */
        const CArr = new Array(count + 1);
        for (let i = 0; i <= count; i++) {
            const t = i / count;
            CArr[i] = this.getCurvature(t);
        }

        // 寻找极值点
        const cusps: number[] = [];
        for (let i = 1; i < count; i++) {
            if ((CArr[i] - CArr[i - 1]) * (CArr[i] - CArr[i + 1]) > 0 && Math.abs(CArr[i]) > limit) {
                cusps.push(i / count);
            }
        }

        return cusps;
    }

    applyFn(fn: PointFn): void {
        fn(this.SPoint);
        fn(this.EPoint);
        fn(this.CPoint1);
    }

    applyFFDFn(fn: PointFn): void {
        // todo, consider use solver equations to calculate the control point position
        this.applyFn(fn);
        const diff = vec2.fromValues(this.CPoint1[0] - 0.5 * (this.SPoint[0] + this.EPoint[0]), this.CPoint1[1] - 0.5 * (this.SPoint[1] + this.EPoint[1]));
        vec2.add(this.CPoint1, this.CPoint1, diff);
    }

    override divideAt(t: number): QuadraticCurve[] {
        const startPoint = this.SPoint;
        const endPoint = this.EPoint;
        const controlPoint1 = this.CPoint1;
        const middlePoint1 = vec2.lerp(vec2.create(), startPoint, controlPoint1, t);
        const middlePoint2 = vec2.lerp(vec2.create(), controlPoint1, endPoint, t);
        const middlePoint = vec2.lerp(vec2.create(), middlePoint1, middlePoint2, t);
        const leftCurve = new QuadraticCurve(startPoint, middlePoint1, middlePoint);
        const rightCurve = new QuadraticCurve(vec2.clone(middlePoint), middlePoint2, endPoint);
        return [leftCurve, rightCurve];
    }

    divideAtArray(tArr: number[]): QuadraticCurve[] {
        return super.divideAtArray.call(this, tArr) as QuadraticCurve[];
    }

    pathOffset(distance: number): QuadraticCurve {
        const paramArr = [0, 0.5, 1];
        const points = paramArr.map((t) => {
            const point = this.getPosition(t);
            const normal = this.getNormal(t);
            return vec2.scaleAndAdd(vec2.create(), point, normal, distance);
        });
        const midpoint = vec2.lerp(vec2.create(), points[0], points[2], 0.5);
        const newControlPoint1 = vec2.lerp(midpoint, midpoint, points[1], 2);
        return new QuadraticCurve(points[0], newControlPoint1, points[2]);
    }

    splitByCoord(splitData: CoordData): QuadraticCurve[] {
        const tArr = this.getSplitT(splitData);
        return this.divideAtArray(tArr);
    }

    toPathString(digits = 0): string {
        return `Q ${this.CPoint1[0].toFixed(digits)} ${this.CPoint1[1].toFixed(digits)} ${this.EPoint[0].toFixed(digits)} ${this.EPoint[1].toFixed(digits)}`;
    }

    toDebugPathString(digits?: number | undefined): string {
        return `L ${this.CPoint1[0].toFixed(digits)} ${this.CPoint1[1].toFixed(
            digits
        )} L ${this.EPoint[0].toFixed(digits)} ${this.EPoint[1].toFixed(digits)}`;
    }

    /**
     * ### use polyline to represent the curve
     * 
    */
    toPoints(count = 10): vec2[] {
        const points: vec2[] = new Array(count);
        const step = 1 / count;
        for (let i = 1; i <= count; i++) {
            const point = this.getPosition(i * step);
            points[i - 1] = point;
        }
        return points.reverse();
    }

    clone(): QuadraticCurve {
        return new QuadraticCurve(vec2.clone(this.SPoint), vec2.clone(this.CPoint1), vec2.clone(this.EPoint));
    }
}

export function LineToQuadratic(lineCurve: LineCurve): QuadraticCurve {
    const startPoint = lineCurve.SPoint;
    const endPoint = lineCurve.EPoint;
    const controlPoint1 = vec2.fromValues((startPoint[0] + endPoint[0]) / 2, (startPoint[1] + endPoint[1]) / 2);
    return new QuadraticCurve(startPoint, controlPoint1, endPoint);
}


// 源码内的测试套件
if (import.meta.vitest) {
    const { it, test, expect, describe } = import.meta.vitest;

    describe('test for quadratic curve', () => {
        /**point arr */
        const quadraticCurve = new QuadraticCurve(vec2.fromValues(0, 0), vec2.fromValues(1, 1), vec2.fromValues(2, 0));

        const points = [
            vec2.fromValues(-1, 0),
            vec2.fromValues(1, 2),
            vec2.fromValues(3, 0)
        ];

        it('get distance', () => {
            expect(quadraticCurve.getDisToPos(vec2.fromValues(1, 1))).toBeCloseTo(0);
            expect(quadraticCurve.getDisToPos(vec2.fromValues(1, 0))).toBeCloseTo(1);
        })
    })
}