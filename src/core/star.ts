import { vec2 } from "gl-matrix";
import { BBox, Curve } from "./curve/curve";
import { getRandomGenerate, getTriangleArea } from "./math";
import { LineCurve, BezierCurve, QuadraticCurve } from "./curve";
// import { interpolate } from "./temp";
import { interpolate } from "./curve";

/**
 * get the vertexes of a polygon
 * @param width width of the basic rectangle
 * @param height height of the basic rectangle
 * @param n number of the polygon vertex (>= 3)
 * @param ramada scale of the polygon vertex (0, 1]
 * @param angle angle of the polygon [0, 1)
 * @param randomSeed random seed of the random generator (0, 1)
 * @returns vertexes of the polygon
 */
export function getPolygon(width: number, height: number, n: number, ramada = 0, angle = 0, randomSeed = 0.1): vec2[] {
    const polygon: vec2[] = [];
    const halfWidth = width / 2;
    const halfHeight = height / 2;

    const randomGenerate = getRandomGenerate(randomSeed);
    // 是否有更好的基础点生成方法？
    let baseCal = (radian: number) => {
        let sb = randomGenerate();
        const r = sb * ramada + (1 - ramada);
        let x = (r * Math.cos(radian) + 1) * halfWidth;
        let y = (r * Math.sin(radian) + 1) * halfHeight;
        return vec2.fromValues(x, y);
    };

    // const angleArr = new Array<number>(n);
    // for (let i = 0; i < n; i++) {
    //     angleArr[i] = randomGenerate();
    // }
    // angleArr.sort((a, b) => a - b);

    for (let i = 0; i < n; i++) {
        let point = baseCal(2 * Math.PI * (i / n + angle));
        polygon.push(point);
    }

    return polygon;
}

/**
 * use bezier curve to smooth the polygon
 * @param polygon points of the polygon
 */
export function getCurvesByPolygon(polygon: vec2[]): Curve[] {
    const curves: Curve[] = [];
    const n = 100;

    const degree = 4;
    const interpolatePoints = new Array<vec2>(100);
    for (let i = 0; i < n; i++) {
        interpolatePoints[i] = interpolate(0.01 * i, degree, polygon as number[][]);
    }

    const midPointArr: vec2[] = [];
    for (let i = 0; i < n; i++) {
        const pointBefore = vec2.fromValues(interpolatePoints[i][0], interpolatePoints[i][1]);
        const pointAfter = vec2.fromValues(interpolatePoints[(i + 1) % n][0], interpolatePoints[(i + 1) % n][1]);
        const midPoint = vec2.lerp(vec2.create(), pointBefore, pointAfter, 0.5);
        midPointArr.push(midPoint);
    }

    for (let i = 0; i < n; i++) {
        // const startPoint: vec2 = vec2.fromValues(midPointArr[i][0], midPointArr[i][1]);
        // const endPoint: vec2 = midPointArr[(i + 1) % n];
        // const mid = polygon[(i + 1) % n];
        // const ratio = 0.66;
        // const controlPoint1 = vec2.lerp(vec2.create(), startPoint, mid, ratio);
        // const controlPoint2 = vec2.lerp(vec2.create(), endPoint, mid, ratio);
        // curves.push(new BezierCurve(startPoint, controlPoint1, controlPoint2, endPoint));

        const startPoint: vec2 = vec2.fromValues(midPointArr[i][0], midPointArr[i][1]);
        const endPoint: vec2 = midPointArr[(i + 1) % n];

        const controlPoint1 = interpolatePoints[(i + 1) % n];
        curves.push(new QuadraticCurve(startPoint, controlPoint1, endPoint));
    }
    return curves;
}

export function getBezierCurvesBBox(curves: Curve[]): BBox {
    let xMin = Infinity,
        yMin = Infinity,
        xMax = -Infinity,
        yMax = -Infinity;

    for (const curve of curves) {
        const bbox = curve.getBBox();

        xMin = Math.min(xMin, bbox.x);
        yMin = Math.min(yMin, bbox.y);
        xMax = Math.max(xMax, bbox.x + bbox.width);
        yMax = Math.max(yMax, bbox.y + bbox.height);
    }
    return {
        x: xMin,
        y: yMin,
        width: xMax - xMin,
        height: yMax - yMin,
    };
}

export function resizeCurvesByBBox(curves: Curve[], targetBBox: BBox): void {
    const bbox = getBezierCurvesBBox(curves);

    const scaleX = targetBBox.width / bbox.width;
    const scaleY = targetBBox.height / bbox.height;
    curves.forEach((curve) => {
        curve.applyFn((point) => {
            point[0] = (point[0] - bbox.x) * scaleX + targetBBox.x;
            point[1] = (point[1] - bbox.y) * scaleY + targetBBox.y;
            return point;
        });
    });
    const bbox2 = getBezierCurvesBBox(curves);
}
