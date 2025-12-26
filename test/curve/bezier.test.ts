// 源码内的测试套件
import { it, test, expect, describe } from "vitest";
import { vec2 } from "gl-matrix";
import { BezierCurve } from "../../src/core/curve/bezier";

describe("test for quadratic curve", () => {
    const TestDataArr = [
        // {
        //     input: [100, 0, 200, 0, 300, 0, 400, 0],
        //     bbox: { x: 100, y: 0, width: 300, height: 0 },
        //     cusps: [],
        // },
        // {
        //     input: [0, 0, 100, 100, 0, 100, 100, 0],
        //     bbox: { x: 0, y: 0, width: 100, height: 75 },
        //     cusps: [0.5],
        // },
        {
            input: [0, 0, 0.551785, 0, 1, 1 - 0.551785, 1, 1],
            bbox: {
                height: 1,
                width: 1,
                x: 0,
                y: 0,
            },
            maxCurvature: 1,
        },
        {
            input: [385, 165, 645, 165, 645, 70, 750, 165],
            bbox: {
                height: 42.22222137451172,
                width: 365,
                x: 385,
                y: 122.77777862548828,
            },
            maxCurvature: 0.01233610133269891,
        },
        {
            input: [74.87, 127.58, -74.96, 39.46, 39.85, -38.02, 78.87, 20.89],
            bbox: {
                height: 127.27870574593544,
                width: 78.86941333918367,
                x: 0.000589407398365438,
                y: 0.30129608511924744,
            },
            maxCurvature: 0.026469714599991784,
        },
    ];

    it("bbox", () => {
        for (const testData of TestDataArr) {
            const { input, bbox } = testData;
            const startPoint = vec2.fromValues(input[0], input[1]);
            const controlPoint1 = vec2.fromValues(input[2], input[3]);
            const controlPoint2 = vec2.fromValues(input[4], input[5]);
            const endPoint = vec2.fromValues(input[6], input[7]);
            const bezierCurve = new BezierCurve(startPoint, controlPoint1, controlPoint2, endPoint);
            expect(bezierCurve.bbox).toEqual(bbox);
        }
    });

    it("getMaxCurvature 0", () => {
        for (const testData of TestDataArr) {
            const { input, maxCurvature } = testData;
            const startPoint = vec2.fromValues(input[0], input[1]);
            const controlPoint1 = vec2.fromValues(input[2], input[3]);
            const controlPoint2 = vec2.fromValues(input[4], input[5]);
            const endPoint = vec2.fromValues(input[6], input[7]);
            const bezierCurve = new BezierCurve(startPoint, controlPoint1, controlPoint2, endPoint);

            const realMaxCurvature = bezierCurve.getMaxCurvature(100);
            const k = maxCurvature / realMaxCurvature;
            expect(k + 1 / k).toBeCloseTo(2, 0.01);
        }
    });
});
