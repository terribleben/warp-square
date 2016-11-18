
const THREE = require('three');

class SmallParticle {
  constructor(scene, viewport, options = {}) {
    this._viewport = viewport;
    this._velocity = { x: 0, y: 0 };
    this._lifespan = 0.3;
    this._ttl = this._lifespan;
    this._position = { x: 0, y: 0 };

    this._geometry = new THREE.PlaneBufferGeometry(0.05, 0.05);
    this._material = new THREE.MeshBasicMaterial( { color: options.color.getHex(), transparent: true } ),
    this._mesh = new THREE.Mesh(this._geometry, this._material);
    this._mesh.position.z = 2;
    if (options.position) {
      this._position = options.position;
    }
    if (options.angle && options.speed) {
      this._velocity = {
        x: Math.cos(options.angle) * options.speed,
        y: Math.sin(options.angle) * options.speed,
      };
    }
    scene.add(this._mesh);
  }

  isAlive() {
    return (this._ttl > 0);
  }

  destroy(scene) {
    scene.remove(this._mesh);
  }

  tick(dt) {
    this._velocity.x *= 0.92;
    this._velocity.y *= 0.92;
    this._material.opacity = (this._ttl / this._lifespan);
    this._position.x += this._velocity.x * dt;
    this._position.y += this._velocity.y * dt;
    this._mesh.position.x = this._position.x;
    this._mesh.position.y = this._position.y;
    this._ttl -= dt;
  }
};

export {
  SmallParticle,
};
