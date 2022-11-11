import * as Tiny from '@alipay/tiny.js';

class Frame {}

Frame.getInstance = function(opts) {
  const { width: w, height: h, thickness, color, lineOpacity, fill, fillOpacity } = opts;
  const rect = new Tiny.Graphics();

  rect.$property = opts;
  rect.beginFill(fill, fillOpacity);
  rect.lineStyle(thickness, color, lineOpacity);
  rect.drawRect(-w / 2, -h / 2, w, h);
  rect.endFill();

  return rect;
};

export { Frame };
