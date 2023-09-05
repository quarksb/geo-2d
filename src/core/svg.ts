import { getCurves, getPolygon, resizeCurvesByBBox } from "./star";

export function createSvgByPath(pathStr: string): SVGSVGElement {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const pathElement = document.createElementNS("http://www.w3.org/2000/svg", "path");
    pathElement.setAttribute("d", pathStr);
    svg.appendChild(pathElement);
    return svg;
}

export function getSvgPathBySize(param: { width: number; height: number; polygonNum: number; ramada: number; randomSeed: number; smoothPercent: number,isDebug?: boolean }): string {
    const { width, height, polygonNum, ramada, randomSeed, smoothPercent = 1, isDebug = false } = param;
    const polygon = getPolygon(width, height, polygonNum, ramada, randomSeed);

    const curves = getCurves(polygon, smoothPercent, isDebug);

    resizeCurvesByBBox(curves, { x: 0, y: 0, width, height });

    const digits = 1;
    const startPoint = curves[0].startPoint;
    let pathStr = `M ${startPoint[0].toFixed(digits)} ${startPoint[1].toFixed(digits)}`;

    for (let i = 0; i < polygonNum; i++) {
        pathStr += curves[i].toPathString(1);
    }

    pathStr += "Z";

    return pathStr;
}
