import { Raster } from 'paper';

export function pixelToMeters([r, g, b]) {
  return (r * 256 + g + b / 256) - 32768;
}

export function pixOffset(image, x, y) {
  return (y * 4) * image.width + (x * 4);
}

export function getPixel(image, x, y) {
  const i = pixOffset(image, x, y);
  return [
    image.data[i],
    image.data[i + 1],
    image.data[i + 2],
    image.data[i + 3]
  ];
}

export function colorPixelsByElevation(raster, minElevation, maxElevation) {
  const image = raster.getImageData();
  const colors = [];
  for (let i = 0; i < 100; i++) {
    colors.push([
      math.randomInt(256),
      math.randomInt(256),
      math.randomInt(256),
      255
    ]);
  }
  // const colors = [[0, 0, 255, 255], [0, 255, 0, 255], [255, 0, 0, 255]];
  const step = (maxElevation - minElevation) / colors.length;
  for (let y = 0; y < image.height; y++) {
    for (let x = 0; x < image.width; x++) {
      const i = pixOffset(image, x, y);
      const pixel = getPixel(image, x, y);
      const meters = pixelToMeters(pixel);
      let color;
      for (let i = 0; i < colors.length; i++) {
        if (meters >= minElevation && meters < minElevation + (step * (i + 1))) {
          color = colors[i];
          break;
        }
      }

      if (!color) {
        // console.log(meters);
        color = [0, 0, 0, 255];
      }

      // 2121.44140625
      image.data[i] = color[0];
      image.data[i + 1] = color[1];
      image.data[i + 2] = color[2];
      image.data[i + 3] = color[3];
    }
  }
  const topoRaster = new Raster(raster.size);
  topoRaster.setImageData(image);
  return topoRaster;
}

/**
 * 
 * @param {imageData} image 
 */
export function imageToElevation(image) {
  let index = 0;
  const elevations = [];
  for (let y = 0; y < image.height; y++) {
    for (let x = 0; x < image.width; x++) {
      const pixel = getPixel(image, x, y);
      const meters = pixelToMeters(pixel);
      elevations[index] = meters;
      index++;
    }
  }
  return elevations;
}