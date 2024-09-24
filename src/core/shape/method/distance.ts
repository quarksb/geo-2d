import { vec2 } from "gl-matrix";
import { checkLineCurveIntersect, LineCurve } from "../../curve";
import { SingleShape } from "../element";
import { calPointsArea } from "../../math";

export interface DisData {
    /**the nearest index arr */
    indexes: Int16Array;
    min: number;
    max: number;
    mean: number;
    std: number;
}

/**
 * ### calculate distance data between two polyline
 * @param shape0 - the first shape, which was composed of multiple curves
 * @param shape1 - the second shape, which was also composed of multiple curves
 * @param baseLen - @default 20 the least distance between points
 * @param check - @default true whether to check the correctness of the shape
 * @returns 
 */
export function calDisData(shape0: SingleShape, shape1: SingleShape, baseLen = 20, check = true): DisData[] {
    const [ps0, ps1] = [shape0, shape1].map(shape => {
        const { len } = shape;
        const count = Math.ceil(len / baseLen);
        if (!count) {
            console.error("the count of points is 0");
        }
        return shape.toPoints(count);
    });

    const { length: l0 } = ps0;
    const { length: l1 } = ps1;

    const defaultDisData: DisData = {
        indexes: new Int16Array(0),
        min: Infinity,
        max: Infinity,
        mean: Infinity,
        std: Infinity,
    };

    if (check) {
        const isAnyClosed = shape0.isClosed || shape1.isClosed;

        // 当 shape 均闭合时，进行相交性检测（ 倘若 shape 闭合，则其首尾已经相交）
        if (!isAnyClosed) {
            // 首尾相交性检测
            const LineCurve0 = new LineCurve(shape0.EPoint, shape1.SPoint);;
            const LineCurve1 = new LineCurve(shape1.EPoint, shape0.SPoint);
            const isIntersect = checkLineCurveIntersect(LineCurve0, LineCurve1);

            // 导轨两连接线交叉，不合理，直接跳过后续计算
            if (isIntersect) {
                return [defaultDisData, defaultDisData];
            }
        }

        const newPoints = [...ps0, ...ps1];
        const isClockwise = calPointsArea(newPoints) > 0;
        // 正确的多边形应该是顺时针的（逆时针表示有效区为外部）
        if (!isClockwise) {
            return [defaultDisData, defaultDisData];
        }
    }

    const indexMatrix = [
        new Int16Array(l0),
        new Int16Array(l1),
    ]
    const distMatrix = [
        new Float32Array(l0).fill(Infinity),
        new Float32Array(l1).fill(Infinity),
    ]

    for (let i0 = 0; i0 < l0; i0++) {
        for (let i1 = 0; i1 < l1; i1++) {
            const dis = vec2.dist(ps0[i0], ps1[i1]);
            if (dis < distMatrix[0][i0]) {
                distMatrix[0][i0] = dis;
                indexMatrix[0][i0] = i1;
            }

            if (dis < distMatrix[1][i1]) {
                distMatrix[1][i1] = dis;
                indexMatrix[1][i1] = i0;
            }
        }
    }

    const disDatas: DisData[] = distMatrix.map((distArr, i) => {
        const min = Math.min(...distArr);
        const max = Math.max(...distArr);
        const mean = distArr.reduce((a, b) => a + b, 0) / distArr.length;
        const std = Math.sqrt(distArr.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / distArr.length);
        return { indexes: indexMatrix[i], min, max, mean, std };
    });

    return disDatas;
}