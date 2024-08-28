import { vec2 } from "gl-matrix";

// todo: b-spline 和其他曲线几乎毫无关系，建议挪动位置

// copy from https://github.com/thibauts/b-spline/blob/master/index.js
export function interpolate(t: number, degree: number, points: number[][], knots?: number[], weights?: number[]) {
    const pointNum = points.length + degree; // points count
    const dimensionality = 2; // point dimensionality

    if (degree < 1) throw new Error("degree must be at least 1 (linear)");
    if (degree > pointNum - 1) throw new Error("degree must be less than or equal to point count - 1");

    if (!weights) {
        // build weight vector of length [n]
        weights = new Array(pointNum).fill(1);
    }

    if (!knots) {
        // build knot vector of length [n + degree + 1]
        knots = [];
        for (let i = 0; i < pointNum + degree + 1; i++) {
            knots[i] = i;
        }
    } else {
        if (knots.length !== pointNum + degree + 1) throw new Error("bad knot vector length");
    }

    // convert points to homogeneous coordinates
    const pointDataArr: number[][] = [];
    for (let i = 0; i < pointNum; i++) {
        pointDataArr[i] = [];
        for (let j = 0; j < dimensionality; j++) {
            pointDataArr[i][j] = points[i % (pointNum - degree)][j] * weights[i];
        }
        pointDataArr[i][dimensionality] = weights[i];
    }

    // remap t to the domain where the spline is defined
    const low = knots[degree];
    const high = knots[pointNum];
    t = t * (high - low) + low;

    if (t < low || t > high) throw new Error("out of bounds");

    let segmentIndex;
    // find s (the spline segment) for the [t] value provided
    for (segmentIndex = degree; segmentIndex < pointNum; segmentIndex++) {
        if (t >= knots[segmentIndex] && t <= knots[segmentIndex + 1]) {
            break;
        }
    }

    // console.log("knots", knots);
    // console.log("pointDataArr", pointDataArr);

    // l (level) goes from 1 to the curve degree + 1
    let alpha;
    for (let l = 1; l <= degree + 1; l++) {
        // build level l of the pyramid
        for (let i = segmentIndex; i > segmentIndex - degree - 1 + l; i--) {
            alpha = (t - knots[i]) / (knots[i + degree + 1 - l] - knots[i]);

            // interpolate each component
            // console.log(i, pointDataArr[i]);

            for (let j = 0; j < dimensionality + 1; j++) {
                pointDataArr[i][j] = (1 - alpha) * pointDataArr[i - 1][j] + alpha * pointDataArr[i][j];
            }
        }
    }

    console.log("pointDataArr", pointDataArr);

    // convert back to cartesian and return
    let result: number[] = [];
    for (let i = 0; i < dimensionality; i++) {
        result[i] = pointDataArr[segmentIndex][i] / pointDataArr[segmentIndex][dimensionality];
    }

    return vec2.fromValues(result[0], result[1]);
}

/**
 * 获取B样条曲线
 * @param points 基础曲线的控制点
 * @param degree 基础曲线的阶数 (degree must be at least 1 (linear) and less than or equal to point count - 1)
 * @returns 返回B样条曲线函数
 */
export function getBSpline(points: vec2[], degree: number) {
    const { length } = points;

    if (degree < 1) throw new Error("degree must be at least 1 (linear)");
    if (degree > length - 1) {
        throw new Error(`degree:${degree} must be less than or equal to point count - 1(${length - 1})`);
    }

    const xNums = new Array(length);
    const yNums = new Array(length);

    for (let i = 0; i < length; i++) {
        xNums[i] = points[i][0];
        yNums[i] = points[i][1];
    }

    /**t ∈ [0,1] */
    return (t: number) => {
        if (t < 0 || t > 1) throw new Error("out of bounds");
        t = t * length + degree;
        const x = getNum(xNums, degree, t);
        const y = getNum(yNums, degree, t);
        return vec2.fromValues(x, y);
    };
}

function getNum(points: number[], degree: number, t: number) {
    const { length } = points;
    const l = length + degree;
    const baseIndex = Math.floor(t);
    const data: number[] = new Array(l);
    for (let i = 0; i < l; i++) {
        data[i] = points[i % length];
    }

    // console.log(
    //     "data",
    //     data.map((v) => v.toFixed(1))
    // );

    for (let i = 0; i < degree; i++) {
        // build level l of the pyramid
        for (let k = baseIndex; k > baseIndex - degree + i; k--) {
            const lamoda = (t - k) / (degree - i);
            // console.log(k, lamoda.toFixed(2), data[k - 1].toFixed(1), data[k].toFixed(1));
            data[k] = lamoda * data[k] + (1 - lamoda) * data[k - 1];
        }
        // console.log(
        //     "data",
        //     data.map((v) => v.toFixed(1))
        // );
    }

    // console.log("baseIndex", baseIndex, data[baseIndex].toFixed(1));

    return data[baseIndex];
}
