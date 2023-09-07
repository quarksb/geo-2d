import { vec2 } from "gl-matrix";
import { getCurves, getPolygon, resizeCurvesByBBox } from "./star";
import { Curve } from "./curve";

export function createSvgByPath(pathStr: string): SVGSVGElement {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const pathElement = document.createElementNS("http://www.w3.org/2000/svg", "path");
    pathElement.setAttribute("d", pathStr);
    svg.appendChild(pathElement);
    return svg;
}

export function getSvgPathBySize(param: { width: number; height: number; polygonNum: number; ramada: number; randomSeed: number; smoothPercent: number; isDebug?: boolean }): string {
    const { width, height, polygonNum, ramada, randomSeed, isDebug = false } = param;
    const polygon = getPolygon(width, height, polygonNum, ramada, randomSeed);

    const curves = getCurves(polygon, isDebug);

    resizeCurvesByBBox(curves, { x: 0, y: 0, width, height });
    return getPathStr(curves);
}

export function getPathStr(curves: Curve[], digits = 1): string {
    const startPoint = curves[0].startPoint;
    let pathStr = `M ${startPoint[0].toFixed(digits)} ${startPoint[1].toFixed(digits)}`;
    curves.forEach((curve) => {
        pathStr += curve.toPathString(digits);
    });
    pathStr += "Z";
    return pathStr;
}

// 给定两多边形，和一个小数，返回这两多边形的插值多边形
export function interpolatePolygon(polygon1: vec2[], polygon2: vec2[], percent: number): vec2[] {
    const polygon: vec2[] = [];
    const len = polygon1.length;
    for (let i = 0; i < len; i++) {
        const point1 = polygon1[i];
        const point2 = polygon2[i];
        const point = vec2.lerp(vec2.create(), point1, point2, percent);
        polygon.push(point);
    }
    return polygon;
}
