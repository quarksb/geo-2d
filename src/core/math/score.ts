// Score related functions

/**
 * ### get the distance mark
 * 函数 y = f(x)，满足以下条件：
 * 
 * - 当 x < 0 时，y = 0。
 * - 当 0 ≤ x ≤ k 时，y 从 0 逐渐增大到 1。
 * - 当 x > k 时，y 从 1 逐渐减小到 0。
 * 
 * @param x 
 * @param k 
 * @returns 
 */
export function getDistMark(x: number, k: number) {
    return Math.exp(-(x - 1) / k);
}

export function getAngleMark(val: number, limit: number) {
    return Math.max(1 - val / limit, 0);
}