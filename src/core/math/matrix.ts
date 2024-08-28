/**
 * ### create a matrix which size is n * n
 * @param n the size of the matrix
 * @returns 
 */
export function createMatrix<T>(n: number): T[][] {
    // 注意不能直接 fill([]), 那样会导致所有元素都是同一个引用
    return new Array(n).fill(0).map(() => new Array(n))
}

/**
 * ### copy a matrix
 * @param matrix 
 * @returns 
 */
export function copyMatrix(matrix: number[][]): number[][] {
    return matrix.map(row => row.slice());
}