import { vec2 } from "gl-matrix";
import { Curve, LineCurve, BezierCurve, QuadraticCurve } from "../../curve";
import { PathCommand, pathStringToPathCommands } from "../../utils";
import { Shape } from "./base-shape";

/**
 * ## Shape of a single path
 * one shape may contain multiple curves, and only one start point(may be is closed)
 */
export class SingleShape extends Shape {
    /**temp sign point when create Shape from data */
    private currentPos: vec2 = vec2.create();
    constructor (curves: Curve[]) {
        super(curves);
    }

    moveTo(x: number, y: number) {
        this.currentPos = vec2.fromValues(x, y);
    }

    lineTo(x: number, y: number) {
        const line = new LineCurve(this.currentPos, vec2.fromValues(x, y));
        this.curves.push(line);
        this.currentPos = vec2.fromValues(x, y);
    }

    bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number) {
        const bezier = new BezierCurve(this.currentPos, vec2.fromValues(cp1x, cp1y), vec2.fromValues(cp2x, cp2y), vec2.fromValues(x, y));
        this.curves.push(bezier);
        this.currentPos = vec2.fromValues(x, y);
    }

    quadraticCurveTo(cpx: number, cpy: number, x: number, y: number) {
        const quadratic = new QuadraticCurve(this.currentPos, vec2.fromValues(cpx, cpy), vec2.fromValues(x, y));
        this.curves.push(quadratic);
        this.currentPos = vec2.fromValues(x, y);
    }

    closePath() {
        const startPoint = this.curves[0].SPoint;
        // 如果之前已经闭合，则不再添加直线
        if (vec2.equals(this.currentPos, startPoint)) {
            return;
        }
        const line = new LineCurve(this.currentPos, this.curves[0].SPoint);
        this.curves.push(line);
    }

    static fromCommands(commands: PathCommand[]) {
        const shape = new SingleShape([]);

        let countOfM = 0;

        for (let i = 0; i < commands.length; i++) {
            const command = commands[i];
            const { type, args = [] } = command;
            const len = args.length;
            // @ts-ignore
            const { x = args[len - 2], y = args[len - 1], x1 = args[0],
                // @ts-ignore
                y1 = args[1], x2 = args[2], y2 = args[3] } = command;

            // console.log(i, "type", type, args, x, y, x1, y1, x2, y2);

            switch (type) {
                case "M":
                    shape.moveTo(x, y);
                    countOfM++;
                    if (countOfM > 1) {
                        console.error("SimpleShape can only have one start point");
                    }
                    break;
                case "L":
                    const isEqual = vec2.equals(shape.currentPos, vec2.fromValues(x, y));
                    // 如果和上一个点重合，则不添加
                    if (!isEqual) {
                        shape.lineTo(x, y);
                    }
                    break;
                case "H":
                    shape.lineTo(x, shape.currentPos[1]);
                    break;
                case "V":
                    shape.lineTo(shape.currentPos[0], y);
                    break;
                case "C":
                    shape.bezierCurveTo(x1, y1, x2, y2, x, y);
                    break;
                case "Q":
                    shape.quadraticCurveTo(x1, y1, x, y,);
                    break;
                case "Z":
                    shape.closePath();
                    break;
            }
        }
        return shape;
    }

    static fromPathString(pathStr: string) {
        const commands = pathStringToPathCommands(pathStr);
        return SingleShape.fromCommands(commands);
    }

}


if (import.meta.vitest) {
    const { it, expect, test } = import.meta.vitest
    test('SingleShape', () => {

        const commands: PathCommand[] = [
            {
                "type": "M",
                "x": 0,
                "y": 0
            },
            {
                "type": "L",
                "x": 0,
                "y": 100
            },
            {
                "type": "L",
                "x": 100,
                "y": 100
            },

            {
                "type": "Z" as const
            }
        ];
        const shape = SingleShape.fromCommands(commands);
        const line = new LineCurve(vec2.fromValues(0, 50), vec2.fromValues(1, 50));
        const result = shape.getLineIntersects(line);

        expect(result).toEqual([vec2.fromValues(0, 50), vec2.fromValues(50, 50)]);
    })

    test('SingleShape', () => {
        const commands: PathCommand[] = [
            {
                "type": "M",
                "x": 0,
                "y": 0
            },
            {
                "type": "Q",
                "x": 100,
                "y": 100,
                "x1": 0,
                "y1": 100
            },
            {
                "type": "Q",
                "x": 0,
                "y": 0,
                "x1": 100,
                "y1": 0
            },

        ];
        const shape = SingleShape.fromCommands(commands);
        const line = new LineCurve(vec2.fromValues(0, 50), vec2.fromValues(1, 50));
        const result = shape.getLineIntersects(line);

        expect(result[0][0]).toBeCloseTo(25.94);
        expect(result[0][1]).toBeCloseTo(50);
        expect(result[1][0]).toBeCloseTo(74.06);
        expect(result[1][1]).toBeCloseTo(50);
    })

    test('SingleShape', () => {
        const commands: PathCommand[] = [
            {
                "type": "M",
                "x": 1146,
                "y": 0
            },
            {
                "type": "L",
                "x": 689,
                "y": 0
            },
            {
                "type": "L",
                "x": 689,
                "y": 290
            },
            {
                "type": "L",
                "x": 771,
                "y": 290
            },
            {
                "type": "L",
                "x": 746,
                "y": 417
            },
            {
                "type": "L",
                "x": 468,
                "y": 417
            },
            {
                "type": "L",
                "x": 443,
                "y": 290
            },
            {
                "type": "L",
                "x": 527,
                "y": 290
            },
            {
                "type": "L",
                "x": 527,
                "y": 0
            },
            {
                "type": "L",
                "x": 70,
                "y": 0
            },
            {
                "type": "L",
                "x": 70,
                "y": 290
            },
            {
                "type": "L",
                "x": 147,
                "y": 290
            },
            {
                "type": "L",
                "x": 403,
                "y": 1571
            },
            {
                "type": "L",
                "x": 811,
                "y": 1571
            },
            {
                "type": "L",
                "x": 1067,
                "y": 290
            },
            {
                "type": "L",
                "x": 1146,
                "y": 290
            },
            {
                "type": "L",
                "x": 1146,
                "y": 0
            },
            {
                "type": "Z"
            },
            {
                "type": "M",
                "x": 607,
                "y": 1110
            },
            {
                "type": "L",
                "x": 527,
                "y": 707
            },
            {
                "type": "L",
                "x": 688,
                "y": 707
            },
            {
                "type": "L",
                "x": 607,
                "y": 1110
            },
            {
                "type": "Z" as const
            }
        ];
        const shape = SingleShape.fromCommands(commands);
        const line = new LineCurve(vec2.fromValues(0, 1), vec2.fromValues(3, 1));
        const result = shape.getLineIntersects(line);

        expect(result).toEqual([vec2.fromValues(1, 1), vec2.fromValues(2, 1)]);
    })

}