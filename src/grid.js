import { Path, Point } from 'paper';

export class Cell {
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

export function getCellType([bl, br, tr, tl], cutoff) {
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

export function toGrid(raster) {
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