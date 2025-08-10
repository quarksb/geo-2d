import { vec2 } from "gl-matrix";
import { getQuadraticCurve } from "../method";
import { ClosedShape } from "./closed-shape";

export const getEllipse = (cx: number, cy: number, rx: number, ry: number, count = 20) => {
    let lastPoint = vec2.fromValues(cx + rx, cy);
    let lastTan = vec2.fromValues(0, 1);
    const step = (Math.PI * 2) / count;
    const curves = [];
    for (let i = 1; i <= count; i++) {
        const angle = i * step;
        const x = cx + rx * Math.cos(angle);
        const y = cy + ry * Math.sin(angle);
        const point = vec2.fromValues(x, y);
        const tan = vec2.fromValues(-Math.sin(angle) * rx, Math.cos(angle) * ry);
        const curve = getQuadraticCurve({ EPoint: lastPoint, outDir: lastTan }, { SPoint: point, inDir: tan });
        curves.push(curve);
        lastPoint = point;
        lastTan = tan;
    }
    const shape = new ClosedShape(curves);
    return shape;
};

if (import.meta.vitest) {
    const { expect, test, describe } = import.meta.vitest;
    test("ellipse", () => {
        const shape = getEllipse(100, 50, 80, 40, 4);
        console.log(shape.toPathString(0));

        expect(shape.toPathString()).toBe("M 180 50 Q 180 90 100 90 Q 20 90 20 50 Q 20 10 100 10 Q 180 10 180 50 Z");
    });
}
