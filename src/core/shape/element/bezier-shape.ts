import { BezierCurve, getBezierFromCurve } from "../../curve";
import { SingleShape } from "./single-shape";

/**
 * ## the shape of a 3rd bezier curve
 * since all curve could be converted to 3rd bezier curve，so we just need to handle 3rd bezier curve
 */
export class BezierShape extends SingleShape {
    curves: BezierCurve[];
    /**记录每段曲线终点到 shape 起点的长度 */
    constructor (curves: BezierCurve[]) {
        super(curves);
        this.curves = curves;
    }
}

export function getBezierShapeFormSingleShape(shape: SingleShape) {
    const curves = shape.curves.map((curve) => getBezierFromCurve(curve));
    return new BezierShape(curves);
}