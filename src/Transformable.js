import { DEFAULT_FRAME, ICONS } from './constants';
import { getLength, getAngle, noop } from './utils';

const customIcons = {};

class Transformable extends Tiny.Container {
  constructor(sprite, opts = {}) {
    super();

    const { frame = {}, drag = {}, zoom = {}, rotation = {}, remove = {}, flipx = {} } = opts;
    const { width, height } = sprite.getBounds();
    const wh = Math.sqrt(Math.pow(width, 2) + Math.pow(height, 2));

    // console.log(width, height);

    this.$icons = {};
    this.$frameOpt = { ...DEFAULT_FRAME, ...frame };
    this.$zoomOpt = { ...{ minScale: 0.5, maxScale: 1.5 }, ...zoom };
    this.$rotationOpt = { ...rotation };
    this.$removeOpt = { ...remove };
    this.$flipxOpt = { ...flipx };
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

    if (drag) {
      this.enableDrag();
    }

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

    Transformable.instancesPoll.push(this);

    this.on('removed', () => {
      Tiny.arrayRemoveObject(Transformable.instancesPoll, this);
    });
  }

  activate() {
    Transformable.deactivateAll();
    this.$container.renderable = true;
    this.parent.setChildIndex(this, Transformable.instancesPoll.length - 1);
  }

  deactivate() {
    this.$container.renderable = false;
  }

  enableDrag() {
    const self = this;
    const cancelHandler = function(e) {
      if (!this.dragging) return;
      this.dragging = false;
    };

    this.setEventEnabled(true);
    this.on('pointerdown', function(e) {
      e.stopPropagation();
      if (e.data.originalEvent.touches && e.data.originalEvent.touches.length > 1) return;

      const { x, y } = e.data.getLocalPosition(this.parent);

      this.dragging = true;
      this.lastGlobalX = x;
      this.lastGlobalY = y;
      this.lastX = self.x;
      this.lastY = self.y;
      self.activate();
    });
    this.on('pointermove', function(e) {
      if (e.data.originalEvent.touches && e.data.originalEvent.touches.length > 1) return;

      const { x, y } = e.data.getLocalPosition(this.parent);

      if (this.dragging && (this.lastGlobalX !== x || this.lastGlobalY !== y)) {
        this.setPosition(
          this.lastX + (x - this.lastGlobalX),
          this.lastY + (y - this.lastGlobalY),
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
      if (!this.dragging) return;
      this.dragging = false;
    };

    icon.on('pointerdown', function(e) {
      e.stopPropagation();

      const { x, y } = e.data.getLocalPosition(this.parent);

      this.dragging = true;
      this.lastGlobalX = x;
      this.lastGlobalY = y;
    });
    icon.on('pointermove', function(e) {
      if (e.data.originalEvent.touches && e.data.originalEvent.touches.length > 1) return;
      if (!this.dragging) return;

      const { x, y } = e.data.getLocalPosition(this.parent);
      const deltaX = x - this.lastGlobalX;
      const deltaY = y - this.lastGlobalY;
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
      if (!this.dragging) return;
      this.dragging = false;
      this.startAngle = Tiny.radian2deg(sprite.rotation);
    };

    icon.on('pointerdown', function(e) {
      e.stopPropagation();

      const { x, y } = e.data.getLocalPosition(this.parent);

      this.dragging = true;
      this.lastGlobalX = x;
      this.lastGlobalY = y;
      this.startAngle = Tiny.radian2deg(sprite.rotation);
    });
    icon.on('pointermove', function(e) {
      if (e.data.originalEvent.touches && e.data.originalEvent.touches.length > 1) return;
      if (!this.dragging) return;

      const { x, y } = e.data.getLocalPosition(this.parent);
      const angle = getAngle(this.lastGlobalX, this.lastGlobalY, x, y);
      const rotateAngle = reticfyAngle(Math.round(this.startAngle + angle));

      sprite.setRotation(Tiny.deg2radian(rotateAngle));
    });
    icon.on('pointerup', cancelHandler);
    icon.on('pointercancel', cancelHandler);
    icon.on('pointerupoutside', cancelHandler);

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
      e.stopPropagation();

      sprite.scale.x *= -1;
    });

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
      e.stopPropagation();

      this.emit('remove');
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
    icon.on('pointerdown', listeners.onStart || noop);
    icon.on('pointermove', listeners.onMove || noop);
    icon.on('pointerup', listeners.onCancel || noop);
    icon.on('pointercancel', listeners.onCancel || noop);
    icon.on('pointerupoutside', listeners.onCancel || noop);

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
