import Exponent from 'exponent';
import React from 'react';
import {
  Dimensions,
  PanResponder,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

import Player from './Entities/Player';
import Surface from './Entities/Surface';
import HUD from './HUD/HUD';

const THREE = require('three');
const THREEView = Exponent.createTHREEViewClass(THREE);

const GAME_FINISHED = 0;
const GAME_STARTED = 1;

export default class Game extends React.Component {
  state = {
    gameStatus: GAME_STARTED,
  };

  constructor(props, context) {
    super(props, context);
    this.restart();
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
    let maybeGameOver = (this.state.gameStatus == GAME_FINISHED) ?
      (
        <View style={styles.gameOver}>
          <Text style={styles.gameOverText}>GAME OVER</Text>
          <TouchableWithoutFeedback
            style={styles.restartButton}
            onPress={this.restart.bind(this)}>
            <View><Text style={styles.restartText}>RESTART</Text></View>
          </TouchableWithoutFeedback>
        </View>
      ) :
      null;
    return (
      <View {...this.props}>
        <THREEView
          style={this.props.style}
          {...panResponder.panHandlers}
          scene={this._scene}
          camera={this._camera}
          tick={this._tick.bind(this)}
        />
        {maybeGameOver}
      </View>
    );
  }

  getGame() {
    return this;
  }

  onPlatformLanded() {
    this._numPlatformsLanded++;
    if (this._numPlatformsLanded == 5 && !this._isInverted) {
      this.setIsInverted(true);
      this._numPlatformsLanded = 0;
    }
  }

  onPlatformMissed() {
    this._numPlatformsLanded = 0;
    if (this._isInverted) {
      this.setIsInverted(false);
    } else {
      this.gameOver();
    }
  }

  setIsInverted(isInverted) {
    this._isInverted = isInverted;
    if (this.state.gameStatus == GAME_STARTED) {
      this._player.setIsInverted(isInverted);
    }
  }

  gameOver() {
    if (this.state.gameStatus == GAME_STARTED) {
      this._player.destroy(this._scene);
      this._player = null;
      this.setState({ gameStatus: GAME_FINISHED });
    }
  }

  _tick(dt) {
    this._updateCamera();
    if (this.state.gameStatus == GAME_STARTED) {
      this._player.tick(dt);
    }
    this._surface.tick(dt);
  }

  _touch(event, gesture) {
    let { nativeEvent } = event;
    let touches = nativeEvent ? nativeEvent.touches : null;
    if (this.state.gameStatus == GAME_STARTED) {
      this._player.touch(touches, gesture);
    }
  };

  _release(event, gesture) {
    let { nativeEvent } = event;
    let touches = nativeEvent ? nativeEvent.changedTouches : null;
    if (this.state.gameStatus == GAME_STARTED) {
      this._player.release(touches, gesture);
    }
  }

  restart() {
    if (this._player) {
      this._player.destroy(this._scene);
      this._player = null;
    }
    if (this._surface) {
      this._surface.destroy(this._scene);
      this._surface = null;
    }
    this._restartCamera();

    this._scene = new THREE.Scene();
    this._isInverted = false;
    this._numPlatformsLanded = 0;
    this._surface = new Surface(this.getGame.bind(this), this._scene, this._viewport);
    this._player = new Player(this._scene, this._viewport, this._surface);
    this.setState({
      gameStatus: GAME_STARTED,
    });
  }

  _restartCamera() {
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
    if (this.state.gameStatus == GAME_STARTED) {
      this._camera.left = this._player.getPositionX() - this._viewport.width * 0.5;
      this._camera.right = this._player.getPositionX() + this._viewport.width * 0.5;
      this._camera.updateProjectionMatrix();
      this._surface.cameraDidUpdate(this._player.getPositionX());
    }
    // this._hud.cameraDidUpdate(this._player.getPositionX());
  }
};

let styles = StyleSheet.create({
  gameOver: {
    position: 'absolute',
    top: 96,
    left: 0,
    width: Dimensions.get('window').width,
    height: 128,
    backgroundColor: 'transparent',
  },
  gameOverText: {
    color: '#ff00ff',
    fontWeight: '700',
    backgroundColor: 'transparent',
    fontSize: 64,
    textAlign: 'center',
  },
  restartButton: {
    backgroundColor: 'transparent',
  },
  restartText: {
    textAlign: 'center',
    color: '#ff0000',
    fontWeight: '700',
    fontSize: 24,
    margin: 12,
  },
})
