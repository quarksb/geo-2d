import { vec2 } from "gl-matrix";
import { LineCurve, lineInterSect } from "../../curve";
import { SingleShape } from "./single-shape";
import { linearRegression } from "../../math";
import { connectShape } from "../method/connect";

export class Polyline extends SingleShape {
    public curves: LineCurve[];
    /**
     * the tangent array
     * @remarks the polyline with tangent array is actually a curve, because it easy to calculate
     * the quadratic curve by the polyline with tangent array which control point is the intersection of two tangent
     */
    public tanArr: vec2[] = [];
    constructor(curves: LineCurve[], tanArr?: vec2[]) {
        super(curves);
        this.curves = curves;
        if (tanArr) {
            this.tanArr = tanArr;
        } else {
            const { length: n } = curves;
            const arr = new Array(n + 1);
            for (let i = 0; i < n; i++) {
                arr[i] = curves[i].inDir;
            }
            arr[n] = curves[n - 1].outDir;
            this.tanArr = arr;
        }
    }

    static fromPoints(points: vec2[], tanArr?: vec2[]) {
        let curves = [];
        for (let i = 0; i < points.length - 1; i++) {
            curves.push(new LineCurve(points[i], points[i + 1]));
        }
        return new Polyline(curves, tanArr);
    }

    getDistance(point: vec2) {
        let minDistance = Infinity;
        for (let pos of this.points) {
            minDistance = Math.min(minDistance, vec2.dist(pos, point));
        }
        return minDistance;
    }

    getClosestPoint(point: vec2) {
        let minDistance = Infinity;
        let closestPoint = vec2.create();
        for (let curve of this.points) {
            let distance = vec2.dist(curve, point);
            if (distance < minDistance) {
                minDistance = distance;
                closestPoint = curve;
            }
        }
        return closestPoint;
    }

    /**### get max angle deflection */
    getMaxDeflection() {
        let maxDeflection = 0;
        for (let i = 0; i < this.curves.length; i++) {
            const tan = this.tanArr[i];
            const deflection = vec2.dist(vec2.create(), tan);
            maxDeflection = Math.max(maxDeflection, deflection);
        }
        return maxDeflection;
    }

    getPosDataByPer(percent: number) {
        const { isClosed, len, curves } = this;

        if (isClosed) {
            percent = (percent + 1) % 1;
        }

        const currentLen = percent * len;
        if (percent <= 0) {
            const curve = curves[0];
            const per = (percent * currentLen) / curves[0].len;
            return curve.getPosDataByPer(per);
        }
        if (percent >= 1) {
            const curve = curves[curves.length - 1];
            const per = ((percent - 1) * currentLen) / curve.len + 1;
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

        const curve = curves[left];
        const previousLen = left === 0 ? 0 : this._lenArr[left - 1];
        const per = (currentLen - previousLen) / curve.len;
        return curve.getPosDataByPer(per);
    }
}

/**
 * 多段线自交检测
 */
export function isSelfIntersect(polyline: Polyline) {
    const { points } = polyline;
    const n = points.length;
    for (let i = 0; i < n; i++) {
        const p0 = points[i];
        const p1 = points[(i + 1) % n];
        for (let j = i + 2; j < n; j++) {
            const p2 = points[j];
            const p3 = points[(j + 1) % n];
            if (lineInterSect(p0, p1, p2, p3)) {
                return true;
            }
        }
    }
    return false;
}

// 计算 singleRail 的延伸线
//
export function calExtendCurve(polyline: Polyline) {
    const { points: p, bbox2 } = polyline;
    // todo: 应该取曲率最大的点后的部分的 5 个点，现在为了简单取的是 5 个点
    // 取倒数五个点, 如果长度不够则取两个点
    const count = Math.min(p.length, 5);
    const points = p.slice(-count);
    // 共线性检测
    const x = points.map(([x]) => x);
    const y = points.map(([, y]) => y);
    const { k, b, R2 } = linearRegression(x, y);
    // console.log(k, b, R2);

    // 此时延长线为直线
    return { k, b, R2 };
}

if (import.meta.vitest) {
    const { it, expect } = import.meta.vitest;

    it("test connectPolyline", () => {
        const polyline0 = Polyline.fromPoints([
            [0, 0],
            [2, 2],
        ]);
        const polyline1 = Polyline.fromPoints([
            [2, 2],
            [3, 3],
            [4, 4],
        ]);
        const polyline2 = Polyline.fromPoints([
            [3, 3],
            [4, 4],
        ]);
        let polyline = connectShape(polyline0, polyline1);
        expect(polyline.points).toEqual([
            [0, 0],
            [2, 2],
            [3, 3],
            [4, 4],
        ]);
        polyline = connectShape(polyline0, polyline2);
        expect(polyline.points).toEqual([
            [0, 0],
            [2, 2],
            [3, 3],
            [4, 4],
        ]);
    });
}
