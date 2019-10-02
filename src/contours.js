import { Vec3 } from './Vec3';
import { Point } from 'paper';

export function slice(grid, width, height, z) {
  const result = [];
  for (let y = 0; y < height - 1; y++) {
    const i0 = y * width;
    const i1 = i0 + width;
    for (let x = 0; x < width - 1; x++) {
      // QUESTION: What do these pixels represent? 
      // Get the elevations at various points. Find out what pixels exactly these are.
      const z0 = grid[i0 + x];
      const z1 = grid[i0 + x + 1];
      const z2 = grid[i1 + x];
      const z3 = grid[i1 + x + 1];
      if (z0 < z && z1 < z && z2 < z && z3 < z) {
        // Do nothing
      } else if (z0 > z && z1 > z && z2 > z && z3 > z) {
        // Do nothing
      } else {
        const z4 = (z0 + z1 + z2 + z3) / 4;
        const v0 = new Vec3(x, y, z0);
        const v1 = new Vec3(x + 1, y, z1);
        const v2 = new Vec3(x, y + 1, z2);
        const v3 = new Vec3(x + 1, y + 1, z3);
        const v4 = new Vec3(x + 0.5, y + 0.5, z4);
        const tris = [
          [v0, v2, v4],
          [v0, v4, v1],
          [v1, v4, v3],
          [v2, v3, v4]
        ];
        for (let tri of tris) {
          const [p1, p2, ok] = intersectTriangle(z, ...tri);
          if (ok) {
            result.push([p1, p2]);
          }
        }
      }
    }
  }
  return result;
}

/**
 * QUESTION: What is the intersect and what do the return values represent?
 * @param {Number} z
 * @param {Vec3} pt1
 * @param {Vec3} pt2
 * @param {Vec3} pt3
 * @return {[Vec3, Vec3, boolean]}
 */
function intersectTriangle(z, pt1, pt2, pt3) {
  const [v1, ok1] = intersectSegment(z, pt1, pt2);
  const [v2, ok2] = intersectSegment(z, pt2, pt3);
  const [v3, ok3] = intersectSegment(z, pt3, pt1);
  let p1, p2;
  if (ok1 && ok2) {
    p1 = v1;
    p2 = v2;
  } else if (ok1 && ok3) {
    p1 = v1;
    p2 = v3;
  } else if (ok2 && ok3) {
    p1 = v2;
    p2 = v3;
  } else {
    return [null, null, false];
  }

  // QUESTION: What are these following variables?
  const n = new Vec3(p1.y - p2.y, p2.x - p1.x, 0);
  const e1 = pt2.subtract(pt1);
  const e2 = pt3.subtract(pt1);
  const tn = e1.cross(e2).normalize();
  if (n.dot(tn) < 0) {
    return [p1, p2, true];
  } else {
    return [p2, p1, true];
  }
}

/**
 * TODO: This can be simplified by just returning v or undefined.
 *  The bool seems to be there to satisfy the golang type system.
 * @param {Number} z 
 * @param {Vec3} v0
 * @param {Vec3} v1
 * @return {[Vec3, boolean]}
 */
function intersectSegment(z, v0, v1) {
  if (v0.z === v1.z) {
    return [null, false];
  }
  const t = (z - v0.z) / (v1.z - v0.z);
  if (t < 0 || t > 1) {
    return [null, false];
  }
  const v = v0.add(v1.subtract(v0).multiply(t));
  return [v, true];
}