import { vec2 } from "gl-matrix";
import { FFD } from "./ffd";

export abstract class Curve {
    startPoint: vec2;
    endPoint: vec2;
    constructor(startPoint: vec2, endPoint: vec2) {
        this.startPoint = startPoint;
        this.endPoint = endPoint;
    }
    abstract getPosition(t: number): vec2;
    abstract getLen(): number;
    abstract applyFFD(ffd: FFD): void;
    abstract getBBox(): BBox;
    abstract applyTransform(fn: (point: vec2) => void): void;
    abstract toPathString(digits?: number): string;
    toString(): string {
        return `Curve(${this.startPoint}, ${this.endPoint})`;
    }
}

export interface BBox {
    x: number;
    y: number;
    width: number;
    height: number;
}
