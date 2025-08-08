const pathsInstance = new Paths();
const {jsPDF} = window.jspdf;

// Progressive app
if (debug === false) {
    window.onload = () => {
        'use strict';

        if ('serviceWorker' in navigator) {
            navigator.serviceWorker
                .register('./pwa.js').then(reg => {
                    // Trigger this after timeout
                    reg.update();
                });
        }
    }
}

function checkVisiableUndoAndRebo() {
    const havePath = !!(pathsInstance.paths.length);
    const haveUndoStack = !!(pathsInstance.undoStack.length);
    const itemUndo = document.getElementById('undo');
    const itemRedo = document.getElementById('redo');
    if (!itemUndo || !itemRedo) return;
    itemUndo.style.display = havePath ? 'flex' : 'none';
    itemRedo.style.display = haveUndoStack ? 'flex' : 'none';
}

// Event handle on page load.
window.addEventListener('load', () => {
    // Resizes the canvas once the window loads
    resize();
    // Restore image from the localStorage if exists.
    /*
     * We can restore it but it will be better if we provide option to restore or not!
     * As in PWA we have to show some content at any cost.
     */
    //restoreFromLocalStorage();

    // On window resize handle.
    window.onresize = () => {
        saveToLocalStorage();
        resize();
        restoreFromLocalStorage();
    };

    // toolbar controls
    const toolbar = document.getElementById('toolbar');
    const showToolbar = document.getElementById('showToolbar');
    const hideToolbar = document.getElementById('hideToolbar');

    hideToolbar.addEventListener('click', () => {
        toolbar.style.display = 'none';
        showToolbar.style.display = 'block';
    });

    showToolbar.addEventListener('click', () => {
        toolbar.style.display = 'flex';
        showToolbar.style.display = 'none';
    });

    document.querySelectorAll('[data-tool]').forEach(btn => {
        btn.addEventListener('click', () => {
            currentTool = btn.getAttribute('data-tool');
        });
    });

    const colorPicker = document.getElementById('colorPicker');
    const storedColor = localStorage.getItem("fcolor");
    colorPicker.value = storedColor && storedColor.startsWith('#') ? storedColor : '#ffffff';
    colorPicker.addEventListener('change', (e) => {
        localStorage.setItem("fcolor", e.target.value);
    });

    const polygonSides = document.getElementById('polygonSides');
    for (let i = 3; i <= 32; i++) {
        const opt = document.createElement('option');
        opt.value = i;
        opt.textContent = i;
        polygonSides.appendChild(opt);
    }

    checkVisiableUndoAndRebo();

    // handle mouse events.
    document.addEventListener('mousedown', startDraw);
    document.addEventListener('mouseup', endDraw);
    window.addEventListener("mousemove", (e) => {
        if (panning) {
            const dx = e.clientX - panLast.x;
            const dy = e.clientY - panLast.y;
            offset.x -= dx;
            offset.y -= dy;
            panLast.x = e.clientX;
            panLast.y = e.clientY;
            repaint();
        } else {
            if (e.shiftKey)
                middleDraw(e, localStorage.getItem("bcolor"), parseInt(localStorage.getItem("font")) + 20);
            else
                middleDraw(e);
        }
    });

    document.addEventListener('wheel', (e) => {
        offset.x += e.deltaX;
        offset.y += e.deltaY;
        repaint();
        e.preventDefault();
    }, {passive: false});
    // handle event for clear all.
    document.onkeydown = (e) => {
        // clear on ctrl + x.
        if (e.ctrlKey && e.keyCode === 88) {
            localStorage.removeItem("board");
            resize();
        }
    };

    // handle touch events.
    document.addEventListener('touchstart', startDraw, {passive: false});
    document.addEventListener('touchend', endDraw, {passive: false});
    window.addEventListener("touchmove", (e) => {
        // #15 Disable swipe to go back in chrome
        e.preventDefault();

        if (panning && e.touches.length === 2) {
            const touch = e.touches[0];
            const dx = touch.clientX - panLast.x;
            const dy = touch.clientY - panLast.y;
            offset.x -= dx;
            offset.y -= dy;
            panLast.x = touch.clientX;
            panLast.y = touch.clientY;
            repaint();
        } else {
            // Only allow to draw with one tap/finger
            if (e.touches.length === 1)
                middleDraw(e.touches[0]);

            // On five finger remove all.
            if (e.touches.length === 5) {
                localStorage.removeItem("board");
                resize();
            }
        }
    }, {passive: false});
    document.addEventListener('keydown', handleKeydown);
});

/* Set default parameters. */
const refactor = () => {
    // If font not exists, make it default.
    if (!localStorage.getItem("font"))
        localStorage.setItem("font", 3);
    // If background color not exists make it default.
    if (!localStorage.getItem("bcolor"))
        localStorage.setItem("bcolor", "black");
    // If foreground/marker color not exists make it default.
    if (!localStorage.getItem("fcolor"))
        localStorage.setItem("fcolor", "white");
}
refactor();
/* Default variables. */
let coordinate = {
    x: 0,
    y: 0
};
let draw = false;
let currentTool = 'pen';
let startShape = {x:0, y:0};

// get board.
const board = document.getElementById("board");
// Change background color.
board.style.backgroundColor = localStorage.getItem("bcolor");

// get the modal and close btn.
const modal = document.getElementById("modal");
const close = document.getElementsByClassName("close")[0];

// close modal.
close.onclick = function () {
    modal.style.display = "none";
    document.getElementById("about").style.display = 'none';
    document.getElementById("help").style.display = 'none';
    document.getElementById("setting").style.display = 'none';

}
// Init canvas
const ctx = board.getContext("2d");
ctx.globalCompositeOperation = 'destination-over';

/* Export/Download canvas image. */
const downland = () => {
    const link = document.createElement('a');
    const locale = new Date().toLocaleString();
    const filename = `board${locale}.png`;
    link.download = filename;

    link.href = board.toDataURL()
    link.click();
}
/* Menu handling. */
function menuItem(e) {
    let type = e.getAttribute("content");
    const title = document.getElementsByClassName("modal-heading")[0];
    const body = document.getElementsByClassName("modal-body")[0];

    const footer = document.getElementsByClassName("modal-footer")[0];

    // download menu
    if (type == 'download') {
        downland();
    }

    // download menu
    if (type == 'download-with-bg') {
        ctx.globalCompositeOperation = "destination-over";
        ctx.fillStyle = localStorage.getItem("bcolor");
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        downland();
    }

    // download as pdf
    if(type === 'download-pdf'){
        const doc = new jsPDF("l" , "mm" , "a3"); // Lanscape orientation , mm measurement and a3 paper size
        doc.addImage(board.toDataURL("image/jpeg" , 1.0) , 'JPEG' , 0 , 0  );
        const locale = new Date().toLocaleString();
        doc.save(`board${locale}.pdf`);
    }

    // about menu
    if (type == "about") {
        title.innerHTML = "About";
        modal.style.display = "block";
        document.getElementById("about").style.display = 'block';
        document.getElementById("version").innerHTML = version;
        modal.style.display = "block";
    }
    // help menu
    if (type == "help") {
        title.innerHTML = "Help";
        document.getElementById("help").style.display = 'block';
        modal.style.display = "block";
    }
    // settings menu
    if (type == "setting") {
        title.innerHTML = "Settings";
        document.getElementById("setting").style.display = 'block';
        // set font size value to default.
        document.getElementById("font").value = localStorage.getItem("font");
        // get elements.
        const f = document.getElementById("fcolor");
        const b = document.getElementById("bcolor");
        // reset to default.
        f.innerHTML = "";
        b.innerHTML = "";
        // loop through colors.
        for (let key of Object.keys(colors)) {
            // create required element.
            let opt = document.createElement('option');
            opt.value = colors[key];
            opt.innerHTML = key;
            // selected default or selected value.
            if (key == localStorage.getItem("bcolor"))
                opt.setAttribute("selected", true);
            b.appendChild(opt);
            // we need to recreate it, in order to append to both.
            opt = document.createElement('option');
            opt.value = colors[key];
            opt.innerHTML = key;
            // selected default or selected value.
            if (key == localStorage.getItem("fcolor"))
                opt.setAttribute("selected", true);
            f.appendChild(opt);
        }
        // get the button.
        const btn = document.getElementById("save");
        // open the modal.
        modal.style.display = "block";
        btn.onclick = (e) => {
            // get form values.
            const font = document.getElementById("font").value;
            const marker_color = f.options[f.selectedIndex].value;
            const background_color = b.options[b.selectedIndex].value;
            if (marker_color != background_color && font >= 1) {
                console.log(background_color);
                localStorage.setItem("bcolor", background_color);
                localStorage.setItem("fcolor", marker_color);
                localStorage.setItem("font", font);
                close.click();
                // Change background color.
                board.style.backgroundColor = localStorage.getItem('bcolor');
            } else {
                const error = "Wrong input are given";
                document.getElementById("error").innerText = error;
            }
        }
    }

    if (type === "undo") {
        pathsInstance.undoPath();
        repaint();
        checkVisiableUndoAndRebo();
    }

    if (type === "redo") {
        pathsInstance.redoPath();
        repaint();
        checkVisiableUndoAndRebo();
    }
}

/* Save to localStorage as image. */
const saveToLocalStorage = () => {
    // Get image base64 data.
    let canvasContents = board.toDataURL();
    // Make object of image data and time
    let data = {
        image: canvasContents,
        date: Date.now()
    };
    // Encode to json string
    let string = JSON.stringify(data);
    // Finally, store/update it.
    localStorage.setItem("board", string);
}

/* restore from localStorage as image. */
const restoreFromLocalStorage = () => {
    // If the image data exists.
    if (localStorage.getItem("board")) {
        // Get the image data, and decode it.
        let img = JSON.parse(localStorage.getItem("board"))['image'];
        var image = new Image();
        image.onload = function () {
            ctx.drawImage(image, 0, 0);
        };
        image.src = img;
    }
}

/* Resize. */
const resize = () => {
    ctx.canvas.width = window.innerWidth;
    ctx.canvas.height = window.innerHeight;

    // If window is full screen
    if ((window.fullScreen) ||
        (window.innerWidth == screen.width && window.innerHeight == screen.height)) {
        ctx.canvas.width = window.screen.width;
        ctx.canvas.height = window.screen.height;
    }

}

/* Get positions and store it to coordinate. */
let offset = { x: 0, y: 0 };
let panning = false;
let panLast = { x: 0, y: 0 };

const position = (e) => {
    // positions in world coordinates.
    coordinate.x = (e.clientX - board.offsetLeft) + offset.x;
    coordinate.y = (e.clientY - board.offsetTop) + offset.y;

}

/* Start the drawing. */
const startDraw = (e) => {
    if (e.target !== board) return;
    e.preventDefault();

    // handle panning for touch (two fingers)
    if (e.touches && e.touches.length === 2) {
        panning = true;
        panLast.x = e.touches[0].clientX;
        panLast.y = e.touches[0].clientY;
        return;
    }

    // handle panning for mouse with ctrl key
    if (!e.touches && e.ctrlKey) {
        panning = true;
        panLast.x = e.clientX;
        panLast.y = e.clientY;
        return;
    }

    draw = true;
    position(e.touches ? e.touches[0] : e);
    startShape = {x: coordinate.x, y: coordinate.y};
    pathsInstance.addNewPath(localStorage.getItem("fcolor"), localStorage.getItem("font"), currentTool);
}

/* End the drawing. */
const endDraw = (e) => {
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

/* drawing */
const middleDraw = (e, color = localStorage.getItem("fcolor"), width = localStorage.getItem("font")) => {
    if (!draw) return;

    if (currentTool === 'pen') {
        ctx.beginPath();
        ctx.lineWidth = width;
        ctx.lineCap = 'round';
        ctx.strokeStyle = color;
        ctx.setLineDash([]);

        ctx.moveTo(coordinate.x - offset.x, coordinate.y - offset.y);
        pathsInstance.addDataToLastPath(coordinate);
        position(e);
        ctx.lineTo(coordinate.x - offset.x, coordinate.y - offset.y);
        ctx.stroke();
        pathsInstance.clearUndoStack();
        pathsInstance.addDataToLastPath(coordinate);
        return;
    }

    // preview shapes while drawing
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

const resetCanvas = () => {
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

const repaint = () => {
    resetCanvas();
    const paths = pathsInstance.paths;
    paths.forEach(({
        width,
        color,
        paths
    }) => {
        ctx.beginPath();
        ctx.lineWidth = width;
        ctx.strokeStyle = color;
        ctx.moveTo(paths[0].x - offset.x, paths[0].y - offset.y);

        paths.forEach(({
            x,
            y
        }) => {
            ctx.lineTo(x - offset.x, y - offset.y);
        });
        ctx.stroke();
    });
}

const handleKeydown = (event) => {
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
