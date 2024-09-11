/**
 * @file simply.ts
 * @module shape/simply
 * @description
 * This module provides functions for simplifying shapes.
 * @author quark 
 */

import { vec2 } from "gl-matrix";
import { createBBox2, getBBox2Size, mergeBBox2 } from "../../base";
import { Curve, LineCurveType } from "../../curve";


/**
 * simply curves
 * @description 尝试合并相邻的线段，合并规则如下，优先级逐渐减低
 * - 方向相同的直线直接合并
 * - 长度较小的曲线线合并到长度较大的曲线上
 * @param curves 
 * @returns 
 */
export function simplyCurves(curves: Curve[]): Curve[] {
    curves = mergeLine(curves);
    curves = mergeShortCurve(curves);
    return curves;
}

/**合并连续的直线 */
function mergeLine(curves: Curve[]) {
    const { length: n } = curves;
    const newCurves: Curve[] = [curves[0]];
    for (let i = 1; i < n; i++) {
        const currentCurve = curves[i];
        const lastCurve = newCurves[newCurves.length - 1];
        // 两者都是直线
        const isBothLine = currentCurve.type === LineCurveType && lastCurve.type === LineCurveType;
        // 且方向非常接近
        const needMerge = isBothLine && vec2.dot(currentCurve.outDir, lastCurve.outDir) > 0.982;
        if (needMerge) {
            // 合并直线, 修改 lastCurve 的终点, 舍弃 currentCurve
            lastCurve.EPoint = currentCurve.EPoint;
        } else {
            newCurves.push(currentCurve);
        }
    }

    return newCurves;
}

/**
 * merge short curve
 * @description 实际文字存在存在一些小曲线，这些小曲线能会因为方向对后续计算产生严重误导，因此需要合并
 * 比如 OPPOSans 字体中的 纹字，其右边的 “文” 结构的内线下方夹角处用了一个小曲线，会误导后续角度判断。
 * @param curves 
 * @returns 
 */
function mergeShortCurve(curves: Curve[]) {
    const bbox2 = createBBox2();
    for (const curve of curves) {
        mergeBBox2(bbox2, curve.bbox2);
    }
    const size = getBBox2Size(bbox2);
    /**基准长度设定为 bbox 对角线的 1% */
    const lenLimit = Math.hypot(size.width, size.width) / 100;

    const newCurves = [curves[0]];

    const { length: n } = curves;

    /**标记可以合并的曲线，可以合并并不意味着一定合并 */
    const mergeSign = new Array(n).fill(false);

    for (let i = 0; i < n; i++) {
        const curve = curves[i];
        // @todo 判定条件需要优化，需要考虑角度
        if (curve.len < lenLimit) {
            mergeSign[i] = true;
        }
    }

    // @todo 优化合并算法,假如存在连续的短曲线，应该如何合并

    for (let i = 1; i < n - 1; i++) {
        const lastCurve = newCurves[newCurves.length - 1];
        const currentCurve = curves[i];
        const nextCurve = curves[i + 1];

        newCurves[i] = mergeSign[i] ? mergeCurve(lastCurve, currentCurve, nextCurve) : currentCurve;
    }

    const isClosed = vec2.sqrDist(curves[0].SPoint, curves[n - 1].EPoint) < 1
    if (isClosed) {
        [n - 1, 0].forEach(i => {
            const lastCurve = curves[i - 1];
            const currentCurve = curves[i % n];
            const nextCurve = curves[(i + 1) % n];
            newCurves[i] = mergeSign[i] ? mergeCurve(lastCurve, currentCurve, nextCurve) : currentCurve;
        })
    }

    // 曲线去重
    return Array.from(new Set(newCurves))
}

/**
 * 合并曲线
 * @param lastCurve - 上一根曲线
 * @param currentCurve - 待合并的曲线
 * @param nextCurve - 下一根曲线
 * @returns - 合并后的曲线
 */
export function mergeCurve(lastCurve: Curve, currentCurve: Curve, nextCurve: Curve) {
    const angle0 = vec2.angle(lastCurve.outDir, currentCurve.inDir);
    const angle1 = vec2.angle(currentCurve.outDir, nextCurve.inDir);

    // 判定哪个方向的角度更小
    if (angle0 < angle1) {
        // 合并当前线段 和 lastCurve
        lastCurve.EPoint = currentCurve.EPoint;
        return lastCurve;
    } else {
        // 合并 currentCurve 和 nextCurve
        nextCurve.SPoint = currentCurve.SPoint;
        return nextCurve;
    }

}