export interface BBox {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface Bounds {
    xMin: number;
    xMax: number;
    yMin: number;
    yMax: number;
}

export function createBounds(): Bounds {
    return {
        xMin: Infinity,
        xMax: -Infinity,
        yMin: Infinity,
        yMax: -Infinity,
    };
}