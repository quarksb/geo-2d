import { vec2 } from "gl-matrix";

// copy from https://github.com/thibauts/b-spline/blob/master/index.js
export function interpolate(t: number, degree: number, points: number[][], knots?: number[], weights?: number[]) {
    const pointNum = points.length + degree; // points count
    const dimensionality = 2; // point dimensionality

    if (degree < 1) throw new Error("degree must be at least 1 (linear)");
    if (degree > pointNum - 1) throw new Error("degree must be less than or equal to point count - 1");

    if (!weights) {
        // build weight vector of length [n]
        weights = [];
        for (let i = 0; i < pointNum; i++) {
            weights[i] = 1;
        }
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

    // convert points to homogeneous coordinates
    const pointDataArr: number[][] = [];
    for (let i = 0; i < pointNum; i++) {
        pointDataArr[i] = [];
        for (let j = 0; j < dimensionality; j++) {
            pointDataArr[i][j] = points[i % (pointNum - degree)][j] * weights[i];
        }
        pointDataArr[i][dimensionality] = weights[i];
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

    // convert back to cartesian and return
    let result: number[] = [];
    for (let i = 0; i < dimensionality; i++) {
        result[i] = pointDataArr[segmentIndex][i] / pointDataArr[segmentIndex][dimensionality];
    }

    return vec2.fromValues(result[0], result[1]);

}
