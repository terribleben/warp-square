import Exponent from 'exponent';
import React from 'react';
import {
  Dimensions,
  PanResponder
} from 'react-native';

import Player from './Entities/Player';
import Surface from './Entities/Surface';
import HUD from './HUD/HUD';

const THREE = require('three');
const THREEView = Exponent.createTHREEViewClass(THREE);

export default class Game extends React.Component {
  constructor(props, context) {
    super(props, context);
    this._prepareCamera();
    this._prepareScene();
  }

  render() {
    const panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: this._touch.bind(this),
      onPanResponderMove: this._touch.bind(this),
      onPanResponderRelease: this._release.bind(this),
      onPanResponderTerminate: this._release.bind(this),
      onShouldBlockNativeResponder: () => false,
    });
    return (
      <THREEView
        {...this.props}
        {...panResponder.panHandlers}
        scene={this._scene}
        camera={this._camera}
        tick={this._tick.bind(this)}
      />
    );
  }

  getGame() {
    return this;
  }

  onPlatformLanded() {
    this._numPlatformsLanded++;
    if (this._numPlatformsLanded == 5) {
      this._isInverted = true;
      this._player.setIsInverted(true);
    }
  }

  _tick(dt) {
    this._updateCamera();
    this._player.tick(dt);
    this._surface.tick(dt);
  }

  _touch(event, gesture) {
    let { nativeEvent } = event;
    let touches = nativeEvent ? nativeEvent.touches : null;
    this._player.touch(touches, gesture);
  };

  _release(event, gesture) {
    let { nativeEvent } = event;
    let touches = nativeEvent ? nativeEvent.changedTouches : null;
    this._player.release(touches, gesture);
  }

  _prepareScene(scene) {
    this._scene = new THREE.Scene();
    this._isInverted = false;
    this._numPlatformsLanded = 0;
    this._surface = new Surface(this.getGame.bind(this), this._scene, this._viewport);
    this._player = new Player(this._scene, this._viewport, this._surface);
  }

  _prepareCamera() {
    const width = 4;
    const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
    const height = (screenHeight / screenWidth) * width;
    console.log('setting up camera with screen width/height:', screenWidth, screenHeight)
    let orthoWidth = !(width > height) ? width : height;
    let orthoHeight = !(width > height) ? width : height;
    this._camera = new THREE.OrthographicCamera(
      -orthoWidth / 2, orthoWidth / 2,
      orthoHeight / 2, -orthoHeight / 2,
      1, 10000,
    );
    this._camera.position.z = 1000;
    this._viewport = {
      width,
      height,
      screenWidth,
      screenHeight,
    };
  }

  _updateCamera() {
    // this._camera.position.x = this._player.getPositionX();
    this._camera.left = this._player.getPositionX() - this._viewport.width * 0.5;
    this._camera.right = this._player.getPositionX() + this._viewport.width * 0.5;
    this._camera.updateProjectionMatrix();
    this._surface.cameraDidUpdate(this._player.getPositionX());
    // this._hud.cameraDidUpdate(this._player.getPositionX());
  }
};
