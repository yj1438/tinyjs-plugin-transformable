class Draggable {
  constructor(target, draggable) {
    const cancelHandler = function(e) {
      if (!this.activated) return;
      this.activated = false;
    };

    target.setEventEnabled(true);
    target.on('pointerdown', function(e) {
      e.stopPropagation();
      if (e.data.originalEvent.touches && e.data.originalEvent.touches.length > 1) return;

      const { x, y } = e.data.getLocalPosition(this.parent);

      this.activated = true;
      this.lastX = x;
      this.lastY = y;
      this.lastGlobalX = target.x;
      this.lastGlobalY = target.y;
      target.activate();
    });
    target.on('pointermove', function(e) {
      if (e.data.originalEvent.touches && e.data.originalEvent.touches.length > 1) return;
      if (!draggable) return;

      let { x, y } = e.data.getLocalPosition(this.parent);

      if (this.activated && (this.lastX !== x || this.lastY !== y)) {
        if (draggable.inScreen) {
          x = Math.max(0, Math.min(Tiny.WIN_SIZE.width, x));
          y = Math.max(0, Math.min(Tiny.WIN_SIZE.height, y));
        }
        this.setPosition(
          this.lastGlobalX + (x - this.lastX),
          this.lastGlobalY + (y - this.lastY),
        );
      }
    });
    target.on('pointerup', cancelHandler);
    target.on('pointercancel', cancelHandler);
    target.on('pointerupoutside', cancelHandler);
  }
}

export { Draggable };
