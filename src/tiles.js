import { Raster } from 'paper';
import { imageToElevation } from './image';
import { degreesToRadians } from './utils';

export class Tile {
  constructor(path, raster) {
    this.path = path;
    this.raster = raster;
  }
}

export class Cache {
  constructor() {
    this.cache = {};
  }

  hasTile(z, x, y) {
    return this.cache[z] && this.cache[z][x] && this.cache[z][x][y];
  }

  getTiles(coords) {
    const promises = [];
    for (let [z, x, y] of coords) {
      promises.push(this.getTile(z, x, y));
    }
    return Promise.all(promises);
  }

  getTile(z, x, y) {
    if (this.hasTile(z, x, y)) {
      return Promise.resolve(this.cache[z][x][y]);
    } else {
      const raster = new Raster(tileUrl(z, x, y));
      const tile = new Tile([z, x, y], raster);
      this.insert(tile);
      return new Promise((resolve, reject) => {
        raster.onLoad = () => {
          const imageData = raster.getImageData();
          const elevation = imageToElevation(imageData);
          let minElevation = Infinity;
          let maxElevation = -Infinity;
          for (let i = 0; i < elevation.length; i++) {
            const el = elevation[i]
            if (el < minElevation) {
              minElevation = el;
            }
            if (el > maxElevation) {
              maxElevation = el;
            }
          }
          tile.elevation = elevation;
          tile.minElevation = minElevation;
          tile.maxElevation = maxElevation;
          raster.visible = false;
          resolve(tile);
        }
      });
    }
  }

  insert(path, item) {
    let obj = this.cache;
    for (let i = 0; i < path.length; i++) {
      if (i === path.length - 1) {
        obj[path[i]] = item;
      } else {
        if (!obj[path[i]]) {
          obj[path[i]] = {};
        }
        obj = obj[path[i]];
      }
    }
  }
}

export function tileUrl(z, x, y) {
  return `/api/tile?z=${z}&x=${x}&y=${y}`;
}

export function tileXY(z, coord) {
  const lat = degreesToRadians(coord.lat);
  const n = math.pow(2, z);
  const x = (coord.lng + 180) / 360 * n;
  const y = (1 - math.log(math.tan(lat) + (1 / math.cos(lat))) / Math.PI) / 2 * n;
  return [Math.floor(x), Math.floor(y)];
}