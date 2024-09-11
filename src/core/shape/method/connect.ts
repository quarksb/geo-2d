import { vec2 } from "gl-matrix";
import { Shape } from "../element/base-shape";
import { cross } from "../../math";
import { ConnectEnd, ConnectStart, Curve, LineCurve, lineInterSect, QuadraticCurve } from "../../curve";
import { SingleShape } from "../element/single-shape";

/**
 * get connect curve for two shapes
 * @param shape0 
 * @param shape1 
 * @returns 
 */
export function getConnectCurve(shape0: ConnectStart, shape1: ConnectEnd) {
    const vec = vec2.sub(vec2.create(), shape1.SPoint, shape0.EPoint);
    let curve: Curve;
    /**l0.outDir -> vec 和 vec -> l1.inDir 同向*/
    const isSameDirection = cross(shape0.outDir, vec) * cross(vec, shape1.inDir) > 0;
    if (!isSameDirection || vec2.angle(shape0.outDir, shape1.inDir) < Math.PI / 36) {
        // 如果角度较小，则用一阶贝塞尔曲线插值
        curve = new LineCurve(shape0.EPoint, shape1.SPoint);
    } else {
        // 如果角度太大，则用二阶贝塞尔曲线插值, 其 ControlPint1 为 polyline0.outDir 和 polyline1.inDir 的交点

        const p1 = shape0.EPoint;
        const p2 = vec2.add(vec2.create(), shape0.EPoint, shape0.outDir);
        const p3 = vec2.add(vec2.create(), shape1.SPoint, shape1.inDir);
        const p4 = shape1.SPoint;
        const interSect = lineInterSect(p1, p2, p3, p4);
        curve = new QuadraticCurve(shape0.EPoint, interSect, shape1.SPoint);
    }

    return curve;
}

/**
 * connect two shapes
 * @param shape0 
 * @param shape1 
 * @returns 
 */
export function connectShape(shape0: Shape, shape1: Shape): SingleShape {
    const vec = vec2.sub(vec2.create(), shape1.SPoint, shape0.EPoint);
    const dist = vec2.len(vec);
    let curves = shape0.curves;
    const isContinuous = dist < 1;

    // 如果不连续，则在两 shape 中间添加一条线
    if (!isContinuous) {
        const connectCurve = getConnectCurve(shape0, shape1);
        curves.push(connectCurve);
    }
    /**
     * polyline1 是否是 polyline0 的一部分
     * @remarks 如果 合并序列首尾相同，如 [2,4,2] 则 polyline1(2) 是 polyline0(2->4) 的一部分, 此时需要避免添加重复点
     */
    const isl1PartOfl0 = (shape0 === shape1) || shape1.points.every((p, i) => vec2.dist(p, shape0.points[i]) < 1);
    if (!isl1PartOfl0) {
        curves = curves.concat(shape1.curves);
    }
    return new SingleShape(curves);
}



