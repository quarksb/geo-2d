export function downloadCore(blob: Blob, fileName: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

export interface ShapesParams {
    width: number;
    height: number;
    d: string;
    rotate: number;
    blur: number;
    blurExpandRatio?: number;
    color0: string;
    color1: string;
}

export function downloadByParams(params: ShapesParams, isPng = false) {
    const { width = 500, height = 500, d, rotate, blur, blurExpandRatio = 2.5, color0, color1 } = params;
    const svgElement: SVGSVGElement = document.querySelector("#targetSvg")!;
    const svgXML = new XMLSerializer().serializeToString(svgElement);
    if (isPng) {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d")!;
        const path = new Path2D(d);
        const gradient = ctx.createLinearGradient(0, 0, width * Math.cos(rotate), height * Math.sin(rotate));
        gradient.addColorStop(0.05, color0);
        gradient.addColorStop(0.95, color1);
        ctx.fillStyle = gradient;
        const blurExpands = blur * blurExpandRatio;
        const scaleX = width / (width + 2 * blurExpands);
        const scaleY = height / (height + 2 * blurExpands);
        ctx.setTransform(scaleX, 0, 0, scaleY, blurExpands, blurExpands);
        ctx.filter = `blur(${blur}px)`;
        ctx.fill(path);
        canvas.toBlob((blob) => {
            downloadCore(blob!, "image.png");
        });
    } else {
        const blob = new Blob([svgXML], { type: "image/svg+xml" });
        downloadCore(blob, "image.svg");
    }
}

export function copySvgCode() {
    const svgElement: SVGSVGElement = document.querySelector("#targetSvg")!;
    const svgXML = new XMLSerializer().serializeToString(svgElement);
    navigator.clipboard.writeText(svgXML);
}

export function throttle(fn: Function, delay: number) {
    let lastTime = 0;
    return function (this: any, ...args: any[]) {
        const nowTime = Date.now();
        if (nowTime - lastTime > delay) {
            fn.apply(this, args);
            lastTime = nowTime;
        }
    };
}

export function parseSvgFromUrl(url: string) {
    return new Promise<SVGSVGElement>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", url);
        xhr.responseType = "document";
        xhr.onload = () => {
            resolve(xhr.responseXML!.documentElement as unknown as SVGSVGElement);
        };
        xhr.onerror = () => {
            reject(new Error("parse svg error"));
        };
        xhr.send();
    });
}

/**add media recorder */
export function addDownloadButton(canvas: HTMLCanvasElement) {
    const recordButton = document.createElement("button");
    recordButton.innerText = "录制";
    recordButton.style.position = "absolute";
    recordButton.style.top = "10px";
    recordButton.style.right = "10px";
    document.body.appendChild(recordButton);

    // canvas 录制
    let recorder: MediaRecorder;
    let chunks: Blob[] = [];
    recordButton.addEventListener("click", () => {
        if (recorder) {
            recorder.stop();
        } else {
            recorder = new MediaRecorder(canvas.captureStream(20), {
                mimeType: "video/webm",
            });
            recorder.ondataavailable = (e) => {
                if (e.data && e.data.size) {
                    chunks.push(e.data);
                }
            };
            recorder.start();

            recorder.onstop = () => {
                const blob = new Blob(chunks, { type: "video/webm" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "record.webm";
                a.click();
                chunks = [];
                recordButton.innerText = "录制";
                recorder = null!;
            };
            recordButton.innerText = "结束";
        }
    });
}
