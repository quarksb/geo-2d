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

export function getEaseElasticOut(t: number): number {
    const p = 0.2;
    return Math.pow(2, -10 * t) * Math.sin(((t - p / 4) * (2 * Math.PI)) / p) + 1;
}

export function getEaseElasticInOut(t: number): number {
    const p = 0.9;
    return t < 0.5 ? 0.5 * Math.pow(2, 20 * t - 10) * Math.sin(((20 * t - 11.125) * (2 * Math.PI)) / p) : 0.5 * (2 - Math.pow(2, -20 * t + 10) * Math.sin(((20 * t - 11.125) * (2 * Math.PI)) / p));
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

export function mergeCouple<T>(couples: T[][]): T[][] {
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
        let cur = toRightMap.keys().next().value;
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
        result.push(values);
    }



    // console.log("count:", couples.length ** 2 - maxCount);
    // console.log("result:", result);

    return result;
}


if (import.meta.vitest) {
    const { it, expect } = import.meta.vitest;
    it('mergeCouple', () => {
        let couples: Array<[number, number]>;
        couples = [[2, 4]];
        expect(mergeCouple(couples)).toEqual([[2, 4]]);

        couples = [[2, 4], [1, 3]];
        expect(mergeCouple(couples)).toEqual([[2, 4], [1, 3]]);

        couples = [[1, 2], [2, 3], [3, 4], [5, 6]];
        expect(mergeCouple(couples)).toEqual([[1, 2, 3, 4], [5, 6]]);

        couples = [[1, 2], [2, 3], [4, 1], [5, 6]];
        expect(mergeCouple(couples)).toEqual([[4, 1, 2, 3], [5, 6]]);

        couples = [[1, 4], [3, 6], [5, 0], [7, 2]];
        expect(mergeCouple(couples)).toEqual([[1, 4], [3, 6], [5, 0], [7, 2]]);
    });
}