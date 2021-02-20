import { ICONS } from './constants';

export const customIcons = {};

export function reticfyIcon(icons, x, y) {
  const allIcons = { ...customIcons, ...ICONS };

  for (const key in allIcons) {
    const [, a, b] = allIcons[key];

    if (icons[key]) {
      icons[key].setPosition(x * a, y * b);
    }
  }
}

export function reticfyAngle(rotateAngle) {
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
