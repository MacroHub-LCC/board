const pathsInstance = new Paths();

let coordinate = { x: 0, y: 0 };
let draw = false;
let currentTool = 'pen';
let currentPen = 'pencil';
const penStyles = {
    pencil: {width: 2, opacity: 1},
    marker: {width: 5, opacity: 1},
    highlighter: {width: 12, opacity: 0.3}
};
let startShape = {x: 0, y: 0};

const board = document.getElementById("board");
board.style.backgroundColor = localStorage.getItem("bcolor");
const ctx = board.getContext("2d");
ctx.globalCompositeOperation = 'destination-over';

let offset = { x: 0, y: 0 };
let panning = false;
let panLast = { x: 0, y: 0 };

function position(e) {
    coordinate.x = (e.clientX - board.offsetLeft) + offset.x;
    coordinate.y = (e.clientY - board.offsetTop) + offset.y;
}

function startDraw(e) {
    if (e.target !== board) return;
    e.preventDefault();

    if (e.touches && e.touches.length === 2) {
        panning = true;
        panLast.x = e.touches[0].clientX;
        panLast.y = e.touches[0].clientY;
        return;
    }

    if (!e.touches && e.ctrlKey) {
        panning = true;
        panLast.x = e.clientX;
        panLast.y = e.clientY;
        return;
    }

    draw = true;
    position(e.touches ? e.touches[0] : e);
    startShape = {x: coordinate.x, y: coordinate.y};
    let width = localStorage.getItem("font");
    let opacity = 1;
    if (currentTool === 'pen') {
        const style = penStyles[currentPen];
        width = style.width;
        opacity = style.opacity;
    }
    pathsInstance.addNewPath(localStorage.getItem("fcolor"), width, currentTool, opacity);
}

function endDraw(e) {
    if (e.target !== board) return;
    e.preventDefault();

    if (panning) {
        panning = false;
        return;
    }

    if (!draw) return;
    draw = false;

    position(e.touches ? e.touches[0] : e);
    const endPos = {x: coordinate.x, y: coordinate.y};

    if (currentTool === 'line') {
        pathsInstance.addDataToLastPath(startShape);
        pathsInstance.addDataToLastPath(endPos);
    } else if (currentTool === 'rect') {
        const rectPoints = [
            {x: startShape.x, y: startShape.y},
            {x: startShape.x, y: endPos.y},
            {x: endPos.x, y: endPos.y},
            {x: endPos.x, y: startShape.y},
            {x: startShape.x, y: startShape.y}
        ];
        rectPoints.forEach(pt => pathsInstance.addDataToLastPath(pt));
    } else if (currentTool === 'circle') {
        const radius = Math.sqrt(Math.pow(endPos.x - startShape.x, 2) + Math.pow(endPos.y - startShape.y, 2));
        const segments = 36;
        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            const x = startShape.x + radius * Math.cos(angle);
            const y = startShape.y + radius * Math.sin(angle);
            pathsInstance.addDataToLastPath({x, y});
        }
    } else if (currentTool === 'polygon') {
        const sides = parseInt(document.getElementById('polygonSides').value, 10);
        const radius = Math.sqrt(Math.pow(endPos.x - startShape.x, 2) + Math.pow(endPos.y - startShape.y, 2));
        for (let i = 0; i <= sides; i++) {
            const angle = (i / sides) * Math.PI * 2;
            const x = startShape.x + radius * Math.cos(angle);
            const y = startShape.y + radius * Math.sin(angle);
            pathsInstance.addDataToLastPath({x, y});
        }
    } else {
        pathsInstance.clearLastEmptyRecode();
    }

    pathsInstance.clearUndoStack();
    repaint();
    checkVisiableUndoAndRebo();
}

function middleDraw(e, color = localStorage.getItem("fcolor"), width = localStorage.getItem("font")) {
    if (!draw) return;

    if (currentTool === 'pen') {
        const style = penStyles[currentPen];
        ctx.beginPath();
        ctx.lineWidth = style.width;
        ctx.lineCap = 'round';
        ctx.strokeStyle = color;
        ctx.globalAlpha = style.opacity;
        ctx.setLineDash([]);

        ctx.moveTo(coordinate.x - offset.x, coordinate.y - offset.y);
        pathsInstance.addDataToLastPath(coordinate);
        position(e);
        ctx.lineTo(coordinate.x - offset.x, coordinate.y - offset.y);
        ctx.stroke();
        ctx.globalAlpha = 1;
        pathsInstance.clearUndoStack();
        pathsInstance.addDataToLastPath(coordinate);
        return;
    }

    position(e);
    repaint();
    ctx.beginPath();
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.strokeStyle = color;
    ctx.setLineDash([]);

    if (currentTool === 'line') {
        ctx.moveTo(startShape.x - offset.x, startShape.y - offset.y);
        ctx.lineTo(coordinate.x - offset.x, coordinate.y - offset.y);
    } else if (currentTool === 'rect') {
        const x = Math.min(startShape.x, coordinate.x) - offset.x;
        const y = Math.min(startShape.y, coordinate.y) - offset.y;
        const w = Math.abs(coordinate.x - startShape.x);
        const h = Math.abs(coordinate.y - startShape.y);
        ctx.strokeRect(x, y, w, h);
    } else if (currentTool === 'circle') {
        const radius = Math.sqrt(Math.pow(coordinate.x - startShape.x, 2) + Math.pow(coordinate.y - startShape.y, 2));
        ctx.arc(startShape.x - offset.x, startShape.y - offset.y, radius, 0, Math.PI * 2);
    } else if (currentTool === 'polygon') {
        const sides = parseInt(document.getElementById('polygonSides').value, 10);
        const radius = Math.sqrt(Math.pow(coordinate.x - startShape.x, 2) + Math.pow(coordinate.y - startShape.y, 2));
        const angleStep = (Math.PI * 2) / sides;
        ctx.moveTo(startShape.x - offset.x + radius * Math.cos(0), startShape.y - offset.y + radius * Math.sin(0));
        for (let i = 1; i <= sides; i++) {
            const angle = i * angleStep;
            const x = startShape.x - offset.x + radius * Math.cos(angle);
            const y = startShape.y - offset.y + radius * Math.sin(angle);
            ctx.lineTo(x, y);
        }
        ctx.closePath();
    }

    ctx.stroke();
}

function resetCanvas() {
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

function repaint() {
    resetCanvas();
    const paths = pathsInstance.paths;
    paths.forEach(({width, color, opacity = 1, paths}) => {
        ctx.beginPath();
        ctx.lineWidth = width;
        ctx.strokeStyle = color;
        ctx.globalAlpha = opacity;
        ctx.moveTo(paths[0].x - offset.x, paths[0].y - offset.y);
        paths.forEach(({x, y}) => {
            ctx.lineTo(x - offset.x, y - offset.y);
        });
        ctx.stroke();
        ctx.globalAlpha = 1;
    });
}

function handleKeydown(event) {
    const isUndo = (event.ctrlKey || event.metaKey) && event.code === 'KeyZ' && !event.shiftKey;
    const isRedo = (event.ctrlKey || event.metaKey) && event.code === 'KeyZ' && event.shiftKey;
    if (isUndo) {
        const path = pathsInstance.undoPath();
        if (path && !path.paths.length) return;
    }
    if (isRedo) {
        const path = pathsInstance.redoPath();
        if (path && !path.paths.length) return;
    }
    if (isUndo || isRedo) {
        repaint();
        checkVisiableUndoAndRebo();
    }
}
