import { vec2 } from "gl-matrix";


/**
 * ### get the area of a triangle
 */
export function getTriangleArea(pA: vec2, pB: vec2, pC: vec2) {
    return Math.abs(getTriangleSignArea(pA, pB, pC));
}

/**
 * ### get the area of a triangle with sign
 */
export function getTriangleSignArea(pA: vec2, pB: vec2, pC: vec2) {
    return (pB[0] - pA[0]) * (pC[1] - pA[1]) - (pC[0] - pA[0]) * (pB[1] - pA[1]) / 2;
}