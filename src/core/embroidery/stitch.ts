import { vec2 } from "gl-matrix";

export class Stitch {
    length: number;
    width: number;
    constructor (distance: number, width: number, public minRatio = 0.3, public maxRatio = Math.SQRT2) {
        this.length = distance;
        this.width = width;
    }

    /**
     * 填充线段
     * @param start
     * @param end
     * @returns
     * @example
     * ```ts
     * const stitch = new Stitch(1, 0.1);
     * const start = vec2.fromValues(0, 0);
     * const end = vec2.fromValues(1, 1);
     * const result = stitch.fillLine(start, end);
     * ```
     */
    fillLine(start: vec2, end: vec2): vec2[] {
        const { length: distance } = this;

        const dir = vec2.sub(vec2.create(), end, start);
        const len = vec2.len(dir);
        if (len < this.minRatio * distance) {
            return [];
        }
        const result: vec2[] = [start];
        let count = Math.floor(len / distance);
        const step = vec2.scale(vec2.create(), dir, distance / len);


        for (let i = 1; i < count; i++) {
            const pos = vec2.scaleAndAdd(vec2.create(), start, step, i);
            result.push(pos);
        }
        const margin = (len / distance) % 1;
        const isMarginLess = margin + 1 < this.maxRatio;

        // 如果最后一段超出了最大距离，需要再加一个点
        if (!isMarginLess && count > 0) {
            const k = (margin + 1) / 2;
            const pos = vec2.scaleAndAdd(vec2.create(), result[result.length - 1] || start, step, k);
            result.push(pos);
        }
        result.push(end);
        return result;
    }
}

if (import.meta.vitest) {
    const { it, expect, test } = import.meta.vitest
    test('Stitch fill', () => {
        {
            const stitch = new Stitch(1, 0.1);
            const start = vec2.fromValues(0, 0);
            const end = vec2.fromValues(1, 1);
            const result = stitch.fillLine(start, end);
            // console.log(result);
            expect(result.length).toBe(3);
        }
        {
            const stitch = new Stitch(2, 0.1);
            const start = vec2.fromValues(0, 0);
            const end = vec2.fromValues(10, 0);
            const result = stitch.fillLine(start, end);
            expect(result.length).toBe(6);
        }
        {
            const stitch = new Stitch(1, 0.1);
            const start = vec2.fromValues(1, 0);
            const end = vec2.fromValues(12.3, 1.6);
            const result = stitch.fillLine(start, end);
            expect(result.length).toBe(12);
        }

    });
}