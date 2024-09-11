import { vec2 } from "gl-matrix";
import { Curve } from "../../curve";
import { SingleShape } from "./single-shape";
import { isPointInPoints } from "./polygon";
import { PathCommand } from "../../utils";
import { includeBBox2 } from "../../base";

export class ClosedShape extends SingleShape {
    constructor (public curves: Curve[]) {
        super(curves);
        // check whether it's closed
        const { EPoint, SPoint } = this;
        if (vec2.distance(EPoint, SPoint) > 1E-1) {
            console.error("ClosedShape must be closed");
        }
        this.initPoints();
    }

    /**
     * ## includePoint
     * - check whether the point is in the shape
     * @param point
     * @returns
     * - true: the point is in the shape
     * - false: the point is not in the shape
     * - if the point is on the edge of the shape, then return false
     */
    includePoint(point: vec2) {
        // 1. 先判断 point 是否在 bbox 内部
        const { xMin, xMax, yMin, yMax } = this.bbox2;
        if (point[0] <= xMin || point[0] >= xMax || point[1] <= yMin || point[1] >= yMax) {
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


/**
 * ### split path
 * - if a path is consists by multiple closed shapes, then split the path into multiple paths
 * - such as we could split a "吕" into two "口"
 */
export function splitByBBox(shapes: ClosedShape[]): ClosedShape[][] {
    // console.log("shapes", shapes.map((shape) => shape.isRightHand));

    // 先找到所有的路径，找到 bbox 最大的作为 path 的起始
    /**biggest shape */
    let BShape = shapes[0];
    for (let i = 1; i < shapes.length; i++) {
        const shape = shapes[i];
        const { bbox2 } = shape;
        if (bbox2.xMin < BShape.bbox2.xMin) {
            BShape = shape;
        }
    }

    // check whether the shape is biggest
    // const isRealBiggest = shapes.every((shape) => {
    //     const { bbox2 } = shape;
    //     return bbox2.xMin >= BShape.bbox2.xMin || bbox2.yMin >= BShape.bbox2.yMin || bbox2.xMax <= BShape.bbox2.xMax || bbox2.yMax <= BShape.bbox2.yMax;
    // })

    // if (!isRealBiggest) {
    //     console.warn("the biggest shape is not real biggest");
    // }

    // the BShape should be right hand, if not, then we should reverse the path
    if (!BShape.isRightHand) {
        shapes.forEach((shape) => {
            shape.reverse();
        })
    }

    const shapeArr: ClosedShape[][] = [];
    // 先找到所有的外圈，即 isRightHand 为 true 的 shape
    for (let i = 0; i < shapes.length; i++) {
        const shape = shapes[i];
        const { isRightHand } = shape;
        if (isRightHand) {
            // 顺时针，说明是外部结构，需要添加进 shapeArr
            shapeArr.push([shape]);
        }
    }

    // console.log("shapeArr", shapeArr);

    // 再找到所有的内圈，即 isRightHand 为 false 的 shape
    for (let i = 0; i < shapes.length; i++) {
        const shape = shapes[i];
        const { bbox2, isRightHand } = shape;
        if (!isRightHand) {
            // 逆时针，说明是内部结构，需要添加进已有的 path 中

            // 通过  查找对应的 path
            const lastShapes = shapeArr.find((shapes) => {
                if (!shapes[0]) {
                    return false;
                }
                const lastBBox2 = shapes[0].bbox2;
                // console.log("lastBBox2", shapes[0], lastBBox2, bbox2);

                return includeBBox2(lastBBox2, bbox2);
            });

            if (lastShapes) {
                lastShapes.push(shape);
            } else {
                console.warn("can't find the path for shape:", shape);
            }
        }
    }

    return shapeArr;
}
