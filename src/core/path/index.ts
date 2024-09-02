import { vec2 } from "gl-matrix";
import { ClosedShape, Shape } from "../shape";
import { PathCommand, pathStringToPathCommands } from "../utils/svg";
import { BBox2, createBBox2, includeBBox2 } from "../base";
import { CoordData, LineCurve, PointFn } from "../curve";

declare type WindingRule = "NONZERO" | "EVENODD";

/**
 * ## Path
 * a collection of shapes
 */
export class Path {
    constructor (public shapes: ClosedShape[], public windingRule: WindingRule | "NONE" = "NONZERO") {
    }
    static fromCommands(commands: PathCommand[]): Path {
        // 先遍历一遍 commands, 拆分 commands，每个 M 命令之间的命令为一个 shape
        const commandsArr: PathCommand[][] = [];
        let currentCommands: PathCommand[] = [];
        for (const command of commands) {
            if (command.type === "M") {
                if (currentCommands.length > 0) {
                    commandsArr.push(currentCommands);
                }
                currentCommands = [command];
            } else {
                currentCommands.push(command);
            }
        }
        if (currentCommands.length > 0) {
            commandsArr.push(currentCommands);
        }

        const shapes = commandsArr.map((commands) => {
            const shape = ClosedShape.fromCommands(commands);
            return shape;
        });

        return new Path(shapes);

    }

    static fromPathString(pathStr: string) {
        const commands = pathStringToPathCommands(pathStr);
        return Path.fromCommands(commands);
    }

    getBBox2(bbox2 = createBBox2()): BBox2 {
        for (const shape of this.shapes) {
            shape.getBBox2(bbox2);
        }
        return bbox2;
    }

    includePoint(point: vec2) {
        let isInclude = true;
        for (const shape of this.shapes) {
            const { isRightHand } = shape;
            const isShapeInclude = shape.includePoint(point);
            isInclude &&= isRightHand ? isShapeInclude : !isShapeInclude;
            if (!isInclude) {
                return false;
            }
        }
        return isInclude;
    }

    applyFn(fn: PointFn) {
        for (const shape of this.shapes) {
            for (const curve of shape.curves) {
                curve.applyFn(fn);
            }
        }
    }

    applyFFDFn(fn: PointFn) {
        for (const shape of this.shapes) {
            for (const curve of shape.curves) {
                curve.applyFFDFn(fn);
            }
        }
    }

    intersectLine(line: LineCurve): vec2[] {
        let points: vec2[] = [];
        for (const shape of this.shapes) {
            points = points.concat(shape.getLineIntersects(line));
        }
        return points;
    }

    /**
     * ### split path
     * - if a path is consists by multiple closed shapes, then split the path into multiple paths
     * - such as we could split a "吕" into two "口"
     */
    splitByBBox(): Path[] {
        const { shapes } = this;
        const shapeArr: ClosedShape[][] = [];
        for (let index = 0; index < shapes.length; index++) {
            const shape = shapes[index];
            const { bbox2, isRightHand } = shape;
            if (isRightHand) {
                // 如果是顺时针，则代表一个新的 path
                shapeArr.push([shape]);
            } else {
                // 反之，如果是逆时针，说明是内部结构，需要添加进已有的 path 中

                // 通过  查找对应的 path
                const lastShapes = shapeArr.find((shapes) => {
                    const lastBBox2 = shapes[0].bbox2;
                    return includeBBox2(lastBBox2, bbox2);
                });

                if (lastShapes) {
                    lastShapes.push(shape);
                } else {
                    console.error("can't find the path for the shape", shape);
                }
            }
        }
        const paths = shapeArr.map((shapes) => {
            return new Path(shapes);
        });
        return paths;
    }

    splitByCoord(splitData: CoordData) {
        for (const shape of this.shapes) {
            shape.splitByCoord(splitData);
        }
    }

    toPathString(digits = 0): string {
        let path = "";
        for (const shape of this.shapes) {
            // 每个 shape 之间用空格分隔(或许是 figma 需要)
            path += shape.toPathString(digits) + " ";
        }
        // 删除最后一空格
        path = path.slice(0, -1);
        return path;
    }

    toPoints(count: number) {
        let points: vec2[] = [];
        for (const shape of this.shapes) {
            points = points.concat(shape.toPoints(count));
        }
        return points;
    }

    clone() {
        const shapes = this.shapes.map((shape) => {
            const curves = shape.curves.map((curve) => {
                return curve.clone();
            });
            return new ClosedShape(curves);
        });
        return new Path(shapes, this.windingRule);
    }
}

if (import.meta.vitest) {
    const { it, expect, test } = import.meta.vitest
    test("Path", () => {
        const pathStr = "M 100 100 L 200 100 L 200 200 Z";
        const path = Path.fromPathString(pathStr);
        const bbox2 = path.getBBox2();

        expect(bbox2).toEqual({
            xMin: 100,
            yMin: 100,
            xMax: 200,
            yMax: 200,
        });
    });

    test("Path-includePoint", () => {
        const pathStr = "M 0 0 L 100 0 L 0 100 Z M 20 20 L 20 80 L 80 20 Z";
        const path = Path.fromPathString(pathStr);
        expect(path.includePoint(vec2.fromValues(10, 50))).toBeTruthy();
        expect(path.includePoint(vec2.fromValues(40, 50))).toBeFalsy();
    })
}