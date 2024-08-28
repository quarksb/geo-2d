const TOL = 1e-12;

export function getRoots(derivation: number[]) {
    switch (derivation.length) {
        case 0:
            return [];
        case 1:
            return [0];
        case 2:
            if (Math.abs(derivation[0]) < TOL) {
                return [];
            } else {
                return [-derivation[1] / derivation[0]];
            }
        case 3:
            if (Math.abs(derivation[0]) < TOL) {
                return getRoots(derivation.slice(1));
            } else {
                return getQuadraticRoots(derivation);
            }
        case 4:
            if (Math.abs(derivation[0]) < TOL) {
                return getRoots(derivation.slice(1));
            } else {
                return getCubicRoots(derivation);
            }
        default:
            throw new Error("Not implemented");
    }
}

function getQuadraticRoots(derivation: number[]) {
    const a = derivation[0];
    const b = derivation[1];
    const c = derivation[2];
    const delta = b * b - 4 * a * c;
    if (delta < 0) {
        return [];
    } else {
        const sqrtDelta = Math.sqrt(delta);
        return [(-b + sqrtDelta) / (2 * a), (-b - sqrtDelta) / (2 * a)];
    }
}

function getCubicRoots(derivation: number[]) {
    const a = derivation[0];
    const b = derivation[1];
    const c = derivation[2];
    const d = derivation[3];
    const A = b / a;
    const B = c / a;
    const C = d / a;
    const Q = (3 * B - A * A) / 9;
    const R = (9 * A * B - 27 * C - 2 * A * A * A) / 54;
    const D = Q * Q * Q + R * R;
    if (D >= 0) {
        const sqrtD = Math.sqrt(D);
        const S = Math.cbrt(R + sqrtD);
        const T = Math.cbrt(R - sqrtD);
        const roots = [-A / 3 + (S + T)];
        if (D === 0) {
            roots.push(-S / 2);
        }
        return roots;
    } else {
        const theta = Math.acos(R / Math.sqrt(-Q * Q * Q));
        const sqrtQ = Math.sqrt(-Q);
        return [2 * sqrtQ * Math.cos(theta / 3) - A / 3, 2 * sqrtQ * Math.cos((theta + 2 * Math.PI) / 3) - A / 3, 2 * sqrtQ * Math.cos((theta + 4 * Math.PI) / 3) - A / 3];
    }
}

// 交换两行
function swapRows(matrix: number[][], i: number, j: number) {
    [matrix[i], matrix[j]] = [matrix[j], matrix[i]];
}

// 高斯消元法求解线性方程组
// matrix[i] 代表第 i 个方程
export function gaussElimination(matrix: number[][]) {
    const { length: n } = matrix;
    for (let i = 0; i < n; i++) {
        // 寻找第 i 列中绝对值最大的行
        let max = i;
        for (let j = i + 1; j < n; j++) {
            if (Math.abs(matrix[j][i]) > Math.abs(matrix[max][i])) {
                max = j;
            }
        }
        swapRows(matrix, i, max);

        // 消元
        for (let j = i + 1; j < n; j++) {
            if (Math.abs(matrix[i][i]) < TOL) {
                continue;
            }
            const ratio = matrix[j][i] / matrix[i][i];
            for (let k = i; k < n + 1; k++) {
                matrix[j][k] -= ratio * matrix[i][k];
            }
        }
    }

    // 回代
    const ans = new Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) {
        if (Math.abs(matrix[i][i]) < TOL) {
            continue;
        }
        ans[i] = matrix[i][n] / matrix[i][i];
        for (let j = i - 1; j >= 0; j--) {
            matrix[j][n] -= matrix[j][i] * ans[i];
        }
    }
    console.log(matrix);

    return ans;
}


// vitest 测试
if (import.meta.vitest) {
    const { it, expect, test } = import.meta.vitest
    // it('gaussElimination 0', () => {
    //     const matrix = [
    //         [1, 2, 3, 6],
    //         [4, 5, 6, 15],
    //         [7, 8, 10, 25]
    //     ]
    //     const ans = [1, 1, 1]
    //     gaussElimination(matrix).forEach((x, i) => expect(x).toBeCloseTo(ans[i]))
    // })

    // it('gaussElimination 1', () => {
    //     const matrix = [
    //         [1, 2, 1, 1],
    //         [4, 5, 1, 1],
    //         [7, 8, 1, 1]
    //     ]
    //     expect(gaussElimination(matrix)).toEqual([0, 0, 1])
    // })

    it('gaussElimination 2', () => {
        const matrix = [
            [
                734449,
                875031.2611694336,
                1042522.6367300786,
                857,
                1021.0399780273438,
                1
            ],
            [
                734449,
                875665.4851074219,
                1044034.4282699227,
                857,
                1021.780029296875,
                1
            ],
            [
                734449,
                876299.6567382812,
                1045547.1903421879,
                857,
                1022.52001953125,
                1
            ],
            [
                734449,
                876933.8283691406,
                1047061.047585547,
                857,
                1023.260009765625,
                1
            ],
            [
                734449,
                877568,
                1048576,
                857,
                1024,
                1
            ]
        ]
        const ans = [0, 0, 0, 1 / 857, 0]
        gaussElimination(matrix).forEach((x, i) => expect(x).toBeCloseTo(ans[i]))
    })
}