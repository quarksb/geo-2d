import { vec2 } from "gl-matrix";
import { BBox } from "../base";

const FactorialArr = [1, 1, 2, 6, 24, 120, 720, 5040, 40320, 362880, 3628800, 39916800];
// 阶乘
const getFactorial = (n: number): number => FactorialArr[n];
/**返回组合数C(m,n) 即 m 个元素中任选 n 个的元素的可能数 */
const getCombination = (m: number, n: number): number => getFactorial(m) / (getFactorial(n) * getFactorial(m - n));
// 计算Bernstein基函数
const bernsteinBasis = (i: number, n: number, t: number): number => getCombination(n, i) * t ** i * (1 - t) ** (n - i);

const clamp = (value: number, min = 0, max = 1) => Math.min(Math.max(value, min), max);

// cal the new pos by B-Spline curve
export function transformPoint(bbox: BBox, controlPoints: vec2[][], isSmooth = true) {
    if (isSmooth) {
        return (point: vec2) => {
            const [x, y] = point;
            const m = controlPoints.length - 1;
            const n = controlPoints[0].length - 1;
            let u = (x - bbox.x) / bbox.width;
            let v = (y - bbox.y) / bbox.height;
            let weightSum = 0;
            let pointSum = vec2.create();
            for (let i = 0; i <= m; i++) {
                const weightX = bernsteinBasis(i, m, u);
                for (let j = 0; j <= n; j++) {
                    const weightY = bernsteinBasis(j, n, v);
                    const weight = weightX * weightY;

                    weightSum += weight;
                    vec2.scaleAndAdd(pointSum, pointSum, controlPoints[i][j], weight);
                }
            }

            vec2.scale(pointSum, pointSum, 1 / weightSum);
            vec2.copy(point, pointSum);
        };
    } else {
        return (point: vec2) => {
            const [x, y] = point;
            const m = controlPoints.length - 1;
            const n = controlPoints[0].length - 1;
            let u = clamp((x - bbox.x) / bbox.width);
            let v = clamp((y - bbox.y) / bbox.height);
            u = u * m;
            v = v * n;
            const i = Math.floor(u);
            const j = Math.floor(v);
            u = u - i;
            v = v - j;
            const p0 = controlPoints[i][j];
            const p1 = controlPoints[i + 1][j];
            const p2 = controlPoints[i][j + 1];
            const p3 = controlPoints[i + 1][j + 1];
            const newX = (1 - u) * (1 - v) * p0[0] + u * (1 - v) * p1[0] + (1 - u) * v * p2[0] + u * v * p3[0];
            const newY = (1 - u) * (1 - v) * p0[1] + u * (1 - v) * p1[1] + (1 - u) * v * p2[1] + u * v * p3[1];
            point[0] = newX;
            point[1] = newY;
            return point;
        };
    }
}
