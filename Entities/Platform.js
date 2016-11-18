
const THREE = require('three');

import { SmallParticle } from './Particles';

export default class Platform {
  constructor(getGame, getSurface, scene, viewport, options = {}) {
    this._scene = scene;
    this._getGame = getGame;
    this._viewport = viewport;
    this._getSurface = getSurface;
    this._isCollided = false;
    this._isDead = false;
    this._sinkingOffset = 0;
    this._radius = (options.radius) ? options.radius : 0.3 + Math.random() * 0.3;
    this._geometry = new THREE.PlaneBufferGeometry(this._radius * 2.0, 0.15);
    this._material = new THREE.MeshBasicMaterial( { color: 0xdddddd, transparent: true } ),
    this._mesh = new THREE.Mesh(this._geometry, this._material);
    this._mesh.position.z = -1;
    if (options.x) {
      this._mesh.position.x = options.x;
    } else {
      this._mesh.position.x = (-0.4 + Math.random() * 0.8) * viewport.width;
    }
    scene.add(this._mesh);
  }

  destroy(scene) {
    scene.remove(this._mesh);
  }

  getRadius() {
    return this._radius;
  }

  getPosition() {
    return this._mesh.position;
  }

  getRotation() {
    return this._mesh.rotation.z;
  }

  getImpactParticles(isInverted) {
    let particles = [];
    for (let ii = 0; ii < 10; ii++) {
      let particle = new SmallParticle(this._scene, this._viewport, {
        color: this._material.color,
        speed: 2.5 + Math.random() * 7.0,
        angle: (isInverted) ? Math.PI * 0.5 : -Math.PI * 0.5,
        position: {
          x: this._mesh.position.x + this._radius * (-1.0 + (ii / 10.0) * 2.0),
          y: this._mesh.position.y,
        }
      });
      particles.push(particle);
    }
    return particles;
  }

  isAlive() {
    return (!this._isDead || this._sinkingOffset < 0.1);
  }

  setIsCollided(isCollided) {
    if (this._isCollided && !isCollided) {
      // we're no longer collided. fade away and die
      this._isDead = true;
    }
    if (isCollided && !this._isCollided) {
      requestAnimationFrame(() => {
        let styleColor = this._getGame().getLevelColor();
        let hexColor = parseInt(styleColor.substring(1), 16)
        this._material.color.setHex(hexColor);
      });
    }
        this._isCollided = isCollided;
  }

  tick(dt) {
    if (this._isDead) {
      this._sinkingOffset += 0.05 * dt;
      this._material.opacity = 1.0 - (this._sinkingOffset / 0.1);
    }
    let yLeft = this._getSurface().getDepth(this._mesh.position.x + this._radius);
    let yRight = this._getSurface().getDepth(this._mesh.position.x - this._radius);
    this._mesh.position.y = ((yLeft + yRight) * 0.5) - this._sinkingOffset;
    this._mesh.rotation.z = -((yRight - yLeft) * this._radius * 2);
  }
};
