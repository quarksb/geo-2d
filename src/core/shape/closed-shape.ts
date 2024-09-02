import { vec2 } from "gl-matrix";
import { Curve } from "../curve";
import { PathCommand, SingleShape } from "./single-shape";
import { isPointInPoints } from "./polygon";


export class PointNode {
    angle: number;
    constructor (public point: vec2, public inVec: vec2, public outVec: vec2) {
        this.angle = vec2.angle(this.inVec, this.outVec);
    }
}

export class ClosedShape extends SingleShape {
    nodes: PointNode[] = [];
    constructor (public curves: Curve[]) {
        super(curves);
        this.initNodes();
    }

    initNodes() {
        let { curves } = this;
        const { length: l } = curves;
        for (let i = 0; i < l; i++) {
            const curve = curves[i];
            const lastCurve = curves[(i - 1 + l) % l];
            const point = curve.SPoint;
            this.nodes[i] = new PointNode(point, lastCurve.ouDir, curve.inDir);
        }
        this.curves = curves;
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

    /**
     * ### split the shape by node angle
     * @param angleThreshold the angle threshold to split
     * @returns 
     */
    splitByAngle(angleThreshold = 60): SingleShape[] {
        // console.log('split');
        // 如果角度大于 angleThreshold，就分割
        angleThreshold *= Math.PI / 180;
        const { curves, nodes } = this;

        const { length: l } = curves;
        const result: Curve[][] = [];
        let curveArr: Curve[] = [];
        let lastCurve = curves[0];
        for (let i = 0; i < l; i++) {
            const curve = curves[i];
            const { angle } = nodes[i];
            // console.log('angle', angle);
            // const curvature = curve.getMaxCurvature();
            // console.log(curve, 'curvature', curvature);

            // 角度超过阈值 或者 曲线类型改变
            if (angle > angleThreshold) {
                if (curveArr.length) {
                    result.push(curveArr);
                }
                curveArr = [curve];
            } else {
                curveArr.push(curve);
            }
            lastCurve = curve;
        }

        // if (curveArr.length == 8) {
        //     console.log('curveArr', curveArr);
        // }

        if (curveArr.length) {
            // 如果nodes[0] < angleThreshold, 则把 curveArr 合并到 result 的第一个元素
            const { angle } = nodes[0]
            if (angle <= angleThreshold && result.length) {
                result[0] = curveArr.concat(result[0]);
            } else {
                result.push(curveArr);
            }
        }

        const shapes = result.map(curves => new SingleShape(curves));

        return shapes
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
