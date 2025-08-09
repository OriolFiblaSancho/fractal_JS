
// Fractal Generator JS with Zoom and Pan
const canvas = document.getElementById('fractalCanvas');
const ctx = canvas.getContext('2d');
let zoom = 1;
let offsetX = 0;
let offsetY = 0;
let currentFractal = 'koch';
// expose for UI active highlighting
window.currentFractal = currentFractal;

function clearCanvas() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function setTransform() {
    // Zoom to a point slightly off-center (e.g., 30% from left, 50% from top)
    const cx = canvas.width * 0.5;
    const cy = canvas.height * 0.4755;
    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset
    ctx.translate(cx + offsetX, cy + offsetY);
    ctx.scale(zoom, zoom);
    ctx.translate(-cx, -cy);
}

function getAdaptiveDepth(base, zoom, maxDepth) {
    // Increase depth as zoom increases, but cap at maxDepth
    return Math.min(maxDepth, base + Math.floor(Math.log2(zoom)));
}

function drawFractal() {
    clearCanvas();
    setTransform();
    switch (currentFractal) {
        case 'koch':
            drawKoch(getAdaptiveDepth(5, zoom, 9));
            break;
        case 'sierpinski':
            drawSierpinski(getAdaptiveDepth(7, zoom, 11));
            break;
        case 'mandelbrot':
            drawMandelbrot();
            break;
    }
}

// Mandelbrot fractal (pixel-based)
function drawMandelbrot() {
    // Reset transform for pixel-accurate drawing
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const w = canvas.width;
    const h = canvas.height;
    const img = ctx.createImageData(w, h);
    const data = img.data;

    // View parameters; support zoom/offset by mapping screen to complex plane
    // Base view for Mandelbrot
    const baseScale = 3.0; // spans roughly [-2.5, 0.5] horizontally
    const centerRe = -0.5;
    const centerIm = 0.0;

    // Convert canvas pixel to complex plane considering zoom/offset
    const scale = baseScale / Math.min(w, h) / zoom;
    const offsetRe = (offsetX - w / 2) * scale;
    const offsetIm = (offsetY - h / 2) * scale;

    const maxIter = Math.round(100 * Math.sqrt(zoom)); // adaptive iterations

    for (let y = 0; y < h; y++) {
        const im = (y - h / 2) * scale + centerIm - offsetIm;
        for (let x = 0; x < w; x++) {
            const re = (x - w / 2) * scale + centerRe - offsetRe;
            let zr = 0, zi = 0;
            let iter = 0;
            while (zr * zr + zi * zi <= 4 && iter < maxIter) {
                const zr2 = zr * zr - zi * zi + re;
                const zi2 = 2 * zr * zi + im;
                zr = zr2; zi = zi2;
                iter++;
            }
            const idx = (y * w + x) * 4;
            // Smooth coloring
            let t = iter / maxIter;
            if (iter < maxIter) {
                const logZn = Math.log(zr * zr + zi * zi) / 2;
                const nu = Math.log(logZn / Math.log(2)) / Math.log(2);
                t = (iter + 1 - nu) / maxIter;
            }
            const color = hslToRgb(0.66 - 0.66 * t, 1, 0.5); // blue to cyan palette
            data[idx] = color[0];
            data[idx + 1] = color[1];
            data[idx + 2] = color[2];
            data[idx + 3] = 255;
        }
    }
    ctx.putImageData(img, 0, 0);
}

function hslToRgb(h, s, l) {
    let r, g, b;
    if (s === 0) { r = g = b = l; }
    else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

// Koch Snowflake
function drawKoch(depth) {
    const size = 400;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2 + 100;
    const h = size * Math.sqrt(3) / 2;
    const p1 = [centerX - size / 2, centerY];
    const p2 = [centerX + size / 2, centerY];
    const p3 = [centerX, centerY - h];
    ctx.strokeStyle = '#0077ff';
    ctx.lineWidth = 2 / zoom;
    kochCurve(p1, p2, depth);
    kochCurve(p2, p3, depth);
    kochCurve(p3, p1, depth);
}

function kochCurve(a, b, depth) {
    if (depth === 0) {
        ctx.beginPath();
        ctx.moveTo(a[0], a[1]);
        ctx.lineTo(b[0], b[1]);
        ctx.stroke();
        return;
    }
    const dx = (b[0] - a[0]) / 3;
    const dy = (b[1] - a[1]) / 3;
    const p1 = [a[0] + dx, a[1] + dy];
    const p2 = [a[0] + 2 * dx, a[1] + 2 * dy];
    const angle = Math.atan2(b[1] - a[1], b[0] - a[0]) - Math.PI / 3;
    const px = p1[0] + Math.cos(angle) * Math.sqrt(dx * dx + dy * dy);
    const py = p1[1] + Math.sin(angle) * Math.sqrt(dx * dx + dy * dy);
    kochCurve(a, p1, depth - 1);
    kochCurve(p1, [px, py], depth - 1);
    kochCurve([px, py], p2, depth - 1);
    kochCurve(p2, b, depth - 1);
}

// Sierpinski Triangle
function drawSierpinski(depth) {
    const size = 500;
    const h = size * Math.sqrt(3) / 2;
    const p1 = [canvas.width / 2, canvas.height / 2 - h / 2];
    const p2 = [canvas.width / 2 - size / 2, canvas.height / 2 + h / 2];
    const p3 = [canvas.width / 2 + size / 2, canvas.height / 2 + h / 2];
    sierpinski(p1, p2, p3, depth);
}

function sierpinski(a, b, c, depth) {
    if (depth === 0) {
        ctx.beginPath();
        ctx.moveTo(a[0], a[1]);
        ctx.lineTo(b[0], b[1]);
        ctx.lineTo(c[0], c[1]);
        ctx.closePath();
        ctx.fillStyle = '#ff6600';
        ctx.fill();
        return;
    }
    const ab = midpoint(a, b);
    const bc = midpoint(b, c);
    const ca = midpoint(c, a);
    sierpinski(a, ab, ca, depth - 1);
    sierpinski(ab, b, bc, depth - 1);
    sierpinski(ca, bc, c, depth - 1);
}

function midpoint(p1, p2) {
    return [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2];
}

// Controls
window.onload = () => {
    drawFractal();
    document.getElementById('kochBtn').onclick = () => {
        currentFractal = 'koch'; window.currentFractal = currentFractal;
        drawFractal();
    };
    document.getElementById('sierpinskiBtn').onclick = () => {
        currentFractal = 'sierpinski'; window.currentFractal = currentFractal;
        drawFractal();
    };
    document.getElementById('mandelbrotBtn').onclick = () => {
        currentFractal = 'mandelbrot'; window.currentFractal = currentFractal;
        drawFractal();
    };
    document.getElementById('zoomInBtn').onclick = () => {
        zoom *= 1.2;
        drawFractal();
    };
    document.getElementById('zoomOutBtn').onclick = () => {
        zoom /= 1.2;
        drawFractal();
    };
    canvas.onmousedown = startPan;
};

let isPanning = false, startX, startY;
function startPan(e) {
    isPanning = true;
    startX = e.offsetX;
    startY = e.offsetY;
    canvas.onmousemove = pan;
    canvas.onmouseup = endPan;
}
function pan(e) {
    if (!isPanning) return;
    offsetX += (e.offsetX - startX);
    offsetY += (e.offsetY - startY);
    startX = e.offsetX;
    startY = e.offsetY;
    drawFractal();
}
function endPan() {
    isPanning = false;
    canvas.onmousemove = null;
    canvas.onmouseup = null;
}
