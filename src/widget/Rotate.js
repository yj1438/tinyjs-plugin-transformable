import * as Tiny from '@alipay/tiny.js';
import { ICONS } from '../constants';
import { getAngle } from '../utils';
import { reticfyAngle } from '../common';

const [img, a, b] = ICONS['rotate'];

class Rotate extends Tiny.Sprite {
  $bindEvent(parent) {
    const { target, widgetContainer, spriteContainer } = parent;
    const { fitness } = this;
    const cancelHandler = function(e) {
      if (!this.activated) return;
      this.activated = false;
      this.startAngle = Tiny.radian2deg(this.lastRadian || 0);
    };

    this.setEventEnabled(true);
    this.on('pointerdown', function(e) {
      e.stopPropagation();

      const { x, y } = e.data.getLocalPosition(fitness ? parent : this.parent);

      this.activated = true;
      this.lastX = x;
      this.lastY = y;
      this.startAngle = Tiny.radian2deg(this.lastRadian || 0);
    });
    this.on('pointermove', function(e) {
      if (e.data.originalEvent.touches && e.data.originalEvent.touches.length > 1) return;
      if (!this.activated) return;

      const { x, y } = e.data.getLocalPosition(fitness ? parent : this.parent);
      const angle = getAngle(this.lastX, this.lastY, x, y);
      const rotateAngle = reticfyAngle(Math.round(this.startAngle + angle));
      const radian = Tiny.deg2radian(rotateAngle);

      if (fitness) {
        widgetContainer.setRotation(radian);
        spriteContainer.setRotation(radian);
      } else {
        target.setRotation(radian);
      }
      this.lastRadian = radian;
    });
    this.on('pointerup', cancelHandler);
    this.on('pointercancel', cancelHandler);
    this.on('pointerupoutside', cancelHandler);
  }
}

Rotate.getInstance = function(parent, opts) {
  const { targetWidth, targetHeight, $icons } = parent;
  const { sprite = img, fitness } = opts;
  let icon = sprite;

  if (Tiny.isString(icon)) {
    icon = Tiny.Texture.fromImage(icon);
  }

  if (icon instanceof Tiny.Texture) {
    icon = new Rotate(icon);
  }

  $icons['rotate'] = icon;
  icon.setAnchor(0.5);
  icon.setPosition(targetWidth / 2 * a, targetHeight / 2 * b);
  icon.fitness = fitness;
  icon.$bindEvent(parent);

  return icon;
};

export { Rotate };
