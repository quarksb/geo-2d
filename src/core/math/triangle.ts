import { vec2 } from "gl-matrix";

/**
 * ### get the area of a triangle
 */
export function getTriangleArea(pA: vec2, pB: vec2, pC: vec2) {
    return Math.abs(calPointsArea([pA, pB, pC]));
}

/**
 * ### judge if the point is in the left of the line
 * @param point
 * @param line
 * @returns
 */
export function isInLeft(point: vec2, line: vec2[]): boolean {
    let [x, y] = point;
    let [[x1, y1], [x2, y2]] = line;
    return (x - x1) * (y2 - y1) - (y - y1) * (x2 - x1) > 0;
}

export function isPointInPoints(point: vec2, points: vec2[]): boolean {
    let [x, y] = point;
    let inside = false;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
        let [xi, yi] = points[i];
        let [xj, yj] = points[j];
        let intersect = yi > y != yj > y && x - xi < ((xj - xi) * (y - yi)) / (yj - yi);
        if (intersect) inside = !inside;
    }
    return inside;
}

/**
 * ### calculate the curvature of a circle(with sign)
 * curvature = sign * 1 / r
 * @param pointA
 * @param pointB
 * @param pointC
 * @returns
 */
export function getCurvature(pointA: vec2, pointB: vec2, pointC: vec2) {
    const a = vec2.distance(pointA, pointB);
    const b = vec2.distance(pointB, pointC);
    const c = vec2.distance(pointC, pointA);

    // 分母
    const denominator = a * b * c;
    if (Math.abs(denominator) < 1e-20) {
        return 0;
    }
    return calPointsArea([pointA, pointB, pointC]) / (a * b * c);
}

export function calPointsArea(points: vec2[]): number {
    let area = 0;
    const { length: n } = points;
    for (let i = 0; i < n; i++) {
        let [xi, yi] = points[i];
        let [xj, yj] = points[(i + 1) % n];
        area += xi * yj - xj * yi;
    }
    return area / 2;
}

if (import.meta.vitest) {
    const { describe, it, expect } = import.meta.vitest;

    describe("math/triangle", () => {
        it("isPointInPoints unClockwise", () => {
            const points = [vec2.fromValues(0, 0), vec2.fromValues(1, 0), vec2.fromValues(1, 1), vec2.fromValues(0, 1)];
            expect(isPointInPoints(vec2.fromValues(0.5, 0.5), points)).toBe(true);
            expect(isPointInPoints(vec2.fromValues(0.5, 1.5), points)).toBe(false);
        });

        it("isPointInPoints clockwise", () => {
            const points = [vec2.fromValues(0, 0), vec2.fromValues(0, 1), vec2.fromValues(1, 1), vec2.fromValues(1, 0)];
            expect(isPointInPoints(vec2.fromValues(0.5, 0.5), points)).toBe(true);
            expect(isPointInPoints(vec2.fromValues(0.5, 1.5), points)).toBe(false);
        });
    });
}
