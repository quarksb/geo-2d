import { vec2 } from "gl-matrix";
import { getTriangleSignArea } from "./triangle";

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

    return a * b * c / 4 / Math.sqrt(s * (s - a) * (s - b) * (s - c));
}


/**
 * ### calculate the curvature of a circle(with sign)
 * curvature = sign * 1 / r
 * @param pointA 
 * @param pointB 
 * @param pointC 
 * @returns 
 */
export function getCurvature(pointA: vec2, pointB: vec2, pointC: vec2) {
    const a = vec2.distance(pointA, pointB);
    const b = vec2.distance(pointB, pointC);
    const c = vec2.distance(pointC, pointA);

    return getTriangleSignArea(pointA, pointB, pointC) / (a * b * c);
}