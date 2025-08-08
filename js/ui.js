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

function downloadImage() {
    const link = document.createElement('a');
    const locale = new Date().toLocaleString();
    const filename = `board${locale}.png`;
    link.download = filename;
    link.href = board.toDataURL();
    link.click();
}

function menuItem(e) {
    let type = e.getAttribute("content");
    const title = document.getElementsByClassName("modal-heading")[0];
    const body = document.getElementsByClassName("modal-body")[0];
    const footer = document.getElementsByClassName("modal-footer")[0];

    if (type == 'download') {
        downloadImage();
    }
    if (type == 'download-with-bg') {
        ctx.globalCompositeOperation = "destination-over";
        ctx.fillStyle = localStorage.getItem("bcolor");
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        downloadImage();
    }
    if(type === 'download-pdf'){
        const doc = new jsPDF("l" , "mm" , "a3");
        doc.addImage(board.toDataURL("image/jpeg" , 1.0) , 'JPEG' , 0 , 0  );
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

    const polygonSides = document.getElementById('polygonSides');
    for (let i = 3; i <= 32; i++) {
        const opt = document.createElement('option');
        opt.value = i;
        opt.textContent = i;
        polygonSides.appendChild(opt);
    }

    checkVisiableUndoAndRebo();
}
