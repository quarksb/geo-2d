export interface PointLike {
    /**point x */
    x: number;
    /**point y */
    y: number;
}
export class Vec implements PointLike {
    x: number;
    y: number;
    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
    distanceTo(point: PointLike) {
        const { x: x1, y: y1 } = this;
        const { x: x2, y: y2 } = point;
        const dx = x1 - x2;
        const dy = y1 - y2;
        return Math.sqrt(dx ** 2 + dy ** 2);
    }
    normalize() {
        const { x, y } = this;
        const length = Math.sqrt(x ** 2 + y ** 2);
        this.x /= length;
        this.y /= length;
        return this;
    }
    rotate90() {
        const { x, y } = this;
        this.x = -y;
        this.y = x;
        return this;
    }
    static add(vec1: PointLike, vec2: PointLike) {
        const { x: x1, y: y1 } = vec1;
        const { x: x2, y: y2 } = vec2;
        return new Vec(x1 + x2, y1 + y2);
    }
    add(vec: PointLike) {
        this.x += vec.x;
        this.y += vec.y;
    }
    scale(s: number) {
        this.x *= s;
        this.y *= s;
    }
    sub(vec: PointLike) {
        this.x -= vec.x;
        this.y -= vec.y;
    }
    static formSub(vec1: PointLike, vec2: PointLike) {
        const { x: x1, y: y1 } = vec1;
        const { x: x2, y: y2 } = vec2;
        return new Vec(x2 - x1, y2 - y1);
    }
}

export function lineInterSect(p1: PointLike, p2: PointLike, p3: PointLike, p4: PointLike): PointLike {
    const { x: x1, y: y1 } = p1;
    const { x: x2, y: y2 } = p2;
    const { x: x3, y: y3 } = p3;
    const { x: x4, y: y4 } = p4;
    const a1 = y2 - y1;
    const b1 = x1 - x2;
    const c1 = x2 * y1 - x1 * y2;
    const a2 = y4 - y3;
    const b2 = x3 - x4;
    const c2 = x4 * y3 - x3 * y4;
    const d = a1 * b2 - a2 * b1;
    const x = (b1 * c2 - b2 * c1) / d;
    const y = (a2 * c1 - a1 * c2) / d;
    return { x, y };
}
