import { vec2 } from "gl-matrix";
import { ClosedShape, IncludeAble, InterSectAble, splitByBBox } from "../shape";
import { PathCommand, pathStringToPathCommands } from "../utils/svg";
import { BBox2, createBBox2 } from "../base";
import { CoordData, PointFn } from "../curve/curve";
import { LineCurve } from "../curve/line";

declare type WindingRule = "NONZERO" | "EVENODD";

/**
 * ## Path
 * a collection of shapes
 */
export class Path implements IncludeAble<vec2>, InterSectAble<LineCurve> {
    constructor(
        public shapes: ClosedShape[],
        public windingRule: WindingRule | "NONE" = "NONZERO"
    ) {}
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

    getArea() {
        let area = 0;
        for (const shape of this.shapes) {
            area += shape.getArea();
        }
        return area;
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
    const { it, expect, test } = import.meta.vitest;
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
    });

    test("Path-mixedCase", () => {
        // path with lowercase relative commands and lowercase z
        const pathStr =
            "M834.3,1932.2l-82.7-2.7l-82.9-3.4l-84-5l-84.1-5.7l-174.1-12.6l34.9-652.8l2-66.2l0.7-66.2l-1-33.3l-1.7-33.3" +
            "l-5.2-66.6l-8-67.6l-4.9-33.6l-5.6-33.5l-15.7-76.6l-18.6-82.5l30-7.3l23.5-6.5l13.5-4.8l13.1-5.7l11.8-6.2l11.3-7l10.2-7.5" +
            "l9.6-8.3l8.7-9l8-9.6l7.3-10.5l6.6-11l6-12.2l5.1-12.6l5.8-18.9l2.3-9l1-5.3l4.2-26.5l1.5-17.4l0.5-17.5l-0.4-20.4l-1.1-20.4" +
            "l-1.7-20.4l-2.4-20.3l-3.7-24l-4.5-23.7L459,301l-14-49l-16.9-54.6L783.1,60.7l3.9,34.3l3.7,25.8l5.4,24.7l7.1,24l8.1,20.3l10,19.4" +
            "l10.8,16.3l12.5,15l13.7,12.6l15.1,11l17,9.2l17.9,7.3l20.6,5.8l21.1,3.7l24.9,1.6l25.1,0.5l25.2-0.5l24.8-1.6l21.2-3.7l20.6-5.8" +
            "l17.9-7.3l17-9.2l15.1-11l13.7-12.6l12.5-15l10.8-16.3l10-19.4l8.1-20.3l7.1-24.1l5.4-24.7l3.7-25.8l3.9-34.3l354.9,136.8L1555,252" +
            "l-14,49l-10.8,47.4l-4.4,23.7l-3.7,24l-2.4,20.3l-1.7,20.4l-1.1,20.4l-0.4,20.4l0.5,17.5l1.5,17.4l4.3,27l0.8,4.4l4,13.8l4.3,14.6" +
            "l8,17.8l3.1,7.1l6.5,10.9l7.3,10.5l8,9.6l8.7,9l9.6,8.3l10.2,7.5l11.3,7l11.8,6.2l13.1,5.7l13.5,4.8l23.5,6.5l30,7.3l-18.6,82.5" +
            "l-15.7,76.6l-5.6,33.5l-4.9,33.6l-8,67.5l-5.2,66.6l-1.7,33.3l-1,33.3l0.7,66.2l2,66.2l17.7,332.1l2.8,53.6l14.3,267.1l-174.1,12.6" +
            "l-84,5.7l-84.2,5l-82.7,3.4l-82.8,2.7l-165.7,4.6L834.3,1932.2z M1720.6,2000V0H279.4v2000H1720.6z";
        expect(() => Path.fromPathString(pathStr)).not.toThrow();
        const path = Path.fromPathString(pathStr);
        expect(path.shapes.length).toBe(2);
    });
}
