import { DEFAULT_FRAME, ICONS } from './constants';
import { getLength, getAngle, noop } from './utils';

const customIcons = {};

class Transformable extends Tiny.Container {
  constructor(sprite, opts = {}) {
    super();

    const { frame = {}, drag = {}, zoom = {}, rotation = {}, remove = {}, flipx = {}, flipy = {} } = opts;
    const { width, height } = sprite.getBounds();
    const wh = Math.sqrt(Math.pow(width, 2) + Math.pow(height, 2));

    this.$fixedIndex = false;
    this.$icons = {};
    this.$frameOpt = { ...DEFAULT_FRAME, ...frame };
    this.$zoomOpt = { ...{ minScale: 0.5, maxScale: 1.5 }, ...zoom };
    this.$rotationOpt = { ...rotation };
    this.$removeOpt = { ...remove };
    this.$flipxOpt = { ...flipx };
    this.$flipyOpt = { ...flipy };
    this.$sprite = sprite;
    this.$spriteContainer = new Tiny.Container();
    this.$container = new Tiny.Container();

    const { fitness } = this.$frameOpt;
    let w = width;
    let h = height;

    if (!fitness) {
      w = wh;
      h = wh;
    }

    sprite.setAnchor(0.5);
    this.$w = w;
    this.$h = h;
    this.deactivate();
    this.addChild(this.$spriteContainer);
    this.addChild(this.$container);
    this.$spriteContainer.addChild(sprite);
    this.$container.addChild(this.createFrame(w, h));

    this.enableDrag(drag);

    if (zoom) {
      this.$container.addChild(this.createZoom(w, h));
    }

    if (rotation) {
      this.$container.addChild(this.createRotate(w, h));
    }

    if (remove) {
      this.$container.addChild(this.createRemove(w, h));
    }

    if (flipx) {
      this.$container.addChild(this.createFlipX(w, h));
    }

    if (!flipx && flipy) {
      this.$container.addChild(this.createFlipY(w, h));
    }

    Transformable.instancesPoll.push(this);

    this.on('removed', () => {
      Tiny.arrayRemoveObject(Transformable.instancesPoll, this);
    });
  }

  activate() {
    Transformable.deactivateAll();
    this.$container.renderable = true;

    if (!this.$fixedIndex) {
      this.parent.setChildIndex(this, this.parent.children.length - 1);
    }

    for (const key in this.$icons) {
      this.$icons[key].setEventEnabled(true);
    }
  }

  deactivate() {
    this.$container.renderable = false;
    for (const key in this.$icons) {
      this.$icons[key].setEventEnabled(false);
    }
  }

  fixedIndex(fixed) {
    this.$fixedIndex = fixed;
  }

  enableDrag(drag) {
    const self = this;
    const cancelHandler = function(e) {
      if (!this.activated) return;
      this.activated = false;
    };

    this.setEventEnabled(true);
    this.on('pointerdown', function(e) {
      e.stopPropagation();
      if (e.data.originalEvent.touches && e.data.originalEvent.touches.length > 1) return;

      const { x, y } = e.data.getLocalPosition(this.parent);

      this.activated = true;
      this.lastX = x;
      this.lastY = y;
      this.lastGlobalX = self.x;
      this.lastGlobalY = self.y;
      self.activate();
    });
    this.on('pointermove', function(e) {
      if (e.data.originalEvent.touches && e.data.originalEvent.touches.length > 1) return;
      if (!drag) return;

      const { x, y } = e.data.getLocalPosition(this.parent);

      if (this.activated && (this.lastX !== x || this.lastY !== y)) {
        this.setPosition(
          this.lastGlobalX + (x - this.lastX),
          this.lastGlobalY + (y - this.lastY),
        );
      }
    });
    this.on('pointerup', cancelHandler);
    this.on('pointercancel', cancelHandler);
    this.on('pointerupoutside', cancelHandler);
  }

  createFrame(w, h) {
    const { thickness, color, lineOpacity, fill, fillOpacity } = this.$frameOpt;
    const rect = new Tiny.Graphics();

    rect.beginFill(fill, fillOpacity);
    rect.lineStyle(thickness, color, lineOpacity);
    rect.drawRect(-w / 2, -h / 2, w, h);
    rect.endFill();

    return rect;
  }

  createZoom(w, h) {
    const { sprite: iconSprite, minScale, maxScale } = this.$zoomOpt;
    const [img, a, b] = ICONS['zoom'];
    const icon = iconSprite && iconSprite instanceof Tiny.Sprite ? iconSprite : Tiny.Sprite.fromImage(img);
    const spriteContainer = this.$spriteContainer;
    const container = this.$container;
    const self = this;

    this.$icons['zoom'] = icon;
    icon.setAnchor(0.5);
    icon.setPosition(w / 2 * a, h / 2 * b);
    icon.setEventEnabled(true);

    const cancelHandler = function(e) {
      if (!this.activated) return;
      this.activated = false;
    };

    icon.on('pointerdown', function(e) {
      e.stopPropagation();

      const { x, y } = e.data.getLocalPosition(this.parent);

      this.activated = true;
      this.lastX = x;
      this.lastY = y;
    });
    icon.on('pointermove', function(e) {
      if (e.data.originalEvent.touches && e.data.originalEvent.touches.length > 1) return;
      if (!this.activated) return;

      const { x, y } = e.data.getLocalPosition(this.parent);
      const deltaX = x - this.lastX;
      const deltaY = y - this.lastY;
      const alpha = Math.atan2(deltaY, deltaX);
      const deltaL = getLength(deltaX, deltaY);
      const scale = (deltaL / w) * 0.3;
      const scScale = spriteContainer.scale.x;

      if (alpha > 0) {
        const deltaScale = scScale + scale;

        if (deltaScale >= maxScale) return;

        spriteContainer.setScale(deltaScale);
      } else {
        const deltaScale = scScale - scale;

        if (deltaScale <= minScale) return;

        spriteContainer.setScale(deltaScale);
      }

      const sx = spriteContainer.scale.x;
      const rect = container.getChildAt(0);

      container.removeChild(rect);
      container.addChildAt(self.createFrame(-w * sx, -h * sx), 0);
      reticfyIcon(self.$icons, w / 2 * sx, h / 2 * sx);
    });
    icon.on('pointerup', cancelHandler);
    icon.on('pointercancel', cancelHandler);
    icon.on('pointerupoutside', cancelHandler);

    return icon;
  }

  createRotate(w, h) {
    const { sprite: iconSprite } = this.$rotationOpt;
    const [img, a, b] = ICONS['rotate'];
    const icon = iconSprite && iconSprite instanceof Tiny.Sprite ? iconSprite : Tiny.Sprite.fromImage(img);
    const sprite = this.$sprite;

    this.$icons['rotate'] = icon;
    icon.setAnchor(0.5);
    icon.setPosition(w / 2 * a, h / 2 * b);
    icon.setEventEnabled(true);

    const cancelHandler = function(e) {
      if (!this.activated) return;
      this.activated = false;
      this.startAngle = Tiny.radian2deg(sprite.rotation);
    };

    icon.on('pointerdown', function(e) {
      e.stopPropagation();

      const { x, y } = e.data.getLocalPosition(this.parent);

      this.activated = true;
      this.lastX = x;
      this.lastY = y;
      this.startAngle = Tiny.radian2deg(sprite.rotation);
    });
    icon.on('pointermove', function(e) {
      if (e.data.originalEvent.touches && e.data.originalEvent.touches.length > 1) return;
      if (!this.activated) return;

      const { x, y } = e.data.getLocalPosition(this.parent);
      const angle = getAngle(this.lastX, this.lastY, x, y);
      const rotateAngle = reticfyAngle(Math.round(this.startAngle + angle));

      sprite.setRotation(Tiny.deg2radian(rotateAngle));
    });
    icon.on('pointerup', cancelHandler);
    icon.on('pointercancel', cancelHandler);
    icon.on('pointerupoutside', cancelHandler);

    return icon;
  }

  createRemove(w, h) {
    const { sprite: iconSprite } = this.$removeOpt;
    const [img, a, b] = ICONS['remove'];
    const icon = iconSprite && iconSprite instanceof Tiny.Sprite ? iconSprite : Tiny.Sprite.fromImage(img);

    this.$icons['remove'] = icon;
    icon.setAnchor(0.5);
    icon.setPosition(w / 2 * a, h / 2 * b);
    icon.setEventEnabled(true);

    icon.on('pointerdown', (e) => {
      e.stopPropagation();
    });
    icon.on('pointerup', (e) => {
      this.emit('remove:touchend', e);
    });

    return icon;
  }

  createFlipX(w, h) {
    const { sprite: iconSprite } = this.$flipxOpt;
    const [img, a, b] = ICONS['flipx'];
    const icon = iconSprite && iconSprite instanceof Tiny.Sprite ? iconSprite : Tiny.Sprite.fromImage(img);
    const sprite = this.$sprite;

    this.$icons['flipx'] = icon;
    icon.setAnchor(0.5);
    icon.setPosition(w / 2 * a, h / 2 * b);
    icon.setEventEnabled(true);

    icon.on('pointerdown', (e) => {
      e.stopPropagation();
    });
    icon.on('pointerup', (e) => {
      sprite.scale.x *= -1;
      this.emit('flipx:touchend', e);
    });

    return icon;
  }

  createFlipY(w, h) {
    const { sprite: iconSprite } = this.$flipyOpt;
    const [img, a, b] = ICONS['flipy'];
    const icon = iconSprite && iconSprite instanceof Tiny.Sprite ? iconSprite : Tiny.Sprite.fromImage(img);
    const sprite = this.$sprite;

    this.$icons['flipy'] = icon;
    icon.setAnchor(0.5);
    icon.setPosition(w / 2 * a, h / 2 * b);
    icon.setEventEnabled(true);

    icon.on('pointerdown', (e) => {
      e.stopPropagation();
    });
    icon.on('pointerup', (e) => {
      sprite.scale.y *= -1;
      this.emit('flipy:touchend', e);
    });

    return icon;
  }

  addWidget(name, image, pos = [1, 1], listeners = {}) {
    const [a, b] = pos;
    const icon = image && image instanceof Tiny.Sprite ? image : Tiny.Sprite.fromImage(image);
    const { $w: w, $h: h } = this;

    this.$icons[name] = icon;
    customIcons[name] = [image, ...pos];
    icon.setAnchor(0.5);
    icon.setPosition(w / 2 * a, h / 2 * b);
    icon.setEventEnabled(true);
    icon.on('pointerdown', listeners.onTouchStart || noop);
    icon.on('pointermove', listeners.onTouchMove || noop);
    icon.on('pointerup', listeners.onTouchEnd || noop);
    icon.on('pointercancel', listeners.onTouchCancel || noop);
    icon.on('pointerupoutside', listeners.onTouchCancel || noop);

    this.$container.addChild(icon);
  }
}

Transformable.instancesPoll = [];

Transformable.deactivateAll = () => {
  Transformable.instancesPoll.forEach(item => {
    item.deactivate();
  });
};

function reticfyIcon(icons, x, y) {
  const allIcons = { ...customIcons, ...ICONS };

  for (const key in allIcons) {
    const [, a, b] = allIcons[key];

    if (icons[key]) {
      icons[key].setPosition(x * a, y * b);
    }
  }
}

function reticfyAngle(rotateAngle) {
  if (rotateAngle >= 360) {
    rotateAngle -= 360;
  } else if (rotateAngle < 0) {
    rotateAngle += 360;
  }
  if (rotateAngle > 356 || rotateAngle < 4) {
    rotateAngle = 0;
  } else if (rotateAngle > 86 && rotateAngle < 94) {
    rotateAngle = 90;
  } else if (rotateAngle > 176 && rotateAngle < 184) {
    rotateAngle = 180;
  } else if (rotateAngle > 266 && rotateAngle < 274) {
    rotateAngle = 270;
  }

  return rotateAngle;
}

export { Transformable };
