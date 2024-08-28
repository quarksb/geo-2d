import { vec2 } from "gl-matrix";
import { Curve, CoordData, LineCurve, LineCurveType } from "../curve";
import { PathCommand, SingleShape } from "./single-shape";
import { BBox2, createBBox2 } from "../base";


/**
 * ## Represents an abstract class for shape.
 * This class is used to extract common code and unify types.
 * You should not create an instance of this class directly.
 */
export abstract class Shape {
    curves: Curve[] = [];
    points: vec2[] = [];
    protected _len?: number;
    /**记录每段曲线终点到 shape 起点的长度 */
    protected _lenArr: number[] = [];
    protected _bounds?: BBox2;

    constructor (curves: Curve[]) {
        this.curves = curves;
        this.initPoints();
    }

    initPoints() {
        if (this.curves.length === 0) return;
        this.points = new Array<vec2>(this.curves.length + 1);
        this.points[0] = this.curves[0].SPoint;
        for (let i = 0; i < this.curves.length; i++) {
            this.points[i + 1] = this.curves[i].EPoint
        }
    }

    /** ### the bounds of the shape */
    get bounds() {
        if (!this._bounds) {
            this._bounds = this.getBBox2();
        }
        return this._bounds;
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
        return this.curves[this.curves.length - 1].ouDir;
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
     * @param bounds 
     * @returns 
     */
    getBBox2(bounds = createBBox2()): BBox2 {
        for (const { bbox } of this.curves) {
            const { x, y, width, height } = bbox;
            bounds.xMin = Math.min(bounds.xMin, x);
            bounds.xMax = Math.max(bounds.xMax, x + width);
            bounds.yMin = Math.min(bounds.yMin, y);
            bounds.yMax = Math.max(bounds.yMax, y + height);
        }
        return bounds;
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

    getPosDataByPer(percent: number, isReCircle = false) {
        const { len } = this

        if (isReCircle) {
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
            const curves = curve.divideAtArray(arr);
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
        // lenArr 需要重新计算
        this._getLen();
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
                pathStr += `M ${startPoint[0].toFixed(digits)} ${startPoint[1].toFixed(digits)} `;
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

/**
 * ### simply curves
 * 尝试合并相邻的线段，合并规则如下，优先级逐渐减低
 * - 方向相同的直线直接合并
 * 
 * - 长度差异过大，长线合并短线
 * @param curves 
 * @returns 
 */
export function simplyCurves(curves: Curve[]): Curve[] {
    const isClosed = vec2.distance(curves[0].SPoint, curves[curves.length - 1].EPoint) < 1;

    let offsetIndex = 0;
    if (isClosed) {
        // 寻找长度最长的线段
        let maxLength = 0;
        for (let i = 0; i < curves.length; i++) {
            const curve = curves[i];
            const len = curve.len;
            if (len > maxLength) {
                maxLength = len;
                offsetIndex = i;
            }
        }
    }

    let result: Curve[] = [curves[offsetIndex]];

    for (let i = 1; i < curves.length; i++) {
        const j = (i + offsetIndex) % curves.length;
        const currentCurve = curves[j];
        const lastCurve = result[result.length - 1];
        // 两者都是直线
        const isBothLine = currentCurve.type === LineCurveType && lastCurve.type === LineCurveType;
        if (isBothLine) {
            const isSameDirection = vec2.dot(currentCurve.inDir, lastCurve.ouDir) > 0.99;
            if (isSameDirection) {
                lastCurve.EPoint = currentCurve.EPoint;
            } else {
                result.push(currentCurve);
            }
        } else {
            result.push(currentCurve);
        }
    }

    curves = result;
    result = [curves[0]];
    const check = (lastCurve: Curve, currentCurve: Curve, nextCurve: Curve) => {
        const { len: l0 } = lastCurve;
        const { len: l1 } = currentCurve;
        const { len: l2 } = nextCurve;

        const threshold = 20;
        const isLengthDiff = l0 > threshold * l1 && l2 > threshold * l1;

        if (isLengthDiff) {
            // 长度差异过大，长线合并短线
            const angle0 = vec2.angle(lastCurve.ouDir, currentCurve.inDir);
            const angle1 = vec2.angle(currentCurve.ouDir, nextCurve.inDir);

            if (angle0 < angle1) {
                // 合并当前线段 和 lastCurve
                lastCurve.EPoint = currentCurve.EPoint;
            } else {
                // 合并 currentCurve 和 nextCurve
                nextCurve.SPoint = currentCurve.SPoint;
                // console.log('合并 currentCurve 和 nextCurve');
                return true
            }
        } else {
            result.push(currentCurve);
        }
    }
    for (let i = 1; i < curves.length - 1; i++) {
        const lastCurve = result[result.length - 1];
        const currentCurve = curves[i];
        const nextCurve = curves[i + 1];
        const sign = check(lastCurve, currentCurve, nextCurve);
        if (sign) {
            result.push(nextCurve);
            i++;
        }
    }

    // 最后一个 curve
    if (isClosed) {
        check(result[result.length - 1], curves[curves.length - 1], curves[0]);
    } else {
        result.push(curves[curves.length - 1]);
    }
    return result;
}

if (import.meta.vitest) {
    const { it, expect, test } = import.meta.vitest
    test('Shape', () => {

        const commands: PathCommand[] = [
            {
                "type": "M",
                "x": 0,
                "y": 0
            },
            {
                "type": "L",
                "x": 0,
                "y": 100
            },
            {
                "type": "L",
                "x": 100,
                "y": 100
            },

            {
                "type": "Z" as const
            }
        ];
        const shape = SingleShape.fromCommands(commands);
        const line = new LineCurve(vec2.fromValues(0, 50), vec2.fromValues(1, 50));
        const result = shape.getLineIntersects(line);

        expect(result).toEqual([vec2.fromValues(0, 50), vec2.fromValues(50, 50)]);
    })

    test('Shape', () => {
        const commands: PathCommand[] = [
            {
                "type": "M",
                "x": 0,
                "y": 0
            },
            {
                "type": "Q",
                "x": 100,
                "y": 100,
                "x1": 0,
                "y1": 100
            },
            {
                "type": "Q",
                "x": 0,
                "y": 0,
                "x1": 100,
                "y1": 0
            },

        ];
        const shape = SingleShape.fromCommands(commands);
        const line = new LineCurve(vec2.fromValues(0, 50), vec2.fromValues(1, 50));
        const result = shape.getLineIntersects(line);

        expect(result[0][0]).toBeCloseTo(25.94);
        expect(result[0][1]).toBeCloseTo(50);
        expect(result[1][0]).toBeCloseTo(74.06);
        expect(result[1][1]).toBeCloseTo(50);
    })
    test('Shape', () => {
        const commands: PathCommand[] = [
            {
                "type": "M",
                "x": 1146,
                "y": 0
            },
            {
                "type": "L",
                "x": 689,
                "y": 0
            },
            {
                "type": "L",
                "x": 689,
                "y": 290
            },
            {
                "type": "L",
                "x": 771,
                "y": 290
            },
            {
                "type": "L",
                "x": 746,
                "y": 417
            },
            {
                "type": "L",
                "x": 468,
                "y": 417
            },
            {
                "type": "L",
                "x": 443,
                "y": 290
            },
            {
                "type": "L",
                "x": 527,
                "y": 290
            },
            {
                "type": "L",
                "x": 527,
                "y": 0
            },
            {
                "type": "L",
                "x": 70,
                "y": 0
            },
            {
                "type": "L",
                "x": 70,
                "y": 290
            },
            {
                "type": "L",
                "x": 147,
                "y": 290
            },
            {
                "type": "L",
                "x": 403,
                "y": 1571
            },
            {
                "type": "L",
                "x": 811,
                "y": 1571
            },
            {
                "type": "L",
                "x": 1067,
                "y": 290
            },
            {
                "type": "L",
                "x": 1146,
                "y": 290
            },
            {
                "type": "L",
                "x": 1146,
                "y": 0
            },
            {
                "type": "Z"
            },
            {
                "type": "M",
                "x": 607,
                "y": 1110
            },
            {
                "type": "L",
                "x": 527,
                "y": 707
            },
            {
                "type": "L",
                "x": 688,
                "y": 707
            },
            {
                "type": "L",
                "x": 607,
                "y": 1110
            },
            {
                "type": "Z" as const
            }
        ];
        const shape = SingleShape.fromCommands(commands);
        const line = new LineCurve(vec2.fromValues(0, 1), vec2.fromValues(3, 1));
        const result = shape.getLineIntersects(line);

        expect(result).toEqual([vec2.fromValues(1, 1), vec2.fromValues(2, 1)]);
    })

}