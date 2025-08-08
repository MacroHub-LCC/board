window.addEventListener('load', () => {
    if (debug === false && 'serviceWorker' in navigator) {
        navigator.serviceWorker.register('./pwa.js').then(reg => {
            reg.update();
        });
    }

    resize();
    restoreFromLocalStorage();
    window.onresize = () => {
        saveToLocalStorage();
        resize();
        restoreFromLocalStorage();
    };

    window.addEventListener('beforeunload', saveToLocalStorage);

    initUI();

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

    document.onkeydown = (e) => {
        if (e.ctrlKey && e.keyCode === 88) {
            localStorage.removeItem("board");
            resize();
        }
    };

    document.addEventListener('touchstart', startDraw, {passive: false});
    document.addEventListener('touchend', endDraw, {passive: false});
    window.addEventListener("touchmove", (e) => {
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
            if (e.touches.length === 1)
                middleDraw(e.touches[0]);
            if (e.touches.length === 5) {
                localStorage.removeItem("board");
                resize();
            }
        }
    }, {passive: false});

    document.addEventListener('keydown', handleKeydown);
});
