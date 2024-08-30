import { LineCurve } from "../curve";
import { calDisData, calPointsArea, DisData, getDistMark, Polyline, Shape, SingleShape } from "../shape";
import { Stitch } from "./stitch";
import { createMatrix } from "../math";
import { vec2 } from "gl-matrix";


const isDebug = true || window.location.href.includes('debug');

export class SingleRail extends Polyline {
    constructor (curves: LineCurve[]) {
        super(curves);
    }

    // find
}

export function getRailCouples(polylineArr: Polyline[], disLimit = 100, size: number = 1000,) {
    console.time("getRailCouples")
    const { length: n } = polylineArr;
    const disDataMatrix: DisData[][] = createMatrix<DisData>(n);

    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            // 计算导轨之间的匹配度
            // if (i === 2 && j === 10) {
            //     debugger
            // }
            const [disArr0, disArr1] = calDisData(polylineArr[i], polylineArr[j]);
            disDataMatrix[i][j] = disArr0;
            disDataMatrix[j][i] = disArr1;
        }
    }
    // console.log("disLimit:", disLimit);
    // console.log("disDataMatrix:", disDataMatrix);

    const maxScoreIndexArr = new Array<number>(n);
    // console.log("disDataMatrix:", disDataMatrix);
    for (let i = 0; i < n; i++) {
        // 寻找标准差最小的导轨
        const l0 = polylineArr[i]
        let maxScore = -Infinity;
        let maxIndex = -1;
        for (let j = 0; j < n; j++) {
            if (i === j) {
                continue;
            }
            const { std, min, mean, max } = disDataMatrix[i][j];
            // console.log(i, j, std.toFixed(5), "min:", min.toFixed(0), "mean:", mean.toFixed(0), "max", max.toFixed(0));
            // debugger
            // 检查闭合图形是否是逆时针

            const score = std > 1E10 ? 0 : (0.9 - std / size) * getDistMark(mean, disLimit);
            // if (i == 0) {
            //     console.log(i, j, score, (0.9 - std / size), getDistMark(mean, disLimit));
            // }
            if (score > maxScore) {
                maxScore = score;
                maxIndex = j;
            }
        }
        maxScoreIndexArr[i] = maxIndex;
        // console.log(i, "minIndex:", minIndex, minStd);
    }

    // maxScoreIndexArr.forEach((index, i) => {
    //     console.log(i, "---->", index);
    // })

    const successIndex = new Set<number>();
    for (let i = 0; i < maxScoreIndexArr.length; i++) {
        if (successIndex.has(i)) {
            continue;
        }
        if (maxScoreIndexArr[maxScoreIndexArr[i]] === i) {
            // console.log("配对成功", i, minStdIndexArr[i]);
            successIndex.add(i);
            successIndex.add(maxScoreIndexArr[i]);
        }
    }

    const count = successIndex.size >> 1;
    const indexCouples = new Array(count);



    // 打印配对不成功的导轨
    for (let i = 0; i < maxScoreIndexArr.length; i++) {
        if (!successIndex.has(i)) {
            console.log("配对不成功", i);
        }
    }
    console.timeEnd("getRailCouples")
    return { successIndex, minStdIndexArr: maxScoreIndexArr };
}


export function createSingleRailFromSingleShape(shape: SingleShape, baseLen = 1): SingleRail {
    const len = shape.len;
    const segmentCount = Math.ceil(len / baseLen);
    // console.log('segmentCount', segmentCount);

    const points = shape.toPoints(segmentCount);
    return SingleRail.fromPoints(points);
}


export class Rail {
    rail0: SingleRail;
    rail1: SingleRail;
    constructor (rail0: SingleRail, rail1: SingleRail) {
        this.rail0 = rail0;
        this.rail1 = rail1;
    }

    createRungs(stitch: Stitch) {
        const { rail0, rail1 } = this;
        this.checkDirection();


        // if (isRail0Closed && isRail1Closed) {
        // console.log(rail1);
        const l0 = rail0.len;
        const l1 = rail1.len;
        const { length: l, width: w } = stitch;


        const [disData0, disData1] = calDisData(rail0, rail1);

        // console.log(l0, l1);
        let [basicL, disArr, basicRail, otherRail] = [l0, disData0, rail0, rail1];
        if (!(l0 > l1)) {
            basicL = l1;
            basicRail = rail1;
            otherRail = rail0;
            disArr = disData1;
        }

        const isRail0Closed = basicRail.isClosed;
        const isRail1Closed = otherRail.isClosed;


        // let indexOffset = 0;
        // if (isRail0Closed) {
        //     // 寻找位置最低点, 即 y 值最大
        //     let yMax = -Infinity;
        //     let maxIndex = 0;
        //     console.log(basicRail.points);

        //     for (let i = 0; i < basicRail.points.length; i++) {
        //         const point = basicRail.points[i];
        //         if (point[1] > yMax) {
        //             yMax = point[1];
        //             maxIndex = i;
        //         }
        //     }
        //     indexOffset = maxIndex;
        // }

        // console.log('indexOffset', indexOffset);
        const offsetPer = isRail1Closed ? (disArr.datas[0]?.index || 0) / otherRail.curves.length : 0;

        // console.log('offsetPer', offsetPer);
        // console.log(basicRail, otherRail);

        const count = Math.floor(basicL / w);
        // console.log('count', count, basicL, w);
        // todo 增加 stitch 最小 length 的限制, 小于次长度的不添加 rung

        const rungs: LineCurve[] = new Array(count);
        for (let i = 0; i < count; i += 1) {
            const per = i / count;
            const { pos } = basicRail.getPosDataByPer(per, true);
            const { pos: end } = otherRail.getPosDataByPer(per + offsetPer, true);
            const rung = new LineCurve(pos, end);
            rungs[i] = rung;
        }
        return rungs;


        // }
    }

    /**
     * 检查两条轨道的方向是否一致，如果不一致则调整第二条轨道的方向
     */
    checkDirection() {
        const { rail0, rail1 } = this;
        const isClockwise0 = getPointsClockwise(rail0.points);
        const isClockwise1 = getPointsClockwise(rail1.points);
        // console.log(isClockwise0, isClockwise1);

        if (true || isClockwise0 !== isClockwise1) {
            rail1.reverse();
        }
    }

}

/**
 * ### get the direction of a shape
 * @param shape 
 * @returns true if the shape is clockwise
 */
export function getPointsClockwise(points: vec2[]) {
    const area = calPointsArea(points);
    return area > 0;
}