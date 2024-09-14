import { vec2 } from "gl-matrix";

/**
 * convert angle to radian
 * @param angle 
 * @returns 
 */
export function toRadian(angle: number) {
    return angle * Math.PI / 180;
}

/**
 * convert radian to angle
 * @param radian 
 * @returns 
 */
export function toAngle(radian: number) {
    return radian * 180 / Math.PI;
}

/**
 * convert vec2 to angle(not radian)
 * @param vec 
 * @returns 
 */
export function vec2ToAngle(vec: vec2) {
    return toAngle(Math.atan2(vec[1], vec[0]));
}

/**
 * ### calculate the radius of a circle
 * @param pointA 
 * @param pointB 
 * @param pointC 
 * @returns 
 */
export function calRadius(pointA: vec2, pointB: vec2, pointC: vec2) {
    const a = vec2.distance(pointA, pointB);
    const b = vec2.distance(pointB, pointC);
    const c = vec2.distance(pointC, pointA);
    const s = (a + b + c) / 2;

    // 分母
    const denominator = 4 * Math.sqrt(s * (s - a) * (s - b) * (s - c));
    if (Math.abs(denominator) < 1E-20) {
        return Infinity;
    }
    return a * b * c / 4 / Math.sqrt(s * (s - a) * (s - b) * (s - c));
}
