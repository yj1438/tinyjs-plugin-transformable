# tinyjs-plugin-transformable

> The Tiny.js plugin for transform something

## 查看demo

http://tinyjs.net/plugins/tinyjs-plugin-transformable.html#demo

## 引用方法

- 推荐作为依赖使用

  - `npm install tinyjs-plugin-transformable --save`

- 也可以直接引用线上cdn地址，注意要使用最新的版本号，例如：

  - https://gw.alipayobjects.com/os/lib/tinyjs-plugin-transformable/1.0.0/index.js
  - https://gw.alipayobjects.com/os/lib/tinyjs-plugin-transformable/1.0.0/index.debug.js

## 起步
首先当然是要引入，推荐`NPM`方式，当然你也可以使用`CDN`或下载独立版本，先从几个例子入手吧！

##### 1、最简单的例子

引用 Tiny.js 源码
``` html
<script src="https://gw.alipayobjects.com/os/lib/alipay/tiny.js/2.2.6/dist/browser/tiny.js"></script>
```
``` js
import Transformable from 'tinyjs-plugin-transformable';

const app = new Tiny.Application({
  //...
});
const container = new Tiny.Container();
app.run(container);

// 创建一个可 transformable 元素
const sprite = Tiny.Sprite.from('https://gw.alipayobjects.com/as/g/tiny/resources/1.0.0/images/logo.png');
const ta = new Tiny.Transformable(sprite);
container.addChild(ta);

```
##### 2、是否贴合

即操作选框、控件是否贴合跟随被编辑的显示对象，默认是贴合的，你可以设置为不贴合：

``` js
const ta = new Tiny.Transformable(sprite, {
  frame: {
    fitness: false
  }
});
```

##### 3、定制参数一览

``` js
const ta = new Tiny.Transformable(sprite, {
  frame: {
    fitness: false,
    thickness: 3,
    color: 0xff0000,
    lineOpacity: 0.5,
    fill: 0xffffff,
    fillOpacity: 0.1,
  },
  drag: {
    inScreen: true,
  },
  zoom: {
    minScale: 0.5,
    maxScale: 1.5,
  },
  rotation: {
    sprite: Tiny.Sprite.fromImage('https://gw.alipayobjects.com/as/g/tiny/resources/1.0.0/images/heart.png'),
  },
  remove: false,
  flipx: false,
  flipy: false,
});
```

##### 4、激活和休眠

``` js
const ta = new Tiny.Transformable(sprite);

container.addChild(ta);
// 添加后立刻激活为编辑态
ta.activate();
// ta.deactivate() // 休眠编辑态

// 点击其他区域切为休眠
container.setEventEnabled(true);
container.hitArea = new Tiny.Rectangle(0, 0, Tiny.WIN_SIZE.width, Tiny.WIN_SIZE.height);
container.on('pointerdown', Tiny.Transformable.deactivateAll);
```

##### 5、固定 Index

``` js
// 按 ta 的添加次序，固定它的 Index，即点击不提升也不置后
ta.fixedIndex(true);
```

##### 6、设定拖拽范围

```js
// 将 Tiny.Transformable 元素的拖拽范围限制在其父 container 相对范围内
Tiny.Transformable.setDragArea(
  // Tiny.Transformable 元素父容器
  container,
  // 相对 container 限制范围，用典型的 left/top + width/height
  { 
    offsetX: 100, // 相对 container 左上角 X
    offsetY: 100, // 相对 container 左上角 Y
    width: 550, // 拖拽范围 width
    height: 550, // 拖拽范围 height
    strict: true, // true: 严格元素在内部，false: 元素锚点在内部
  },
);

```

##### 7、监听回调

``` js
// 点击 remove 按钮后的回调
ta.on('remove:touchend', function(e) {
  console.log('remove', e);
  this.parent.removeChild(this);
});
```

##### 8、添加自定义控件

``` js
var ta = new Tiny.Transformable(sprite, {
  flipx: false, // 将右上角的位置留出来
  flipy: false,
});

ta.addWidget(
  'custom',
  'https://gw.alipayobjects.com/as/g/tiny/resources/1.0.0/images/heart.png',
  [1, -1], // 放在右上角
  {
    onTouchStart: function(e) {
      e.stopPropagation();
      console.log('custom start');
    },
    onTouchMove: function(e) {},
    onTouchEnd: function(e) {},
    onTouchCancel: function(e) {},
  }
);
```

## 依赖
- `Tiny.js`: [Link](http://tinyjs.net/api)

## API文档

http://tinyjs.net/plugins/tinyjs-plugin-transformable.html#docs
