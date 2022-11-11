import * as Tiny from '@alipay/tiny.js';
import { ICONS } from '../constants';
import { getLength } from '../utils';
import { reticfyIcon } from '../common';
import { Frame } from './Frame';

const [img, a, b] = ICONS['zoom'];

class Zoom extends Tiny.Sprite {
  $bindEvent(parent) {
    const { targetWidth, targetHeight, spriteContainer, widgetContainer, $icons } = parent;
    const { minScale, maxScale } = this;
    const originRadius = getLength(targetWidth, targetHeight);
    const cancelHandler = function(e) {
      if (!this.activated) return;
      this.activated = false;
    };

    this.setEventEnabled(true);
    this.on('pointerdown', function(e) {
      e.stopPropagation();

      const { x, y } = e.data.getLocalPosition(this.parent);

      this.activated = true;
      this.lastX = x;
      this.lastY = y;
    });
    this.on('pointermove', function(e) {
      if (e.data.originalEvent.touches && e.data.originalEvent.touches.length > 1) return;
      if (!this.activated) return;

      const { x, y } = e.data.getLocalPosition(this.parent);
      const deltaX = x - this.lastX;
      const deltaY = y - this.lastY;
      const alpha = Math.atan2(deltaY, deltaX);
      const radius = getLength(deltaX, deltaY);
      const scale = (radius / originRadius) * 2;
      const originScale = spriteContainer.scale.x;

      if (alpha > 0) {
        const deltaScale = originScale + scale;

        if (deltaScale >= maxScale) return;

        spriteContainer.setScale(deltaScale);
      } else {
        const deltaScale = originScale - scale;

        if (deltaScale <= minScale) return;

        spriteContainer.setScale(deltaScale);
      }

      const sx = spriteContainer.scale.x;
      const rect = widgetContainer.getChildAt(0);

      widgetContainer.removeChild(rect);
      widgetContainer.addChildAt(Frame.getInstance({
        ...rect.$property,
        ...{
          width: -targetWidth * sx,
          height: -targetHeight * sx,
        },
      }), 0);
      reticfyIcon($icons, targetWidth / 2 * sx, targetHeight / 2 * sx);

      this.lastX = x;
      this.lastY = y;
    });
    this.on('pointerup', cancelHandler);
    this.on('pointercancel', cancelHandler);
    this.on('pointerupoutside', cancelHandler);
  }
}

Zoom.getInstance = function(parent, opts) {
  const { targetWidth, targetHeight, $icons } = parent;
  const { sprite = img, minScale, maxScale } = opts;
  let icon = sprite;

  if (Tiny.isString(icon)) {
    icon = Tiny.Texture.fromImage(icon);
  }

  if (icon instanceof Tiny.Texture) {
    icon = new Zoom(icon);
  }

  $icons['zoom'] = icon;
  icon.setAnchor(0.5);
  icon.setPosition(targetWidth / 2 * a, targetHeight / 2 * b);
  icon.minScale = minScale;
  icon.maxScale = maxScale;
  icon.$bindEvent(parent);

  return icon;
};

export { Zoom };
