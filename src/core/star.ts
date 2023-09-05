import { vec2 } from "gl-matrix";
import { BBox, Curve } from "./curve/curve";
import { getRandomGenerate, getTriangleArea } from "./math";
import { LineCurve, QuadraticCurve } from "./curve";

export function getPolygon(width: number, height: number, n: number, ramada = 0, randomSeed = 0.1): vec2[] {
    const polygon: vec2[] = [];
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    const randomGenerate = getRandomGenerate(randomSeed);
    let angle = randomGenerate() * 2 * Math.PI;
    let baseCal = () => {
        let sb = randomGenerate();
        const r = sb * ramada + (1 - ramada);
        let x = (r * Math.cos(angle) + 1) * halfWidth;
        let y = (r * Math.sin(angle) + 1) * halfHeight;
        return vec2.fromValues(x, y);
    };
    const ratio = 1 / (width * height);
    for (let i = 0; i < n; i++) {
        angle += (2 * Math.PI) / n;
        let point = baseCal();
        if (i >= 2) {
            let areaPercent = getTriangleArea([polygon[i - 2], polygon[i - 1], point]) * ratio;
            let count = 0;
            while (areaPercent < 0.008 && count++ < 20) {
                point = baseCal();
                areaPercent = getTriangleArea([polygon[i - 2], polygon[i - 1], point]) * ratio;
            }
        }

        polygon.push(point);
    }

    // 检查最后一个点、倒数第二个点和第一个点构成的三角形的面积是否过小
    if (n >= 5) {
        let areaPercent0 = getTriangleArea([polygon[n - 3], polygon[n - 2], polygon[1]]) * ratio;
        let areaPercent1 = getTriangleArea([polygon[n - 2], polygon[n - 1], polygon[0]]) * ratio;
        let areaPercent2 = getTriangleArea([polygon[n - 1], polygon[0], polygon[1]]) * ratio;
        let count = 0;
        while ((areaPercent0 < 0.01 || areaPercent1 < 0.01 || areaPercent2 < 0.01) && count++ < 100) {
            polygon[n - 1] = baseCal();
            areaPercent0 = getTriangleArea([polygon[n - 3], polygon[n - 2], polygon[1]]) * ratio;
            areaPercent1 = getTriangleArea([polygon[n - 2], polygon[n - 1], polygon[0]]) * ratio;
            areaPercent2 = getTriangleArea([polygon[n - 1], polygon[0], polygon[1]]) * ratio;
        }
    }

    return polygon;
}

/**
 * use bezier curve to smooth the polygon
 * @param polygon points of the polygon
 */
export function getCurves(polygon: vec2[], isDebug: boolean): Curve[] {
    const curves: Curve[] = [];
    const n = polygon.length;
    if (isDebug) {
        for (let i = 0; i < n; i++) {
            const pointBefore = vec2.fromValues(polygon[i][0], polygon[i][1]);
            const pointAfter = vec2.fromValues(polygon[(i + 1) % n][0], polygon[(i + 1) % n][1]);
            curves.push(new LineCurve(pointBefore, pointAfter));
        }
        return curves;
    }

    let midPointArr: vec2[] = [];
    for (let i = 0; i < n; i++) {
        const pointBefore = vec2.fromValues(polygon[i][0], polygon[i][1]);
        const pointAfter = vec2.fromValues(polygon[(i + 1) % n][0], polygon[(i + 1) % n][1]);
        const midPoint = vec2.lerp(vec2.create(), pointBefore, pointAfter, 0.5);
        midPointArr.push(midPoint);
    }

    for (let i = 0; i < n; i++) {
        let startPoint: vec2 = vec2.fromValues(midPointArr[i][0], midPointArr[i][1]);
        let endPoint: vec2 = midPointArr[(i + 1) % n];
        let controlPoint1 = polygon[(i + 1) % n];
        curves.push(new QuadraticCurve(startPoint, controlPoint1, endPoint));
        // const pointBefore = vec2.fromValues(polygon[i][0], polygon[i][1]);
        // const pointAfter = vec2.fromValues(polygon[(i + 1) % n][0], polygon[(i + 1) % n][1]);

        // const controlPoint1 = vec2.lerp(vec2.create(), pointBefore, pointAfter, 0.5);
        // const controlPoint2 = vec2.lerp(vec2.create(), startPoint, endPoint, 2 / 3);
        // curves.push(new Curve(startPoint, controlPoint1, controlPoint2, endPoint));
    }
    return curves;
}

export function getBezierCurvesBBox(bezierCurves: Curve[]): BBox {
    let xMin = Infinity;
    let yMin = Infinity;
    let xMax = -Infinity;
    let yMax = -Infinity;
    for (const bezierCurve of bezierCurves) {
        const bbox = bezierCurve.getBBox();
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

export function resizeCurvesByBBox(bezierCurves: Curve[], targetBBox: BBox): void {
    const bbox = getBezierCurvesBBox(bezierCurves);

    const scaleX = targetBBox.width / bbox.width;
    const scaleY = targetBBox.height / bbox.height;
    bezierCurves.forEach((bezierCurve) => {
        bezierCurve.applyTransform((point) => {
            point[0] = (point[0] - bbox.x) * scaleX + targetBBox.x;
            point[1] = (point[1] - bbox.y) * scaleY + targetBBox.y;
        });
    });
}
