import { vec2 } from "gl-matrix";
import { getCurvesByPolygon, getPolygon, resizeCurvesByBBox } from "./star";
import { Curve } from "./curve";

export function createSvgByPath(pathStr: string): SVGSVGElement {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const pathElement = document.createElementNS("http://www.w3.org/2000/svg", "path");
    pathElement.setAttribute("d", pathStr);
    svg.appendChild(pathElement);
    return svg;
}

export function getSvgPathBySize(param: { width: number; height: number; polygonNum: number; ramada: number; randomSeed: number; smoothPercent: number; isDebug?: boolean }): string {
    const { width, height, polygonNum, ramada, randomSeed } = param;
    const polygon = getPolygon(width, height, polygonNum, ramada, randomSeed);
Í
    const curves = getCurvesByPolygon(polygon);

    resizeCurvesByBBox(curves, { x: 0, y: 0, width, height });
    return getPathStr(curves);
}

export function getPathStr(curves: Curve[], digits = 1): string {
    const startPoint = curves[0].startPoint;
    let pathStr = `M ${startPoint[0].toFixed(digits)} ${startPoint[1].toFixed(digits)} `;
    curves.forEach((curve) => {
        pathStr += curve.toPathString(digits) + " ";
    });
    pathStr += "Z";
    return pathStr;
}

export function getDebugPathStr(curves: Curve[], digits = 1): string {
    const startPoint = curves[0].startPoint;
    let pathStr = `M ${startPoint[0].toFixed(digits)} ${startPoint[1].toFixed(digits)} `;
    curves.forEach((curve) => {
        pathStr += curve.toDebugPathString(digits) + " ";
    });
    return pathStr;
}

// 将单条 pathStr(只含一个M)拆分成一个个子命令
export function pathStringToPathCommands(pathStr: string): { type: string; args: number[] }[] {
    const commands: { type: string; args: number[] }[] = [];
    let currentCommand = "";
    let currentArgs: number[] = [];

    function addCommand(type: string, args: number[]) {
        commands.push({ type, args });
    }

    // 遍历路径字符串中的每个字符
    for (let i = 0; i < pathStr.length; i++) {
        const char = pathStr[i];

        if (char.match(/[A-Z]/)) {
            // 如果是大写字母，则表示新的命令开始
            addCommand(currentCommand, currentArgs);
            currentCommand = char;
            currentArgs = [];
        } else if (char === " " || char === ",") {
            // 忽略空格和逗号
            continue;
        } else if (char === "-" || char === "." || !isNaN(parseInt(char, 10))) {
            // 处理数字、负号和小数点
            const start = i;
            while (i < pathStr.length && (pathStr[i] === "-" || pathStr[i] === "." || !isNaN(parseInt(pathStr[i], 10)))) {
                i++;
            }
            const argStr = pathStr.substring(start, i);
            currentArgs.push(parseFloat(argStr));
            i--; // 回退一步，因为在for循环中会自增
        }
    }

    addCommand(currentCommand, currentArgs);
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
