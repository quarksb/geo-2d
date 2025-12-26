import { vec2 } from "gl-matrix";
import { Curve } from "../curve/curve";

export function createSvgByPath(pathStr: string): SVGSVGElement {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const pathElement = document.createElementNS("http://www.w3.org/2000/svg", "path");
    pathElement.setAttribute("d", pathStr);
    svg.appendChild(pathElement);
    return svg;
}

export function getPathStr(curves: Curve[], digits = 1): string {
    if (curves.length === 0) return "";
    const startPoint = curves[0].SPoint;
    let pathStr = `M ${startPoint[0].toFixed(digits)} ${startPoint[1].toFixed(digits)} `;
    curves.forEach((curve) => {
        pathStr += curve.toPathString(digits) + " ";
    });
    pathStr += "Z";
    return pathStr;
}

export function getDebugPathStr(curves: Curve[], digits = 1): string {
    if (curves.length === 0) return "";
    const startPoint = curves[0].SPoint;
    let pathStr = `M ${startPoint[0].toFixed(digits)} ${startPoint[1].toFixed(digits)} `;
    curves.forEach((curve) => {
        pathStr += curve.toDebugPathString(digits) + " ";
    });
    return pathStr;
}

// todo: 重构
export type PathCommandType = "M" | "L" | "H" | "V" | "C" | "S" | "Q" | "T" | "A" | "Z" | (string & {});

export interface PathCommand {
    type: PathCommandType;
    args?: number[];
    x?: number;
    y?: number;
    x1?: number;
    y1?: number;
    x2?: number;
    y2?: number;
}

/**
 * ### 将单条 pathStr(只含一个M)拆分成一个个子命令
 * 支持科学计数法
 */
export function pathStringToPathCommands(pathStr: string): PathCommand[] {
    // 正则表达式匹配路径命令和参数，包括支持科学计数法的数字
    const pathRegex = /([MmLlHhVvCcSsQqTtAaZz])|([-+]?\d*\.?\d+(?:[eE][-+]?\d+)?)/g;
    const matches = pathStr.match(pathRegex);

    if (!matches) {
        throw new Error("Invalid path string");
    }

    const commands: PathCommand[] = [];
    let currentType: string | null = null;
    let currentArgs: number[] = [];

    for (const match of matches) {
        if (isNaN(parseFloat(match))) {
            // 如果匹配到的是字母，表示一个新的命令
            if (currentType) {
                // 将前一个命令和参数存储
                commands.push({ type: currentType, args: currentArgs });
                currentArgs = [];
            }
            currentType = match;
        } else {
            // 如果匹配到的是数字，表示参数
            currentArgs.push(parseFloat(match));
        }
    }

    // 将最后一个命令存储
    if (currentType) {
        commands.push({ type: currentType, args: currentArgs });
    }

    return commands;
}

// 给定两多边形，和一个小数，返回这两多边形的插值多边形
export function interpolatePolygon(startPolygon: vec2[], targetPolygon: vec2[], percent: number): vec2[] {
    const polygon: vec2[] = [];
    const l = startPolygon.length;
    const len = targetPolygon.length;
    for (let i = 0; i < len; i++) {
        const point = vec2.lerp(vec2.create(), startPolygon[i % l], targetPolygon[i], percent);
        polygon.push(point);
    }
    return polygon;
}

if (import.meta.vitest) {
    const { describe, it, expect } = import.meta.vitest;
    const pathStr =
        "M55.5437 22.9059 C40.1922 7.60225 20.0901 -0.0301725 0 8.96355e-05 L0.0562527 78.4342 L55.7169 133.921 C86.3252 103.217 86.2476 53.5142 55.5437 22.9059 Z";
    describe("svg util test", () => {
        it("pathStringToPathCommands", () => {
            const commands = pathStringToPathCommands(pathStr);
            expect(commands).toEqual([
                { type: "M", args: [55.5437, 22.9059] },
                { type: "C", args: [40.1922, 7.60225, 20.0901, -0.0301725, 0, 8.96355e-5] },
                { type: "L", args: [0.0562527, 78.4342] },
                { type: "L", args: [55.7169, 133.921] },
                { type: "C", args: [86.3252, 103.217, 86.2476, 53.5142, 55.5437, 22.9059] },
                { type: "Z", args: [] },
            ]);
        });
    });
}
