import { vec2 } from "gl-matrix";

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
