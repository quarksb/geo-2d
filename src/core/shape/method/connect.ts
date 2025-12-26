import { vec2 } from "gl-matrix";
import { Shape } from "../element/base-shape";
import { cross, toAngle } from "../../math";
import { ConnectEnd, ConnectStart } from "../../curve/types";
import { Curve } from "../../curve/curve";
import { LineCurve, lineInterSect } from "../../curve/line";
import { QuadraticCurve } from "../../curve/quadratic";
import { SingleShape } from "../element/single-shape";

/**
 * get connect curve for two shapes
 * @param shape0
 * @param shape1
 * @param angleLimit 用曲线连接还是折线连接的判定角度
 * @returns
 */
export function getConnectCurve(shape0: ConnectStart, shape1: ConnectEnd, angleLimit = 30) {
    const vec = vec2.sub(vec2.create(), shape1.SPoint, shape0.EPoint);
    let curve: Curve;
    /**l0.outDir -> vec 和 vec -> l1.inDir 同向*/
    const isSameDirection = cross(shape0.outDir, vec) * cross(vec, shape1.inDir) > 0;
    const angle = toAngle(vec2.angle(shape0.outDir, shape1.inDir));

    /**@todo isSameDirection 考虑三阶贝塞尔 */
    if (
        isSameDirection &&
        angle > 1 &&
        toAngle(vec2.angle(shape0.outDir, vec)) < angleLimit &&
        toAngle(vec2.angle(vec, shape1.inDir)) < angleLimit
    ) {
        // 如果角度太大，则用二阶贝塞尔曲线插值, 其 ControlPint1 为 polyline0.outDir 和 polyline1.inDir 的交点
        curve = getQuadraticCurve(shape0, shape1);
    } else {
        // 如果角度太小或者太大，则用直线插值
        curve = new LineCurve(vec2.clone(shape0.EPoint), vec2.clone(shape1.SPoint));
    }

    return curve;
}

export function getQuadraticCurve(shape0: ConnectStart, shape1: ConnectEnd) {
    const p1 = vec2.clone(shape0.EPoint);
    const p4 = vec2.clone(shape1.SPoint);
    const p2 = vec2.add(vec2.create(), p1, shape0.outDir);
    const p3 = vec2.add(vec2.create(), p4, shape1.inDir);

    const interSect = lineInterSect(p1, p2, p3, p4);
    const curve = new QuadraticCurve(p1, interSect, p4);
    return curve;
}

/**
 * connect two shapes
 * @param shape0
 * @param shape1
 * @returns
 */
export function connectShape(shape0: Shape, shape1: Shape): SingleShape {
    if (shape0.curves.length === 0) return new SingleShape([...shape1.curves]);
    if (shape1.curves.length === 0) return new SingleShape([...shape0.curves]);

    const vec = vec2.sub(vec2.create(), shape1.SPoint!, shape0.EPoint!);
    const dist = vec2.len(vec);
    let curves = shape0.curves;
    const isContinuous = dist < 1;

    // 如果不连续，则在两 shape 中间添加一条线
    if (!isContinuous) {
        const connectCurve = getConnectCurve(shape0, shape1);
        curves.push(connectCurve);
    }
    /**
     * polyline1 是否是 polyline0 的一部分
     * @remarks 如果 合并序列首尾相同，如 [2,4,2] 则 polyline1(2) 是 polyline0(2->4) 的一部分, 此时需要避免添加重复点
     */
    const isl1PartOfl0 = shape0 === shape1 || shape1.points.every((p, i) => vec2.dist(p, shape0.points[i]) < 1);
    if (!isl1PartOfl0) {
        curves = curves.concat(shape1.curves);
    }
    return new SingleShape(curves);
}

if (import.meta.vitest) {
    const { describe, it, expect } = import.meta.vitest;
    describe("test connect", () => {
        it("getConnectCurve: QuadraticCurve0", () => {
            const shape0 = new SingleShape([new LineCurve(vec2.fromValues(0, 0), vec2.fromValues(1, 0))]);
            const shape1 = new SingleShape([new LineCurve(vec2.fromValues(2, 0.5), vec2.fromValues(2.5, 1))]);
            const curve = getConnectCurve(shape0, shape1);
            const output = new QuadraticCurve(vec2.fromValues(1, 0), vec2.fromValues(1.5, 0), vec2.fromValues(2, 0.5));
            expect(curve).toEqual(output);
        });

        // it('getConnectCurve: QuadraticCurve1', () => {
        //     const shape0 = new SingleShape([
        //         new QuadraticCurve(vec2.fromValues(1, 0), vec2.fromValues(0, 0), vec2.fromValues(0, 1))
        //     ]);
        //     const shape1 = new SingleShape([
        //         new QuadraticCurve(vec2.fromValues(0.5, -0.5),vec2.fromValues(1, -0.2), vec2.fromValues(1.5, -0.5))
        //     ]);
        //     const curve = getConnectCurve(shape0, shape1);
        //     const output = new QuadraticCurve(vec2.fromValues(1, 0), vec2.fromValues(1.5, 0), vec2.fromValues(2, 0.5));
        //     expect(curve).toEqual(output);
        // });

        it("getConnectCurve: LineCurve0", () => {
            const shape0 = new SingleShape([new LineCurve(vec2.fromValues(0, 0), vec2.fromValues(1, 0))]);
            const shape1 = new SingleShape([new LineCurve(vec2.fromValues(2, 0), vec2.fromValues(2.5, 1))]);
            const curve = getConnectCurve(shape0, shape1);
            const output = new LineCurve(vec2.fromValues(1, 0), vec2.fromValues(2, 0));
            expect(curve).toEqual(output);
        });

        it("getConnectCurve: LineCurve1", () => {
            const shape0 = new SingleShape([new LineCurve(vec2.fromValues(0, 0), vec2.fromValues(1, 0))]);
            const shape1 = new SingleShape([new LineCurve(vec2.fromValues(1, -1), vec2.fromValues(2, 0))]);
            const curve = getConnectCurve(shape0, shape1);
            const output = new LineCurve(vec2.fromValues(1, 0), vec2.fromValues(1, -1));
            expect(curve).toEqual(output);
        });
    });
}
