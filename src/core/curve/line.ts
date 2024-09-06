import { vec2 } from "gl-matrix";
import { Curve, PointFn, CoordData } from "./curve";
import { BBox2 } from "../base";

export const LineCurveType = "curve-line";

/**
 * ## Line Curve
 * Represents a line segment in a 2D space.
 */
export class LineCurve extends Curve {
    tangent: vec2;
    normal: vec2;
    /**
     * Creates a new instance of LineCurve.
     * @param startPoint The starting point of the line curve.
     * @param endPoint The ending point of the line curve.
     */
    constructor (startPoint: vec2, endPoint: vec2) {
        super(startPoint, endPoint);
        this.type = LineCurveType;
        this.tangent = vec2.normalize(vec2.create(), vec2.sub(vec2.create(), endPoint, startPoint));
        this.normal = vec2.fromValues(-this.tangent[1], this.tangent[0]);
        this.inDir = this.tangent;
        this.ouDir = this.tangent;
    }

    protected update() {
        super.update();
        this.tangent = vec2.normalize(vec2.create(), vec2.sub(vec2.create(), this.EPoint, this.SPoint));
        this.normal = vec2.fromValues(-this.tangent[1], this.tangent[0]);
        this.inDir = this.tangent;
        this.ouDir = this.tangent;
    }

    protected _getBBox2(): BBox2 {
        const { SPoint: SPt, EPoint: EPt } = this;
        const [xMin, xMax] = SPt[0] < EPt[0] ? [SPt[0], EPt[0]] : [EPt[0], SPt[0]];
        const [yMin, yMax] = SPt[1] < EPt[1] ? [SPt[1], EPt[1]] : [EPt[1], SPt[1]];
        return { xMin, yMin, xMax, yMax };
    }

    protected _getLen(): number {
        return vec2.distance(this.SPoint, this.EPoint);
    }

    /**
    * Gets the normal vector of the line curve.
    * @returns The normal vector.
    */
    getNormal(_?: number): vec2 {
        return this.normal;
    }

    /**
     * Gets the tangent vector of the line curve.
     * @returns The tangent vector.
     */
    getTangent(_?: number): vec2 {
        return this.tangent;
    }

    /**
     * ### get the max curvature of this curve
     * @returns 
     */
    getMaxCurvature() {
        return 0;
    }

    /**
     * Gets the position on the line curve at a given parameter value.
     * @param t The parameter value.
     * @returns The position vector.
     */
    getPosition(t: number): vec2 {
        return vec2.lerp(vec2.create(), this.SPoint, this.EPoint, t);
    }

    /**
     * Gets the position and tangent vector on the line curve at a given parameter value.
     * @param per The parameter value.
     * @returns An object containing the position and tangent vectors.
     */
    getPosDataByPer(per: number): { pos: vec2, tan: vec2 } {
        const pos = this.getPosition(per);
        const tan = this.tangent;
        return { pos, tan };
    }

    /**
     * Gets the parameter values at which the line curve is split by a given coordinate data.
     * @param splitData The coordinate data.
     * @returns An array of parameter values.
     */
    getSplitT(data: CoordData): number[] {
        const { x, y, width, height } = this.bbox;
        const { SPoint: p1, EPoint: p2 } = this;
        const { mode, val } = data;
        const answer: number[] = [];
        if (mode === 'x' && val >= x && val <= x + width) {
            answer.push((val - p1[0]) / (p2[0] - p1[0]));
        } else if (mode === 'y' && val >= y && val <= y + height) {
            answer.push((val - p1[1]) / (p2[1] - p1[1]));
        }
        return answer;
    }

    /**
    * Calculates the intersection points between two line curves.
    * @param line The line curve to intersect with.
    * @returns An array of intersection points.
    */
    getLineIntersects(line: LineCurve): vec2[] {
        const [x1, y1] = this.SPoint
        const [x2, y2] = this.EPoint;
        const [x3, y3] = line.SPoint;
        const [x4, y4] = line.EPoint;

        const intersect: vec2[] = [];
        const d = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
        if (Math.abs(d) > 1E-10) {
            const a = x1 * y2 - y1 * x2;
            const b = x3 * y4 - y3 * x4;

            const x = (a * (x3 - x4) - b * (x1 - x2)) / d;
            const y = (a * (y3 - y4) - b * (y1 - y2)) / d;

            const { x: xMin, y: yMin, width, height } = this.bbox;
            if (x >= xMin && x <= x + width && y >= yMin && y <= yMin + height) {
                intersect.push(vec2.fromValues(x, y));
            }
        }

        return intersect;
    }

    /**
     * Gets the distance from a given point to the line curve.
     * @param pos 
     * @returns 
     */
    getDisToPos(pos: vec2): number {
        const { SPoint: SPt, EPoint: EPt, tangent: tan } = this;
        const vec = vec2.sub(vec2.create(), pos, SPt);
        const dot = vec2.dot(vec, tan);
        if (dot < 0) {
            return vec2.distance(SPt, pos);
        }
        const len = vec2.distance(SPt, EPt);
        if (dot > len) {
            return vec2.distance(EPt, pos);
        }
        const normal = vec2.fromValues(-tan[1], tan[0]);
        return Math.abs(vec2.dot(normal, vec));
    }

    /**
     * Applies a function to the start and end points of the line curve.
     * @param fn The function to apply.
     */
    applyFn(fn: PointFn): void {
        fn(this.SPoint);
        fn(this.EPoint);
    }

    /**
     * Applies a function to the start and end points of the line curve.
     * @param fn The function to apply.
     */
    applyFFDFn(fn: PointFn): void {
        this.applyFn(fn);
    }

    reverse(): void {
        [this.SPoint, this.EPoint] = [this.EPoint, this.SPoint];
        this.update();
    }

    /**
     * Divides the line curve at a given parameter value.
     * @param t The parameter value to divide the line curve at.
     * @returns An array of divided line curves.
     */
    divideAt(t: number): LineCurve[] {
        const { SPoint: SPt, EPoint: EPt } = this;
        const point = this.getPosition(t);
        return [new LineCurve(SPt, point), new LineCurve(vec2.clone(point), EPt)];
    }

    /**
     * Checks if a given point lies on the line curve.
     * @param point The point to check.
     * @returns `true` if the point lies on the line curve, `false` otherwise.
     */
    isPointOnCurve(point: vec2): boolean {
        const { SPoint: SPt, EPoint: EPt } = this;
        const d1 = vec2.distance(SPt, point);
        const d2 = vec2.distance(EPt, point);
        const d = vec2.distance(SPt, EPt);
        return Math.abs(d1 + d2 - d) < 1E-10;
    }



    /**
     * Converts the line curve to a path string.
     * @param digits The number of digits to round the coordinates to.
     * @returns The path string representation of the line curve.
     */
    toPathString(digits = 0): string {
        const [x2, y2] = this.EPoint;
        return `L ${x2.toFixed(digits)} ${y2.toFixed(digits)}`;
    }

    /**
     * Converts the line curve to a debug path string.
     * @param digits The number of digits to round the coordinates to.
     * @returns The debug path string representation of the line curve.
     */
    toDebugPathString(digits?: number | undefined): string {
        return this.toPathString(digits);
    }

    clone(): LineCurve {
        return new LineCurve(vec2.clone(this.SPoint), vec2.clone(this.EPoint));
    }
}

export function isLineDirClose(line1: LineCurve, line2: LineCurve): boolean {
    // 0.982 为标准正态分布 -3, 3 之间的概率, 随便写的，0.95 亦可
    return vec2.dot(line1.tangent, line2.tangent) > 0.982;
}

export function lineInterSect(p1: vec2, p2: vec2, p3: vec2, p4: vec2): vec2 {
    const [x1, y1] = p1;
    const [x2, y2] = p2;
    const [x3, y3] = p3;
    const [x4, y4] = p4;
    const a1 = y2 - y1;
    const b1 = x1 - x2;
    const c1 = x2 * y1 - x1 * y2;
    const a2 = y4 - y3;
    const b2 = x3 - x4;
    const c2 = x4 * y3 - x3 * y4;
    // todo d = 0
    const d = a1 * b2 - a2 * b1;
    const x = (b1 * c2 - b2 * c1) / d;
    const y = (a2 * c1 - a1 * c2) / d;
    return vec2.fromValues(x, y);
}

/**
 * ### Check if two line curves intersect
 * 倘若相交，则通过线段 line1 的两点必定在线段 line2 的两侧, 反之亦然
 * @param line1 
 * @param line2 
 * @returns 
 */
export function checkLineCurveIntersect(line1: LineCurve, line2: LineCurve): boolean {
    const [x1, y1] = line1.SPoint
    const [x2, y2] = line1.EPoint;
    const [x3, y3] = line2.SPoint;
    const [x4, y4] = line2.EPoint;

    // bbox 检测
    const { x: x1Min, y: y1Min, width: w1, height: h1 } = line1.bbox;
    const { x: x2Min, y: y2Min, width: w2, height: h2 } = line2.bbox;
    if (x1Min + w1 < x2Min || x2Min + w2 < x1Min || y1Min + h1 < y2Min || y2Min + h2 < y1Min) {
        return false;
    }

    // line1 的两点必定在线段 line2 的两侧
    const cross0 = (x1 - x3) * (y4 - y3) - (y1 - y3) * (x4 - x3);
    const cross1 = (x2 - x3) * (y4 - y3) - (y2 - y3) * (x4 - x3);
    if (cross0 * cross1 > 0) {
        return false;
    }

    // line2 的两点必定在线段 line1 的两侧
    const cross2 = (x3 - x1) * (y2 - y1) - (y3 - y1) * (x2 - x1);
    const cross3 = (x4 - x1) * (y2 - y1) - (y4 - y1) * (x2 - x1);
    if (cross2 * cross3 > 0) {
        return false;
    }

    return true;
}


// 源码内的测试套件
if (import.meta.vitest) {
    const { it, test, expect, describe } = import.meta.vitest;


    // 自定义匹配器
    expect.extend({
        toEqual(received: vec2, expected: vec2, tolerance = 1e-6) {
            const pass = vec2.distance(received, expected) < tolerance;
            if (pass) {
                return {
                    message: () => `expected ${received} to be close enough to ${expected}`,
                    pass: true,
                };
            } else {
                return {
                    message: () => `expected ${received} to be close enough to ${expected}, but they are not`,
                    pass: false,
                };
            }
        },
    });

    describe('test for line curve', () => {
        /**point arr */
        const p = [
            vec2.fromValues(0, 0),
            vec2.fromValues(1, 1),
            vec2.fromValues(1, 0),
            vec2.fromValues(0, 1),
            vec2.fromValues(0.5, 0.5),
        ];
        const line = new LineCurve(p[0], p[1]);
        it('get function test', () => {
            expect(line.bbox).toEqual({ x: 0, y: 0, width: 1, height: 1 });
            expect(line.len).toBeCloseTo(Math.SQRT2);
            const normal = line.getNormal();
            expect(normal).toEqual(vec2.fromValues(-Math.SQRT1_2, Math.SQRT1_2));
            const tangent = line.getTangent();
            expect(tangent).toEqual(vec2.fromValues(Math.SQRT1_2, Math.SQRT1_2));
            const pos = line.getPosition(0.5);
            expect(pos).toEqual(vec2.fromValues(0.5, 0.5));
            const posData = line.getPosDataByPer(0.5);
            expect(posData.pos).toEqual(vec2.fromValues(0.5, 0.5));
            expect(posData.tan).toEqual(vec2.fromValues(Math.SQRT1_2, Math.SQRT1_2));
            expect(line.getSplitT({ mode: 'x', val: 0.5 })).toEqual([0.5]);
            expect(line.getSplitT({ mode: 'y', val: 0.5 })).toEqual([0.5]);
        });

        it('to function test', () => {
            expect(line.toPathString()).toBe("L 1 1");
            expect(line.toDebugPathString()).toBe("L 1 1");
        });

        it('other function test', () => {
            const otherLine = new LineCurve([0, 1], [1, 0]);
            expect(line.getLineIntersects(new LineCurve([0, 1], [1, 0]))).toEqual([vec2.fromValues(0.5, 0.5)]);

            expect(line.isPointOnCurve([0.5, 0.5])).toBe(true);
            expect(line.clone()).toEqual(line);
        });

    })
}