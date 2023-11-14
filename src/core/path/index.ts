import { vec2 } from "gl-matrix";
import { Curve, LineCurve, BezierCurve, QuadraticCurve, SplitData } from "../curve";
import { pathStringToPathCommands } from "../svg";
import { isVec2DirectionClose } from "./uilts";

declare type WindingRule = "NONZERO" | "EVENODD";
export class Shape {
    curves: Curve[] = [];
    currentPos: vec2 = vec2.create();
    isSmoothArr: boolean[] = [];
    currentTangent: vec2 = vec2.create();
    constructor(curves: Curve[]) {
        this.curves = curves;
    }
    moveTo(x: number, y: number) {
        this.currentPos = vec2.fromValues(x, y);
    }
    lineTo(x: number, y: number) {
        const line = new LineCurve(this.currentPos, vec2.fromValues(x, y));

        const bezier = BezierCurve.fromLineCurve(line);
        this.curves.push(bezier);
        // 比较切线值判断一下是否连续
        const tangent = vec2.sub(vec2.create(), vec2.fromValues(x, y), this.currentPos);
        this.isSmoothArr.push(isVec2DirectionClose(tangent, this.currentTangent));

        this.currentPos = vec2.fromValues(x, y);
        this.currentTangent = line.getTangent();
    }
    bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number) {
        const bezier = new BezierCurve(this.currentPos, vec2.fromValues(cp1x, cp1y), vec2.fromValues(cp2x, cp2y), vec2.fromValues(x, y));
        this.curves.push(bezier);
        // 比较切线值判断一下是否连续
        const tangent = vec2.sub(vec2.create(), vec2.fromValues(cp1x, cp1y), this.currentPos);
        this.isSmoothArr.push(isVec2DirectionClose(tangent, this.currentTangent));
        this.currentPos = vec2.fromValues(x, y);
        this.currentTangent = bezier.getTangent(0);
    }
    quadraticCurveTo(cpx: number, cpy: number, x: number, y: number) {
        const quadratic = new QuadraticCurve(this.currentPos, vec2.fromValues(cpx, cpy), vec2.fromValues(x, y));
        this.curves.push(quadratic);
        // 比较切线值判断一下是否连续
        const tangent = vec2.sub(vec2.create(), vec2.fromValues(cpx, cpy), this.currentPos);

        this.isSmoothArr.push(isVec2DirectionClose(tangent, this.currentTangent));
        this.currentPos = vec2.fromValues(x, y);
        this.currentTangent = quadratic.getTangent(0);
    }
    closePath() {
        // 如果之前已经闭合，则不再添加直线
        if (vec2.equals(this.currentPos, this.curves[0].startPoint)) {
            return;
        }
        const line = new LineCurve(this.currentPos, this.curves[0].startPoint);
        const bezier = BezierCurve.fromLineCurve(line);
        this.curves.push(bezier);

        // 比较切线值判断一下是否连续
        const tangent = vec2.sub(vec2.create(), this.curves[0].startPoint, this.currentPos);
        this.isSmoothArr.push(isVec2DirectionClose(tangent, this.currentTangent));
        this.currentPos = this.curves[0].startPoint;
        this.currentTangent = line.getTangent();

        // 闭合的时候，最后一个点的切线和第一个点的切线也要比较一下
        const firstTangent = this.curves[0].getTangent(0);
        this.isSmoothArr.push(isVec2DirectionClose(firstTangent, this.currentTangent));
    }
    split(splitData:SplitData) {
        const curves = this.curves
            .map((curve) => {
                return curve.split(splitData);
            })
            .flat();
        this.curves = curves;
    }
    toPathString(digits = 0): string {
        // const { curves } = this;
        // let pathStr = `M ${curves[0].startPoint[0].toFixed(digits)} ${curves[0].startPoint[1].toFixed(digits)} `;
        // for (let i = 1; i < this.curves.length; i++) {
        //     pathStr += curves[i].toPathString(digits) + " ";
        // }
        let pathStr = "";
        this.curves.forEach((curve, i) => {
            if (i === 0) {
                pathStr += `M ${curve.startPoint[0].toFixed(digits)} ${curve.startPoint[1].toFixed(digits)} `;
            }
            pathStr += curve.toPathString(digits) + " ";
        });
        pathStr += "Z";
        return pathStr;
    }
    getBounds(): { xMin: number; xMax: number; yMin: number; yMax: number } {
        const bounds = {
            xMin: Infinity,
            xMax: -Infinity,
            yMin: Infinity,
            yMax: -Infinity,
        };
        this.curves.forEach((curve) => {
            const { x, y, width, height } = curve.bbox;
            bounds.xMin = Math.min(bounds.xMin, x);
            bounds.xMax = Math.max(bounds.xMax, x + width);
            bounds.yMin = Math.min(bounds.yMin, y);
            bounds.yMax = Math.max(bounds.yMax, y + height);
        });
        return bounds;
    }
}

export class ShapeGroup {
    shapes: Shape[] = [];
    windingRule: WindingRule | "NONE" = "NONZERO";
    constructor(paths: Shape[], windingRule: WindingRule | "NONE" = "NONZERO") {
        this.shapes = paths;
        this.windingRule = windingRule;
    }
    static fromPathString(pathStr: string, offsetVec: vec2 = vec2.create(), windingRule: WindingRule | "NONE" = "NONZERO") {
        const pathGroup = new ShapeGroup([], windingRule);
        const commands = pathStringToPathCommands(pathStr);
        let currentPath: Shape | null = null;
        commands.forEach((command: { type: any; args: any }) => {
            const { type, args } = command;
            switch (type) {
                case "M":
                    if (currentPath) {
                        pathGroup.shapes.push(currentPath);
                    }
                    currentPath = new Shape([]);
                    currentPath.moveTo(args[0] + offsetVec[0], args[1] + offsetVec[1]);
                    break;
                case "L":
                    currentPath!.lineTo(args[0] + offsetVec[0], args[1] + offsetVec[1]);
                    break;
                case "H":
                    const currentPoint = currentPath?.currentPos!;
                    currentPath!.lineTo(args[0] + offsetVec[0], currentPoint[1]);
                    break;
                case "C":
                    currentPath!.bezierCurveTo(args[0] + offsetVec[0], args[1] + offsetVec[1], args[2] + offsetVec[0], args[3] + offsetVec[1], args[4] + offsetVec[0], args[5] + offsetVec[1]);
                    break;
                case "Q":
                    currentPath!.quadraticCurveTo(args[0] + offsetVec[0], args[1] + offsetVec[1], args[2] + offsetVec[0], args[3] + offsetVec[1]);
                    break;
                case "Z":
                    currentPath!.closePath();
                    break;
            }
        });
        if (currentPath) {
            pathGroup.shapes.push(currentPath);
        }
        return pathGroup;
    }
    getBounds(): { xMin: number; xMax: number; yMin: number; yMax: number } {
        const bounds = {
            xMin: Infinity,
            xMax: -Infinity,
            yMin: Infinity,
            yMax: -Infinity,
        };
        this.shapes.forEach((shape) => {
            const { xMin, xMax, yMin, yMax } = shape.getBounds();
            bounds.xMin = Math.min(bounds.xMin, xMin);
            bounds.xMax = Math.max(bounds.xMax, xMax);
            bounds.yMin = Math.min(bounds.yMin, yMin);
            bounds.yMax = Math.max(bounds.yMax, yMax);
        });
        return bounds;
    }

    applyTransform(fn: (point: vec2, ratio?: number) => vec2) {
        this.shapes.forEach((shape) => {
            shape.curves.forEach((curve) => {
                curve.applyFn(fn);
            });
        });
    }

    split(splitData:SplitData) {
        this.shapes.forEach((shape) => {
            shape.split(splitData);
        });
    }

    clone() {
        const shapes = this.shapes.map((shape) => {
            const curves = shape.curves.map((curve) => {
                if (curve instanceof LineCurve) {
                    return new LineCurve(vec2.clone(curve.startPoint), vec2.clone(curve.endPoint));
                } else if (curve instanceof BezierCurve) {
                    return new BezierCurve(vec2.clone(curve.startPoint), vec2.clone(curve.controlPoint1), vec2.clone(curve.controlPoint2), vec2.clone(curve.endPoint));
                } else {
                    const quadratic = curve as QuadraticCurve;
                    return new QuadraticCurve(vec2.clone(quadratic.startPoint), vec2.clone(quadratic.controlPoint1), vec2.clone(quadratic.endPoint));
                }
            });
            return new Shape(curves);
        });
        return new ShapeGroup(shapes, this.windingRule);
    }

    toPathString(digits = 0): string {
        return this.shapes.map((shape) => shape.toPathString(digits)).join(" ");
    }
}
