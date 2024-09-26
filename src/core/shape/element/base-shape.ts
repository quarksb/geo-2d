import { vec2 } from "gl-matrix";
import { Curve, CoordData, LineCurve, PointFn } from "../../curve";
import { BBox2, createBBox2, mergeBBox2 } from "../../base";
import { calPointsArea } from "../../math";
import { vec2ToStr } from "../../utils";


/**
 * ## Represents an abstract class for shape.
 * This class is used to extract common code and unify types.
 * You should not create an instance of this class directly.
 */
export abstract class Shape {
    curves: Curve[] = [];
    /**@deprecated 准备移除 */
    points: vec2[] = [];
    /** is the shape complies with the right-hand rule */
    protected _isClockwise?: boolean;
    protected _len?: number;
    /**记录每段曲线终点到 shape 起点的长度 */
    protected _lenArr: number[] = [];
    protected _bbox2?: BBox2;

    constructor (curves: Curve[]) {
        this.curves = curves;
        this.initPoints();
    }

    initPoints() {
        const { curves } = this;
        const { length: n } = curves;
        if (n === 0) return;
        // console.log("curves", curves);

        this.points = new Array<vec2>(n + 1);
        this.points[0] = curves[0].SPoint;
        for (let i = 0; i < n; i++) {
            this.points[i + 1] = curves[i].EPoint
        }
    }

    /** ### is the shape complies with the right-hand rule  */
    get isClockwise() {
        if (this._isClockwise === undefined) {
            this._isClockwise = this.getIsClockwise();
        }
        return this._isClockwise;
    }

    get isClosed() {
        return this.curves.length > 0 && vec2.dist(this.SPoint, this.EPoint) < 1E-2;
    }

    /** ### the bbox2 of the shape */
    get bbox2() {
        if (!this._bbox2) {
            this._bbox2 = this.getBBox2();
        }
        return this._bbox2;
    }
    /** ### the length of the shape */
    get len() {
        if (!this._len) {
            this._len = this._getLen();
        }
        return this._len;
    }

    /**
     * ### the start point of the shape
     */
    get SPoint() {
        return this.curves[0].SPoint;
    }

    /**
     * ### the end point of the shape
     */
    get EPoint() {
        return this.curves[this.curves.length - 1].EPoint;
    }

    /**
     * ### the in direction of this curve
     */
    get inDir() {
        return this.curves[0].inDir;
    }

    /**
     * ### the out direction of this curve
     */
    get outDir() {
        return this.curves[this.curves.length - 1].outDir;
    }

    getMaxCurvature() {
        let maxCurvature = 0;
        for (const curve of this.curves) {
            const curCurvature = curve.getMaxCurvature();
            maxCurvature = Math.sign(curCurvature) * Math.max(maxCurvature, Math.abs(curCurvature));
        }
        return maxCurvature;
    }

    /**
     * ### get the direction of a shape
     * @returns 
     */
    private getIsClockwise() {
        const { points } = this;
        return calPointsArea(points) > 0;
    }

    /**
     * ### get the length of the shape
     * @returns 
     */
    private _getLen() {
        this._lenArr = this.curves.map((curve) => curve.len);
        const { length } = this.curves;

        for (let i = 1; i < length; i++) {
            this._lenArr[i] += this._lenArr[i - 1];
        }
        return this._lenArr[length - 1];
    }

    /**
     * ### get the BBox2 of the shape
     * @param bbox2 
     * @returns 
     */
    getBBox2(outBBox2 = createBBox2()): BBox2 {
        for (const { bbox2 } of this.curves) {
            mergeBBox2(outBBox2, bbox2);
        }
        return outBBox2;
    }

    getLineIntersects(line: LineCurve): vec2[] {
        const { curves } = this;
        const { length: l } = curves;
        const result: vec2[][] = new Array(l);
        for (let i = 0; i < l; i++) {
            const curve = curves[i];
            const points = curve.getLineIntersects(line);
            result[i] = points;
        }
        return result.flat();
    }

    getPosDataByPer(percent: number) {
        const { len } = this

        if (this.isClosed) {
            percent = (percent + 1) % 1;
        }

        const currentLen = percent * len;
        if (percent <= 0) {
            const curve = this.curves[0];
            const per = percent * currentLen / this.curves[0].len;
            return curve.getPosDataByPer(per);
        }
        if (percent >= 1) {
            const curve = this.curves[this.curves.length - 1];
            const per = (percent - 1) * currentLen / curve.len + 1;
            return curve.getPosDataByPer(per);
        }

        // todo: percent 递增时，可以优化
        // 二分查找
        let left = 0;
        let right = this._lenArr.length - 1;
        let mid;
        while (left < right) {
            mid = Math.floor((left + right) / 2);
            if (this._lenArr[mid] < currentLen) {
                left = mid + 1;
            } else {
                right = mid;
            }
        }

        const curve = this.curves[left];
        const previousLen = left === 0 ? 0 : this._lenArr[left - 1];
        const per = (currentLen - previousLen) / curve.len;
        return curve.getPosDataByPer(per);
    }

    clearCache() {
        this._len = undefined;
        this._lenArr = [];
        this._bbox2 = undefined;
        this._isClockwise = undefined;
    }

    applyFn(fn: PointFn) {
        for (const curve of this.curves) {
            curve.applyFn(fn);
        }
        // 清理缓存
        this.clearCache();
    }

    splitByCoord(coordData: CoordData) {
        // todo 对比下 ... 和 flat 的性能
        const newCurves: Curve[] = [];
        for (const curve of this.curves) {
            const curves = curve.splitByCoord(coordData);
            newCurves.push(...curves);
        }
        this.curves = newCurves;
        return this.curves;
    }

    divideAtByNum(count: number = 100) {
        const arr = new Array(count - 1);
        for (let i = 1; i < count; i++) {
            arr[i - 1] = i / count;
        }
        const { length } = this.curves;
        const newCurves = new Array(length * count);
        for (let i = 0; i < length; i++) {
            const curve = this.curves[i];
            const curves = curve.splitAtArray(arr);
            newCurves.splice(i * count, count, ...curves);
        }
        this.curves = newCurves;
    }

    reverse() {
        this.curves.reverse();
        for (const curve of this.curves) {
            curve.reverse();
        }
        this.points.reverse();
        // this.isClockwise 可能为 undefined, 所以不能直接取反
        if (this._isClockwise !== undefined) {
            this._isClockwise = !this._isClockwise;
        }
        // _lenArr 需要更新
        this._len = this._getLen();
    }



    toPathString(digits = 0): string {
        let originPoint = this.curves[0].SPoint;
        let pathStr = `M ${originPoint[0].toFixed(digits)} ${originPoint[1].toFixed(digits)} `;
        let curPos = originPoint;
        for (const curve of this.curves) {
            // 如果曲线不连续，则添加 M 命令
            const isContinuous = vec2.distance(curPos, curve.SPoint) < 1;
            if (!isContinuous) {
                const { SPoint: startPoint } = curve;
                pathStr += `M ${vec2ToStr(startPoint)} `;
                originPoint = startPoint;
            }
            pathStr += curve.toPathString(digits) + " ";
            curPos = curve.EPoint;
        }
        const isClosed = vec2.distance(curPos, originPoint) < 1;
        if (isClosed) {
            pathStr += "Z";
        }
        return pathStr;
    }

    /**
     * ### convert the shape to points
     * @param count - the number of points
     * @returns points array which length is count + 1
     */
    toPoints(count = 100) {
        let points: vec2[] = new Array(count + 1);
        for (let i = 0; i <= count; i++) {
            const per = i / count;
            const { pos } = this.getPosDataByPer(per);
            points[i] = pos;
        }
        return points;
    }
}


if (import.meta.vitest) {
    const point = vec2.fromValues(655, -208);

}