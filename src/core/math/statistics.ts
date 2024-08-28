/**
 * ### get the max value of an array
 * @param arr 
 * @returns 
 */
export function max(arr: number[]): number {
    return Math.max(...arr);
}

/**
 * ### get the min value of an array
 * @param arr
 * @returns
 */
export function min(arr: number[]): number {
    return Math.min(...arr);
}

/**
 * ### get the sum of an array
 * @param arr 
 * @returns 
 */
export function sum(arr: number[]): number {
    return arr.reduce((a, b) => a + b, 0);
}

/**
 * ### get the mean value of an array
 * @param arr
 * @returns
 */
export function mean(arr: number[]): number {
    return sum(arr) / arr.length;
}

/**
 * ### get the standard deviation of an array
 * @param arr 
 * @returns 
 */
export function std(arr: number[]): number {
    const m = mean(arr);
    return Math.sqrt(variance(arr));
}

/**
 * ### get the variance of an array
 * @param arr 
 * @returns 
 */
export function variance(arr: number[]): number {
    const m = mean(arr);
    return mean(arr.map(x => Math.pow(x - m, 2)));
}


/**
 * ### Calculates the median value of an array of numbers.
 * @param arr - The array of numbers.
 * @returns The median value.
 */
export function median(arr: number[]): number {
    const sorted = arr.slice().sort((a, b) => a - b);
    const mid = Math.floor(arr.length / 2);
    return arr.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export interface LineFunc {
    /** 斜率 */
    k: number,
    /** 截距 */
    b: number,
}
export interface LineFuncFromPoints extends LineFunc {
    /**
     * ### 判定系数 
     * - 0 <= R2 <= 1
     * - R2 越接近 1，表示拟合效果越好
    */
    R2: number
}


/**
 * ### get the mode value of an array
 * @param x 
 * @param y 
 * @returns @type {LineFuncFromPoints} - the line function
 * - if k is Infinity, the line is x = b
 * - else the line is y = k * x + b
 */
export function linearRegression(x: number[], y: number[]): LineFuncFromPoints {
    const n = x.length;
    const sumX = sum(x);
    const sumY = sum(y);
    const aveY = sumY / n;
    const sumXY = sum(x.map((xi, i) => xi * y[i]));
    const sumX2 = sum(x.map(xi => xi * xi));

    const TOL = 1e-10;
    // 分母大小检测
    if (n * sumX2 - sumX * sumX < TOL) {
        // 斜率无穷大 直线类型为 x = b
        return { k: Infinity, b: sumX / n, R2: 1 };
    }
    const k = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const b = (sumY - k * sumX) / n;
    // console.log('k', k, 'b', b);
    // y = k * x + b
    /**总平方和 SST (sum of squares for total)  */
    const SST = Math.max(TOL, sum(y.map(yi => Math.pow(yi - aveY, 2))));
    /**回归平方和 SSReg (sum of squares for regression) */
    const SSR = Math.max(TOL, sum(x.map(xi => Math.pow(k * xi + b - aveY, 2))));
    // 判定系数
    const R2 = SSR / SST;
    // console.log('ssT', SST, 'ssR', SSR, 'R2', R2);

    return { k, b, R2 };
}

