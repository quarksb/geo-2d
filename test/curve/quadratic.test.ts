// 源码内的测试套件
import { it, test, expect, describe } from "vitest";
import { vec2 } from "gl-matrix";
import { QuadraticCurve } from "../../src";

console.log("quarksb");

describe('test for quadratic curve', () => {
    let curve = new QuadraticCurve(vec2.fromValues(0, 0), vec2.fromValues(1, 1), vec2.fromValues(2, 0));

    const points = [
        vec2.fromValues(-1, 0),
        vec2.fromValues(1, 2),
        vec2.fromValues(3, 0)
    ];

    test('get distance', () => {
        const datas = [
            { point: vec2.fromValues(-1, 0), distance: 1 },
            { point: vec2.fromValues(0, 0), distance: 0 },
            { point: vec2.fromValues(0.5, 1), distance: 0.5798392351022574 },
            { point: vec2.fromValues(1, 0), distance: 0.5 },
            { point: vec2.fromValues(2, 0), distance: 0 },
            { point: vec2.fromValues(3, 0), distance: 1 }
        ];
        for (const data of datas) {
            expect(curve.getDisToPos(data.point)).toBeCloseTo(curve.getDisToPos2(data.point));
        }
        // expect(quadraticCurve.getDisToPos(vec2.fromValues(0, 1))).toBeCloseTo(0.5);
        // expect(quadraticCurve.getDisToPos(vec2.fromValues(1, 1))).toBeCloseTo(0.5);
        // expect(quadraticCurve.getDisToPos(vec2.fromValues(2, 0))).toBeCloseTo(0);
    })

    test('get curvature', () => {
        // expect(false).toBe(true);
        expect(curve.getCurvature(0.5)).toBeCloseTo(-1);
        expect(curve.getCurvature(0)).toBeGreaterThan(-1);
        expect(curve.getCurvature(1)).toBeGreaterThan(-1);
    })

    it("getMaxCurvature 0", () => {
        const input = [232, 195, 234, 191, 283, 89]
        const maxCurvature = 0.45;
        const startPoint = vec2.fromValues(input[0], input[1]);
        const controlPoint1 = vec2.fromValues(input[2], input[3]);
        const endPoint = vec2.fromValues(input[4], input[5]);
        const bezierCurve = new QuadraticCurve(startPoint, controlPoint1, endPoint);

        const realMaxCurvature = bezierCurve.getMaxCurvature(100);
        const k = maxCurvature / realMaxCurvature
        expect(k + 1 / k).toBeCloseTo(2, 0.01);

    });
})