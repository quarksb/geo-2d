import { vec2 } from "gl-matrix";
import { BBox, BBox2 } from "../base";
import { type LineCurve } from "./line";
import { getRadianChange } from "../math/utils";
import { ConnectAble, ConnectEnd, ConnectStart } from "./types";

export type PointFn = (vec: vec2) => void;
/**
 * Represents an abstract curve.
 */
export abstract class Curve implements CloneAble<Curve>, SplitAble<Curve>, ConnectAble {
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
    protected _bbox2?: BBox2;
    protected _len?: number;

    /**
     * The normal vector to represent direction of the curve at the start point.
     */
    inDir: vec2 = vec2.create();
    /**
     * The normal vector to represent direction of the curve at the end point.
     */
    outDir: vec2 = vec2.create();

    /**
     * Creates a new instance of the Curve class.
     * @param startPoint - The start point of the curve.
     * @param endPoint - The end point of the curve.
     */
    constructor(startPoint: vec2, endPoint: vec2) {
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
        const { xMin, yMin, xMax, yMax } = this.bbox2;
        return { x: xMin, y: yMin, width: xMax - xMin, height: yMax - yMin };
    }

    get bbox2(): BBox2 {
        if (this._isDirty || !this._bbox2) {
            this.update();
        }
        return this._bbox2!;
    }

    get len(): number {
        if (this._isDirty || (!this._len && this._len !== 0)) {
            this.update();
        }
        return this._len!;
    }

    /**
     * Gets the deflection radian angle of the curve.
     * @remarks this is the radian angle between the inDir and ouDir,
     * it is correct for most of the time, but it not correct for bezier curve sometimes.
     */
    get radian(): number {
        const { inDir, outDir } = this;
        return getRadianChange(inDir, outDir);
    }

    protected update() {
        this._bbox2 = this._getBBox2();
        this._len = this._getLen();
        this._isDirty = false;
    }

    /**
     * Gets the bounding box of the curve.
     * @returns The bounding box.
     */
    protected abstract _getBBox2(): BBox2;

    /**
     * Gets the length of the curve.
     * @returns The length.
     */
    protected abstract _getLen(): number;

    abstract getCurvature(t: number): number;

    /**
     * ### get the max curvature of this curve
     * curvature = 1 / r, curvature > 0 means the curve is turning right, otherwise, turning left
     * @returns range from (-Infinity, Infinity)
     */
    abstract getMaxCurvature(n?: number): number;

    /**
     * ### get the mean curvature of this curve
     * curvature = 1 / r, curvature > 0 means the curve is turning right, otherwise, turning left
     * @returns range from (-Infinity, Infinity)
     */
    abstract getMeanCurvature(n?: number): number;

    /**
     * ### Gets the position on the curve at the given parameter value.
     * @param t - The parameter value.
     * @returns The position on the curve.
     */
    abstract getPosition(t: number): vec2;

    /**
     * Gets the position data (position and tangent) on the curve at the given length percentage.
     * @param per - The length percentage.
     * @returns The position data.
     */
    abstract getPosDataByPer(per: number): { pos: vec2; tan: vec2 };

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
     * @param line - The line to intersect with（代指直线，而不是线段）
     * @returns An array of intersection points.
     */
    abstract getLineIntersects(line: LineCurve): vec2[];

    /**
     * Gets the distance to the given position.
     * @param pos
     */
    abstract getDisToPos(pos: vec2): number;

    abstract splitAt(t: number): Curve[];

    /**
     * ### Divides the curve at multiple parameter values.
     * @param tArr An array of parameter values to divide the curve at.
     * @returns An array of divided curves.
     */
    splitAtArray(tArr: number[]): Curve[] {
        tArr.sort((a, b) => a - b);
        let currentCurve: Curve = this;
        const curves: Curve[] = new Array(tArr.length + 1);
        let lastT = 0;
        for (let i = 0; i < tArr.length; i++) {
            let t = tArr[i];
            t = (t - lastT) / (1 - lastT);
            lastT = tArr[i];
            const dividedCurves = currentCurve.splitAt(t);
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
        return this.splitAtArray(tArr);
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

    /**
     * Scales the curve by the given factors.
     * @param scaleX - The scale factor for the x-axis.
     * @param scaleY - The scale factor for the y-axis (optional, defaults to scaleX for uniform scaling).
     * @param origin - The origin point for scaling (optional, defaults to [0, 0]).
     */
    scale(scaleX: number, scaleY: number = scaleX, origin: vec2 = vec2.fromValues(0, 0)): void {
        const scaleFn: PointFn = (point: vec2) => {
            // Translate to origin
            vec2.subtract(point, point, origin);
            // Scale
            point[0] *= scaleX;
            point[1] *= scaleY;
            // Translate back
            vec2.add(point, point, origin);
        };
        this.applyFn(scaleFn);
    }

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
    splitAt(t: number): T[];

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
    splitAtArray(paramArr: number[]): T[];
}

export interface CoordData {
    mode: "x" | "y";
    val: number;
}
