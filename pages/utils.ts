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

export function copySvgCode() {
    const svgElement: SVGSVGElement = document.querySelector("#targetSvg")!;
    const svgXML = new XMLSerializer().serializeToString(svgElement);
    navigator.clipboard.writeText(svgXML);
}
