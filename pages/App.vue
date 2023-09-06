<script setup lang="ts">
import { getSvgPathBySize } from "../src/core/svg";
import { ref, watch, computed } from "vue";
import { downloadCore, copySvgCode } from "./utils";
import { gradientArr } from "./data";

const msg = "quark_china";
const url = "https://freesvg.win";
const text = encodeURIComponent(`Make organic SVG shapes with $FreeSvg by @${msg}`);
const href = `http://twitter.com/intent/tweet?url=${url}&text=${text}&original_referer=${url}`;
const size = 500;
const width = size;
const height = size;
let blur = ref(2);
const blurExpandRatio = 2.4;
const viewBox = computed(() => {
    const blurExpands = blur.value * blurExpandRatio;
    return `${-blurExpands} ${-blurExpands} ${width + 2 * blurExpands} ${height + 2 * blurExpands}`;
});
let rotate = ref(45);
let color0 = ref(gradientArr[1][0]);
let color1 = ref(gradientArr[1][1]);
let d = ref("");
let polygonNum = ref(6);
let ramada = ref(0.5);
let randomSeed = ref(0.314);
let isDebug = ref(false);
let smoothPercent = ref(1);
function renderSvgPath(ramada: number) {
    const path = getSvgPathBySize({ width, height, polygonNum: polygonNum.value, ramada, randomSeed: randomSeed.value, isDebug: isDebug.value, smoothPercent: smoothPercent.value });
    d.value = path;
}
function smoothRender() {
    renderSvgPath(ramada.value);
}

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
function randomAll() {
    randomSeed.value = Math.random();
    polygonNum.value = Math.floor(Math.random() * 8) + 3;
    ramada.value = Math.random();
    const gradient = gradientArr[Math.floor(Math.random() * gradientArr.length)];
    color0.value = gradient[0];
    color1.value = gradient[1];
    // 变化矩阵以原点为中心旋转
    rotate.value = Math.floor(Math.random() * 90);
    // smoothPercent.value = Math.random();
}
// 页面加载完成之后添加svg
smoothRender();
watch(polygonNum, () => {
    smoothRender();
});
watch(ramada, () => {
    smoothRender();
});
watch(randomSeed, () => {
    smoothRender();
});
watch(isDebug, () => {
    smoothRender();
});
watch(smoothPercent, () => {
    smoothRender();
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
                    <img alt="quark" src="/quark.png" />
                    <h1>
                        By
                        <a href="https://github.com/quarksb" target="_blank">{{ msg }}</a>
                    </h1>
                </div>
                <a type="button" :href="href" class="share-button"
                    >Share
                    <div class="logo">
                        <img src="/twitter.svg" />
                    </div>
                </a>
            </nav>
            <div class="flex">
                <body class="body">
                    <svg id="targetSvg" :viewBox="viewBox" focusable="false" role="presentation" class="css-1im46kq">
                        <defs>
                            <linearGradient id="myGradient" :gradientTransform="`rotate(${rotate})`">
                                <stop offset="5%" :stop-color="color0" />
                                <stop offset="95%" :stop-color="color1" />
                            </linearGradient>
                            <filter id="blurMe" v-if="blur > 0">
                                <feGaussianBlur in="SourceGraphic" :stdDeviation="blur" />
                            </filter>
                        </defs>
                        <path id="target" fill="url(#myGradient)" :d="d" filter="url(#blurMe)"></path>
                    </svg>
                    <div class="row-container">
                        <button class="button">
                            <img src="/rand.svg" alt="random" @click="randomAll" />
                        </button>
                        <button class="button">
                            <img src="/download.png" alt="download" @click="download(false)" />
                        </button>
                    </div>
                </body>

                <aside class="aside">
                    <div class="control">
                        <div class="param">color</div>
                        <input class="color-picker" type="color" v-model="color0" />
                        <input class="color-picker" type="color" v-model="color1" />
                        <!-- <ColorPicker class="color-picker" style="margin-left: -20px;" v-model="color0" /> -->
                    </div>
                    <div class="control">
                        <div class="param">num</div>
                        <input type="range" v-model="polygonNum" min="3" max="10" step="1" />
                    </div>
                    <div class="control">
                        <div class="param">flex</div>
                        <input type="range" v-model="ramada" min="0" max="1" step="0.01" />
                    </div>
                    <div class="control">
                        <div class="param">smooth</div>
                        <input type="range" v-model="smoothPercent" min="0.5" max="1" step="0.01" />
                    </div>
                    <div class="control">
                        <div class="param">blur</div>
                        <input type="range" v-model="blur" min="0" max="20" step="1" />
                    </div>
                    <div class="control">
                        <button
                            type="button"
                            @click="
                                () => {
                                    randomSeed = Math.random();
                                }
                            "
                        >
                            Random
                        </button>
                    </div>

                    <div class="control">
                        <button type="button" @click="download(false)">
                            <img src="/download.png" alt="download" />
                            svg
                        </button>
                    </div>
                    <div class="control">
                        <button type="button" @click="download(true)">
                            <img src="/download.png" alt="download" />
                            png
                        </button>
                    </div>
                    <div class="control">
                        <button type="button" @click="copySvgCode">
                            <img src="/code.png" alt="copy" />
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
            }
            .share-button {
                display: flex;
                height: 80%;
                align-items: center;
                justify-content: center;
                padding: 0 1em;
                border-radius: 5px;
                color: #1b1717;
                text-decoration: none;
                &:hover {
                    background-color: #cececeaa;
                }
                img {
                    width: 35px;
                    height: 35px;
                    margin-left: 15px;
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
                            box-shadow: 0 0 1em #00000033;
                        }
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

                    .param {
                        width: 30%;
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
                    input {
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
