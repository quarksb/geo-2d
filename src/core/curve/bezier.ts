import { vec2 } from "gl-matrix";
import { QuadraticCurve } from "./quadratic";
import { PointFn, CoordData, Curve } from "./curve";
import { getRoots } from "../math/equation";
import { LineCurve } from "./line";
import { BBox2 } from "../base";
import { cross } from "../math";
import { vec2ToStr } from "../utils";

export const BezierCurveType = "curve-bezier";

/**
 * ## BezierCurve
 * Represents a cubic bezier curve in a 2D space.
 */
export class BezierCurve extends QuadraticCurve {
    /** The second control point of the curve. */
    protected _CPoint2: vec2 = vec2.create();
    constructor(startPoint: vec2, controlPoint1: vec2, controlPoint2: vec2, endPoint: vec2) {
        super(startPoint, controlPoint1, endPoint);
        this.type = BezierCurveType;
        this.CPoint2 = controlPoint2;
        let vector = vec2.sub(vec2.create(), controlPoint1, startPoint);
        this.inDir = vec2.normalize(vector, vector);
        vector = vec2.sub(vec2.create(), endPoint, controlPoint2);
        this.outDir = vec2.normalize(vector, vector);
    }

    /**
     * Sets the second control point of the curve.
     */
    set CPoint2(val: vec2) {
        this._isDirty ||= !vec2.exactEquals(this._CPoint2, val);
        this._CPoint2 = val;
    }
    /**
     * Gets the second control point of the curve.
     * @returns The second control point.
     */
    get CPoint2(): vec2 {
        return this._CPoint2;
    }

    /**
     * get BBox by control points, using derivation
     * @returns
     */
    protected _getBBox2(): BBox2 {
        const [x0, y0] = this.SPoint;
        const [x1, y1] = this.CPoint1;
        const [x2, y2] = this.CPoint2;
        const [x3, y3] = this.EPoint;

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

        return { xMin, xMax, yMin, yMax };
    }

    getSplitT(data: CoordData): number[] {
        const { x, y, width, height } = this.bbox;
        const { mode, val } = data;
        const i = mode === "y" ? 1 : 0;

        if (val < [x, y][i] || val > [x + width, y + height][i]) {
            return [];
        } else {
            const derivation = [
                -this.SPoint[i] + 3 * this.CPoint1[i] - 3 * this.CPoint2[i] + this.EPoint[i],
                3 * this.SPoint[i] - 6 * this.CPoint1[i] + 3 * this.CPoint2[i],
                -3 * this.SPoint[i] + 3 * this.CPoint1[i],
                this.SPoint[i] - val,
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
        let x = a * this.SPoint[0] + b * this.CPoint1[0] + c * this.CPoint2[0] + d * this.EPoint[0];
        let y = a * this.SPoint[1] + b * this.CPoint1[1] + c * this.CPoint2[1] + d * this.EPoint[1];
        return vec2.fromValues(x, y);
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

    /**
     * @inheritdoc
     * 设定垂足点 p0 则 p0 -> pos 表述为 关于参数 t 的 3 阶方程，p0 点切线表述为关于参数 t 的 2 阶方程,
     * 满足垂直时，即内积为 0，两个方程的内积表述为关于参数t 的 5 阶方程，5 阶方程没有解析解，所以无法用解析法求解垂足
     */
    getDisToPos2(pos: vec2): number {
        console.error("bezier has no analytical solution for getDisToPos2");
        return this.getDisToPos(pos);
    }

    getDerivative(t: number): vec2 {
        let a = -3 * (1 - t) ** 2;
        let b = 3 * (1 - 4 * t + 3 * t ** 2);
        let c = 3 * (2 * t - 3 * t ** 2);
        let d = 3 * t ** 2;
        let x = a * this.SPoint[0] + b * this.CPoint1[0] + c * this.CPoint2[0] + d * this.EPoint[0];
        let y = a * this.SPoint[1] + b * this.CPoint1[1] + c * this.CPoint2[1] + d * this.EPoint[1];
        return vec2.fromValues(x, y);
    }

    getSecondDerivative(t: number): vec2 {
        let a = 6 * (1 - t);
        let b = 6 * (3 * t - 2);
        let c = 6 * (1 - 3 * t);
        let d = 6 * t;
        let x = a * this.SPoint[0] + b * this.CPoint1[0] + c * this.CPoint2[0] + d * this.EPoint[0];
        let y = a * this.SPoint[1] + b * this.CPoint1[1] + c * this.CPoint2[1] + d * this.EPoint[1];
        return vec2.fromValues(x, y);
    }

    applyFn(fn: PointFn) {
        fn(this.SPoint);
        fn(this.EPoint);
        fn(this.CPoint1);
        fn(this.CPoint2);
        this._isDirty = true;
        this.update();
    }

    /**
     * ### Apply a free form deformation (FFD) to the curve.
     * @param fn
     */
    applyFFDFn(fn: PointFn): void {
        const { SPoint, EPoint } = this;
        // 分析问题，经历 FFD 变换后 贝塞尔曲线的位置是确定的，那么还是先两控制点共 4 个参数，需要求解 4 个方程，而每个点可以提供 x, y 两个方程，所以需要 2 个点, 选取 t = 0.4, 0.6 两点
        /**目标点参数 */
        const tArr = [0.4, 0.6];
        /**目标点位置 */
        const pArr = tArr.map((t) => {
            // 求出变换前点位置
            const p = this.getPosition(t);
            // 应用 fn 求出变换后 p 的位置
            fn(p);
            return p;
        });

        // 更新收尾两点位置
        fn(SPoint);
        fn(EPoint);

        const getEquation = (t: number, p: vec2) => {
            // 计算 t 时的方程
            const a = (1 - t) ** 3;
            const b = 3 * t * (1 - t) ** 2;
            const c = 3 * t ** 2 * (1 - t);
            const d = t ** 3;
            // 原始等式为 a * SPoint + b * CPoint1 + c * CPoint2 + d * EPoint = p
            // 现在要求 CPoint1, CPoint2, 故将等式变形为
            // b * CPoint1 + c * CPoint2 = p - a * SPoint - d * EPoint
            return [b, c, p[0] - d * EPoint[0] - a * SPoint[0], p[1] - d * EPoint[1] - a * SPoint[1]];
        };

        // 共两个二元二次方程组（ x, y 方程组相互独立）
        const [a, b, m0, n0] = getEquation(tArr[0], pArr[0]);
        const [c, d, m1, n1] = getEquation(tArr[1], pArr[1]);

        // bc - ad 只有在 t = 0 或 t = 1 时为 0，所以不用担心分母为 0 的情况
        const k = 1 / (b * c - a * d);

        const x0 = (b * m1 - d * m0) * k;
        const y0 = (b * n1 - d * n0) * k;
        const x1 = (c * m0 - a * m1) * k;
        const y1 = (c * n0 - a * n1) * k;

        this.CPoint1 = vec2.fromValues(x0, y0);
        this.CPoint2 = vec2.fromValues(x1, y1);
        this._isDirty = true;
    }

    reverse(): void {
        [this.CPoint1, this.CPoint2] = [this.CPoint2, this.CPoint1];
        super.reverse();
    }

    /**
     * @inheritdoc
     */
    getLineIntersects(line: LineCurve): vec2[] {
        // bbox 碰撞检查
        const { xMin, xMax, yMin, yMax } = this.bbox2;
        const { SPoint, EPoint } = line;

        const points = [
            vec2.fromValues(xMin, yMin),
            vec2.fromValues(xMax, yMin),
            vec2.fromValues(xMax, yMax),
            vec2.fromValues(xMin, yMax),
        ];

        // 如果 bbox四点 都在 line 一侧，则不可能相交
        let count = 0;
        for (const point of points) {
            // 叉乘判断点在直线的哪一侧
            count += cross(vec2.sub(vec2.create(), EPoint, SPoint), vec2.sub(vec2.create(), point, SPoint)) > 0 ? 1 : 0;
        }
        if (count === 0 || count === 4) {
            return [];
        }

        const intersections: vec2[] = [];

        // Calculate the intersection point using line-quadratic bezier intersection formula
        const [x1, y1] = this.SPoint;
        const [x2, y2] = this.CPoint1;
        const [x3, y3] = this.CPoint2;
        const [x4, y4] = this.EPoint;
        const [x5, y5] = line.SPoint;

        const ax0 = -x1 + 3 * x2 - 3 * x3 + x4;
        const ay0 = -y1 + 3 * y2 - 3 * y3 + y4;

        const bx0 = 3 * x1 - 6 * x2 + 3 * x3;
        const by0 = 3 * y1 - 6 * y2 + 3 * y3;

        const cx0 = -3 * x1 + 3 * x2;
        const cy0 = -3 * y1 + 3 * y2;

        const dx0 = x1;
        const dy0 = y1;

        const [lx0, ly0] = vec2.sub(vec2.create(), line.EPoint, line.SPoint);

        const a = lx0 * ay0 - ly0 * ax0;
        const b = lx0 * by0 - ly0 * bx0;
        const c = lx0 * cy0 - ly0 * cx0;
        const d = lx0 * dy0 - ly0 * dx0 - (lx0 * y5 - ly0 * x5);

        const roots = getRoots([a, b, c, d]);

        for (const root of roots) {
            if (root >= 0 && root <= 1) {
                const x = ax0 * root ** 3 + bx0 * root ** 2 + cx0 * root + dx0;
                const y = ay0 * root ** 3 + by0 * root ** 2 + cy0 * root + dy0;
                intersections.push(vec2.fromValues(x, y));
            }
        }

        return intersections;
    }

    splitAt(t: number): BezierCurve[] {
        const startPoint = this.SPoint;
        const endPoint = this.EPoint;
        const controlPoint1 = this.CPoint1;
        const controlPoint2 = this.CPoint2;
        const middlePoint1 = vec2.lerp(vec2.create(), startPoint, controlPoint1, t);
        const middlePoint2 = vec2.lerp(vec2.create(), controlPoint1, controlPoint2, t);
        const middlePoint3 = vec2.lerp(vec2.create(), controlPoint2, endPoint, t);
        const middlePoint4 = vec2.lerp(vec2.create(), middlePoint1, middlePoint2, t);
        const middlePoint5 = vec2.lerp(vec2.create(), middlePoint2, middlePoint3, t);
        const middlePoint = this.getPosition(t);

        const leftCurve = new BezierCurve(startPoint, middlePoint1, middlePoint4, middlePoint);
        const rightCurve = new BezierCurve(vec2.clone(middlePoint), middlePoint5, middlePoint3, endPoint);
        return [leftCurve, rightCurve];
    }

    /**曲线砍n刀生成 n+1 段曲线 */
    splitAtArray(tArr: number[]): BezierCurve[] {
        return super.splitAtArray.call(this, tArr) as BezierCurve[];
    }

    splitByCoord(splitData: CoordData): BezierCurve[] {
        const tArr = this.getSplitT(splitData);
        return this.splitAtArray(tArr);
    }

    toPathString(digits = 0): string {
        return `C ${vec2ToStr(this.CPoint1, digits)} ${vec2ToStr(this.CPoint2, digits)} ${vec2ToStr(this.EPoint, digits)}`;
    }

    toDebugPathString(digits?: number | undefined): string {
        return ` L ${vec2ToStr(this.CPoint1, digits)} L ${vec2ToStr(this.CPoint2, digits)} L ${vec2ToStr(this.EPoint, digits)}`;
    }

    clone(): BezierCurve {
        return new BezierCurve(
            vec2.clone(this.SPoint),
            vec2.clone(this.CPoint1),
            vec2.clone(this.CPoint2),
            vec2.clone(this.EPoint)
        );
    }
}

/**
 * ### Gets a bezier curve from a curve.
 * 因为循环依赖问题，不能在 line Quadratic 中使用 Bezier 中导入 BezierCurve, 不能利用
 * curve.toBezier + 多态实现，故将此方法提取到此处
 * @param curve
 * @returns
 */
export function getBezierFromCurve(curve: Curve): BezierCurve {
    if (curve instanceof BezierCurve) {
        return curve;
    } else if (curve instanceof LineCurve) {
        return lineToBezier(curve);
    } else if (curve instanceof QuadraticCurve) {
        return quadraticToBezier(curve);
    } else {
        throw new Error("Unsupported curve type.");
    }
}

export function lineToBezier(lineCurve: LineCurve): BezierCurve {
    const { SPoint, EPoint } = lineCurve;
    const controlPoint1 = vec2.lerp(vec2.create(), SPoint, EPoint, 1 / 3);
    const controlPoint2 = vec2.lerp(vec2.create(), SPoint, EPoint, 2 / 3);
    return new BezierCurve(SPoint, controlPoint1, controlPoint2, EPoint);
}

export function quadraticToBezier(quadraticCurve: QuadraticCurve): BezierCurve {
    const { SPoint, CPoint1: Q1, EPoint } = quadraticCurve;
    const controlPoint1 = vec2.lerp(vec2.create(), SPoint, Q1, 2 / 3);
    const controlPoint2 = vec2.lerp(vec2.create(), EPoint, Q1, 2 / 3);
    return new BezierCurve(SPoint, controlPoint1, controlPoint2, EPoint);
}
