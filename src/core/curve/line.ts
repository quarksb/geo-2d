import { vec2 } from "gl-matrix";
import { BBox, Curve } from "./curve";
import { FFD } from "./ffd";

export class LineCurve extends Curve {
    constructor(startPoint: vec2, endPoint: vec2) {
        super(startPoint, endPoint);
    }
    applyFFD(ffd: FFD): void {
        this.startPoint = ffd.transformPoint(this.startPoint);
        this.endPoint = ffd.transformPoint(this.endPoint);
    }
    getPosition(t: number): vec2 {
        const x = this.startPoint[0] + (this.endPoint[0] - this.startPoint[0]) * t;
        const y = this.startPoint[1] + (this.endPoint[1] - this.startPoint[1]) * t;
        return vec2.fromValues(x, y);
    }
    getLen(): number {
        return vec2.distance(this.startPoint, this.endPoint);
    }
    getBBox(): BBox {
        let x, y, width, height;
        if (this.startPoint[0] < this.endPoint[0]) {
            x = this.startPoint[0];
            width = this.endPoint[0] - this.startPoint[0];
        } else {
            x = this.endPoint[0];
            width = this.startPoint[0] - this.endPoint[0];
        }
        if (this.startPoint[1] < this.endPoint[1]) {
            y = this.startPoint[1];
            height = this.endPoint[1] - this.startPoint[1];
        } else {
            y = this.endPoint[1];
            height = this.startPoint[1] - this.endPoint[1];
        }

        return {
            x,
            y,
            width,
            height,
        };
    }
    applyTransform(fn: (point: vec2) => void): void {
        fn(this.startPoint);
        fn(this.endPoint);
    }
    toPathString(digits = 0): string {
        return `L ${this.endPoint[0].toFixed(digits)} ${this.endPoint[1].toFixed(digits)}`;
    }
}
