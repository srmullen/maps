import dat from 'dat.gui';
import paper, { Raster, Group, Path, Point, Size } from 'paper';
import * as math from 'mathjs';
import { A4, STRATH_SMALL, ARTIST_SKETCH, createCanvas } from './setup';
import { degreesToRadians, saveAsSVG } from './utils';
import { slice } from './contours';
import * as topojson from 'topojson';
import atlas from 'us-atlas/states-albers-10m.json';
// import atlas from 'us-atlas/states-10m.json';

window.math = math;
window.paper = paper;
window.topojson = topojson;
window.atlas = atlas;

class Tile {
  constructor(path, raster) {
    this.path = path;
    this.raster = raster;
  }
}

class Cache {
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

function tileUrl(z, x, y) {
  return `/api/tile?z=${z}&x=${x}&y=${y}`;
}

class TileRequest {
  constructor(latitude=0.0, longitude=0.0, widthKm=10, heightKm=10) {
    this.latitude = latitude;
    this.longitude = longitude;
    this.widthKm = widthKm;
    this.heightKm = heightKm;
  }

  getTile() {
    const url = tileUrl(z, x, y);
    const raster = new Raster(url);
    return new Promise((resolve, reject) => {
      raster.onLoad = () => {
        resolve(raster);
      }
    });
  }
}

const tileRequest = new TileRequest();
const gui = new dat.GUI();
gui.add(tileRequest, 'latitude').step(0.001).min(-90).max(90);
gui.add(tileRequest, 'longitude').step(0.001).min(-180).max(180);
gui.add(tileRequest, 'widthKm').step(0.1).min(0.1);
gui.add(tileRequest, 'heightKm').step(0.1).min(0.1);
gui.add(tileRequest, 'getTile');

function boundingbox(lat, lng, widthKm, heightKm) {
  const earthRadiusMiles = 3958.8;
  const earthRadiusKms = 6371;
  const eps = 1e-3;

  const lrKm = haversine({ lat, lng: lng - eps }, { lat, lng: lng + eps }) * earthRadiusKms;
  const kmPerLng = lrKm / (eps * 2);
  const tbKm = haversine({ lat: lat - eps, lng }, { lat: lat + eps, lng }) * earthRadiusKms;
  const kmPerLat = tbKm / (eps * 2);

  const dLng = widthKm / 2 / kmPerLng;
  const dLat = heightKm / 2 / kmPerLat;

  return [lat - dLat, lng - dLng, lat + dLat, lng + dLng];
}

/**
 * Calculates the shortest path between two coordinates on the surface of the earth.
 */
function haversine(from, to) {
  const lat0 = degreesToRadians(from.lat);
  const lng0 = degreesToRadians(from.lng);
  const lat1 = degreesToRadians(to.lat);
  const lng1 = degreesToRadians(to.lng);

  const diffLat = lat1 - lat0;
  const diffLng = lng1 - lng0;

  const a = math.pow(math.sin(diffLat / 2), 2) +
    math.cos(lat0) * math.cos(lat1) *
    math.pow(math.sin(diffLng / 2), 2);

  return 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a));
}

function tileXY(z, coord) {
  const lat = degreesToRadians(coord.lat);
  const n = math.pow(2, z);
  const x = (coord.lng + 180) / 360 * n;
  const y = (1 - math.log(math.tan(lat) + (1 / math.cos(lat))) / Math.PI) / 2 * n;
  return [Math.floor(x), Math.floor(y)];
}

const Z = 15; // What is Z? zoom, ranges from 0 to 20. https://github.com/tilezen/joerd/blob/master/docs/use-service.md
const TILE_SIZE = 256;

async function main() {
  const PAPER_SIZE = A4.portrait;
  const [width, height] = PAPER_SIZE;
  const canvas = createCanvas(PAPER_SIZE);
  paper.setup(canvas);

  // const lat = 40.078190;
  // const lng = -111.826498;
  // const widthKm = 8;
  // const heightKm = 16;

  // Yosemite Valley
  // const lat = 37.733614;
  // const lng = -119.586598;
  // const widthKm = 15;
  // const heightKm = 10;

  // Colorado
  const lat = 39.5501;
  const lng = 105.7821;
  const widthKm = 20;
  const heightKm = 20;

  // Denali
  // const lat = 63.1148;
  // const lng = 151.1926;
  // const widthKm = 10;
  // const heightKm = 10;

  // Iceland
  // Lat0, Lng0 = 66.750108, -25.731168
  // Lat1, Lng1 = 62.881496, -12.699955
  // Lat0, Lng0 = 66.750108, -25.831168
  // Lat1, Lng1 = 62.881496, -12.599955

  // Grand Canyon
  // Lat0, Lng0 = 36.477988, -112.726473
  // Lat1, Lng1 = 35.940449, -111.561530
  // Lat0, Lng0 = 36.551589, -112.728958
  // Lat1, Lng1 = 35.886162, -111.688370

  // Mount Everest
  // Lat0, Lng0 = 28.413539, 86.467738
  // Lat1, Lng1 = 27.543224, 87.400420

  const [lat0, lng0, lat1, lng1] = boundingbox(lat, lng, widthKm, heightKm);
  const min = { lat: lat0, lng: lng0 };
  const max = { lat: lat1, lng: lng1 };
  console.log(min, max);
  let [x0, y0] = tileXY(Z, min);
  let [x1, y1] = tileXY(Z, max);
  console.log(x0, y0, x1, y1);
  if (x1 < x0) {
    const tmp = x0
    x0 = x1;
    x1 = tmp;
  }
  if (y1 < y0) {
    const tmp = y0;
    y0 = y1;
    y1 = tmp;
  }
  x1++;
  y1++;
  const n = (y1 - y0) * (x1 - x0);
  console.log(`${n} tiles.`);

  const coords = [];
  for (let x = x0; x < x1; x++) {
    for (let y = y0; y < y1; y++) {
      coords.push([Z, x, y]);
    }
  }

  const cache = new Cache();
  const tiles = await cache.getTiles(coords);
  window.tiles = tiles;

  // Get min and max elevations
  let minElevation = Infinity;
  let maxElevation = -Infinity;
  for (let tile of tiles) {
    if (tile.minElevation < minElevation) {
      minElevation = tile.minElevation;
    }
    if (tile.maxElevation > maxElevation) {
      maxElevation = tile.maxElevation;
    }
  }

  const margin = 0;
  const xScaleFactor = (width - 2 * margin) / ((x1 - x0) * TILE_SIZE);
  const yScaleFactor = (height - 2 * margin) / ((y1 - y0) * TILE_SIZE);
  const scaleFactor = xScaleFactor < yScaleFactor ? xScaleFactor : yScaleFactor;

  // Stich tiles  
  // const raster = await stichGrayScale(cache, x0, x1, y0, y1, minElevation, maxElevation);
  const raster = await stich(cache, x0, x1, y0, y1);
  raster.position = [width/2, height/2];
  // raster.translate(raster.width/2, raster.height/2);
  
  
  // const topoRaster = colorPixelsByElevation(raster, minElevation, maxElevation);
  // topoRaster.position = [width / 2, height / 2];

  raster.setSize(raster.size.multiply(scaleFactor));
  // topoRaster.setSize(topoRaster.size.multiply(scaleFactor));
    
  window.raster = raster;

  const grid = toGrid(raster);
  toContourLines(grid, raster, minElevation, maxElevation);
}

/**
 * 
 * @param {Cell.bounds} bounds 
 * @param {Ball[]} balls 
 * @return {[number, number, number, number]} - [BL, BR, TR, TL]
 */
function getVertexValues(fn, bounds) {
  let bl = fn(bounds.left, bounds.bottom);
  let br = fn(bounds.right, bounds.bottom);
  let tr = fn(bounds.right, bounds.top);
  let tl = fn(bounds.left, bounds.top);
  return [bl, br, tr, tl];
}

function getCellType([bl, br, tr, tl], cutoff) {
  const BL_MASK = 1;
  const BR_MASK = 2;
  const TR_MASK = 4;
  const TL_MASK = 8;
  let type = 0;
  if (bl > cutoff) {
    type = type | BL_MASK;
  }
  if (br > cutoff) {
    type = type | BR_MASK;
  }
  if (tr > cutoff) {
    type = type | TR_MASK;
  }
  if (tl > cutoff) {
    type = type | TL_MASK;
  }
  return type;
}

class Cell {
  constructor(from, to, showCell = false) {
    this.from = from;
    this.to = to;
    if (showCell) {
      this.square = new Path.Rectangle(from, to);
      this.square.strokeColor = 'black';
    }
    const top = Math.min(from.y, to.y);
    const left = Math.min(from.x, to.x);
    const bottom = Math.max(from.y, to.y);
    const right = Math.max(from.x, to.x);
    const cx = left + (right - left) / 2;
    const cy = top + (bottom - top) / 2;
    this.bounds = {
      top,
      left,
      bottom,
      right,
      center: { x: cx, y: cy }
    };

    this.paths = [];
  }

  getPaths(type) {
    const left = new Point(this.bounds.left, this.bounds.center.y);
    const bottom = new Point(this.bounds.center.x, this.bounds.bottom);
    const right = new Point(this.bounds.right, this.bounds.center.y);
    const top = new Point(this.bounds.center.x, this.bounds.top);

    // IDEA: Could the direction of the line indicate which point it contains. Not currently implemented.
    if (type === 0) {
      return [];
    } if (type === 1) {
      return [[left, bottom]]
    } else if (type === 2) {
      return [[bottom, right]];
    } else if (type === 3) {
      return [[left, right]];
    } else if (type === 4) {
      return [[top, right]];
    } else if (type === 5) {
      return [[left, top], [right, bottom]];
    } else if (type === 6) {
      return [[top, bottom]];
    } else if (type === 7) {
      return [[left, top]];
    } else if (type === 8) {
      return [[left, top]];
    } else if (type === 9) {
      return [[top, bottom]];
    } else if (type === 10) {
      return [[left, bottom], [top, right]];
    } else if (type === 11) {
      return [[top, right]];
    } else if (type === 12) {
      return [[left, right]];
    } else if (type === 13) {
      return [[bottom, right]];
    } else if (type === 14) {
      return [[left, bottom]];
    } else if (type === 15) {
      return []
    }

  }

  draw(type, clearPaths = false) {
    if (clearPaths) {
      this.paths.map(path => path.remove());
      this.paths = [];
    }

    const paths = this.getPaths(type);

    paths.forEach(segments => {
      const path = new Path({
        segments,
        strokeColor: 'red'
      });
      this.paths.push(path);
    });
  }
}

function toGrid(raster) {
  const grid = [];
  const size = 2;
  const ny = raster.height / size;
  const nx = raster.width / size;
  for (let y = 0; y < ny; y++) {
    const row = [];
    for (let x = 0; x < nx; x++) {
      const from = new Point(x * size, y * size);
      const to = from.add(size);
      const cell = new Cell(from, to, false);
      row.push(cell);
    }
    grid.push(row);
  }
  return grid;
}

// Marching squares
function toContourLines(grid, raster, minElevation, maxElevation) {
  const image = raster.getImageData();
  const toElevation = (x, y) => {
    return pixelToMeters(getPixel(image, x, y));
  }
  const nLines = 10;
  const elevationDiff = (maxElevation - minElevation);
  const stepSize = elevationDiff / nLines
  // const midElevation = minElevation + elevationDiff / 2;
  for (let i = 0; i < nLines; i++) {
    const elevation = minElevation + (stepSize * i);
    for (let y = 0; y < grid.length; y++) {
      const row = grid[y]
      for (let x = 0; x < row.length; x++) {
        const cell = row[x];
        const vertexValues = getVertexValues(toElevation, cell.bounds);
        const cellType = getCellType(vertexValues, elevation);
        cell.draw(cellType);
      }
    }
  }
}

function colorPixelsByElevation(raster, minElevation, maxElevation) {
  const image = raster.getImageData();
  const colors = [];
  for (let i = 0; i < 20; i++) {
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

async function stich(cache, x0, x1, y0, y1) {
  const group = new Group();
  for (let x = x0; x < x1; x++) {
    const dx = (x - x0) * TILE_SIZE;
    for (let y = y0; y < y1; y++) {
      const tile = await cache.getTile(Z, x, y);

      const raster = new Raster(tile.raster.size);
      raster.setImageData(tile.raster.getImageData());

      raster.translate([dx, (y - y0) * TILE_SIZE]);
      group.addChild(raster);
    }
  }
  const raster = group.rasterize();
  group.remove();
  return raster;
}

async function stichGrayScale(cache, x0, x1, y0, y1, minElevation, maxElevation) {
  const group = new Group();
  for (let x = x0; x < x1; x++) {
    const dx = (x - x0) * TILE_SIZE;
    for (let y = y0; y < y1; y++) {
      const tile = await cache.getTile(Z, x, y);
      const raster = asGrayScaleElevation(tile, minElevation, maxElevation);
      raster.translate([dx, (y - y0) * TILE_SIZE])
      group.addChild(raster);
    }
  }
  const raster = group.rasterize();
  group.remove();
  return raster;
}

// function toContourLines(raster) {
//   const image = raster.getImageData();
//   const grid = toGrid(image)

//   for (let z = 0; z < 65535; z += 1024) {
//     const p = slice(grid, image.width, image.height, z + 1e-7);
//     for (let path of p) {
//       new Path.Line({
//         strokeColor: 'red',
//         from: new Point(path[0].x, path[0].y),
//         to: new Point(path[1].x, path[1].y)
//       });
//     }
//   }
// }

// The grid function does bitwise operations on the image data? Not sure exactly what is needed here.
// function toGrid(image) {
//   const grid = new Uint8Array(image.width * image.height);
//   let index = 0;
//   for (let y = 0; y < image.height; y++) {
//     for (let x = 0; x < image.width; x++) {
//       const i = pixOffset(image, x, y);
//       // const [r,g,b,a] = getPixel(image, x);
//       const a = image.data[i];
//       // const b = image.data[i+3];
//       grid[i] = a;
//       index++;
//     }
//   }
//   return grid;
// }

/**
 * 
 * @param {imageData} image 
 */
function imageToElevation(image) {
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

function pixelToMeters([r, g, b]) {
  return (r * 256 + g + b / 256) - 32768;
}

function pixOffset(image, x, y) {
  return (y * 4) * image.width + (x * 4);
}

function getPixel(image, x, y) {
  const i = pixOffset(image, x, y);
  return [
    image.data[i], 
    image.data[i+1], 
    image.data[i+2], 
    image.data[i+3]
  ];
}

function asGrayScaleElevation(tile, low, high) {
  const image = tile.raster.getImageData();
  for (let y = 0; y < image.width; y++) {
    for (let x = 0; x < image.height; x++) {
      const i = y * image.width + x;
      const pixIdx = pixOffset(image, x, y);
      const elevation = tile.elevation[i];
      let t = (elevation - low) / (high - low);
      if (t < 0) {
        t = 0;
      }
      if (t > 1) {
        t = 1
      }
      const gray = t * 255;
      image.data[pixIdx] = gray;
      image.data[pixIdx+1] = gray;
      image.data[pixIdx+2] = gray;
    }
  }
  // tile.raster.setImageData(image);
  const raster = new Raster(new Size(image.width, image.height));
  raster.setImageData(image);
  // return new Raster(image);
  return raster;
}

// main();

function showShapeFile() {
  // const PAPER_SIZE = A4.portrait;
  const PAPER_SIZE = STRATH_SMALL.landscape;
  const [width, height] = PAPER_SIZE;
  const canvas = createCanvas(PAPER_SIZE);
  paper.setup(canvas);

  const states = atlas.objects.states.geometries.reduce((acc, geom) => {
    return Object.assign({}, acc, { [geom.properties.name]: geom });
  }, {});

  // const massachusetts = atlas.objects.states.geometries.find(geom => geom.properties.name === 'Massachusetts');
  const mesh = topojson.mesh(atlas, atlas.objects.states);
  // const mesh = topojson.mesh(atlas, createGeometryCollection(states, ['Washington', 'California', 'Colorado']));
  console.log(mesh);
  const paths = mesh.coordinates.map(segments => {
    const path = new Path({
      strokeColor: 'black',
      segments
    });
    return path;
  });
  const america = new Group({children: paths});
  america.translate(-80, -75);
  america.scale(0.7);
}
showShapeFile();

function createGeometryCollection(states, names=[]) {
  const geometries = names.map(name => states[name]);
  return {
    type: 'GeometryCollection',
    geometries
  };
}

window.saveAsSvg = function save(name) {
  saveAsSVG(paper.project, name);
}