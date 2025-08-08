class Paths {
  paths = [];
  undoStack = [];

  addNewPath = (color = localStorage.getItem("fcolor"), width = localStorage.getItem("font"), type = 'pen', opacity = 1) => {
    this.paths.push({
        color,
        width,
        type,
        opacity,
        paths: []
    });
  }

  /**
   * 
   * @param {{x: number; y: number}}
   * @return {this}
   */
  addDataToLastPath = ({
    x,
    y,
  }) => {
    const lastestRecode = this.paths[this.paths.length - 1];
    lastestRecode.paths.push({
        x,
        y
    });
    return this;
  }

  /**
   * @returns {{ x: number; y: number; paths: [] }}
   */
  undoPath = () => {
    const pathUndo = this.paths.pop();
    if (pathUndo) {
      this.undoStack.push(pathUndo);
    }
    return pathUndo;
  }

  /**
   * @returns {{ x: number; y: number; paths: [] }}
   */
  redoPath = () => {
    if (this.undoStack.length) {
      const pointUndo = this.undoStack.pop();
      this.paths.push(pointUndo);

      return pointUndo;
    }

    return null;
  }

  clearUndoStack = () => {
    this.undoStack = [];
    return this;
  }

  clearLastEmptyRecode  = () => {
    if (this.paths.length) {
      const lastPath = this.paths[this.paths.length - 1];
      if (!lastPath.paths.length) this.paths.pop();
    }
    return this;
  }
}