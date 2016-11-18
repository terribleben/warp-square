
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
    this._velocity.x *= 0.93;
    this._velocity.y *= 0.93;
    this._material.opacity = (this._ttl / this._lifespan);
    this._position.x += this._velocity.x * dt;
    this._position.y += this._velocity.y * dt;
    this._mesh.position.x = this._position.x;
    this._mesh.position.y = this._position.y;
    this._ttl -= dt;
  }
};

class RadialParticle {
  constructor(scene, viewport, options = {}) {
    this._viewport = viewport;
    this._velocity = { x: 0, y: 0 };
    this._lifespan = 0.8;
    this._ttl = this._lifespan;
    this._position = { x: 0, y: 0 };
    this._scaleFactor = options.scaleFactor ? options.scaleFactor : 1.0;

    let curve = new THREE.EllipseCurve(
      0,  0,            // ax, aY
      0.2, 0.2,           // xRadius, yRadius
      0, 2 * Math.PI,  // aStartAngle, aEndAngle
      false,            // aClockwise
      0                 // aRotation
    );

    let path = new THREE.Path(curve.getPoints(32));
    let geometry = path.createPointsGeometry(32);
    this._material = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 3, transparent: true });

    // Create the final Object3d to add to the scene
    this._ellipse = new THREE.Line(geometry, this._material);

    this._ellipse.position.z = 2;
    if (options.position) {
      this._position = options.position;
    }
    scene.add(this._ellipse);
  }

  isAlive() {
    return (this._ttl > 0);
  }

  destroy(scene) {
    scene.remove(this._ellipse);
  }

  tick(dt) {
    this._material.opacity = (this._ttl / this._lifespan);
    this._ellipse.position.x = this._position.x;
    this._ellipse.position.y = this._position.y;
    this._ellipse.scale.x += this._scaleFactor * dt;
    this._ellipse.scale.y += this._scaleFactor * dt;
    this._ttl -= dt;
  }
};

class BadParticle {
  constructor(scene, viewport, options = {}) {
    this._viewport = viewport;
    this._velocity = { x: 0, y: 0 };
    this._lifespan = 0.8;
    this._ttl = this._lifespan;
    this._position = { x: 0, y: 0 };
    this._scaleMult = options.scaleMult ? options.scaleMult : 0.99;
    this._aVel = (options.aVel) ? options.aVel : 0.5;

    let curve = new THREE.EllipseCurve(
      0,  0,            // ax, aY
      2.0, 2.0,           // xRadius, yRadius
      0, 2 * Math.PI,  // aStartAngle, aEndAngle
      false,            // aClockwise
      0                 // aRotation
    );

    let path = new THREE.Path(curve.getPoints(11));
    let geometry = path.createPointsGeometry(11);
    this._material = new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 3, transparent: true });

    // Create the final Object3d to add to the scene
    this._ellipse = new THREE.Line(geometry, this._material);

    this._ellipse.position.z = 2;
    if (options.position) {
      this._position = options.position;
    }
    scene.add(this._ellipse);
  }

  isAlive() {
    return (this._ttl > 0);
  }

  destroy(scene) {
    scene.remove(this._ellipse);
  }

  tick(dt) {
    this._material.opacity = (this._ttl / this._lifespan);
    this._ellipse.position.x = this._position.x;
    this._ellipse.position.y = this._position.y;
    this._ellipse.scale.x *= this._scaleMult;
    this._ellipse.scale.y *= this._scaleMult;
    this._ellipse.rotation.z += this._aVel;
    this._ttl -= dt;
  }
};

class BackgroundParticle {
  constructor(scene, viewport, options = {}) {
    this._viewport = viewport;
    this._cameraXOffset = 0;
    this._position = { x: 0, y: 0 };
    this._aVel = -0.003 + Math.random() * 0.006;

    this._radius = viewport.width * (0.4 + Math.random() * 0.2);
    this._geometry = new THREE.PlaneBufferGeometry(this._radius, this._radius);
    this._material = new THREE.MeshBasicMaterial( { color: options.color } ),
    this._mesh = new THREE.Mesh(this._geometry, this._material);
    this._mesh.position.z = (options.position.z) ? options.position.z : -50;
    if (options.position) {
      this._position = options.position;
    }
    if (options.rotation) {
      this._mesh.rotation.z = options.rotation;
    }
    this._parallax = (options.parallax) ? options.parallax : 1.0;
    scene.add(this._mesh);
  }

  destroy(scene) {
    scene.remove(this._mesh);
  }

  _isOffscreen() {
    let hypotenuse = (1.414 * this._radius);
    return (this._mesh.position.x + hypotenuse < this._cameraXOffset - this._viewport.width * 0.5);
  }

  tick(dt) {
    this._mesh.position.x = this._position.x;
    this._mesh.position.y = this._position.y;
    this._mesh.rotation.z += this._aVel;
    if (this._isOffscreen()) {
      let hypotenuse = (1.414 * this._radius);
      this._position.x = this._cameraXOffset + this._viewport.width * 0.5 + hypotenuse;
    }
  }

  cameraDidUpdate(xPos) {
    let diff = xPos - this._cameraXOffset;
    this._position.x += diff * this._parallax;
    this._cameraXOffset = xPos;
  }
};

export {
  SmallParticle,
  RadialParticle,
  BadParticle,
  BackgroundParticle,
};
