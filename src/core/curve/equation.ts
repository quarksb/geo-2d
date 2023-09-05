export function getRoots(derivation: number[]) {
    switch (derivation.length) {
        case 0:
            return [];
        case 1:
            return [0];
        case 2:
            return [-derivation[1] / derivation[0]];
        case 3:
            return getQuadraticRoots(derivation);
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
    }
    else if (delta === 0) {
        return [-b / (2 * a)];
    }
    else {
        const sqrtDelta = Math.sqrt(delta);
        return [(-b + sqrtDelta) / (2 * a), (-b - sqrtDelta) / (2 * a)];
    }
}