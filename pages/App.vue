<script setup lang="ts">
import logoUrl from "../public/logo.png";
import twitterLogo from "../public/twitter.svg";
import downloadLogo from "../public/download.png";
import codeLogo from "../public/code.png";
import { getSvgPathBySize } from "../src/core/svg";
import { ref, watch } from "vue";
import { downloadCore } from "./utils";

// defineProps<{ msg: string }>()

const msg = "QuarkSb";
const url = "https://www.blobmaker.app";
const text = "Make%20organic%20%23SVG%20shapes%20with%$FreeSvg%20by%20%Quark&amp";
const href = `http://twitter.com/intent/tweet?url=${url}&text=${text}&original_referer=${url}`;
const size = 500;
const width = size;
const height = size;
const viewBox = `0 0 ${width} ${height}`;
let color = ref("#03fef2");
let d = ref("");
let polygonNum = ref(6);
let ramada = ref(0.5);
let randomSeed = ref(0.314);
let isDebug = ref(false);
function renderSvgPath() {
    const path = getSvgPathBySize({ width, height, polygonNum: polygonNum.value, ramada: ramada.value, randomSeed: randomSeed.value, isDebug: isDebug.value });
    d.value = path;
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
        ctx.fillStyle = color.value;
        ctx.fill(path);
        canvas.toBlob((blob) => {
            downloadCore(blob!, "image.png");
        });
    } else {
        const blob = new Blob([svgXML], { type: "image/svg+xml" });
        downloadCore(blob, "image.svg");
    }
}
function copySvgCode() {
    const svgElement: SVGSVGElement = document.querySelector("#targetSvg")!;
    const svgXML = new XMLSerializer().serializeToString(svgElement);
    navigator.clipboard.writeText(svgXML);
}
// 页面加载完成之后添加svg
renderSvgPath();
watch(polygonNum, () => {
    renderSvgPath();
});
watch(ramada, () => {
    renderSvgPath();
});
watch(randomSeed, () => {
    renderSvgPath();
});
watch(isDebug, () => {
    renderSvgPath();
});
</script>

<template>
    <div class="root">
        <header class="header">
            <h2>Glory to Ukraine and freedom will prevail!</h2>
        </header>
        <nav class="nav">
            <div class="logo-container">
                <img alt="quark" :src="logoUrl" />
                <h1>
                    By
                    <a href="https://github.com/quarksb" target="_blank">{{ msg }}</a>
                </h1>
            </div>
            <a type="button" :href="href" class="share-button"
                >Share
                <div class="logo">
                    <img :src="twitterLogo" />
                </div>
            </a>
        </nav>
        <body class="body">
            <svg id="targetSvg" :viewBox="viewBox" focusable="false" role="presentation" class="css-1im46kq">
                <path id="target" :fill="color" :d="d"></path>
            </svg>
        </body>
        <aside class="aside">
            <div class="control">
                <div class="param">color</div>
                <input class="color-pick" type="color" v-model="color"  />
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
                <button
                    type="button"
                    @click="
                        () => {
                            randomSeed = Math.random();
                        }
                    "
                >
                    Generate
                </button>
            </div>

            <div class="control">
                <button type="button" @click="download(false)">
                    <img :src="downloadLogo" alt="download" />
                    svg
                </button>
            </div>
            <div class="control">
                <button type="button" @click="download(true)">
                    <img :src="downloadLogo" alt="download" />
                    png
                </button>
            </div>
            <div class="control">
                <button type="button" @click="copySvgCode">
                    <img :src="codeLogo" alt="copy" />
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
</template>

<style lang="less" scoped>
.root {
    width: 100%;
    height: 100vh;
    display: grid;
    gap: 5px;
    grid-template-columns: auto 300px;
    grid-template-rows: 60px 60px 1fr 100px;
    grid-template-areas:
        "header header"
        "nav nav"
        "body aside";
    .header {
        grid-area: header;
        padding: 5px;
        display: flex;
        justify-content: center;
        align-items: center;
        h1 {
            margin: 0;
        }
    }
    .nav {
        grid-area: nav;
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
    .body {
        grid-area: body;
        display: flex;
        justify-content: center;
        align-items: center;
        svg {
            width: 500px;
            height: 500px;
            background-position: 0px 0px, 10px 10px;
            background-size: 10px 10px;
            background-image: linear-gradient(45deg, #eee 25%, transparent 25%, transparent 75%, #eee 75%, #eee 100%), linear-gradient(145deg, #eee 25%, white 25%, white 75%, #eee 75%, #eee 100%);
        }
    }
    .aside {
        grid-area: aside;
        border-left: 1px solid #00000033;
        display: flex;
        flex-direction: column;
        padding: 10px;
        .control {
            height: 40px;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1px solid #00000033;
            .param {
                width: 50px;
                font-size: 30px;
                text-align: center;
                margin-right: 20px;
            }
            input {
                width: 100%;
            }
            button {
                width: 100%;
                height: 30px;
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
    }
    // .footer {
    //     grid-area: footer;
    // }
}
</style>
