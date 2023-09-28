export function getRoots(derivation: number[]) {
    switch (derivation.length) {
        case 0:
            return [];
        case 1:
            return [0];
        case 2:
            if (derivation[0] === 0) {
                return [];
            } else {
                return [-derivation[1] / derivation[0]];
            }
        case 3:
            if (derivation[0] === 0) {
                return getRoots(derivation.slice(1));
            } else {
                return getQuadraticRoots(derivation);
            }
        case 4:
            if (derivation[0] === 0) {
                return getRoots(derivation.slice(1));
            } else {
                return getCubicRoots(derivation);
            }
        default:
            throw new Error("Not implemented");
    }
}

function getQuadraticRoots(derivation: number[]) {
    const a = derivation[0];
    const b = derivation[1];
    const c = derivation[2];
    const delta = b * b - 4 * a * c;
    if (delta < 0) {
        return [];
    } else {
        const sqrtDelta = Math.sqrt(delta);
        return [(-b + sqrtDelta) / (2 * a), (-b - sqrtDelta) / (2 * a)];
    }
}

function getCubicRoots(derivation: number[]) {
    const a = derivation[0];
    const b = derivation[1];
    const c = derivation[2];
    const d = derivation[3];
    const A = b / a;
    const B = c / a;
    const C = d / a;
    const Q = (3 * B - A * A) / 9;
    const R = (9 * A * B - 27 * C - 2 * A * A * A) / 54;
    const D = Q * Q * Q + R * R;
    if (D >= 0) {
        const sqrtD = Math.sqrt(D);
        const S = Math.cbrt(R + sqrtD);
        const T = Math.cbrt(R - sqrtD);
        const roots = [-A / 3 + (S + T)];
        if (D === 0) {
            roots.push(-S / 2);
        }
        return roots;
    } else {
        const theta = Math.acos(R / Math.sqrt(-Q * Q * Q));
        const sqrtQ = Math.sqrt(-Q);
        return [2 * sqrtQ * Math.cos(theta / 3) - A / 3, 2 * sqrtQ * Math.cos((theta + 2 * Math.PI) / 3) - A / 3, 2 * sqrtQ * Math.cos((theta + 4 * Math.PI) / 3) - A / 3];
    }
}
