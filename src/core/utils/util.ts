import { vec2 } from "gl-matrix";

/**
 * vector2 to string
 * @param point
 * @param digits
 * @returns
 */
export function vec2ToStr(point: vec2, digits?: number): string {
    // +0 是为了去掉 -0
    return `${(0 + point[0]).toFixed(digits)} ${(0 + point[1]).toFixed(digits)}`;
}
