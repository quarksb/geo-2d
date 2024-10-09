import { vec2 } from "gl-matrix";
import { checkLineCurveIntersect, Curve, LineCurve } from "../../curve";
import { SingleShape } from "./single-shape";
import { calPointsArea, isPointInPoints } from "../../math";
import { PathCommand, pathStringToPathCommands } from "../../utils";
import { BBox2, includeBBox2 } from "../../base";

export class ClosedShape extends SingleShape implements IncludeAble<vec2>, InterSectAble<LineCurve> {
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
     * judge if the point is in the polygon
     * @param point 
     * @returns 
     */
    include(point: vec2): boolean {
        // bbox check
        if (!isInBBox2(point, this.bbox2)) return false;
        return isPointInPoints(point, this.points);
    }

    intersect(lineCurve: LineCurve) {
        // 检车是否和任意一条边相交
        let isInclude = false;
        for (let i = 0; i < this.curves.length; i++) {
            const curve = this.curves[i];
            const line = new LineCurve(curve.SPoint, curve.EPoint);
            if (checkLineCurveIntersect(line, lineCurve)) {
                isInclude = true;
                break;
            }
        }
        return isInclude;
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

    static override fromPathString(pathStr: string) {
        const commands = pathStringToPathCommands(pathStr);
        return ClosedShape.fromCommands(commands);
    }

    /**
     * ### get the area of the polygon
     * @returns the area of the polygon
     */
    getArea() {
        return Math.abs(this.getSignArea());
    }

    /**
     * ### get the signed area of the polygon
     * @returns signed area
     */
    getSignArea() {
        return calPointsArea(this.points);
    }

}

export function isInBBox2(point: vec2, bbox2: BBox2): boolean {
    const { xMin, xMax, yMin, yMax } = bbox2;
    return point[0] >= xMin && point[0] <= xMax && point[1] >= yMin && point[1] <= yMax;
}


export interface IncludeAble<T> {
    include(point: T): boolean;
}

export interface InterSectAble<T> {
    intersect(obj: T): boolean;
}

/**
 * ### split path
 * - if a path is consists by multiple closed shapes, then split the path into multiple paths
 * - such as we could split a "吕" into two "口"
 */
export function splitByBBox(shapes: ClosedShape[]): ClosedShape[][] {
    // console.log("shapes", shapes.map((shape) => shape.isClockwise));

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


    // the BShape should be right hand, if not, then we should reverse the path
    if (!BShape.isClockwise) {
        console.warn("outShape should be right hand, and now I will reverse it");
        shapes.forEach((shape) => {
            shape.reverse();
        })
    }

    const outSideShapeArr: ClosedShape[] = [];
    const inSideShapeArr: ClosedShape[] = [];
    // 先找到所有的外圈，即 isClockwise 为 true 的 shape
    for (let i = 0; i < shapes.length; i++) {
        const shape = shapes[i];
        const { isClockwise, bbox2 } = shape;
        // 过滤杂点，比如 wedding 字体的 8 字就有杂点
        // console.log("bbox2:", bbox2);

        if ((bbox2.xMax - bbox2.xMin) * (bbox2.yMax - bbox2.yMin) < 1) continue;
        if (isClockwise) {
            outSideShapeArr.push(shape);
        } else {
            inSideShapeArr.push(shape);
        }
    }

    // 通过比较 bbox 查找对应的 path
    const getIndex = (inSideShape: ClosedShape) => {
        const index = outSideShapeArr.findIndex((outSideShape) => {
            return includeBBox2(outSideShape.bbox2, inSideShape.bbox2);
        });
        return index
    }

    const indexMatrix: number[][] = new Array(outSideShapeArr.length).fill(0).map(() => []);
    // 便利所有的内圈，即 isClockwise 为 false 的 shape
    for (let i = 0; i < inSideShapeArr.length; i++) {
        const shape = inSideShapeArr[i];
        const index = getIndex(shape);
        if (index !== -1) {
            indexMatrix[index].push(i);
        } else {
            console.warn("can't find the path for shape:", shape);
        }
    }

    // console.log("indexMatrix:", indexMatrix);


    // 不能直接 fill([]) 会导致所有的 indexMatrix[i] 都是同一个数组
    const result: ClosedShape[][] = new Array(outSideShapeArr.length).fill(0).map(() => []);
    for (let i = 0; i < indexMatrix.length; i++) {
        result[i].push(outSideShapeArr[i]);
        const indexArr = indexMatrix[i];
        indexArr.forEach((index) => {
            result[i].push(inSideShapeArr[index]);
        })
    }
    // console.log("result:", result);

    return result;
}
