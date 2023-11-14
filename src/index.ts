import { getCurvesByPolygon, getPathStr, getPolygon, resizeCurvesByBBox } from "./core";

export * from "./core";
/**
 * 
 * @param width 目标图像的宽度
 * @param height 
 * @param polygonNum 
 * @param ramada 
 * @param randomSeed 
 */
export function getRandomPathStr(width = 100, height = 100, polygonNum = 6, ramada = 0.5, randomSeed = Math.random()) {
    const polygon = getPolygon(width, height, polygonNum, ramada, randomSeed);
    const curves = getCurvesByPolygon(polygon);
    resizeCurvesByBBox(curves, { x: 0, y: 0, width, height });

    const pathStr = getPathStr(curves);
    return pathStr;
}
