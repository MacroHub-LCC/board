const {jsPDF} = window.jspdf;

function checkVisiableUndoAndRebo() {
    const havePath = !!(pathsInstance.paths.length);
    const haveUndoStack = !!(pathsInstance.undoStack.length);
    const itemUndo = document.getElementById('undo');
    const itemRedo = document.getElementById('redo');
    if (!itemUndo || !itemRedo) return;
    itemUndo.style.display = havePath ? 'flex' : 'none';
    itemRedo.style.display = haveUndoStack ? 'flex' : 'none';
}

function menuItem(e) {
    let type = e.getAttribute("content");
    const title = document.getElementsByClassName("modal-heading")[0];
    if(type === 'download-pdf'){
        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = board.width;
        exportCanvas.height = board.height;
        const exportCtx = exportCanvas.getContext('2d');
        exportCtx.fillStyle = localStorage.getItem('bcolor');
        exportCtx.fillRect(0, 0, board.width, board.height);
        exportCtx.drawImage(board, 0, 0);
        const orientation = board.width > board.height ? 'l' : 'p';
        const doc = new jsPDF(orientation, 'px', [board.width, board.height]);
        doc.addImage(exportCanvas.toDataURL('image/png', 1.0), 'PNG', 0, 0, board.width, board.height);
        const locale = new Date().toLocaleString();
        doc.save(`board${locale}.pdf`);
    }
    if (type == "about") {
        title.innerHTML = "About";
        modal.style.display = "block";
        document.getElementById("about").style.display = 'block';
        document.getElementById("version").innerHTML = version;
        modal.style.display = "block";
    }
    if (type == "help") {
        title.innerHTML = "Help";
        document.getElementById("help").style.display = 'block';
        modal.style.display = "block";
    }
    if (type == "setting") {
        title.innerHTML = "Settings";
        document.getElementById("setting").style.display = 'block';
        document.getElementById("font").value = localStorage.getItem("font");
        const f = document.getElementById("fcolor");
        const b = document.getElementById("bcolor");
        f.innerHTML = "";
        b.innerHTML = "";
        for (let key of Object.keys(colors)) {
            let opt = document.createElement('option');
            opt.value = colors[key];
            opt.innerHTML = key;
            if (key == localStorage.getItem("bcolor"))
                opt.setAttribute("selected", true);
            b.appendChild(opt);
            opt = document.createElement('option');
            opt.value = colors[key];
            opt.innerHTML = key;
            if (key == localStorage.getItem("fcolor"))
                opt.setAttribute("selected", true);
            f.appendChild(opt);
        }
        const btn = document.getElementById("save");
        modal.style.display = "block";
        btn.onclick = (e) => {
            const font = document.getElementById("font").value;
            const marker_color = f.options[f.selectedIndex].value;
            const background_color = b.options[b.selectedIndex].value;
            if (marker_color != background_color && font >= 1) {
                localStorage.setItem("bcolor", background_color);
                localStorage.setItem("fcolor", marker_color);
                localStorage.setItem("font", font);
                close.click();
                board.style.backgroundColor = localStorage.getItem('bcolor');
            } else {
                const error = "Wrong input are given";
                document.getElementById("error").innerText = error;
            }
        };
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

const modal = document.getElementById("modal");
const close = document.getElementsByClassName("close")[0];
close.onclick = function () {
    modal.style.display = "none";
    document.getElementById("about").style.display = 'none';
    document.getElementById("help").style.display = 'none';
    document.getElementById("setting").style.display = 'none';
};

function initUI() {
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

    document.querySelectorAll('[data-pen]').forEach(btn => {
        btn.addEventListener('click', () => {
            currentPen = btn.getAttribute('data-pen');
        });
    });

    const colorPicker = document.getElementById('colorPicker');
    const storedColor = localStorage.getItem("fcolor");
    colorPicker.value = storedColor && storedColor.startsWith('#') ? storedColor : '#ffffff';
    colorPicker.addEventListener('change', (e) => {
        localStorage.setItem("fcolor", e.target.value);
    });

    const bgPicker = document.getElementById('bgColorPicker');
    const storedBg = localStorage.getItem('bcolor');
    bgPicker.value = storedBg && storedBg.startsWith('#') ? storedBg : '#000000';
    bgPicker.addEventListener('change', (e) => {
        localStorage.setItem('bcolor', e.target.value);
        board.style.backgroundColor = e.target.value;
        repaint();
        saveToLocalStorage();
    });

    const polygonSides = document.getElementById('polygonSides');
    for (let i = 3; i <= 32; i++) {
        const opt = document.createElement('option');
        opt.value = i;
        opt.textContent = i;
        polygonSides.appendChild(opt);
    }

    checkVisiableUndoAndRebo();
}
