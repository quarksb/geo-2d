import { vec2 } from "gl-matrix";
import { ClosedShape, Shape } from "../shape";
import { pathStringToPathCommands } from "../utils/svg";
import { BBox2, createBBox2 } from "../base";
import { PathCommand } from "../shape/single-shape";
import { CoordData, LineCurve, PointFn } from "../curve";

declare type WindingRule = "NONZERO" | "EVENODD";

/**
 * ## Path
 * a collection of shapes
 */
export class Path {
    constructor (public shapes: Shape[], public windingRule: WindingRule | "NONE" = "NONZERO") {
    }
    static fromCommands(commands: PathCommand[], windingRule: WindingRule | "NONE" = "NONZERO"): Path {
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

        return new Path(shapes, windingRule);

    }

    static fromPathString(pathStr: string, windingRule: WindingRule | "NONE" = "NONZERO") {
        const commands = pathStringToPathCommands(pathStr);
        return Path.fromCommands(commands, windingRule);
    }

    getBBox2(bounds = createBBox2()): BBox2 {
        for (const shape of this.shapes) {
            shape.getBBox2(bounds);
        }
        return bounds;
    }

    applyFn(fn: PointFn) {
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
}