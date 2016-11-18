
const THREE = require('three');

const MAX_ACCEL = 20;
const MAX_VEL = 2.5;
const MAX_JUMP_VEL = 6;

export default class Player {
  constructor(scene, viewport, surface) {
    this._viewport = viewport;
    this._xAccel = 0;
    this._xVel = 0;
    this._yVel = 0;
    this._touchIdentifier = null;
    this._initialTouchPosition = { x: 0, y: 0 };
    this._previousTouchPosition = { x: 0, y: 0 };
    this._touchDeltaX = 0;
    this._isJumping = true;
    this._surface = surface;
    this._isInverted = false;

    const geometry = new THREE.PlaneBufferGeometry(0.12, 0.12);
    this._material = new THREE.MeshBasicMaterial( { color: 0xffffff } ),

    this._mesh = new THREE.Mesh(geometry, this._material);
    this._mesh.position.z = 10;
    this._mesh.position.y = viewport.width * 0.2;
    scene.add(this._mesh);
  }

  destroy(scene) {
    scene.remove(this._mesh);
  }

  setIsInverted(isInverted) {
    this._isInverted = isInverted;
    this._material.color.setHex((isInverted) ? 0x000000 : 0xffffff);
    if (!isInverted) {
      // burst thru surface!!!
      this._mesh.position.y += 0.5;
      this._xVel = MAX_VEL;
      this._jump(1.0);
    }
  }

  getPositionX() {
    return this._mesh.position.x;
  }

  tick(dt) {
    let viewportHalfWidth = this._viewport.width / 2;

    if (this._touchIdentifier) {
      this._xAccel = MAX_ACCEL;
      this._xVel += this._xAccel * dt;
      if (this._xVel < -MAX_VEL) this._xVel = -MAX_VEL;
      if (this._xVel > MAX_VEL) this._xVel = MAX_VEL;
    } else {
      this._xAccel = 0;
      if (!this._isJumping) {
        this._xVel *= 0.93;
      }
    }
    this._mesh.position.x += (this._xVel * dt);
    if (this._mesh.position.x < -viewportHalfWidth) {
      this._mesh.position.x = -viewportHalfWidth;
      this._xVel = 0;
    }

    let surfaceBelow = this._surface.getDepth(this._mesh.position.x) + 0.05 * (this._isInverted ? -1.0 : 1.0);
    if (this._isJumping) {
      this._yVel -= 0.5;
      this._mesh.position.y += (this._yVel * dt * (this._isInverted ? -1.0 : 1.0));
      if ((!this._isInverted && this._mesh.position.y <= surfaceBelow && this._yVel <= 0) ||
          (this._isInverted && this._mesh.position.y >= surfaceBelow && -this._yVel >= 0)) {
        this._surface.impact(this._mesh.position.x, this._yVel * 0.02 * (this._isInverted ? -1.0 : 1.0));
        this._isJumping = false;
        this._yVel = 0;
        this._stickToSurface(surfaceBelow);
      }
    } else {
      this._stickToSurface(surfaceBelow);
    }
  }

  _stickToSurface(surfaceY) {
    this._surface.maybeCollideWithPlatform(this._mesh.position.x);
    let platform = this._surface.getCollidedPlatform();
    if (platform) {
      let platformPosition = platform.getPosition();
      let platformRotation = platform.getRotation();
      let deltaX = this._mesh.position.x - platformPosition.x;
      this._mesh.position.y = platformPosition.y + Math.sin(platformRotation) * deltaX + 0.13 * (this._isInverted ? -1.0 : 1.0);
    } else {
      this._mesh.position.y = surfaceY;
    }
  }

  touch(touches, gesture) {
    if (touches && touches.length) {
      let firstTouch = touches[0];
      if (!this._touchIdentifier) {
        this._touchIdentifier = firstTouch.identifier;
        this._initialTouchPosition = { x: firstTouch.locationX, y: firstTouch.locationY };
        this._previousTouchPosition = this._initialTouchPosition;
        this._touchDeltaX = 0;
      } else if (firstTouch.identifier == this._touchIdentifier) {
        let currentTouchPosition = { x: firstTouch.locationX, y: firstTouch.locationY };
        this._touchDeltaX = currentTouchPosition.x - this._initialTouchPosition.x;
        this._previousTouchPosition = currentTouchPosition;
      }
    }
  }

  release(touches, gesture) {
    if (touches && touches.length) {
      let firstTouch = touches[0];
      if (this._touchIdentifier && firstTouch.identifier == this._touchIdentifier) {
        let currentTouchPosition = { x: firstTouch.locationX, y: firstTouch.locationY };
        let deltaY = currentTouchPosition.y - this._initialTouchPosition.y;
        if (this._isInverted) { deltaY = -deltaY; }
        if (!this._isJumping && deltaY < -24) {
          this._jump((deltaY + 24.0) / -128.0);
        }
      }
    }
    this._touchIdentifier = null;
    this._touchDeltaX = 0;
    this._previousTouchPosition = { x: 0, y: 0 };
  }

  _jump(amount) {
    if (!this._isJumping) {
      this._isJumping = true;
      this._yVel = MAX_JUMP_VEL * Math.min(1.0, amount * (0.5 + 0.5 * (Math.abs(this._xVel) / MAX_VEL)));
    }
  }
};
