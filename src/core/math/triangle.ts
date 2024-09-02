import { vec2 } from "gl-matrix";
import { calPointsArea } from "../shape";


/**
 * ### get the area of a triangle
 */
export function getTriangleArea(pA: vec2, pB: vec2, pC: vec2) {
    return Math.abs(calPointsArea([pA, pB, pC]));
}