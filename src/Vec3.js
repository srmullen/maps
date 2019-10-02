export class Vec3 {
  constructor(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  add(vec) {
    if (vec instanceof Vec3) {
      const x = this.x + vec.x;
      const y = this.y + vec.y;
      const z = this.z + vec.z;
      return new Vec3(x, y, z);
    } else if (typeof vec === 'number') {
      return new Vec3(this.x + vec, this.y + vec, this.z + vec);
    } else {
      throw new Error('Wrong type.');
    }
  }

  subtract(vec) {
    if (vec instanceof Vec3) {
      const x = this.x - vec.x;
      const y = this.y - vec.y;
      const z = this.z - vec.z;
      return new Vec3(x, y, z);
    } else if (typeof vec === 'number') {
      return new Vec3(this.x - vec, this.y - vec, this.z - vec);
    } else {
      throw new Error('Wrong type.');
    }
  }

  multiply(vec) {
    if (vec instanceof Vec3) {
      const x = this.x * vec.x;
      const y = this.y * vec.y;
      const z = this.z * vec.z;
      return new Vec3(x, y, z);
    } else if (typeof vec === 'number') {
      return new Vec3(this.x * vec, this.y * vec, this.z * vec);
    } else {
      throw new Error('Wrong type.');
    }
  }

  divide(vec) {
    if (vec instanceof Vec3) {
      const x = this.x / vec.x;
      const y = this.y / vec.y;
      const z = this.z / vec.z;
      return new Vec3(x, y, z);
    } else if (typeof vec === 'number') {
      return new Vec3(this.x / vec, this.y / vec, this.z / vec);
    } else {
      throw new Error('Wrong type.');
    }
  }

  cross(vec) {
    const x = this.y * vec.z - this.z * vec.y;
    const y = this.z * vec.x - this.y * vec.z;
    const z = this.x * vec.y - this.y * vec.x;
    return new Vec3(x, y, z);
  }

  normalize() {
    const mag = this.mag();
    return this.multiply(1 / mag);
  }

  mag() {
    return Math.sqrt(
      Math.pow(this.x, 2) +
      Math.pow(this.y, 2) +
      Math.pow(this.z, 2)
    );
  }

  dot(vec) {
    return this.x * vec.x + this.y * (vec.y) + this.z * vec.z;
  }
}