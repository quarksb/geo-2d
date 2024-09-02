import { vec2 } from "gl-matrix";
import { BBox2 } from "../base";

export class Polygon {
    points: vec2[];
    bbox: BBox2;
    constructor (points: vec2[]) {
        this.points = points;
        this.bbox = {
            xMin: Infinity,
            xMax: -Infinity,
            yMin: Infinity,
            yMax: -Infinity,
        };
        for (let point of this.points) {
            this.bbox.xMin = Math.min(this.bbox.xMin, point[0]);
            this.bbox.xMax = Math.max(this.bbox.xMax, point[0]);
            this.bbox.yMin = Math.min(this.bbox.yMin, point[1]);
            this.bbox.yMax = Math.max(this.bbox.yMax, point[1]);
        }
    }

    /**
     * ### get the area of the polygon
     * @returns the area of the polygon
     */
    getArea() {
        return Math.abs(this.getSignArea());
    }

    /**
     * ### get the signed area of the polygon
     * @returns signed area
     */
    getSignArea() {
        return calPointsArea(this.points);
    }

    getCentroid() {
        let area = this.getSignArea();
        let cx = 0;
        let cy = 0;
        for (let i = 0; i < this.points.length; i++) {
            let [xi, yi] = this.points[i];
            let [xj, yj] = this.points[(i + 1) % this.points.length];
            cx += (xi + xj) * (xi * yj - xj * yi);
            cy += (yi + yj) * (xi * yj - xj * yi);
        }
        return [cx / 6 / area, cy / 6 / area];
    }

    /**
     * judge if the point is in the polygon
     * @param point 
     * @returns 
     */
    includePoint(point: vec2): boolean {
        // bbox check
        if (point[0] < this.bbox.xMin || point[0] > this.bbox.xMax || point[1] < this.bbox.yMin || point[1] > this.bbox.yMax) return false;
        return isPointInPoints(point, this.points);
    }

    /**
     * judge if the polygon is in the polygon
     * @param polygon 
     * @returns 
     */
    includePolygon(polygon: Polygon): boolean {
        // bbox check
        if (polygon.bbox.xMin < this.bbox.xMin || polygon.bbox.xMax > this.bbox.xMax || polygon.bbox.yMin < this.bbox.yMin || polygon.bbox.yMax > this.bbox.yMax) return false;
        for (let point of polygon.points) {
            if (!this.includePoint(point)) return false;
        }
        return true;
    }

    /**
     * judge if the polygon is intersect with the polygon
     * @param polygon 
     * @returns 
     */
    intersectPolygon(polygon: Polygon): boolean {
        for (let point of polygon.points) {
            if (this.includePoint(point)) return true;
        }
        return false;
    }

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

/**
 * ### get the direction of a shape
 * @param shape 
 * @returns true if the shape is clockwise
 */
export function getPointsRightHandRule(points: vec2[]) {
    const area = calPointsArea(points);
    return area > 0;
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
        let intersect = ((yi > y) != (yj > y)) && (x - xi < (xj - xi) * (y - yi) / (yj - yi));
        if (intersect) inside = !inside;
    }
    return inside;
}


if (import.meta.vitest) {
    const { it, expect } = import.meta.vitest;
    let points: vec2[];
    let polygon: Polygon;
    points = [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
    ].map(([x, y]) => vec2.fromValues(x, y));
    polygon = new Polygon(points);

    // it("includePoint-0", () => {
    //     expect(polygon.includePoint([0.5, 0.5])).toBe(true);
    //     expect(polygon.includePoint([1.5, 0.5])).toBe(false);
    //     expect(polygon.getArea()).toBe(1);
    // })

    // it("calPointsArea-0", () => {
    //     expect(calPointsArea(points)).toBe(1);
    // })

    points = [
        [0, 0],
        [0, 1],
        [1, 1],
        [1, 0],
    ].map(([x, y]) => vec2.fromValues(x, y));
    polygon = new Polygon(points);

    // it("includePoint-1", () => {
    //     expect(polygon.includePoint([0.5, 0.5])).toBe(true);
    //     expect(polygon.includePoint([1.5, 0.5])).toBe(false);
    // })

    it("calPointsArea-1", () => {
        expect(calPointsArea(points)).toBe(-1);
    })
}