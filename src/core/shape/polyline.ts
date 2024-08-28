import { vec2 } from "gl-matrix";
import { LineCurve } from "../curve";
import { SingleShape } from "./single-shape";
import { calRadius, linearRegression } from "../math";

export class Polyline extends SingleShape {
    public curves: LineCurve[];
    constructor (curves: LineCurve[]) {
        super(curves);
        this.curves = curves;
    }

    static fromPoints(points: vec2[]) {
        let curves = [];
        for (let i = 0; i < points.length - 1; i++) {
            curves.push(new LineCurve(points[i], points[i + 1]));
        }
        return new Polyline(curves);
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

    /**
     * 通过曲率来切割
     */
    split(radiusLimit = 100): Polyline[] {
        const { points } = this;

        const indexArr = getPointsSplitIndexByRadius(points, radiusLimit);
        const arr = splitPointsByIndex(points, indexArr);
        let newArr: vec2[][] = [];
        arr.forEach(points => {
            const indexArr = getPointsSplitIndexByWave(points);
            // console.log("indexArr:", indexArr);

            const subArr = splitPointsByIndex(points, indexArr);
            // console.log("subArr:", subArr);

            newArr.push(...subArr);
        });

        // indexArr.sort((a, b) => a - b);
        // console.log("indexArr:", newArr);

        // 如果 r 小于 minRadius，且 r 是局部最小值，则在此处拆解 polyline

        return newArr.filter(a => a.length >= 2).map(points => Polyline.fromPoints(points));
    }
}

/**
 * ### get the index array to split points by wave
 * @param points 
 * @param sArr the wave length array
 */
function getPointsSplitIndexByWave(points: vec2[], sArr = [2, 4, 8, 16, 32]): number[] {
    const { length: n } = points;
    // 本质山是波长不同的滤波器  
    let maxAngle = 0;
    let maxIndex = 0;
    let indexSet = new Set<number>();
    for (let i = 0; i < sArr.length; i++) {
        const s = sArr[i];
        if (n < 2 * s) {
            break;
        }

        for (let j = s; j < n - s; j++) {
            const lastPoint = points[j - s];
            const currentPoint = points[j];
            const nextPoint = points[j + s];
            // 三点计算角度
            const v1 = vec2.sub(vec2.create(), currentPoint, lastPoint);
            const v2 = vec2.sub(vec2.create(), nextPoint, currentPoint);
            const angle = Math.max(vec2.angle(v1, v2) * 180 / Math.PI, 0);
            if (maxAngle < angle) {
                maxAngle = angle;
                maxIndex = j;
            }
            if (angle > 120) {
                indexSet.add(j);
            }
        }

    }

    const indexArr = Array.from(indexSet).sort((a, b) => a - b);
    // console.log("needSplit:", indexArr.length > 0, "maxAngle:", maxAngle, "maxIndex:", maxIndex);
    // console.log("indexSet:", indexArr);
    // 取最大角度对应的点
    const l = indexArr.length;
    return l <= 1 ? indexArr : [maxIndex];
}

/**
 * ### get the index array to split points by radius
 * @param points 
 * @param radiusLimit 
 * @returns the index array to split points
 */
function getPointsSplitIndexByRadius(points: vec2[], radiusLimit = 100): number[] {
    const { length: l } = points;
    const radiusArr = new Array(l - 2);
    for (let i = 1; i < l - 1; i++) {
        const lastPoint = points[i - 1];
        const currentPoint = points[i];
        const nextPoint = points[i + 1];
        // 三点计算半径
        radiusArr[i - 1] = calRadius(lastPoint, currentPoint, nextPoint);
    }

    // console.log("radiusArr:", radiusArr);

    // 如果 r 小于 minRadius，且 r 是局部最小值，则在此处拆解 polyline
    const indexArr = [];
    for (let i = 1; i < radiusArr.length - 1; i++) {
        const lastRadius = radiusArr[i - 1];
        const r = radiusArr[i];
        const nextRadius = radiusArr[i + 1];
        const isMin = r < lastRadius && r < nextRadius;
        if (isMin && r < radiusLimit) {
            // radiusArr 比 points 少 2 个，前后各少一个，所以 index 需要加 1
            indexArr.push(i + 1);
        }
    }
    return indexArr;
}


function splitPointsByIndex(points: vec2[], indexArr: number[]): vec2[][] {
    const { length: n } = indexArr;
    const arr = new Array<vec2[]>(n + 1);
    let startIndex = 0;
    for (let i = 0; i < n; i++) {
        // console.log("i:", i);
        const index = indexArr[i];
        const curPoints = points.slice(startIndex, index + 1);

        arr[i] = curPoints;
        startIndex = index;
    }
    // console.log("startIndex:", startIndex);

    if (startIndex < points.length) {
        arr[n] = points.slice(startIndex);
    }
    // console.log("arr:", arr);

    return arr;
}


export interface DisData {
    datas: {
        dis: number;
        index: number;
    }[],
    min: number;
    max: number;
    mean: number;
    std: number;
}

/**
 * ### calculate distance data between two polyline
 * @param polyline0 
 * @param polyline1 
 * @returns 
 */
export function calDisData(polyline0: Polyline, polyline1: Polyline): DisData[] {
    const { points: ps0 } = polyline0;
    const { points: ps1 } = polyline1;
    const { length: l0 } = ps0;
    const { length: l1 } = ps1;
    const datas0 = new Array(l0).fill({ dis: Infinity, index: -1 });
    const datas1 = new Array(l1).fill({ dis: Infinity, index: -1 });

    for (let i0 = 0; i0 < l0; i0++) {
        for (let i1 = 0; i1 < l1; i1++) {
            const dis = vec2.dist(ps0[i0], ps1[i1]);

            if (dis < datas0[i0].dis) {
                datas0[i0] = { dis, index: i1 };
            }

            if (dis < datas1[i1].dis) {
                datas1[i1] = { dis, index: i0 };
            }
        }
    }

    const disDatas = [datas0, datas1].map(datas => {
        const disArr = datas.map(({ dis }) => dis);
        const min = Math.min(...disArr);
        const max = Math.max(...disArr);
        const mean = disArr.reduce((a, b) => a + b, 0) / disArr.length;
        const std = Math.sqrt(disArr.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / disArr.length);
        return { datas, min, max, mean, std };
    });

    return disDatas;
}

// 计算 singleRail 的延伸线
// 
export function calExtendCurve(polyline: Polyline) {
    const { points: p, bounds } = polyline;
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


export function getConnectMark(polyline0: Polyline, polyline1: Polyline, disLimit = 300, angleLimit = 30) {
    const { EPoint: EPoint0, outDir: outDir0 } = polyline0;
    const { SPoint: SPoint1, inDir: inDir1 } = polyline1;

    const off = vec2.sub(vec2.create(), SPoint1, EPoint0);
    const dis = vec2.len(off);
    const angle0 = vec2.angle(off, outDir0) * 180 / Math.PI;
    const angle1 = vec2.angle(off, inDir1) * 180 / Math.PI;

    const getMark = (val: number, limit: number) => Math.max(1 - val / limit, 0);
    return getMark(dis, disLimit) * getMark(angle0, angleLimit) * getMark(angle1, angleLimit);
}

export function connectPolyline(polyline0: Polyline, polyline1: Polyline) {
    const isContinuous = vec2.dist(polyline0.EPoint, polyline1.SPoint) < 1e-3;
    // 如果连续，则省去 polyline1 的第一个点
    const points = [...polyline0.points, ...polyline1.points.slice(isContinuous ? 1 : 0)];
    return Polyline.fromPoints(points);
}

if (import.meta.vitest) {
    const { it, expect } = import.meta.vitest;

    it("test getPointsSplitIndexByRadius", () => {
        const points = [
            [0, 0],
            [1, 1],
            [2, 2],
            [3, 3],
            [4, 4],
            [5, 3],
            [6, 2],
            [7, 1],
            [8, 0],
        ].map(([x, y]) => vec2.fromValues(x, y));
        const indexArr = getPointsSplitIndexByRadius(points, 100);
        expect(indexArr).toEqual([4]);
    })

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
        let polyline = connectPolyline(polyline0, polyline1);
        expect(polyline.points).toEqual([
            [0, 0],
            [2, 2],
            [3, 3],
            [4, 4],
        ]);
        polyline = connectPolyline(polyline0, polyline2);
        expect(polyline.points).toEqual([
            [0, 0],
            [2, 2],
            [3, 3],
            [4, 4],
        ]);
    })
}
