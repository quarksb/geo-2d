import { Polygon } from "../shape/polygon";

declare type WindingRule = "NONZERO" | "EVENODD";

/**
 * ## Path
 * a collection of shapes
 */
export class PolygonPath {
    shapes: Polygon[];
    constructor (shapes: Polygon[]) {
        this.shapes = shapes;
    }


}


// function 
