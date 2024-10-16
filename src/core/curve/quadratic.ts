import { vec2 } from "gl-matrix";
import { LineCurve } from "./line";
import { PointFn, CoordData } from "./curve";
import { getRoots } from "../math/equation";
import { BBox2 } from "../base";
import { cross } from "../math";
import { vec2ToStr } from "../utils";

const SPLIT_COUNT = 20;
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
        let vector = vec2.sub(vec2.create(), controlPoint1, startPoint);
        this.inDir = vec2.normalize(vector, vector);
        vector = vec2.sub(vec2.create(), endPoint, controlPoint1);
        this.outDir = vec2.normalize(vector, vector);
    }

    set CPoint1(val: vec2) {
        this._isDirty ||= !vec2.exactEquals(this._CPoint1, val);
        this._CPoint1 = val;
    }

    get CPoint1(): vec2 {
        return this._CPoint1;
    }

    protected override update(): void {
        super.update();
        this.inDir = this.getTangent(0);
        this.outDir = this.getTangent(1);
    }

    protected _getBBox2(): BBox2 {
        const [x0, y0] = this.SPoint;
        const [x1, y1] = this.CPoint1;
        const [x2, y2] = this.EPoint;

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
        return { xMin, xMax, yMin, yMax };
    }

    // 通过采样点计算长度
    protected _getLen(): number {
        let len = 0;
        let lastPoint = this.getPosition(0);
        for (let i = 1; i <= SPLIT_COUNT; i++) {
            let point = this.getPosition(i / SPLIT_COUNT);
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
        // bbox 碰撞检查
        const { xMin, xMax, yMin, yMax } = this.bbox2;
        const { SPoint, EPoint } = line;

        const points = [
            vec2.fromValues(xMin, yMin),
            vec2.fromValues(xMax, yMin),
            vec2.fromValues(xMax, yMax),
            vec2.fromValues(xMin, yMax)
        ];

        // 如果 bbox四点 都在 line 一侧，则不可能相交
        let count = 0;
        for (const point of points) {
            // 叉乘判断点在直线的哪一侧
            count += cross(line.tangent, vec2.sub(vec2.create(), point, SPoint)) > 0 ? 1 : 0;
        }
        if (count === 0 || count === 4) {
            return [];
        }

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
     * ### Gets the distance from a given point to the quadratic curve by numerical method.
     * @param pos 
     * @returns 
     */
    getDisToPos(pos: vec2): number {
        let count = 100;
        let minDistance = Infinity;
        for (let i = 0; i <= count; i++) {
            const t = i / count;
            const point = this.getPosition(t);
            const distance = vec2.distance(pos, point);
            if (distance < minDistance) {
                minDistance = distance;
            }
        }
        return minDistance;
    }

    /**
     * Gets the distance from a given point to the quadratic curve by Analytical method
     * @param pos 
     * @returns 
     */
    getDisToPos2(pos: vec2): number {
        const [x1, y1] = this.SPoint;
        const [x2, y2] = this.CPoint1;
        const [x3, y3] = this.EPoint;
        const [x4, y4] = pos;

        // 求出垂足对应的 t, 垂足点满足其切线和直线 pos 之间的夹角为 90 度
        // 通过求解方程组得到 t

        // 曲线参数方程可以表达为
        // x = (x1-2*x2+x3)*t^2 + 2*(x2-x1)*t + x1
        // y = (y1-2*y2+y3)*t^2 + 2*(y2-y1)*t + y1

        // 曲线的切线方程可以表达为
        // x0 = 2 * (x1 - 2 * x2 + x3) * t + 2 * (x2 - x1)
        // y0 = 2 * (y1 - 2 * y2 + y3) * t + 2 * (y2 - y1)



        // 垂足 p0 到 pos 对应的向量为
        // x1 = - (x1-2*x2+x3)*t^2 - 2*(x2-x1)*t - x1 + x4
        // y1 = - (y1-2*y2+y3)*t^2 - 2*(y2-y1)*t - y1 + y4
        /**向量：垂足 p0 -> pos */
        const offVecArr = [
            [- (x1 - 2 * x2 + x3), - 2 * (x2 - x1), x4 - x1],
            [- (y1 - 2 * y2 + y3), - 2 * (y2 - y1), y4 - y1]
        ];

        /**切线向量 */
        const tanArr = [
            [2 * (x1 - 2 * x2 + x3), 2 * (x2 - x1)],
            [2 * (y1 - 2 * y2 + y3), 2 * (y2 - y1)]
        ];

        // 两个向量的点积为 0 （ 一次方程 点乘 二次方程）
        // x0 * x1 + y0 * y1 = 0
        // 整理，合并得到 一个一元三次方程
        /**一元三次方程的参数，共 4 个 */
        const equation = new Array(2 + 3 - 1).fill(0);
        for (let i = 0; i < 2; i++) { // x, y
            for (let j = 0; j < 2; j++) { // tanArr
                for (let k = 0; k < 3; k++) { // offVecArr
                    // 合并同次项
                    equation[j + k] += tanArr[i][j] * offVecArr[i][k] + tanArr[i][j] * offVecArr[i][k];
                }
            }
        }

        const roots = getRoots(equation);
        const rootArr = [...roots.filter(t => t * (t - 1) < 0), 0, 1]
        let minDistance = Infinity;
        for (let t of rootArr) {
            const pedal = this.getPosition(t);
            const distance = vec2.distance(pos, pedal);
            if (distance < minDistance) {
                minDistance = distance;
            }
        }

        return minDistance;
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
     * ### 计算曲率半径
     */
    override getCurvature(t: number): number {
        const [x1, y1] = this.getDerivative(t);
        const [x2, y2] = this.getSecondDerivative(t);
        const numerator = x1 * y2 - y1 * x2;
        if (Math.abs(numerator) < 1E-20) {
            return 0
        }
        const dominator = x1 ** 2 + y1 ** 2;
        const curvature = dominator < 1E-20 ? Infinity : numerator / dominator ** 1.5;
        return curvature;
    }

    getMaxCurvature(n = 10): number {
        let max = 0;
        for (let i = 0; i <= n; i++) {
            const t = i / n;
            const curvature = this.getCurvature(t);
            if (Math.abs(curvature) > Math.abs(max)) {
                max = curvature;
            }
        }
        return max;
    }

    getMeanCurvature(n = 10): number {
        let sum = 0;
        for (let i = 0; i <= n; i++) {
            const t = i / n;
            const curvature = this.getCurvature(t);
            sum += curvature;
        }
        return sum / (n + 1);
    }

    /**
     *### 数值法计算曲率极值点对应的参数，可以是多个 
     * @param n 分割点数量(数值越大精度越高)
     * @returns 曲率半径极值点对应的参数 
     */
    getCusps(n = 10): number[] {
        // 计算 count 个点的曲率
        /**curvature array */
        const CArr = new Array(n + 1);

        for (let i = 0; i <= n; i++) {
            const t = i / n;
            const curvature = this.getCurvature(t);
            CArr[i] = curvature;
        }

        // console.log(CArr);

        // 寻找极值点
        const cusps: number[] = [];
        for (let i = 1; i < n; i++) {
            if ((CArr[i] - CArr[i - 1]) * (CArr[i] - CArr[i + 1]) > 0) {
                cusps.push(i / n);
            }
        }

        // 分析首尾是否是极值点
        if (CArr[0] * (CArr[0] - CArr[1]) > 0) {
            cusps.unshift(0)
        }

        if (CArr[n] * (CArr[n] - CArr[n - 1]) > 0) {
            cusps.push(1)
        }

        return cusps;
    }

    applyFn(fn: PointFn): void {
        fn(this.SPoint);
        fn(this.EPoint);
        fn(this.CPoint1);
        this._isDirty = true;
        this.update();
    }

    applyFFDFn(fn: PointFn): void {
        // todo, consider use solver equations to calculate the control point position
        this.applyFn(fn);
        const diff = vec2.fromValues(this.CPoint1[0] - 0.5 * (this.SPoint[0] + this.EPoint[0]), this.CPoint1[1] - 0.5 * (this.SPoint[1] + this.EPoint[1]));
        vec2.add(this.CPoint1, this.CPoint1, diff);
    }

    override splitAt(t: number): QuadraticCurve[] {
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

    splitAtArray(tArr: number[]): QuadraticCurve[] {
        return super.splitAtArray.call(this, tArr) as QuadraticCurve[];
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
        return this.splitAtArray(tArr);
    }

    toPathString(digits = 0): string {
        return `Q ${vec2ToStr(this.CPoint1, digits)} ${vec2ToStr(this.EPoint, digits)}`;
    }

    toDebugPathString(digits?: number | undefined): string {
        return `L ${vec2ToStr(this.CPoint1, digits)}L ${vec2ToStr(this.EPoint, digits)}`;
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