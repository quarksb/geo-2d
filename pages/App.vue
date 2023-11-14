<script setup lang="ts">
import { getPathStr, interpolatePolygon } from "../src/core/svg";
import { ref, watch, computed } from "vue";
import { downloadCore, copySvgCode, throttle } from "./utils";
import { gradientArr } from "./data";
import { getPolygon, getCurvesByPolygon, resizeCurvesByBBox } from "../src/core/star";
import { getEaseElasticOut } from "../src/core/math";
import { vec2 } from "gl-matrix";

const msg = "quark_china";
const url = "https://quarksb.com";
const text = encodeURIComponent(`Make organic SVG shapes with $FreeSvg by @${msg}`);
const href = `http://twitter.com/intent/tweet?url=${url}&text=${text}&original_referer=${url}`;
const size = 500;
const width = size;
const height = size;
let blur = ref(0);
let isBlurSelected = ref(false);
const blurExpandRatio = 3;
const viewBox = computed(() => {
    const blurExpands = blur.value * blurExpandRatio;
    return `${-blurExpands} ${-blurExpands} ${width + 2 * blurExpands} ${height + 2 * blurExpands}`;
});
let rotate = ref(45);
let isRotateSelected = ref(false);
let colorIndex = 6;
let color0 = ref(gradientArr[colorIndex][0]);
let color1 = ref(gradientArr[colorIndex][1]);
let isColorSelected = ref(false);
let d = ref("");
let polygonNum = ref(7);
let isPolygonNumSelected = ref(false);
let ramada = ref(0.8);
let isRamadaSelected = ref(false);
let randomSeed = ref(0.3619);
let isDebug = ref(false);
let isScaleToEdge = ref(false);
let currentState: {
    polygon: vec2[];
    polygonNum: number;
} = { polygon: [], polygonNum: polygonNum.value };
let handle: number | null = null;
let tempPolygon: vec2[] = [];

// 生成svg path, 并赋值给d, 如果有旧数据，则利用新旧数据插值生成动画
function renderSvgPath() {
    const resetPolygonState = () => {
        if (handle) {
            cancelAnimationFrame(handle);
            currentState.polygon = tempPolygon;
            currentState.polygonNum = polygonNum.value;
            handle = null;
        }
    };
    if (handle) {
        resetPolygonState();
    }
    const targetPolygon = getPolygon(width, height, polygonNum.value, ramada.value, 0, randomSeed.value);
    if (currentState.polygon.length > 0) {
        const animationTime = 3000;
        let initTime = performance.now();
        const baseRender = (time: number) => {
            // const t = (time - initTime) / animationTime;
            const t = getEaseElasticOut((time - initTime) / animationTime);
            tempPolygon = interpolatePolygon(currentState.polygon, targetPolygon, t);
            const curves = getCurvesByPolygon(tempPolygon);
            if (isScaleToEdge.value) {
                resizeCurvesByBBox(curves, { x: 0, y: 0, width, height });
            }

            d.value = getPathStr(curves);
            handle = requestAnimationFrame(baseRender);
        };
        handle = requestAnimationFrame(baseRender);

        setTimeout(resetPolygonState, animationTime);
    } else {
        const curves = getCurvesByPolygon(targetPolygon);
        if (isScaleToEdge.value) {
            resizeCurvesByBBox(curves, { x: 0, y: 0, width, height });
        }
        d.value = getPathStr(curves);
        currentState.polygon = targetPolygon;
        currentState.polygonNum = polygonNum.value;
    }
}

const smoothRender = throttle(renderSvgPath, 100);

function download(isPng: boolean) {
    const svgElement: SVGSVGElement = document.querySelector("#targetSvg")!;
    const svgXML = new XMLSerializer().serializeToString(svgElement);
    if (isPng) {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d")!;
        const path = new Path2D(d.value);
        const gradient = ctx.createLinearGradient(0, 0, width * Math.cos(rotate.value), height * Math.sin(rotate.value));
        gradient.addColorStop(0.05, color0.value);
        gradient.addColorStop(0.95, color1.value);
        ctx.fillStyle = gradient;
        const blurExpands = blur.value * blurExpandRatio;
        const scaleX = width / (width + 2 * blurExpands);
        const scaleY = height / (height + 2 * blurExpands);
        ctx.setTransform(scaleX, 0, 0, scaleY, blurExpands, blurExpands);
        ctx.filter = `blur(${blur.value}px)`;
        ctx.fill(path);
        canvas.toBlob((blob) => {
            downloadCore(blob!, "image.png");
        });
    } else {
        const blob = new Blob([svgXML], { type: "image/svg+xml" });
        downloadCore(blob, "image.svg");
    }
}
function randomSelect() {
    if (isBlurSelected.value) {
        blur.value = Math.floor(Math.random() * 20);
    }
    if (isRotateSelected.value) {
        rotate.value = Math.floor(Math.random() * 90);
    }
    if (isColorSelected.value) {
        const gradient = gradientArr[Math.floor(Math.random() * gradientArr.length)];
        color0.value = gradient[0];
        color1.value = gradient[1];
    }
    if (isPolygonNumSelected.value) {
        polygonNum.value = Math.floor(Math.random() * 8) + 3;
    }
    if (isRamadaSelected.value) {
        ramada.value = Math.random();
    }

    randomSeed.value = Math.random();
}
// 页面加载完成之后添加svg
smoothRender();
// 监听参数变化，重新渲染svg
[blur, rotate, color0, color1, polygonNum, ramada, randomSeed, isDebug, isScaleToEdge].forEach((item) => {
    watch(item, () => {
        smoothRender();
    });
});
</script>

<template>
    <div class="layout">
        <div class="root">
            <!-- <header class="header">
                <h2>Glory to Ukraine and freedom will prevail!</h2>
            </header> -->
            <nav class="nav">
                <div class="logo-container">
                    <img alt="quark" src="./assets/quark.png" />
                    <h1>
                        By
                        <a href="https://github.com/quarksb" target="_blank">{{ msg }}</a>
                    </h1>
                </div>
                <div class="logo-container">
                    <a type="button" href="https://github.com/quarksb/organic-svg" class="share-button">
                        <div class="logo">
                            <img src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png" />
                        </div>
                    </a>
                    <a type="button" :href="href" class="share-button">
                        <div class="logo">
                            <img src="./assets/twitter.svg" />
                        </div>
                    </a>
                </div>
            </nav>
            <div class="flex">
                <body class="body">
                    <svg id="targetSvg" :viewBox="viewBox" focusable="false" role="presentation" class="css-1im46kq">
                        <defs>
                            <linearGradient id="myGradient" :gradientTransform="`rotate(${rotate})`">
                                <stop offset="5%" :stop-color="color0" />
                                <stop offset="95%" :stop-color="color1" />
                            </linearGradient>
                            <filter id="blurMe">
                                <feGaussianBlur in="SourceGraphic" :stdDeviation="blur" />
                            </filter>
                        </defs>
                        <path id="target" fill="url(#myGradient)" :d="d" filter="url(#blurMe)"></path>
                    </svg>
                    <div class="row-container">
                        <button class="button">
                            <img src="./assets/rand.svg" alt="random" @click="randomSelect" />
                        </button>
                        <button class="button">
                            <img src="./assets/download.png" alt="download" @click="download(false)" />
                        </button>
                    </div>
                </body>

                <aside class="aside">
                    <div class="control">
                        <input class="checkbox" type="checkbox" v-model="isColorSelected" />
                        <div class="param">color</div>
                        <input class="color-picker" type="color" v-model="color0" />
                        <input class="color-picker" type="color" v-model="color1" />
                        <!-- <ColorPicker class="color-picker" style="margin-left: -20px;" v-model="color0" /> -->
                    </div>
                    <div class="control">
                        <input class="checkbox" type="checkbox" v-model="isScaleToEdge" />
                        <div class="param">isScale</div>
                    </div>
                    <div class="control">
                        <input class="checkbox" type="checkbox" v-model="isRotateSelected" />
                        <div class="param">rotate</div>
                        <input class="range" type="range" v-model="rotate" min="0" max="90" step="1" />
                        <!-- <ColorPicker class="color-picker" style="margin-left: -20px;" v-model="color0" /> -->
                    </div>
                    <div class="control">
                        <input class="checkbox" type="checkbox" v-model="isPolygonNumSelected" />
                        <div class="param">num</div>
                        <input class="range" type="range" v-model="polygonNum" min="3" max="10" step="1" />
                    </div>
                    <div class="control">
                        <input class="checkbox" type="checkbox" v-model="isRamadaSelected" />
                        <div class="param">flex</div>
                        <input class="range" type="range" v-model="ramada" min="0" max="1" step="0.01" />
                    </div>
                    <div class="control">
                        <input class="checkbox" type="checkbox" v-model="isBlurSelected" />
                        <div class="param">blur</div>
                        <input class="range" type="range" v-model="blur" min="0" max="20" step="1" />
                    </div>
                    <div class="control">
                        <button type="button" @click="randomSelect">Random Select</button>
                    </div>

                    <div class="control">
                        <button type="button" @click="download(false)">
                            <img src="./assets/download.png" alt="download" />
                            svg
                        </button>
                    </div>
                    <div class="control">
                        <button type="button" @click="download(true)">
                            <img src="./assets/download.png" alt="download" />
                            png
                        </button>
                    </div>
                    <div class="control">
                        <button type="button" @click="copySvgCode">
                            <img src="./assets/code.png" alt="copy" />
                            copy
                        </button>
                    </div>
                    <!-- <div class="control">
                <button
                    type="button"
                    @click="
                        () => {
                            isDebug = !isDebug;
                        }
                    "
                >
                    isDebug
                </button>
            </div> -->
                </aside>
            </div>
        </div>
    </div>
</template>

<style lang="less" scoped>
@max-width: 1000px;
@side-width: 300px;
.layout {
    display: flex;
    justify-content: center;
    .root {
        width: 100%;
        max-width: @max-width;
        height: 100vh;
        color: #393535;
        font-family: Inter, system-ui, sans-serif;
        display: flex;
        flex-direction: column;
        padding-top: 10px;
        .header {
            padding: 5px;
            display: flex;
            justify-content: center;
            align-items: center;
            h1 {
                margin: 0;
            }
        }
        .nav {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0 1em;
            background-color: #fff;
            box-shadow: 0 0 1em #00000033;
            position: sticky;
            top: 0;
            z-index: 1;
            .logo-container {
                display: flex;
                align-items: center;
                img {
                    width: 40px;
                    height: 40px;
                    margin-right: 10px;
                }
                a {
                    color: #646cff;
                    text-decoration: none;
                    &:hover {
                        text-decoration: underline;
                    }
                }
                .share-button {
                    display: flex;
                    // height: 80%;
                    align-items: center;
                    justify-content: center;
                    padding: 0 5px;
                    border-radius: 5px;
                    color: #1b1717;
                    text-decoration: none;
                    &:hover {
                        box-shadow: 0 0 10px #00000033;
                    }
                    .logo {
                        width: 35px;
                        height: 35px;
                        img {
                            width: 35px;
                            height: 35px;
                            margin-right: 0px;
                        }
                    }
                }
            }
        }
        .flex {
            padding-top: 50px;
            display: flex;
            flex-wrap: wrap;
            flex-direction: row;
            justify-content: space-between;
            align-items: top;
            .body {
                width: calc(@max-width - @side-width - 16px);
                max-width: 100%;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                svg {
                    width: 500px;
                    height: 500px;
                    border: 3px dashed #00000033;
                }
                @media screen and (max-width: 500px) {
                    svg {
                        width: 300px;
                        height: 300px;
                    }
                }
                .row-container {
                    width: 60%;
                    display: flex;
                    flex-direction: row;
                    justify-content: space-evenly;
                    align-items: center;

                    .button {
                        position: relative;
                        margin-top: 30px;
                        width: 80px;
                        height: 80px;
                        border-radius: 50%;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        border: none;
                        background-color: #eee;
                        cursor: pointer;
                        img {
                            width: 50px;
                            height: 50px;
                            background-color: #eee;
                        }
                        &:hover {
                            transition-duration: 0.5s;
                            background-color: #3a3a3a;
                            box-shadow: 0 0 10px #050505;
                            img {
                                filter: invert(86%);
                                transition-duration: 0.5s;
                            }
                        }
                    }

                    .button:after {
                        content: "";
                        display: block;
                        position: absolute;
                        border-radius: 4em;
                        left: 0;
                        top: 0;
                        width: 100%;
                        height: 100%;
                        opacity: 0;
                        transition: all 0.5s;
                        box-shadow: 0 0 10px 40px #050505;
                        z-index: -1;
                    }

                    .button:active:after {
                        box-shadow: 0 0 0 0 #050505;
                        position: absolute;
                        border-radius: 4em;
                        left: 0;
                        top: 0;
                        opacity: 1;
                        transition: 0s;
                    }

                    .button:active {
                        top: 1px;
                    }
                }
            }
            .aside {
                width: @side-width;
                display: flex;
                flex-direction: column;

                .control {
                    padding: 2px 12px;
                    height: 40px;
                    margin-bottom: 10px;
                    display: flex;
                    flex-direction: row;
                    align-items: center;
                    border-radius: 5px;
                    // border-bottom: 1px solid #00000033;

                    .checkbox {
                        width: 20px;
                        height: 20px;
                        margin-right: 10px;
                    }
                    .param {
                        width: 20%;
                        font-size: 20px;
                        text-align: center;
                        margin-right: 10px;
                        text-align: left;
                    }
                    .color-picker {
                        width: 35px;
                        height: 35px;
                        border: none;
                        border-radius: 5px;
                        cursor: pointer;
                    }
                    .range {
                        width: 60%;
                    }
                    button {
                        width: 100%;
                        height: 40px;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        border: none;
                        border-radius: 5px;
                        background-color: #eee;
                        cursor: pointer;
                        img {
                            width: 20px;
                            height: 20px;
                            margin-right: 10px;
                        }
                    }
                }
                .control:hover {
                    background-color: #cececeaa;
                }
            }
        }

        // .footer {
        //     grid-area: footer;
        // }
    }
}
</style>
