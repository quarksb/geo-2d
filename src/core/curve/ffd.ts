import { vec2 } from 'gl-matrix';
import { BBox } from './curve';

export class FFD {
    controlPoints: vec2[];
    gridCount: [number, number] = [2,2];
    
    constructor(boundingBox: BBox, gridCount: [number, number] = [2,2]) {
        this.controlPoints = [];
        this.gridCount = gridCount;
        const x0 = boundingBox.x;
        const y0 = boundingBox.y;
        const x1 = boundingBox.x + boundingBox.width;
        const y1 = boundingBox.y + boundingBox.height;
        const dx = (x1 - x0) / (this.gridCount[0] - 1);
        const dy = (y1 - y0) / (this.gridCount[1] - 1);
        for (let i = 0; i < this.gridCount[0]; i++) {
            for (let j = 0; j < this.gridCount[1]; j++) {
                const x = x0 + i * dx;
                const y = y0 + j * dy;
                this.controlPoints.push(vec2.fromValues(x, y));
            }
        }
    }

    transformPoint(point: vec2): vec2 {
        const x = point[0];
        const y = point[1];
        const x0 = this.controlPoints[0][0];
        const y0 = this.controlPoints[0][1];
        const x1 = this.controlPoints[1][0];
        const y1 = this.controlPoints[1][1];
        const x2 = this.controlPoints[2][0];
        const y2 = this.controlPoints[2][1];
        const x3 = this.controlPoints[3][0];
        const y3 = this.controlPoints[3][1];
        const u = (x - x0) / (x1 - x0);
        const v = (y - y0) / (y2 - y0);
        const u1 = 1 - u;
        const v1 = 1 - v;
        const x_ = u1 * (v1 * x0 + v * x2) + u * (v1 * x1 + v * x3);
        const y_ = u1 * (v1 * y0 + v * y2) + u * (v1 * y1 + v * y3);
        return vec2.fromValues(x_, y_);
    }
}