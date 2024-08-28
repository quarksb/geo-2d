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