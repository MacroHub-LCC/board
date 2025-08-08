function setDefaults() {
    if (!localStorage.getItem("font"))
        localStorage.setItem("font", 3);
    if (!localStorage.getItem("bcolor"))
        localStorage.setItem("bcolor", "black");
    if (!localStorage.getItem("fcolor"))
        localStorage.setItem("fcolor", "white");
}
setDefaults();

function saveToLocalStorage() {
    let canvasContents = board.toDataURL();
    let data = {
        image: canvasContents,
        date: Date.now()
    };
    localStorage.setItem("board", JSON.stringify(data));
}

function restoreFromLocalStorage() {
    if (localStorage.getItem("board")) {
        let img = JSON.parse(localStorage.getItem("board")).image;
        const image = new Image();
        image.onload = function () {
            ctx.drawImage(image, 0, 0);
        };
        image.src = img;
    }
}

function resize() {
    ctx.canvas.width = window.innerWidth;
    ctx.canvas.height = window.innerHeight;
    if ((window.fullScreen) ||
        (window.innerWidth == screen.width && window.innerHeight == screen.height)) {
        ctx.canvas.width = window.screen.width;
        ctx.canvas.height = window.screen.height;
    }
}
