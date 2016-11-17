
const THREE = require('three');

import Platform from './Platform';

const SURFACE_NUM_SEGMENTS = 24;
const SURFACE_NEUTRAL_DEPTH = -0.6;

const NUM_PLATFORMS = 2;

export default class Surface {
  constructor(getGame, scene, viewport) {
    this._viewport = viewport;
    this._collidedPlatform = null;

    this._depths = [];
    this._vDepth = [];
    for (let ii = 0; ii < SURFACE_NUM_SEGMENTS; ii++) {
      this._depths.push(-0.09 + Math.random() * 0.18);
      this._vDepth.push(0);
    }

    this._material = new THREE.MeshBasicMaterial( { color: 0x555555 } ),
    this._mesh = new THREE.Mesh(this._makeShapeGeometry(), this._material);
    scene.add(this._mesh);

    this._platforms = [];
    this._platforms.push(new Platform(getGame, this.getSurface.bind(this), scene, this._viewport, { x: this._viewport.width * -0.25 }));
    this._platforms.push(new Platform(getGame, this.getSurface.bind(this), scene, this._viewport, { x: this._viewport.width * 0.3 }));
  }

  getSurface() {
    return this;
  }

  getCollidedPlatform() {
    return this._collidedPlatform;
  }

  tick(dt) {
    this._updateShape();
    for (let ii = 0; ii < 2; ii++) {
      this._platforms[ii].tick(dt);
    }
  }

  // position in y dimension of screen
  getDepth(position) {
    let { scaledPosition, leftIndex, rightIndex, interp } = this._scaledPosition(position);
    return SURFACE_NEUTRAL_DEPTH +
      (this._depths[leftIndex] * (1.0 - interp)) +
      (this._depths[rightIndex] * interp);
  }

  impact(position, magnitude) {
    let isOnPlatform = false, leftIndex = 0, rightIndex = 0;
    for (let ii = 0; ii < NUM_PLATFORMS; ii++) {
      let platform = this._platforms[ii];
      let xPosition = platform.getPosition().x, radius = platform.getRadius();
      if (position > xPosition - radius && position < xPosition + radius) {
        isOnPlatform = true;
        leftIndex = this._scaledPosition(xPosition - radius).leftIndex;
        rightIndex = this._scaledPosition(xPosition + radius).rightIndex;
        break;
      }
    }

    if (isOnPlatform) {
      // it's on a platform, impact everything from leftindex to rightindex
      for (let ii = leftIndex; ii <= rightIndex; ii++) {
        this._depths[ii] += magnitude * 0.5;
      }
      let scaledPosition = this._scaledPosition(position);
      this._depths[scaledPosition.leftIndex] += magnitude * (1.0 - scaledPosition.interp);
      this._depths[scaledPosition.rightIndex] += magnitude * (scaledPosition.interp);
    } else {
      // it's just in the water somewhere
      let { leftIndex, rightIndex, interp } = this._scaledPosition(position);
      this._depths[leftIndex] += magnitude * (1.0 - interp);
      this._depths[rightIndex] += magnitude * interp;
    }
  }

  maybeCollideWithPlatform(position) {
    this._collidedPlatform = null;

    for (let ii = 0; ii < NUM_PLATFORMS; ii++) {
      let platform = this._platforms[ii];
      let xPosition = platform.getPosition().x, radius = platform.getRadius();
      if (position > xPosition - radius && position < xPosition + radius) {
        this._collidedPlatform = platform;
        platform.setIsCollided(true);
      } else {
        platform.setIsCollided(false);
      }
    }
  }

  _scaledPosition(screenPosition) {
    position = ((screenPosition + this._viewport.width * 0.5) / this._viewport.width);
    let scaledPosition = position * (SURFACE_NUM_SEGMENTS - 1);
    let leftIndex = Math.floor(scaledPosition);
    let rightIndex = Math.ceil(scaledPosition);
    let interp = scaledPosition - leftIndex;
    return { scaledPosition, leftIndex, rightIndex, interp };
  }

  _makeShapeGeometry() {
    let width = this._viewport.width;
    let shape = new THREE.Shape();
    shape.moveTo(-this._viewport.width / 2, -this._viewport.height / 2);

    // (interpolating, 1 + value)
    for (let ii = 0; ii < SURFACE_NUM_SEGMENTS; ii++) {
      let xInterp = ii / (SURFACE_NUM_SEGMENTS - 1.0);
      shape.lineTo(-(this._viewport.width / 2) + (xInterp * width), SURFACE_NEUTRAL_DEPTH + this._depths[ii]);
    }

    // bottom two corners
    shape.lineTo(this._viewport.width / 2, -this._viewport.height / 2);
    shape.lineTo(-this._viewport.width / 2, -this._viewport.height / 2);
    return new THREE.ShapeGeometry(shape);
  }

  _updateShape() {
    for (let ii = 0; ii < SURFACE_NUM_SEGMENTS; ii++) {
      // TODO: kill me
      if (Math.random() < 0.005) {
        this._vDepth[ii] = -0.005 + Math.random() * 0.01;
      }
      let left = (ii > 0) ? this._depths[ii - 1] : 0.0;
      let right = (ii < SURFACE_NUM_SEGMENTS - 1) ? this._depths[ii + 1] : 0.0;
      let aDepth = -this._depths[ii] * 0.02 + (left * 0.006) + (right * 0.006);
      this._vDepth[ii] += aDepth;
      this._depths[ii] += this._vDepth[ii];
      this._vDepth[ii] *= 0.98;
    }
    let vertices = this._mesh.geometry.vertices;

    // modify in place
    for (let vertexIdx = 1, ii = 0; ii < SURFACE_NUM_SEGMENTS; vertexIdx++, ii++) {
      vertices[vertexIdx].y = SURFACE_NEUTRAL_DEPTH + this._depths[ii];
    }
    this._mesh.geometry.verticesNeedUpdate = true;
  }
};
