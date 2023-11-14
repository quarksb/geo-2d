import { vec2 } from "gl-matrix";
const a = 1103515245;
const b = 12345;
const m = 2147483647;

export function getRandomGenerate(x = 0.314) {
    // create the next random number
    let cur = (a * x + b) % m;
    return () => {
        cur = (a * cur + b) % m;
        return cur / m;
    };
}

export function getTriangleArea(points: vec2[]) {
    const a = vec2.distance(points[0], points[1]);
    const b = vec2.distance(points[1], points[2]);
    const c = vec2.distance(points[2], points[0]);
    const s = (a + b + c) / 2;
    return Math.sqrt(s * (s - a) * (s - b) * (s - c));
}

export function getEaseElasticOut(t: number): number {
    const p = 0.2;
    return Math.pow(2, -10 * t) * Math.sin(((t - p / 4) * (2 * Math.PI)) / p) + 1;
}

export function getEaseElasticInOut(t: number): number {
    const p = 0.9;
    return t < 0.5 ? 0.5 * Math.pow(2, 20 * t - 10) * Math.sin(((20 * t - 11.125) * (2 * Math.PI)) / p) : 0.5 * (2 - Math.pow(2, -20 * t + 10) * Math.sin(((20 * t - 11.125) * (2 * Math.PI)) / p));
}
