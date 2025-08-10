<script setup lang="ts">
import {
  getPathStr,
  interpolatePolygon,
  getEaseElasticOut,
  getPolygon,
  getCurvesByPolygon,
  resizeCurvesByBBox,
} from "../src";
import { ref, watch, computed } from "vue";
import { downloadCore, copySvgCode, throttle } from "./utils";
import { gradientArr } from "./data";
import { vec2 } from "gl-matrix";
import * as styles from "./app.css";

const msg = "quark_china";
const url = "https://quarksb.com";
const text = encodeURIComponent(
  `Make organic SVG shapes with $FreeSvg by @${msg}`
);
const href = `http://twitter.com/intent/tweet?url=${url}&text=${text}&original_referer=${url}`;
const size = 500;
const width = size;
const height = size;
let blur = ref(0);
let isBlurSelected = ref(false);
const blurExpandRatio = 3;
const viewBox = computed(() => {
  const blurExpands = blur.value * blurExpandRatio;
  return `${-blurExpands} ${-blurExpands} ${width + 2 * blurExpands} ${
    height + 2 * blurExpands
  }`;
});
let rotate = ref(45);
let isRotateSelected = ref(false);
let colorIndex = 6;
let color0 = ref(gradientArr[colorIndex][0]);
let color1 = ref(gradientArr[colorIndex][1]);
let isColorSelected = ref(false);
let d = ref("");
const minPolygonNum = 4;
const maxPolygonNum = 20;

let polygonNum = ref(10);
let isPolygonNumSelected = ref(false);
let degree = ref(3);
let isDegreeSelected = ref(false);
let ramada = ref(0.5);
let isRamadaSelected = ref(false);
let randomSeed = ref(0.8859102140559103);
let isDebug = ref(false);
let isScaleToEdge = ref(false);
let currentState: {
  polygon: vec2[];
  polygonNum: number;
} = { polygon: [], polygonNum: polygonNum.value };
let handle: number | null = null;
let timeOutId: number | null = null;
let tempPolygon: vec2[] = [];

// 生成svg path, 并赋值给d, 如果有旧数据，则利用新旧数据插值生成动画
function renderSvgPath() {
  const resetPolygonState = () => {
    if (handle) {
      cancelAnimationFrame(handle);
      currentState.polygon = tempPolygon;
      handle = null;
    }
    if (timeOutId) {
        clearTimeout(timeOutId);
        timeOutId = null;
    }

    const targetPolygon = getPolygon(width, height, polygonNum.value, ramada.value, 0, randomSeed.value);
    if (currentState.polygon.length > 0) {
        const animationTime = 3000;
        let initTime = performance.now();
        const baseRender = (time: number) => {
            // const t = (time - initTime) / animationTime;
            const t = getEaseElasticOut((time - initTime) / animationTime);
            tempPolygon = interpolatePolygon(currentState.polygon, targetPolygon, t);
            console.log(degree.value);

            const curves = getCurvesByPolygon(tempPolygon, degree.value);
            if (isScaleToEdge.value) {
                resizeCurvesByBBox(curves, { x: 0, y: 0, width, height });
            }

            d.value = getPathStr(curves);
            handle = requestAnimationFrame(baseRender);
        };
        handle = requestAnimationFrame(baseRender);

        timeOutId = setTimeout(resetPolygonState, animationTime) as unknown as number;
    } else {
        const curves = getCurvesByPolygon(targetPolygon, degree.value);
        if (isScaleToEdge.value) {
            resizeCurvesByBBox(curves, { x: 0, y: 0, width, height });
        }
        d.value = getPathStr(curves);
        currentState.polygon = targetPolygon;
    }
    currentState.polygon = targetPolygon;
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
    const gradient = ctx.createLinearGradient(
      0,
      0,
      width * Math.cos(rotate.value),
      height * Math.sin(rotate.value)
    );
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
    const gradient =
      gradientArr[Math.floor(Math.random() * gradientArr.length)];
    color0.value = gradient[0];
    color1.value = gradient[1];
  }
  if (isPolygonNumSelected.value) {
    polygonNum.value =
      Math.round(Math.random() * (maxPolygonNum - minPolygonNum)) +
      minPolygonNum;
  }
  if (isDegreeSelected.value) {
    degree.value = Math.round(Math.random() * (5 - 1)) + 1;
  }
  if (isRamadaSelected.value) {
    ramada.value = Math.random();
  }

  randomSeed.value = Math.random();
}
// 页面加载完成之后添加svg
smoothRender();
// 监听参数变化，重新渲染svg
[
  blur,
  rotate,
  color0,
  color1,
  polygonNum,
  degree,
  ramada,
  randomSeed,
  isDebug,
  isScaleToEdge,
].forEach((item) => {
  watch(item, () => {
    smoothRender();
  });
});
</script>

<template>
    <div :class="[styles.themeClass, styles.layout]">
        <div :class="styles.root">
            <nav :class="styles.nav">
                <div :class="styles.logoContainer">
                    <img alt="quark" src="./assets/quark.png" :class="styles.logoImg" />
                    <h1 :class="styles.logoText">
                        By
                        <a href="https://github.com/quarksb" target="_blank" :class="styles.link">{{ msg }}</a>
                    </h1>
                </div>
                <div :class="styles.logoContainer">
                    <a type="button" href="https://github.com/quarksb/organic-svg" :class="styles.shareButton">
                        <div :class="styles.shareIcon">
                            <img src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png" :class="styles.shareIcon" />
                        </div>
                    </a>
                    <a type="button" :href="href" :class="styles.shareButton">
                        <div :class="styles.shareIcon">
                            <img src="./assets/twitter.svg" :class="styles.shareIcon" />
                        </div>
                    </a>
                </div>
            </nav>
            <div :class="styles.content">
                <div :class="styles.mainArea">
                    <svg id="targetSvg" :viewBox="viewBox" focusable="false" role="presentation" :class="styles.svg">
                        <defs>
                            <linearGradient id="myGradient" :gradientTransform="`rotate(${rotate})`">
                                <stop offset="5%" :stop-color="color0" />
                                <stop offset="95%" :stop-color="color1" />
                            </linearGradient>
                            <filter id="blurMe">
                                <feGaussianBlur in="SourceGraphic" :stdDeviation="blur" />
                            </filter>
                        </defs>
                        <path id="target" fill="url(#myGradient)" :d="d" filter="url(#blurMe)" stroke="red"></path>
                    </svg>
                    <div :class="styles.actionButtons">
                        <button :class="styles.circleButton">
                            <img src="./assets/rand.svg" alt="random" @click="randomSelect" :class="styles.buttonIcon" />
                        </button>
                        <button :class="styles.circleButton">
                            <img src="./assets/download.png" alt="download" @click="download(false)" :class="styles.buttonIcon" />
                        </button>
                    </div>
                </div>

                <aside :class="styles.sidebar">
                    <div :class="styles.control">
                        <input :class="styles.checkbox" type="checkbox" v-model="isColorSelected" />
                        <div :class="styles.label">color</div>
                        <input :class="styles.colorInput" type="color" v-model="color0" />
                        <input :class="styles.colorInput" type="color" v-model="color1" />
                    </div>
                    <div :class="styles.control">
                        <input :class="styles.checkbox" type="checkbox" v-model="isScaleToEdge" />
                        <div :class="styles.label">isScaleToEdge</div>
                    </div>
                    <div :class="styles.control">
                        <input :class="styles.checkbox" type="checkbox" v-model="isRotateSelected" />
                        <div :class="styles.label">rotate</div>
                        <input :class="styles.rangeInput" type="range" v-model="rotate" min="0" max="90" step="1" />
                    </div>
                    <div :class="styles.control">
                        <input :class="styles.checkbox" type="checkbox" v-model="isDegreeSelected" />
                        <div :class="styles.label">degree</div>
                        <input :class="styles.rangeInput" type="range" v-model="degree" :min="1" :max="5" step="1" />
                    </div>
                    <div :class="styles.control">
                        <input :class="styles.checkbox" type="checkbox" v-model="isPolygonNumSelected" />
                        <div :class="styles.label">num</div>
                        <input :class="styles.rangeInput" type="range" v-model="polygonNum" :min="minPolygonNum" :max="maxPolygonNum" step="1" />
                    </div>
                    <div :class="styles.control">
                        <input :class="styles.checkbox" type="checkbox" v-model="isRamadaSelected" />
                        <div :class="styles.label">flex</div>
                        <input :class="styles.rangeInput" type="range" v-model="ramada" min="0" max="1" step="0.01" />
                    </div>
                    <div :class="styles.control">
                        <input :class="styles.checkbox" type="checkbox" v-model="isBlurSelected" />
                        <div :class="styles.label">blur</div>
                        <input :class="styles.rangeInput" type="range" v-model="blur" min="0" max="20" step="1" />
                    </div>
                    <div :class="styles.control">
                        <button type="button" @click="randomSelect" :class="styles.controlButton">Random Select</button>
                    </div>

                    <div :class="styles.control">
                        <button type="button" @click="download(false)" :class="styles.controlButton">
                            <img src="./assets/download.png" alt="download" :class="styles.controlIcon" />
                            svg
                        </button>
                    </div>
                    <div :class="styles.control">
                        <button type="button" @click="download(true)" :class="styles.controlButton">
                            <img src="./assets/download.png" alt="download" :class="styles.controlIcon" />
                            png
                        </button>
                    </div>
                    <div :class="styles.control">
                        <button type="button" @click="copySvgCode" :class="styles.controlButton">
                            <img src="./assets/code.png" alt="copy" :class="styles.controlIcon" />
                            copy
                        </button>
                    </div>
                </aside>
            </div>
        </div>
    </div>
  </div>
</template>

