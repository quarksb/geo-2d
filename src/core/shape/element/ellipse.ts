import { vec2 } from "gl-matrix";
import { getQuadraticCurve } from "../method";
import { ClosedShape } from "./closed-shape";

export const getEllipse = (rx: number, ry: number, cx: number, cy: number, count = 20) => {
    let lastPoint = vec2.fromValues(cx + rx, cy);
    let lastTan = vec2.fromValues(0, 1);
    const step = Math.PI * 2 / count;
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
}


if (import.meta.vitest) {
    const { expect, test, describe } = import.meta.vitest;
    test('ellipse', () => {
        const shape = getEllipse(100, 50, 100, 50, 4);
        console.log(shape.toPathString());

        expect(shape.isClosed).toBeTruthy();
        expect(shape.curves.length).toBe(20);
    });
}