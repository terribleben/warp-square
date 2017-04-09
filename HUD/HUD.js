
const THREE = require('three');

const HUD_BAR_SIZE = { width: 3.75, height: 0.08 };

export default class HUD {
  constructor(getGame, scene, viewport) {
    this._getGame = getGame;
    this._cameraXOffset = 0;
    this._viewport = viewport;
    this._progress = 0;
    this._progressInterp = 0;

    const lineMaterial = new THREE.LineBasicMaterial( { color: 0xffffff, linewidth: 2 } );
    this._line = new THREE.Line(this._makeRectGeometry(), lineMaterial);
    this._line.position.z = 10;
    this._line.position.y = viewport.height * -0.45;
    scene.add(this._line);

    this._underMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(HUD_BAR_SIZE.width, HUD_BAR_SIZE.height),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true })
    );
    this._underMesh.position.z = this._line.position.z + 1;
    this._underMesh.position.y = this._line.position.y;
    scene.add(this._underMesh);

    this._mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(HUD_BAR_SIZE.width, HUD_BAR_SIZE.height),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    this._mesh.position.z = this._line.position.z + 2;
    this._mesh.position.y = this._line.position.y;
    scene.add(this._mesh);
  }

  destroy(scene) {
    scene.remove(this._line);
    scene.remove(this._underMesh);
    scene.remove(this._mesh);
  }

  setProgress(progress) {
    this._progress = progress;
    if (this._progress === 0) {
      this._progressInterp = 0;
    }
  }

  setLevel(level) {
    if (level > 0) {
      let styleColor = this._getGame().getLevelColor(level - 1);
      let hexColor = parseInt(styleColor.substring(1), 16)
      this._underMesh.material.color.setHex(hexColor);
      this._underMesh.material.opacity = 1;
    } else {
      this._underMesh.material.opacity = 0;
    }
    let styleColor = this._getGame().getLevelColor();
    let hexColor = parseInt(styleColor.substring(1), 16)
    this._mesh.material.color.setHex(hexColor);
  }

  tick(dt) {
    this._updateBarShape();
    const progressInterpTarget = 0.1 + (this._progress * 0.8);
    this._progressInterp += (progressInterpTarget - this._progressInterp) * 0.1;
    this._line.position.x = this._cameraXOffset;// - HUD_BAR_SIZE.width * 0.5;
    this._underMesh.position.x = this._line.position.x;
    this._mesh.position.x = this._line.position.x;
  }

  cameraDidUpdate(x) {
    this._cameraXOffset = x;
  }

  _makeRectGeometry() {
    let shape = new THREE.Shape();
    const { width, height } = HUD_BAR_SIZE;
    shape.moveTo(-width / 2, -height / 2);
    shape.lineTo(width / 2, -height / 2);
    shape.lineTo(width / 2, height / 2);
    shape.lineTo(-width / 2, height / 2);
    shape.lineTo(-width / 2, -height / 2);
    shape.lineTo(width / 2, -height / 2);
    return new THREE.ShapeGeometry(shape);
  }

    _updateBarShape() {
      let vertices = this._mesh.geometry.vertices;

      if (vertices.length == 4) {
        let leftX = vertices[0].x;
        let barWidth = HUD_BAR_SIZE.width * this._progressInterp;
        vertices[1].x = leftX + barWidth;
        vertices[3].x = leftX + barWidth;
      }

      // modify in place
      this._mesh.geometry.verticesNeedUpdate = true;
      this._mesh.geometry.computeBoundingSphere();
    }
};
