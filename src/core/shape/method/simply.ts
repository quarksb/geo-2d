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
    const bbox2 = createBBox2();
    for (const curve of curves) {
        mergeBBox2(bbox2, curve.bbox2);
    }
    const size = getBBox2Size(bbox2);
    /**基准长度设定为 bbox 对角线的 1% */
    const lenLimit = Math.hypot(size.width, size.width) / 100;

    let { length: n } = curves;

    const isClosed = vec2.distance(curves[0].SPoint, curves[n - 1].EPoint) < 1;

    let offsetIndex = 0;
    if (isClosed) {
        // 寻找长度最长的线段
        let maxLength = 0;
        for (let i = 0; i < n; i++) {
            const curve = curves[i];
            const len = curve.len;
            if (len > maxLength) {
                maxLength = len;
                offsetIndex = i;
            }
        }
    }

    // 合并直线
    let newCurves: Curve[] = [curves[offsetIndex]];
    for (let i = 1; i < n; i++) {
        const j = (i + offsetIndex) % n;
        const currentCurve = curves[j];
        const lastCurve = newCurves[newCurves.length - 1];
        // 两者都是直线
        const isBothLine = currentCurve.type === LineCurveType && lastCurve.type === LineCurveType;
        // 且方向相同
        const needMerge = isBothLine && vec2.dot(currentCurve.inDir, lastCurve.ouDir) > 0.982;
        if (needMerge) {
            // 合并直线, 直接修改 lastCurve 的终点
            lastCurve.EPoint = currentCurve.EPoint;
        } else {
            newCurves.push(currentCurve);
        }
    }

    curves = newCurves;
    newCurves = [curves[0]];

    n = curves.length;

    /**标记可以合并的曲线，可以合并并不意味着一定合并 */
    const mergeSign = new Array(n).fill(false);

    for (let i = 0; i < n; i++) {
        const curve = curves[i];
        if (curve.len < lenLimit) {
            mergeSign[i] = true;
        }
    }

    console.table(mergeSign);
    // 合并小线段
    for (let i = 1; i < n - 1; i++) {
        const curCurve = curves[i];
        if (mergeSign[i]) {
            const lastCurve = newCurves[newCurves.length - 1];
            const nextCurve = curves[i + 1];
            shouldMerge(lastCurve, curCurve, nextCurve);
        } else {
            newCurves.push(curCurve);
        }
    }

    // 最后一个 curve
    if (isClosed) {
        shouldMerge(newCurves[newCurves.length - 1], curves[n - 1], curves[0]);
    } else {
        newCurves.push(curves[n - 1]);
    }
    return newCurves;
}

/**
 * 检查是否可以合并
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
    } else {
        // result.push(currentCurve);
    }
}