
const THREE = require('three');

import Platform from './Platform';

const SURFACE_NUM_SEGMENTS = 36;
const SURFACE_NEUTRAL_DEPTH = 0;

export default class Surface {
  constructor(getGame, scene, viewport) {
    this._viewport = viewport;
    this._collidedPlatform = null;
    this._segmentXOffset = 0;
    this._numSegmentsOffset = 0;
    this._cameraXOffset = 0;
    this._getGame = getGame;
    this._maxPlatformX = viewport.width * -0.2;
    this._scene = scene;

    this._depths = [];
    this._vDepth = [];
    for (let ii = 0; ii < SURFACE_NUM_SEGMENTS; ii++) {
      this._depths.push(-0.09 + Math.random() * 0.18);
      this._vDepth.push(0);
    }

    this._material = new THREE.MeshBasicMaterial( { color: 0xffffff, transparent: true, opacity: 0.5 } ),
    this._mesh = new THREE.Mesh(this._makeShapeGeometry(), this._material);
    scene.add(this._mesh);

    this._platforms = [];
    for (let ii = 0; ii < 4; ii++) {
      this._addPlatform();
    }
  }

  destroy(scene) {
    for (let ii = 0; ii < this._platforms.length; ii++) {
      this._platforms[ii].destroy(scene);
    }
    scene.remove(this._mesh);
    this._platforms = [];
  }

  getSurface() {
    return this;
  }

  getCollidedPlatform() {
    return this._collidedPlatform;
  }

  tick(dt) {
    this._updateShape();
    for (let ii = 0; ii < this._platforms.length; ii++) {
      this._platforms[ii].tick(dt);
    }
    // we can get away with this because the player will always traverse left-right without skipping any.
    if (this._platforms.length && !this._platforms[0].isAlive()) {
      this._platforms[0].destroy(this._scene);
      this._platforms.shift();
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
    for (let ii = 0; ii < this._platforms.length; ii++) {
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
    let prevCollidedPlatform = this._collidedPlatform;
    this._collidedPlatform = null;

    for (let ii = 0; ii < this._platforms.length; ii++) {
      let platform = this._platforms[ii];
      let xPosition = platform.getPosition().x, radius = platform.getRadius();
      if (position > xPosition - radius - 0.06 && position < xPosition + radius + 0.06) {
        this._collidedPlatform = platform;
        platform.setIsCollided(true);
      } else {
        platform.setIsCollided(false);
      }
    }
    if (this._collidedPlatform) {
      if (this._collidedPlatform != prevCollidedPlatform && this._collidedPlatform.isAlive()) {
        this._getGame().onPlatformLanded();
      }
    } else {
      this._getGame().onPlatformMissed();
    }
  }

  _scaledPosition(worldXPosition) {
    position = ((worldXPosition + this._segmentXOffset - this._cameraXOffset + this._viewport.width * 0.5) / this._viewport.width);
    let scaledPosition = Math.max(0, Math.min(1, position)) * (SURFACE_NUM_SEGMENTS - 1);
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
    // neutral top-right corner
    shape.lineTo(this._viewport.width / 2, SURFACE_NEUTRAL_DEPTH);

    // bottom two corners
    shape.lineTo(this._viewport.width / 2, -this._viewport.height / 2);
    shape.lineTo(-this._viewport.width / 2, -this._viewport.height / 2);
    return new THREE.ShapeGeometry(shape);
  }

  _updateShape() {
    let width = this._viewport.width;
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
    let leftBound = -(this._viewport.width / 2) + this._cameraXOffset;
    vertices[0].x = leftBound;
    for (let vertexIdx = 1, ii = 0; ii < SURFACE_NUM_SEGMENTS; vertexIdx++, ii++) {
      let xInterp = ii / (SURFACE_NUM_SEGMENTS - 1.0);
      vertices[vertexIdx].y = SURFACE_NEUTRAL_DEPTH + this._depths[ii];
      vertices[vertexIdx].x = leftBound + (xInterp * width) - this._segmentXOffset;
    }
    vertices[vertices.length - 3].x = leftBound + this._viewport.width;
    vertices[vertices.length - 2].x = leftBound + this._viewport.width;
    vertices[vertices.length - 1].x = leftBound + this._viewport.width;
    this._mesh.geometry.verticesNeedUpdate = true;
    this._mesh.geometry.computeBoundingSphere();
  }

  cameraDidUpdate(cameraXOffset) {
    let segmentWidth = this._viewport.width / (SURFACE_NUM_SEGMENTS - 1.0);
    let numSegmentsOffset = Math.floor(cameraXOffset / segmentWidth);
    if (numSegmentsOffset > this._numSegmentsOffset) {
      for (let ii = 0; ii < numSegmentsOffset - this._numSegmentsOffset; ii++) {
        this._shiftSegmentsLeft();
      }
    } else if (numSegmentsOffset < this._numSegmentsOffset) {
      for (let ii = 0; ii < this._numSegmentsOffset - numSegmentsOffset; ii++) {
        this._shiftSegmentsRight();
      }
    }
    this._cameraXOffset = cameraXOffset;
    this._numSegmentsOffset = numSegmentsOffset;
    this._segmentXOffset = cameraXOffset - (numSegmentsOffset * segmentWidth);

    if (this._cameraXOffset > this._maxPlatformX - this._viewport.width * 0.5) {
      this._addPlatform();
    }
  }

  _shiftSegmentsLeft() {
    let leftDepth = this._depths.shift();
    this._depths.push(leftDepth);
    let leftVel = this._vDepth.shift();
    this._vDepth.push(leftVel);
  }

  _shiftSegmentsRight() {
    let rightDepth = this._depths.pop();
    this._depths.unshift(rightDepth);
    let rightVel = this._vDepth.pop();
    this._vDepth.unshift(rightVel);
  }

  _addPlatform() {
    let difficulty = this._getGame().getDifficulty();
    let { gap, radius } = this._getPlatformSpecs(difficulty);

    let x = this._maxPlatformX + radius + gap;
    let platform = new Platform(this._getGame, this.getSurface.bind(this), this._scene, this._viewport, { x, radius });
    this._platforms.push(platform);
    this._maxPlatformX = platform.getPosition().x + platform.getRadius();
  }

  _getPlatformSpecs(difficulty) {
    /*
    0: easy, easy, easy, medium
    1: easy, easy, medium, medium
    2: easy, medium, medium, hard
    3: easy, medium, hard, hard
    4: easy, medium, hard, hard, hard
    5: ...
    */

    let difficultyMatrix = [
      [ 0, 0, 0, 1 ],
      [ 0, 0, 1, 1 ],
      [ 0, 1, 1, 2 ],
      [ 0, 1, 2, 2 ],
    ];
    let difficultyDistribution = (difficulty < difficultyMatrix.length) ?
      difficultyMatrix[difficulty] :
      difficultyMatrix[difficultyMatrix.length - 1];
    if (difficulty >= difficultyMatrix.length) {
      for (let ii = 0; ii <= difficulty - difficultyMatrix.length; ii++) {
        difficultyDistribution.push(2);
      }
    }
    let platformDifficulty = difficultyDistribution[Math.floor(Math.random() * difficultyDistribution.length)];

    let gap, radius;
    switch (platformDifficulty) {
      case 0: {
        gap = 0.04 + Math.random() * 0.04;
        radius = 0.14 + Math.random() * 0.12;
        break;
      }
      case 1: {
        gap = 0.09 + Math.random() * 0.04;
        radius = 0.11 + Math.random() * 0.09;
        break;
      }
      case 2: {
        gap = 0.11 + Math.random() * 0.06;
        radius = 0.09 + Math.random() * 0.05;
        break;
      }
    }
    gap *= this._viewport.width;
    radius *= this._viewport.width;
    return { gap, radius };

    // radii get smaller with difficulty
    /* let maxRadiusVariance = Math.max(0.02, 0.15 - (difficulty * 0.01));
    let radius = this._viewport.width * (0.09 + Math.random() * maxRadiusVariance);

    // gaps get larger with difficulty
    // difficult: range 0.14-0.18. easy: range 0.03 - 0.07
    // TODO: add variety
    let baseGap = Math.min(0.14, 0.04 + (difficulty * 0.01));
    let gap =  + (this._viewport.width * (baseGap + Math.random() * 0.04));
    return { gap, radius }; */
  }
};
