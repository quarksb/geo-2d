import { vec2 } from "gl-matrix";
import { Shape } from "./base-shape";
import { cross } from "../math";
import { Curve, LineCurve, lineInterSect, QuadraticCurve } from "../curve";
import { SingleShape } from "./single-shape";

const EPSILON = 1e-6;
const MasCosine = Math.cos(30 / Math.PI);

// 计算两条射线的交点
export function findRayIntersection(point1: vec2, direction1: vec2, point2: vec2, direction2: vec2): vec2 | null {
    const cosAngle = vec2.dot(direction1, direction2);

    if (cosAngle < MasCosine) {
        return null;
    }

    const [x1, y1] = point1;
    const [x2, y2] = direction1;
    const [x3, y3] = point2;
    const [x4, y4] = direction2

    // solve equation x1 + t*x2 = x3 + u * x4; y1 + t*y2 = y3 + u * y4

    const denominator = x4 * y2 - x2 * y4;

    if (denominator < EPSILON && denominator > -EPSILON) {
        // 射线平行，没有交点
        return null;
    }

    const t = ((x1 - x3) * y4 - (y1 - y3) * x4) / denominator;
    return vec2.scaleAndAdd(vec2.create(), point1, direction1, t);
}

export function isVec2DirectionClose(a: vec2, normalVec: vec2) {
    const dot = vec2.dot(a, normalVec);
    return dot > vec2.length(a) * 0.9;
}


export function connectShape(l0: Shape, l1: Shape): SingleShape {
    const vec = vec2.sub(vec2.create(), l1.SPoint, l0.EPoint);
    const dist = vec2.len(vec);
    let curves = l0.curves;
    const isContinuous = dist < 1;


    // 如果不连续，则添加一条线
    if (!isContinuous) {
        let curve: Curve;
        /**l0.outDir -> vec 和 vec -> l1.inDir 同向*/
        const isSameDirection = cross(l0.outDir, vec) * cross(vec, l1.inDir) > 0;
        if (!isSameDirection || vec2.angle(l0.outDir, l1.inDir) < Math.PI / 36) {
            // 如果角度较小，则用一阶贝塞尔曲线插值
            curve = new LineCurve(l0.EPoint, l1.SPoint);
        } else {
            // 如果角度太大，则用二阶贝塞尔曲线插值, 其 ControlPint1 为 polyline0.outDir 和 polyline1.inDir 的交点

            // debugger
            const p1 = l0.EPoint;
            const p2 = vec2.add(vec2.create(), l0.EPoint, l0.outDir);
            const p3 = vec2.add(vec2.create(), l1.SPoint, l1.inDir);
            const p4 = l1.SPoint;
            const interSect = lineInterSect(p1, p2, p3, p4);
            curve = new QuadraticCurve(l0.EPoint, interSect, l1.SPoint);
        }

        curves.push(curve);
    }
    /**
     * polyline1 是否是 polyline0 的一部分
     * @remarks 如果 合并序列首尾相同，如 [2,4,2] 则 polyline1(2) 是 polyline0(2->4) 的一部分, 此时需要避免添加重复点
     */
    const isl1PartOfl0 = (l0 === l1) || l1.points.every((p, i) => vec2.dist(p, l0.points[i]) < 1);
    if (!isl1PartOfl0) {
        curves = curves.concat(l1.curves);
    }
    return new SingleShape(curves);
}

