import * as Tiny from '@alipay/tiny.js';

class Draggable {
  /**
   * @param {Tiny.Container} elementsContainer
   * @param {object} [opts={}] - 是否可缩放
   * @param {number} [opts.offsetX=0] - 是否可缩放
   * @param {number} [opts.offsetY=0] - 是否可缩放
   * @param {number | 'auto'} [opts.width='auto'] - 是否可缩放
   * @param {number | 'auto'} [opts.height='auto'] - 是否可缩放
   * @param {boolean} [opts.strict=false] - 是否严格在内部，true:图片整体在内部; false:图片锚点(中心)在内部
   */
  static setDragArea(elementsContainer, opts) {
    if (!elementsContainer) {
      throw new Error('[tinyjs-transformable] setDragArea 未指定有效 container');
    }
    const { width, height, offsetX, offsetY, strict } = opts || {};
    elementsContainer.dragArea = { width, height, offsetX, offsetY, strict };
  }

  constructor(target, draggable) {
    const cancelHandler = function(e) {
      if (!target.activated) return;
      target.activated = false;
    };

    target.setEventEnabled(true);
    target.on('pointerdown', function(e) {
      e.stopPropagation();
      if (e.data.originalEvent.touches && e.data.originalEvent.touches.length > 1) return;

      const { x, y } = e.data.getLocalPosition(target.parent);
      target.activated = true;
      target.lastX = x;
      target.lastY = y;
      target.lastGlobalX = target.x;
      target.lastGlobalY = target.y;
      target.activate();
    });
    target.on('pointermove', function(e) {
      if (e.data.originalEvent.touches && e.data.originalEvent.touches.length > 1) return;
      if (!draggable) return;

      let { x, y } = e.data.getLocalPosition(target.parent);

      if (target.activated && (target.lastX !== x || target.lastY !== y)) {
        if (draggable.inScreen) {
          x = Math.max(0, Math.min(Tiny.WIN_SIZE.width, x));
          y = Math.max(0, Math.min(Tiny.WIN_SIZE.height, y));
        }
        let targetX = target.lastGlobalX + (x - target.lastX);
        let targetY = target.lastGlobalY + (y - target.lastY);

        // 在父 container 的区域范围内拖拽
        if (target.parent && target.parent.dragArea) {
          const { width, height, offsetX = 0, offsetY = 0, strict = false } = target.parent.dragArea;
          const _halfW = target.spriteContainer.width / 2;
          const _halfH = target.spriteContainer.height / 2;
          const _left = offsetX + (strict ? _halfW : 0);
          const _top = offsetY + (strict ? _halfH : 0);
          targetX = Math.max(_left, Math.min(offsetX - (strict ? _halfW : 0) + (typeof width === 'number' ? width : target.parent.width), targetX));
          targetY = Math.max(_top, Math.min(offsetY - (strict ? _halfH : 0) + (typeof height === 'number' ? height : target.parent.height), targetY));
        }
        target.setPosition(
          targetX,
          targetY,
        );
      }
    });
    target.on('pointerup', cancelHandler);
    target.on('pointercancel', cancelHandler);
    target.on('pointerupoutside', cancelHandler);
  }
}

export { Draggable };
