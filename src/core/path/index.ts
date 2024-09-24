import { vec2 } from "gl-matrix";
import { ClosedShape, IncludeAble, InterSectAble, splitByBBox } from "../shape";
import { PathCommand, pathStringToPathCommands } from "../utils/svg";
import { BBox2, createBBox2 } from "../base";
import { CoordData, LineCurve, PointFn } from "../curve";

declare type WindingRule = "NONZERO" | "EVENODD";

/**
 * ## Path
 * a collection of shapes
 */
export class Path implements IncludeAble<vec2>, InterSectAble<LineCurve> {
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

    include(point: vec2) {
        let isInclude = true;
        for (const shape of this.shapes) {
            const { isClockwise } = shape;
            const isShapeInclude = shape.include(point);
            isInclude &&= isClockwise ? isShapeInclude : !isShapeInclude;
            if (!isInclude) {
                return false;
            }
        }
        return true;
    }

    intersect(lineCurve: LineCurve) {
        // 检车是否和任意一条边相交
        return this.shapes.some((shape) => {
            return shape.intersect(lineCurve);
        });
    }

    applyFn(fn: PointFn) {
        for (const shape of this.shapes) {
            shape.applyFn(fn);
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

    splitByBBox(): Path[] {
        const shapesArr = splitByBBox(this.shapes);

        const paths: Path[] = [];
        for (const shapes of shapesArr) {
            if (shapes.length > 0) {
                paths.push(new Path(shapes));
            }
        }
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
        expect(path.include(vec2.fromValues(10, 50))).toBeTruthy();
        expect(path.include(vec2.fromValues(40, 50))).toBeFalsy();
    })
}