import { vec2 } from "gl-matrix";
import { BBox } from "../BBox";

export type PointFn = (vec: vec2) => void;
export abstract class Curve {
    startPoint: vec2;
    endPoint: vec2;
    protected _bbox: BBox | null = null;
    protected _isDirty = true;
    constructor(startPoint: vec2, endPoint: vec2) {
        this.startPoint = startPoint;
        this.endPoint = endPoint;
    }
    abstract get bbox(): BBox;
    abstract getPosition(t: number): vec2;
    abstract getTangent(t: number | null): vec2;
    abstract getNormal(t: number | null): vec2;
    abstract getLen(): number;
    abstract getBBox(): BBox;
    abstract applyFn(fn: PointFn): void;
    abstract applyFFDFn(fn: PointFn): void;
    abstract toPathString(digits?: number): string;
    abstract toDebugPathString(digits?: number): string;
    abstract divideAt(t?: number): Curve[];
    abstract split(splitData: SplitData): Curve[];
    abstract divideAtArray(tArr: number[]): Curve[];
    // 只考虑一个交点情况
    abstract getSplitT(data: SplitData): number[];
}

export interface SplitData {
    mode: "x" | "y";
    val: number;
}

