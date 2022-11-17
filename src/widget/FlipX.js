import * as Tiny from '@alipay/tiny.js';
import { ICONS } from '../constants';

const [img, a, b] = ICONS['flipx'];

class FlipX extends Tiny.Sprite {
  $bindEvent(parent) {
    const { target } = parent;

    this.setEventEnabled(true);
    this.on('pointerdown', (e) => {
      e.stopPropagation();
    });
    this.on('pointerup', (e) => {
      target.scale.x *= -1;
      if (!target.anchor) {
        target.position.x = target.scale.x > 0 ? 0 : target.width;
      }
      parent.emit('flipx:touchend', e);
    });
  }
}

FlipX.getInstance = function(parent, opts) {
  const { targetWidth, targetHeight, $icons } = parent;
  const { sprite = img } = opts;
  let icon = sprite;

  if (Tiny.isString(icon)) {
    icon = Tiny.Texture.fromImage(icon);
  }

  if (icon instanceof Tiny.Texture) {
    icon = new FlipX(icon);
  }

  $icons['flipx'] = icon;
  icon.setAnchor(0.5);
  icon.setPosition(targetWidth / 2 * a, targetHeight / 2 * b);
  icon.$bindEvent(parent);

  return icon;
};

export { FlipX };
