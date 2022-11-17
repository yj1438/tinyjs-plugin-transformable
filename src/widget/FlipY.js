import * as Tiny from '@alipay/tiny.js';
import { ICONS } from '../constants';

const [img, a, b] = ICONS['flipy'];

class FlipY extends Tiny.Sprite {
  $bindEvent(parent) {
    const { target } = parent;

    this.setEventEnabled(true);
    this.on('pointerdown', (e) => {
      e.stopPropagation();
    });
    this.on('pointerup', (e) => {
      target.scale.y *= -1;
      if (!target.anchor) {
        target.position.y = target.scale.y > 0 ? 0 : target.height;
      }
      parent.emit('flipy:touchend', e);
    });
  }
}

FlipY.getInstance = function(parent, opts) {
  const { targetWidth, targetHeight, $icons } = parent;
  const { sprite = img } = opts;
  let icon = sprite;

  if (Tiny.isString(icon)) {
    icon = Tiny.Texture.fromImage(icon);
  }

  if (icon instanceof Tiny.Texture) {
    icon = new FlipY(icon);
  }

  $icons['flipy'] = icon;
  icon.setAnchor(0.5);
  icon.setPosition(targetWidth / 2 * a, targetHeight / 2 * b);
  icon.$bindEvent(parent);

  return icon;
};

export { FlipY };
