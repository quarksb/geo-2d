import { vec2 } from "gl-matrix";
import { Curve } from "../curve";
import { SingleShape } from "./single-shape";
import { isPointInPoints } from "./polygon";
import { PathCommand } from "../utils";

export class ClosedShape extends SingleShape {
    constructor (public curves: Curve[]) {
        super(curves);
        this.initPoints();
    }

    includePoint(point: vec2) {
        // 1. 先判断 point 是否在 bbox 内部
        const { xMin, xMax, yMin, yMax } = this.bbox2;
        if (point[0] < xMin || point[0] > xMax || point[1] < yMin || point[1] > yMax) {
            return false;
        }

        return isPointInPoints(point, this.points);
    }

    static fromCommands(commands: PathCommand[]) {
        // 检查是否闭合
        const { length } = commands;
        if (commands[0].type !== "M" || commands[length - 1].type !== "Z") {
            console.error("ClosedShape must start with M and end with Z");
        }
        const sb = super.fromCommands(commands);
        return new ClosedShape(sb.curves);
    }
}
