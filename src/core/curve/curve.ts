import { vec2 } from "gl-matrix";
import { BBox } from "../base/bbox";

export type PointFn = (vec: vec2) => void;
export abstract class Curve {
    startPoint: vec2;
    endPoint: vec2;
    protected _bbox: BBox | null = null;
    protected _len = 0;
    protected _isDirty = true;
    constructor (startPoint: vec2, endPoint: vec2) {
        this.startPoint = startPoint;
        this.endPoint = endPoint;
    }
    abstract get bbox(): BBox;
    abstract get len(): number;
    abstract getPosition(t: number): vec2;
    /**通过长度百分比位置获取坐标 */
    abstract getPosDataByPer(per: number): { pos: vec2, tan: vec2 };
    abstract getTangent(t: number | null): vec2;
    abstract getNormal(t: number | null): vec2;

    abstract getBBox(): BBox;
    abstract getLen(): number;
    abstract applyFn(fn: PointFn): void;
    abstract applyFFDFn(fn: PointFn): void;
    abstract toPathString(digits?: number): string;
    abstract toDebugPathString(digits?: number): string;
    abstract divideAt(t?: number): Curve[];
    abstract split(splitData: SplitData): Curve[];
    abstract divideAtArray(tArr: number[]): Curve[];
    // 只考虑一个交点情况
    abstract getSplitT(data: SplitData): number[];
    abstract toPoints(count?: number): vec2[];
}

export interface SplitData {
    mode: "x" | "y";
    val: number;
}
