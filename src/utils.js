export const degToRadian = (deg) => deg * Math.PI / 180;

export const centerToTL = ({ centerX, centerY, width, height, rotateAngle }) => ({
  top: centerY - height / 2,
  left: centerX - width / 2,
  width,
  height,
  rotateAngle,
});

export const getLength = (x, y) => Math.sqrt(x * x + y * y);

export const getAngle = (x1, y1, x2, y2) => {
  const dot = x1 * x2 + y1 * y2;
  const det = x1 * y2 - y1 * x2;
  const angle = Math.atan2(det, dot) / Math.PI * 180;

  return (angle + 360) % 360;
};

export function noop() {}
