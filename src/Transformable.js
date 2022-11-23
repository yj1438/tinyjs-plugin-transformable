import * as Tiny from '@alipay/tiny.js';
import { DEFAULT_FRAME } from './constants';
import { Draggable, Frame, Zoom, Rotate, Remove, FlipX, FlipY, Widget } from './widget';

/**
 * @example
 * var ta = new Tiny.Transformable(sprite);
 * ta.on('remove:touchend', function(e) {
 *   console.log('remove', e);
 *   this.parent.removeChild(this);
 * });
 *
 * @class
 */
class Transformable extends Tiny.Container {
  /**
   *
   * @param {Tiny.Sprite} target
   * @param {object} opts
   * @param {object} [opts.frame={}]
   * @param {boolean} [opts.frame.fitness=true] - 操作是否贴合
   * @param {number} [opts.frame.thickness=1] - 选框线条粗细
   * @param {number} [opts.frame.color=0xffffff] - 选框线条颜色
   * @param {number} [opts.frame.lineOpacity=1] - 选框线条透明度
   * @param {number} [opts.frame.fill=0] - 选框填充颜色值
   * @param {number} [opts.frame.fillOpacity=0] - 选框填充透明度
   * @param {boolean|object} [opts.drag={}] - 是否可拖拽
   * @param {boolean} opts.drag.inScreen - 是否可移出屏幕外
   * @param {boolean|object} [opts.zoom={}] - 是否可缩放
   * @param {string|Tiny.Texture|Tiny.Sprite} [opts.zoom.sprite=ICONS['zoom'][0]] - 缩放控件的显示对象
   * @param {number} [opts.zoom.minScale=0.5] - 最小缩放值
   * @param {number} [opts.zoom.maxScale=1.5] - 最大缩放值
   * @param {boolean|object} [opts.rotation={}] - 是否可旋转
   * @param {string|Tiny.Texture|Tiny.Sprite} [opts.rotation.sprite=ICONS['rotation'][0]] - 旋转控件的显示对象
   * @param {boolean|object} [opts.remove={}] - 是否显示移除控件
   * @param {string|Tiny.Texture|Tiny.Sprite} [opts.remove.sprite=ICONS['remove'][0]] - 移除控件的显示对象
   * @param {boolean|object} [opts.flipx={}] - 是否可横向翻转
   * @param {string|Tiny.Texture|Tiny.Sprite} [opts.flipx.sprite=ICONS['flipx'][0]] - 横向翻转控件的显示对象
   * @param {boolean|object} [opts.flipy={}] - 是否可纵向翻转
   * @param {string|Tiny.Texture|Tiny.Sprite} [opts.flipy.sprite=ICONS['flipy'][0]] - 纵向翻转控件的显示对象
   */
  constructor(target, opts = {}) {
    super();

    const { frame = {}, drag = {}, zoom = {}, rotation = {}, remove = {}, flipx = {}, flipy = {} } = opts;
    this.$fixedIndex = false;
    this.$icons = {};

    /**
     * @type {Tiny.Sprite}
     */
    this.target = target;

    /**
     * 被编辑显示对象的容器
     *
     * @type {Tiny.Container}
     */
    this.spriteContainer = new Tiny.Container();

    /**
     * 控件的容器
     *
     * @type {Tiny.Container}
     */
    this.widgetContainer = new Tiny.Container();

    /**
     * texture 加载后的初始化
     */
    const textureLoadedFn = () => {
      const { width, height } = target.getBounds();

      /**
       * 被编辑显示对象的宽
       *
       * @type {number}
       */
      this.targetWidth = width;
      /**
       * 被编辑显示对象的高
       *
       * @type {number}
       */
      this.targetHeight = height;
      this.deactivate();
      this.addChild(this.spriteContainer);
      this.addChild(this.widgetContainer);
      this.spriteContainer.addChild(target);
      this.widgetContainer.addChild(Frame.getInstance({ width, height, ...DEFAULT_FRAME, ...frame }));

      // transformable 元素锚点在中心
      if (target.anchor) {
        target.anchor.set(0.5);
      } else {
        this.spriteContainer.pivot.set(width / 2, height / 2);
      }

      new Draggable(this, drag); // eslint-disable-line

      if (zoom) {
        this.widgetContainer.addChild(Zoom.getInstance(this, { ...{ minScale: 0.5, maxScale: 1.5 }, ...zoom }));
      }

      if (rotation) {
        this.widgetContainer.addChild(Rotate.getInstance(this, { ...rotation, fitness: ({ ...DEFAULT_FRAME, ...frame }).fitness }));
      }

      if (remove) {
        this.widgetContainer.addChild(Remove.getInstance(this, { ...remove }));
      }

      if (flipx) {
        this.widgetContainer.addChild(FlipX.getInstance(this, { ...flipx }));
      }

      if (!flipx && flipy) {
        this.widgetContainer.addChild(FlipY.getInstance(this, { ...flipy }));
      }

      Transformable.instancesPoll.push(this);

      this.on('removed', () => {
        Tiny.arrayRemoveObject(Transformable.instancesPoll, this);
      });
      this.on('added', () => {
        const p = this.parent;
        const cancelHandler = (e) => {
          for (const key in this.$icons) {
            this.$icons[key].activated = false;
          }
        };

        p.on('pointerup', cancelHandler);
        p.on('pointerout', cancelHandler);
        p.on('pointercancel', cancelHandler);
        p.on('pointerupoutside', cancelHandler);
      });
    };

    /**
     * 等 texture 加载成功后初始化
     */
    if (target.isSprite && target.texture.height <= 1 && target.texture.width <= 1) {
      target.texture.once('update', () => {
        textureLoadedFn();
      });
    } else {
      textureLoadedFn();
    }

    /**
     * Fired when remove touchend.
     *
     * @event Tiny.Transformable#remove:touchend
     */
    /**
     * Fired when flipx touchend.
     *
     * @event Tiny.Transformable#flipx:touchend
     */
    /**
     * Fired when flipy touchend.
     *
     * @event Tiny.Transformable#flipy:touchend
     */
  }

  /**
   * 激活编辑态
   */
  activate() {
    Transformable.deactivateAll();
    this.widgetContainer.renderable = true;

    if (!this.$fixedIndex) {
      this.parent.setChildIndex(this, this.parent.children.length - 1);
    }

    for (const key in this.$icons) {
      this.$icons[key].setEventEnabled(true);
    }
  }

  /**
   * 休眠编辑态
   */
  deactivate() {
    this.widgetContainer.renderable = false;
    for (const key in this.$icons) {
      this.$icons[key].setEventEnabled(false);
    }
  }

  disable() {
    this.setEventEnabled(false);
  }

  enable() {
    this.setEventEnabled(true);
  }

  /**
   * 是否按添加的顺序固定 index
   *
   * @param {boolean} fixed
   */
  fixedIndex(fixed) {
    this.$fixedIndex = fixed;
  }

  /**
   * 添加自定义控件
   *
   * @param {string} name - 名称，如：skew
   * @param {string|Tiny.Texture|Tiny.Sprite} image - 控件的显示对象
   * @param {number[]} [pos=[1,1]] - 位置（取值区间[[-1, 1], [-1, 1]]），如：[1,1]
   * @param {object} [listeners={}] - 回调
   * @param {function} [listeners.onTouchStart]
   * @param {function} [listeners.onTouchMove]
   * @param {function} [listeners.onTouchEnd]
   * @param {function} [listeners.onTouchCancel]
   */
  addWidget(name, image, pos = [1, 1], listeners = {}) {
    this.widgetContainer.addChild(Widget.getInstance(this, {
      name,
      sprite: image,
      pos,
      listeners,
    }));
  }
}

/**
 * 设定 container 范围
 */
Transformable.setDragArea = Draggable.setDragArea;

/**
 * 当前 transformable 元素
 */
Transformable.instancesPoll = [];

/**
 * 使所有控件都休眠
 *
 * @static
 */
Transformable.deactivateAll = () => {
  Transformable.instancesPoll.forEach(item => {
    item.deactivate();
  });
};

/**
 * 所有元素不可编辑
 *
 * @static
 */
Transformable.disableAll = () => {
  Transformable.instancesPoll.forEach(item => {
    item.deactivate();
    item.disable();
  });
};

/**
 * 所有元素恢复编辑
 *
 * @static
 */
Transformable.enableAll = () => {
  Transformable.instancesPoll.forEach(item => {
    item.enable();
  });
};

export { Transformable };
