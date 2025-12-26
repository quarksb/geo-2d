import { vec2 } from "gl-matrix";

export interface ConnectStart {
    EPoint: vec2;
    outDir: vec2;
}

export interface ConnectEnd {
    SPoint: vec2;
    inDir: vec2;
}

export interface ConnectAble extends ConnectStart, ConnectEnd {}
