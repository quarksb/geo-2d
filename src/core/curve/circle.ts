import { BBox, Curve } from "./curve";
import { vec2 } from "gl-matrix";

export class Circle extends Curve {
    center: vec2;
    startAngle: number;
    endAngle: number;
    radius: number;
    constructor(center: vec2, radius: number, startAngle: number, endAngle: number) {
        const startPoint = vec2.fromValues(center[0] + radius * Math.cos(startAngle), center[1] + radius * Math.sin(startAngle));
        const endPoint = vec2.fromValues(center[0] + radius * Math.cos(endAngle), center[1] + radius * Math.sin(endAngle));
        super(startPoint, endPoint);
        this.center = center;
        this.startAngle = startAngle;
        this.endAngle = endAngle;
        this.radius = radius;
    }
    applyFFD(): void {
        throw new Error("Method not implemented.");
    }
    getPosition(t: number): vec2 {
        const angle = t * (this.endAngle - this.startAngle) + this.startAngle;
        const x = this.center[0] + this.radius * Math.cos(angle);
        const y = this.center[1] + this.radius * Math.sin(angle);
        return vec2.fromValues(x, y);
    }
    getLen(): number {
        return this.radius * (this.endAngle - this.startAngle);
    }
    getBBox(): BBox {
        const x = this.center[0] - this.radius;
        const y = this.center[1] - this.radius;
        const width = 2 * this.radius;
        const height = 2 * this.radius;
        return {
            x,
            y,
            width,
            height,
        };
    }
    applyTransform(fn: (point: vec2) => void): void {
        fn(this.center);
        throw new Error("Method does not support for circle.");
    }
    toPathString(digits = 0): string {
        return `A ${this.radius.toFixed(digits)} ${this.radius.toFixed(digits)} 0 0 1 ${this.endPoint[0].toFixed(digits)} ${this.endPoint[1].toFixed(digits)}`;
    }
}