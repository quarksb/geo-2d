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

    getArea() {
        let area = 0;
        for (let i = 0; i < this.points.length; i++) {
            let [xi, yi] = this.points[i];
            let [xj, yj] = this.points[(i + 1) % this.points.length];
            area += xi * yj - xj * yi;
        }
        return Math.abs(area) / 2;
    }

    /**
     * judge if the point is in the polygon
     * @param point 
     * @returns 
     */
    includePoint(point: vec2): boolean {
        // bbox check
        if (point[0] < this.bbox.xMin || point[0] > this.bbox.xMax || point[1] < this.bbox.yMin || point[1] > this.bbox.yMax) return false;

        let [x, y] = point;
        let inside = false;
        for (let i = 0, j = this.points.length - 1; i < this.points.length; j = i++) {
            let [xi, yi] = this.points[i];
            let [xj, yj] = this.points[j];
            let intersect = ((yi > y) != (yj > y)) && (x - xi < (xj - xi) * (y - yi) / (yj - yi));
            if (intersect) inside = !inside;
        }
        return inside;
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


function getSignArea(points: vec2[]) {
    let area = 0;
    const n = points.length;

    for (let i = 0; i < n; i++) {
        const current = points[i];
        const next = points[(i + 1) % n];
        area += current[0] * next[1] - next[0] * current[1];
    }

    return area / 2;
}