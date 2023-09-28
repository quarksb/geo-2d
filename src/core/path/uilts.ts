import { vec2 } from "gl-matrix";
import { Curve } from "../curve";

const EPSILON = 1e-6;
const MasCosine = Math.cos(30 / Math.PI);
// 计算两条射线的交点
export function findRayIntersection(point1: vec2, direction1: vec2, point2: vec2, direction2: vec2): vec2 | null {
    const cosAngle = vec2.dot(direction1, direction2);

    if (cosAngle < MasCosine) {
        return null;
    }
    
    const [x1, y1] = point1;
    const [x2, y2] = direction1;
    const [x3, y3] = point2;
    const [x4, y4] = direction2

    // solve equation x1 + t*x2 = x3 + u * x4; y1 + t*y2 = y3 + u * y4

    const denominator = x4 * y2 - x2 * y4;

    if (denominator < EPSILON && denominator > -EPSILON) {
        // 射线平行，没有交点
        return null;
    }

    const t = ((x1 - x3) * y4 - (y1 - y3) * x4) / denominator;
    return vec2.scaleAndAdd(vec2.create(), point1, direction1, t);
}

export function isVec2DirectionClose(a: vec2, normalVec: vec2) {
    const dot = vec2.dot(a, normalVec);
    return dot > vec2.length(a) * 0.9;
}

// 将偏移后的曲线合并成一个 Shape
export function connectCurve(curves: Curve) {}

// function connectAdjacentBezier(segments1: Curve[], segments2: Curve[], origin: paper.Segment, joinType: CanvasRenderingContext2D["lineJoin"], offset: number, limit: number) {
//     const curve1 = new paper.Curve(segments1[0], segments1[1]);
//     const curve2 = new paper.Curve(segments2[0], segments2[1]);
//     const intersection = curve1.getIntersections(curve2);
//     const distance = segments1[1].point.getDistance(segments2[0].point);
//     if (origin.isSmooth()) {
//       segments2[0].handleOut = segments2[0].handleOut!.project(origin.handleOut!);
//       segments2[0].handleIn = segments1[1].handleIn!.project(origin.handleIn!);
//       segments2[0].point = segments1[1].point.add(segments2[0].point).divide(2);
//       segments1.pop();
//     } else {
//       if (intersection.length === 0) {
//         if (distance > Math.abs(offset) * 0.1) {
//           // connect
//           switch (joinType) {
//             case 'miter':
//               const join = getPointLineIntersections(curve1.point2, curve1.point2.add(curve1.getTangentAtTime(1)),
//                 curve2.point1, curve2.point1.add(curve2.getTangentAtTime(0)));
//               // prevent sharp angle
//               const joinOffset = Math.max(join.getDistance(curve1.point2), join.getDistance(curve2.point1));
//               if (joinOffset < Math.abs(offset) * limit) {
//                 segments1.push(new paper.Segment(join));
//               }
//               break;
//             case 'round':
//               const mid = makeRoundJoin(segments1[1], segments2[0], origin.point, offset);
//               if (mid) {
//                 segments1.push(mid);
//               }
//               break;
//             default: break;
//           }
//         } else {
//           segments2[0].handleIn = segments1[1].handleIn;
//           segments1.pop();
//         }
//       } else {
//         const second1 = curve1.divideAt(intersection[0]);
//         if (second1) {
//           const join = second1.segment1;
//           const second2 = curve2.divideAt(curve2.getIntersections(curve1)[0]);
//           join.handleOut = second2 ? second2.segment1.handleOut : segments2[0].handleOut;
//           segments1.pop();
//           segments2[0] = join;
//         } else {
//           segments2[0].handleIn = segments1[1].handleIn;
//           segments1.pop();
//         }
//       }
//     }
//   }
