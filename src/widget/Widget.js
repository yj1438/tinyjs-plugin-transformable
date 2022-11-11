import * as Tiny from '@alipay/tiny.js';
import { noop } from '../utils';
import { customIcons } from '../common';

class Widget extends Tiny.Sprite {
  $bindEvent(listeners) {
    this.setEventEnabled(true);
    this.on('pointerdown', listeners.onTouchStart || noop);
    this.on('pointermove', listeners.onTouchMove || noop);
    this.on('pointerup', listeners.onTouchEnd || noop);
    this.on('pointercancel', listeners.onTouchCancel || noop);
    this.on('pointerupoutside', listeners.onTouchCancel || noop);
  }
}

Widget.getInstance = function(parent, opts) {
  const { targetWidth, targetHeight, $icons } = parent;
  const { sprite, name, pos, listeners } = opts;
  const [a, b] = pos;
  let icon = sprite;

  if (Tiny.isString(icon)) {
    icon = Tiny.Texture.fromImage(icon);
  }

  if (icon instanceof Tiny.Texture) {
    icon = new Widget(icon);
  }

  $icons[name] = icon;
  customIcons[name] = [sprite, ...pos];
  icon.setAnchor(0.5);
  icon.setPosition(targetWidth / 2 * a, targetHeight / 2 * b);
  icon.$bindEvent(listeners);

  return icon;
};

export { Widget };
