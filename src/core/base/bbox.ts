export interface BBox {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface BBox2 {
    xMin: number;
    xMax: number;
    yMin: number;
    yMax: number;
}

export function createBBox2(): BBox2 {
    return {
        xMin: Infinity,
        xMax: -Infinity,
        yMin: Infinity,
        yMax: -Infinity,
    };
}

export function mergeBBox2(bbox2A: BBox2, bbox2B: BBox2): BBox2 {
    bbox2A.xMin = Math.min(bbox2A.xMin, bbox2B.xMin);
    bbox2A.xMax = Math.max(bbox2A.xMax, bbox2B.xMax);
    bbox2A.yMin = Math.min(bbox2A.yMin, bbox2B.yMin);
    bbox2A.yMax = Math.max(bbox2A.yMax, bbox2B.yMax);
    return bbox2A;
}

/**
 * ### judge if the bbox2A include bbox2B
 * @param bbox2A
 * @param bbox2B
 * @returns 
 * @example
 * ```ts
 * const bbox2A = { xMin: 0, xMax: 10, yMin: 0, yMax: 10 };
 * const bbox2B = { xMin: 2, xMax: 8, yMin: 2, yMax: 8 };
 * console.log(includeBBox2(bbox2A, bbox2B)); // true
 * ```
 */
export function includeBBox2(bbox2A: BBox2, bbox2B: BBox2): boolean {
    return bbox2A.xMin <= bbox2B.xMin && bbox2A.xMax >= bbox2B.xMax && bbox2A.yMin <= bbox2B.yMin && bbox2A.yMax >= bbox2B.yMax;
}