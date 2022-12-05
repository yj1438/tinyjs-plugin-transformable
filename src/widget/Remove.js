import * as Tiny from '@alipay/tiny.js';
import { ICONS } from '../constants';

const [img, a, b] = ICONS['remove'];

class Remove extends Tiny.Sprite {
  $bindEvent(parent) {
    this.setEventEnabled(true);
    this.on('pointerdown', (e) => {
      e.stopPropagation();
    });
    this.on('pointerup', (e) => {
      parent.emit('remove:touchend', e);
    });
    this.on('pointertap', (e) => {
      parent.emit('remove:click', e);
    });
  }
}

Remove.getInstance = function(parent, opts) {
  const { targetWidth, targetHeight, $icons } = parent;
  const { sprite = img } = opts;
  let icon = sprite;

  if (Tiny.isString(icon)) {
    icon = Tiny.Texture.fromImage(icon);
  }

  if (icon instanceof Tiny.Texture) {
    icon = new Remove(icon);
  }

  $icons['remove'] = icon;
  icon.setAnchor(0.5);
  icon.setPosition(targetWidth / 2 * a, targetHeight / 2 * b);
  icon.$bindEvent(parent);

  return icon;
};

export { Remove };
