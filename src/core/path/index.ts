import { vec2 } from "gl-matrix";
import { Curve, LineCurve, BezierCurve, QuadraticCurve } from "../curve";
import { pathStringToPathCommands } from "../svg";
import { findRayIntersection, isVec2DirectionClose } from "./uilts";

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
        this.curves.push(line);
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
        this.curves.push(line);

        // 比较切线值判断一下是否连续
        const tangent = vec2.sub(vec2.create(), this.curves[0].startPoint, this.currentPos);
        this.isSmoothArr.push(isVec2DirectionClose(tangent, this.currentTangent));
        this.currentPos = this.curves[0].startPoint;
        this.currentTangent = line.getTangent();

        // 闭合的时候，最后一个点的切线和第一个点的切线也要比较一下
        const firstTangent = this.curves[0].getTangent(0);
        this.isSmoothArr.push(isVec2DirectionClose(firstTangent, this.currentTangent));
    }
    toPathString(digits = 0): string {
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
}

export class ShapeGroup {
    shapes: Shape[] = [];
    constructor(paths: Shape[]) {
        this.shapes = paths;
    }
    static fromPathString(pathStr: string) {
        const pathGroup = new ShapeGroup([]);
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
                    currentPath.moveTo(args[0], args[1]);
                    break;
                case "L":
                    currentPath?.lineTo(args[0], args[1]);
                    break;
                case "H":
                    const currentPoint = currentPath?.currentPos!;
                    currentPath?.lineTo(args[0], currentPoint[1]);
                    break;
                case "C":
                    currentPath?.bezierCurveTo(args[0], args[1], args[2], args[3], args[4], args[5]);
                    break;
                case "Q":
                    currentPath?.quadraticCurveTo(args[0], args[1], args[2], args[3]);
                    break;
                case "Z":
                    currentPath?.closePath();
                    break;
            }
        });
        if (currentPath) {
            pathGroup.shapes.push(currentPath);
        }
        return pathGroup;
    }
    
    toPathString(digits = 0): string {
        return this.shapes.map((shape) => shape.toPathString(digits)).join(" ");
    }
}
