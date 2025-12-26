import { vec2 } from "gl-matrix";
import { ConnectEnd, ConnectStart } from "../curve";
import { toAngle } from "./circle";

export function arrEquals<T>(v0: Array<T>, v1: Array<T>): boolean {
    if (v0.length !== v1.length) {
        return false;
    }
    for (let i = 0; i < v0.length; i++) {
        if (v0[i] !== v1[i]) {
            return false;
        }
    }
    return true;
}

export function cross(v0: vec2, v1: vec2): number {
    return v0[0] * v1[1] - v0[1] * v1[0];
}

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

export function getEaseElasticOut(t: number): number {
    const p = 0.2;
    return Math.pow(2, -10 * t) * Math.sin(((t - p / 4) * (2 * Math.PI)) / p) + 1;
}

export function getEaseElasticInOut(t: number): number {
    const p = 0.9;
    return t < 0.5
        ? 0.5 * Math.pow(2, 20 * t - 10) * Math.sin(((20 * t - 11.125) * (2 * Math.PI)) / p)
        : 0.5 * (2 - Math.pow(2, -20 * t + 10) * Math.sin(((20 * t - 11.125) * (2 * Math.PI)) / p));
}

/**
 * ### 根据尺寸返回推荐的精度
 * @param num 尺寸, 必须大于0
 * @returns 推荐的精度值，给 Number.toFixed() 使用
 */
export function getDigit(num: number, scale = 4): number {
    return Math.max(scale - Math.floor(Math.log10(num)), 0);
}

/**
 * ### merge couples
 * @param couple
 * @returns
 * @example
 * ```ts
 * mergeCouple([[1, 2], [2, 3], [3, 4], [5, 6]])
 * // [[1, 2, 3, 4], [5, 6]]
 * ```
 */

export function mergeCouple<T extends {}>(couples: T[][]): T[][] {
    // when couples is empty or only one couple, return couples
    if (couples.length <= 1) {
        return couples;
    }
    const toRightMap = new Map<T, T>();
    const toLeftMap = new Map<T, T>();
    for (const couple of couples) {
        if (couple.length < 2) {
            throw new Error("couple length must be greater than 1");
        }
        const [left, right] = [couple[0], couple[couple.length - 1]];
        toRightMap.set(left, right);
        toLeftMap.set(right, left);
    }

    const result: T[][] = [];
    let maxCount = couples.length ** 2;
    while ((toRightMap.size || toLeftMap.size) && maxCount-- > 0) {
        let cur = toRightMap.keys().next().value!;
        const values = [cur];
        let current = toRightMap.get(cur);
        while (current !== undefined && current !== cur && maxCount-- > 0) {
            values.push(current);
            toRightMap.delete(cur);
            toLeftMap.delete(current);
            cur = current;
            current = toRightMap.get(current);
        }
        cur = values[0];
        current = toLeftMap.get(cur);
        // console.log("values:", values);
        // console.log("cur,", cur, "current:", current);

        while (current !== undefined && current !== cur && maxCount-- > 0) {
            values.unshift(current);
            toRightMap.delete(current);
            toLeftMap.delete(cur);
            cur = current;
            current = toLeftMap.get(current);
        }
        result.push(values as T[]);
    }

    return result;
}

/**
 * get the angle of the curve
 * @param lastCurve
 * @param curve
 * @returns
 */
export function getCurveAngle(lastCurve: ConnectStart, curve: ConnectEnd) {
    const radian = getRadianChange(lastCurve.outDir, curve.inDir);
    return toAngle(radian);
}

/**
 * get the angle change between two vectors
 * @param v1 - the first vector
 * @param v2 - the second vector
 * @returns - the angle change from v1 to v2, range ``` (-PI, PI] 前开后闭 ```
 */
export function getRadianChange(v1: vec2, v2: vec2, tol = Math.PI / 180) {
    const sine = v1[0] * v2[1] - v1[1] * v2[0];
    const cosine = v1[0] * v2[0] + v1[1] * v2[1];
    let radian = Math.atan2(sine, cosine);
    // -PI -> PI
    if (radian < -Math.PI + tol) {
        radian = Math.PI;
    }
    return radian;
}

if (import.meta.vitest) {
    const { it, expect } = import.meta.vitest;
    it("mergeCouple", () => {
        let couples: Array<[number, number]>;
        couples = [[2, 4]];
        expect(mergeCouple(couples)).toEqual([[2, 4]]);

        couples = [
            [2, 4],
            [1, 3],
        ];
        expect(mergeCouple(couples)).toEqual([
            [2, 4],
            [1, 3],
        ]);

        couples = [
            [1, 2],
            [2, 3],
            [3, 4],
            [5, 6],
        ];
        expect(mergeCouple(couples)).toEqual([
            [1, 2, 3, 4],
            [5, 6],
        ]);

        couples = [
            [1, 2],
            [2, 3],
            [4, 1],
            [5, 6],
        ];
        expect(mergeCouple(couples)).toEqual([
            [4, 1, 2, 3],
            [5, 6],
        ]);

        couples = [
            [1, 4],
            [3, 6],
            [5, 0],
            [7, 2],
        ];
        expect(mergeCouple(couples)).toEqual([
            [1, 4],
            [3, 6],
            [5, 0],
            [7, 2],
        ]);
    });
    it("getRadianChange", () => {
        expect(getRadianChange([1, 0], [0, 1])).toBeCloseTo(Math.PI / 2);
        expect(getRadianChange([1, 0], [1, 0])).toBeCloseTo(0);
        expect(getRadianChange([1, 0], [-1, 0])).toBeCloseTo(Math.PI);
        expect(getRadianChange([-1, -1], [0, -1])).toBeCloseTo(Math.PI / 4);
    });
}
