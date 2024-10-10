import { vec2 } from "gl-matrix";
import { ClosedShape } from "./closed-shape";
import { LineCurve } from "../../curve";

export class Polygon extends ClosedShape {
    constructor (curves: LineCurve[]) {
        super(curves);
    }

    static fromPoints(points: vec2[]) {
        let curves = [];
        for (let i = 0; i <= points.length; i++) {
            curves.push(new LineCurve(points[i], points[(i + 1) % points.length]));
        }
        return new Polygon(curves);
    }

    getCentroid() {
        let area = this.getArea();
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
     * judge if the polygon is in the polygon
     * @param polygon 
     * @returns 
     */
    includePolygon(polygon: Polygon): boolean {
        // bbox check
        const { xMin, xMax, yMin, yMax } = this.bbox2;
        if (polygon.bbox2.xMin < xMin || polygon.bbox2.xMax > xMax || polygon.bbox2.yMin < yMin || polygon.bbox2.yMax > yMax) return false;
        for (let point of polygon.points) {
            if (!this.include(point)) return false;
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
            if (this.include(point)) return true;
        }
        return false;
    }

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
    polygon = Polygon.fromPoints(points)

    it("includePoint-0", () => {
        expect(polygon.include([0.5, 0.5])).toBe(true);
        expect(polygon.include([1.5, 0.5])).toBe(false);
        expect(polygon.getArea()).toBe(1);
    })
}