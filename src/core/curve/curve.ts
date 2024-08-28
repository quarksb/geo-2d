import { vec2 } from "gl-matrix";
import { BBox } from "../base/bbox";
import { BezierCurve } from "./bezier";
import { type LineCurve } from "./line";

export type PointFn = (vec: vec2) => void;
/**
 * Represents an abstract curve.
 */
export abstract class Curve implements CloneAble<Curve>, SplitAble<Curve> {
    /**
     * The type of the curve.
     */
    type: string = "curve";

    protected _isDirty: boolean = true;

    /**
    * The start point of the curve.
    */
    protected _SPoint: vec2 = vec2.create();

    /**
     * The end point of the curve.
     */
    protected _EPoint: vec2 = vec2.create();
    protected _bbox?: BBox;
    protected _len?: number;

    /**
     * The direction of the curve at the start point.
     */
    inDir: vec2 = vec2.create();
    /**
     * The direction of the curve at the end point.
     */
    ouDir: vec2 = vec2.create();

    /**
     * Creates a new instance of the Curve class.
     * @param startPoint - The start point of the curve.
     * @param endPoint - The end point of the curve.
     */
    constructor (startPoint: vec2, endPoint: vec2) {
        this.SPoint = startPoint;
        this.EPoint = endPoint;
        this._isDirty = false;
    }

    set SPoint(val: vec2) {
        this._isDirty ||= !vec2.exactEquals(this._SPoint, val);
        this._SPoint = val;
    }

    get SPoint(): vec2 {
        return this._SPoint;
    }

    set EPoint(val: vec2) {
        this._isDirty ||= !vec2.exactEquals(this._EPoint, val);
        this._EPoint = val;
    }

    get EPoint(): vec2 {
        return this._EPoint;
    }

    get bbox(): BBox {
        if (this._isDirty || !this._bbox) {
            this.update();
        }
        return this._bbox!;
    }

    get len(): number {
        if (this._isDirty || (!this._len && this._len !== 0)) {
            this.update();
        }
        return this._len!;
    }

    protected update() {
        this._bbox = this._getBBox();
        this._len = this._getLen();
        this._isDirty = false;
    }

    /**
     * Gets the bounding box of the curve.
     * @returns The bounding box.
     */
    protected abstract _getBBox(): BBox;

    /**
     * Gets the length of the curve.
     * @returns The length.
     */
    protected abstract _getLen(): number;

    /**
     * Gets the length of the curve.
     * @param coordData 
    abstract get len(): number;

    /**
     * Gets the position on the curve at the given parameter value.
     * @param t - The parameter value.
     * @returns The position on the curve.
     */
    abstract getPosition(t: number): vec2;

    /**
     * Gets the position data (position and tangent) on the curve at the given length percentage.
     * @param per - The length percentage.
     * @returns The position data.
     */
    abstract getPosDataByPer(per: number): { pos: vec2, tan: vec2 };

    /**
     * Gets the tangent vector on the curve at the given parameter value.
     * @param t - The parameter value.
     * @returns The tangent vector.
     */
    abstract getTangent(t?: number): vec2;

    /**
     * Gets the normal vector on the curve at the given parameter value.
     * @param t - The parameter value.
     * @returns The normal vector.
     */
    abstract getNormal(t?: number): vec2;

    /**
     * Gets the parameter values at which the curve is split by the given coordinate data.
     * @param coordData - The coordinate data to split the curve at.
     * @returns An array of parameter values.
     */
    abstract getSplitT(coordData: CoordData): number[];

    /**
     * Finds the intersection points between the curve and a line.
     * @param line - The line curve.
     * @returns An array of intersection points.
     */
    abstract getLineIntersects(line: LineCurve): vec2[];

    /**
     * Gets the distance to the given position.
     * @param pos 
     */
    abstract getDisToPos(pos: vec2): number;

    abstract divideAt(t: number): Curve[];

    /**
     * ### Divides the curve at multiple parameter values.
     * @param tArr An array of parameter values to divide the curve at.
     * @returns An array of divided curves.
     */
    divideAtArray(tArr: number[]): Curve[] {
        tArr.sort((a, b) => a - b);
        let currentCurve: Curve = this;
        const curves: Curve[] = new Array(tArr.length + 1);
        let lastT = 0
        for (let i = 0; i < tArr.length; i++) {
            let t = tArr[i];
            t = (t - lastT) / (1 - lastT);
            lastT = tArr[i];
            const dividedCurves = currentCurve.divideAt(t);
            curves[i] = dividedCurves[0];
            currentCurve = dividedCurves[1];
        }
        curves[tArr.length] = currentCurve;
        return curves;
    }

    /**
     * Splits the line curve by a given coordinate data.
     * @param splitData The coordinate data.
     * @returns An array of divided line curves.
     */
    splitByCoord(splitData: CoordData): Curve[] {
        const tArr = this.getSplitT(splitData);
        return this.divideAtArray(tArr);
    }

    /**
     * Applies a function to each point on the curve.
     * @param fn - The function to apply.
     */
    abstract applyFn(fn: PointFn): void;

    /**
     * Applies a function to each point on the curve using forward finite difference method.
     * @param fn - The function to apply.
     */
    abstract applyFFDFn(fn: PointFn): void;

    abstract reverse(): void;

    /**
     * Converts the curve to a path string.
     * @param digits - The number of digits to round the coordinates to.
     * @returns The path string.
     */
    abstract toPathString(digits?: number): string;

    /**
     * Converts the curve to a debug path string.
     * @param digits - The number of digits to round the coordinates to.
     * @returns The debug path string.
     */
    abstract toDebugPathString(digits?: number): string;

    /**
     * Clones the curve.
     * @returns The cloned curve.
     */
    abstract clone(): Curve;
}


export interface CloneAble<T> {
    /**
     * Clones the curve.
     * @returns The cloned curve.
     */
    clone(): T;
}

export interface SplitAble<T> {
    /**
     * Divides the curve at the given parameter value.
     * @param t - The parameter value to divide the curve at.
     * @returns An array of divided curves.
     */
    divideAt(t: number): T[];

    /**
     * Splits the curve at the given coordinate data.
     * @param coordData - The coordinate data to split the curve at.
     * @returns An array of split curves.
     */
    splitByCoord(coordData: CoordData): T[];

    /**
     * Divides the curve at the given array of parameter values.
     * @param paramArr - The array of parameter values to divide the curve at.
     * @returns An array of divided curves.
     */
    divideAtArray(paramArr: number[]): T[];
}

export interface CoordData {
    mode: "x" | "y";
    val: number;
}
