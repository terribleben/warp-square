
import {
  Platform,
} from 'react-native';

const THREE = require('three');

const MAX_ACCEL = 20;
const BASE_MAX_VEL = 2.5;
const MAX_JUMP_VEL = 6;

export default class Player {
  constructor(scene, viewport, surface) {
    this._viewport = viewport;
    this._xAccel = 0;
    this._xVel = 0;
    this._yVel = 0;
    this._touchIdentifier = null;
    this._initialTouchPosition = { x: 0, y: 0 };
    this._numTouchSteps = 0;
    this._touchYPositions = [];
    this._isJumping = true;
    this._isJumpAvailable = false;
    this._surface = surface;
    this._isInverted = false;
    this._isExploded = false;
    this._moreMaxVel = 0;

    const geometry = new THREE.PlaneBufferGeometry(0.12, 0.12);
    this._material = new THREE.MeshBasicMaterial( { color: 0xffffff, transparent: true } ),

    this._mesh = new THREE.Mesh(geometry, this._material);
    this._mesh.position.z = 10;
    this._mesh.position.y = viewport.width * 0.2;
    scene.add(this._mesh);
  }

  destroy(scene) {
    scene.remove(this._mesh);
  }

  explode() {
    let impactMagnitude = this._yVel * 0.2 * (this._isInverted ? -1.0 : 1.0);
    this._surface.impact(this._mesh.position.x, impactMagnitude);
    this._surface.impact(this._mesh.position.x + 0.15, impactMagnitude * 0.5);
    this._surface.impact(this._mesh.position.x - 0.15, impactMagnitude * 0.5);
    this._isExploded = true;
  }

  setMaxVelMore(moreAmount) {
    this._moreMaxVel = moreAmount * 0.06;
  }

  _getMaxVel() {
    return BASE_MAX_VEL + this._moreMaxVel;
  }

  setIsInverted(isInverted, isLevelUp) {
    this._isInverted = isInverted;
    this._material.color.setHex((isInverted) ? 0x000000 : 0xffffff);
    if (!isLevelUp) {
      // burst thru surface!!!
      this._mesh.position.y += 0.5 * (isInverted ? -1.0 : 1.0);
      this._xVel = this._getMaxVel();
      this._jump(1.0, true);
    }
  }

  getPositionX() {
    return this._mesh.position.x;
  }

  tick(dt) {
    let viewportHalfWidth = this._viewport.width / 2;

    if (this._touchIdentifier !== null && !this._isExploded) {
      this._xAccel = MAX_ACCEL;
      this._xVel += this._xAccel * dt;
      if (this._xVel < -this._getMaxVel()) this._xVel = -this._getMaxVel();
      if (this._xVel > this._getMaxVel()) this._xVel = this._getMaxVel();
    } else {
      this._xAccel = 0;
      if (!this._isJumping) {
        this._xVel *= 0.85;
      }
    }
    this._mesh.position.x += (this._xVel * dt);
    if (this._mesh.position.x < -viewportHalfWidth) {
      this._mesh.position.x = -viewportHalfWidth;
      this._xVel = 0;
    }

    let surfaceBelow = this._surface.getDepth(this._mesh.position.x) + 0.05 * (this._isInverted ? -1.0 : 1.0);
    if (this._isExploded) {
      this._yVel -= 0.5;
      this._material.opacity = Math.max(0, this._material.opacity - 0.07);
      this._mesh.position.y += (this._yVel * dt * (this._isInverted ? -1.0 : 1.0));
      if (this._mesh.position.y < -this._viewport.height / 2 || this._mesh.position.y > this._viewport.height / 2) {
        this._surface.gameOver();
      }
    } else if (this._isJumping) {
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
      if (this._touchIdentifier === null && !this._isJumping) {
        this._touchIdentifier = firstTouch.identifier;
        this._initialTouchPosition = this._touchLocation(firstTouch);
        this._isJumpAvailable = true;
        this._numTouchSteps = 0;
        this._touchYPositions = [this._initialTouchPosition.y];
      } else if (firstTouch.identifier === this._touchIdentifier) {
        let currentTouchPosition = this._touchLocation(firstTouch);
        this._numTouchSteps++;
        let deltaY = currentTouchPosition.y - this._initialTouchPosition.y;
        this._touchYPositions.push(currentTouchPosition.y);
        if (this._touchYPositions.length > 3) { this._touchYPositions.shift() };
        this._maybeJump(deltaY, false);
      }
    }
  }

  release(touches, gesture) {
    if (touches && touches.length) {
      let firstTouch = touches[0];
      if (this._touchIdentifier !== null && firstTouch.identifier === this._touchIdentifier) {
        let currentTouchPosition = this._touchLocation(firstTouch);
        let deltaY = currentTouchPosition.y - this._initialTouchPosition.y;
        this._touchYPositions.push(currentTouchPosition.y);
        if (this._touchYPositions.length > 3) { this._touchYPositions.shift() };
        this._maybeJump(deltaY, true);
      }
    }
    this._touchIdentifier = null;
    this._numTouchSteps = 0;
    this._touchYPositions = [];
  }

  _maybeJump(touchDeltaY, isRelease) {
    let velocity = (this._touchYPositions[this._touchYPositions.length - 1] - this._touchYPositions[0]) / this._touchYPositions.length;
    if (this._isInverted) {
      touchDeltaY = -touchDeltaY;
      velocity = -velocity;
    }
    if (!this._isJumping && touchDeltaY < -32 && (velocity < -20 || isRelease)) {
      this._jump(-velocity / 24.0);
    }
  }

  _jump(amount, force = false) {
    if (!this._isJumping && !this._isExploded && (this._isJumpAvailable || force)) {
      this._isJumping = true;
      this._isJumpAvailable = false;
      this._yVel = MAX_JUMP_VEL * Math.min(1.0, amount * (0.5 + 0.5 * (Math.abs(this._xVel) / this._getMaxVel())));
    }
  }

  _touchLocation(touch) {
    if (Platform.OS == 'ios') {
      // ios uses locationX and locationY
      return { x: touch.locationX, y: touch.locationY };
    } else {
      // android uses pageX and pageY
      return { x: touch.pageX, y: touch.pageY };
    }
  }
};
