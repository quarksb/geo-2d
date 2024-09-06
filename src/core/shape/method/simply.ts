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
        const needMerge = isBothLine && vec2.dot(currentCurve.ouDir, lastCurve.ouDir) > 0.982;
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
        if (curve.len < lenLimit) {
            mergeSign[i] = true;
        }
    }

    return curves;

    // 先尝试把连续多段小曲线合并成一段
    let i = 0, j = 0;
    while (i < n) {
        // 找到第一个可以合并的曲线
        if (mergeSign[i]) {
            j = i + 1;
            while (j < n && mergeSign[j]) {
                j++;
            }
            if (j - i > 1) {
                // 合并 i 到 j-1 的曲线
                let SPoint = curves[i].SPoint;
                let EPoint = curves[j - 1].EPoint;
                for (let k = i + 1; k < j; k++) {
                    curves[k].SPoint = SPoint;
                    curves[k].EPoint = EPoint;
                }
                i = j;
            } else {
                i++;
            }
        }
    }

    return newCurves;
}

/**
 * 检查是否可以合并
 * @todo 未完成, 目前合并逻辑不完善
 * @param lastCurve 
 * @param currentCurve 
 * @param nextCurve 
 * @returns 
 */
export function shouldMerge(lastCurve: Curve, currentCurve: Curve, nextCurve: Curve) {
    const { len: l0 } = lastCurve;
    const { len: l1 } = currentCurve;
    const { len: l2 } = nextCurve;

    const threshold = 20;
    const isLengthDiff = l0 > threshold * l1 && l2 > threshold * l1;

    if (isLengthDiff) {
        // 长度差异过大，长线合并短线
        const angle0 = vec2.angle(lastCurve.ouDir, currentCurve.inDir);
        const angle1 = vec2.angle(currentCurve.ouDir, nextCurve.inDir);

        if (angle0 < angle1) {
            // 合并当前线段 和 lastCurve
            lastCurve.EPoint = currentCurve.EPoint;
        } else {
            // 合并 currentCurve 和 nextCurve
            nextCurve.SPoint = currentCurve.SPoint;
            // console.log('合并 currentCurve 和 nextCurve');
            return true
        }
    }
}