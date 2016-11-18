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
const LEVEL_COLORS = [
  '#ee0000',
  '#eeaa00',
  '#efef00',
  '#00ee00',
  '#00eeee',
  '#ee00ee',
  '#ff7777',
];

export default class Game extends React.Component {
  state = {
    gameStatus: GAME_STARTED,
    level: 0,
  };

  componentDidMount() {
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
    let otherStuff = (this.state.gameStatus == GAME_FINISHED) ? this._renderGameOver() : this._renderReactHUD();
    return (
      <View {...this.props}>
        <THREEView
          style={this.props.style}
          {...panResponder.panHandlers}
          scene={this._scene}
          camera={this._camera}
          tick={this._tick.bind(this)}
        />
        {otherStuff}
      </View>
    );
  }

  _renderGameOver() {
    return (
      <View style={styles.gameOver}>
        <Text style={styles.gameOverText}>GAME OVER</Text>
        <TouchableWithoutFeedback
          style={styles.restartButton}
          onPress={this.restart.bind(this)}>
          <View><Text style={styles.restartText}>RESTART</Text></View>
        </TouchableWithoutFeedback>
      </View>
    );
  }

  _renderReactHUD() {
    return (
      <View style={styles.hud}>
        <Text style={[styles.levelText, { color: this.getLevelColor() }]}>
          PWR {this.state.level}
        </Text>
      </View>
    );
  }

  getGame() {
    return this;
  }

  getLevelColor() {
    let colorIdx = (this.state.level < LEVEL_COLORS.length) ? this.state.level : LEVEL_COLORS.length - 1;
    return LEVEL_COLORS[colorIdx];
  }

  onPlatformLanded() {
    this._numPlatformsLanded++;
    if (this._numPlatformsLanded == 5) {
      this.setIsInverted(!this._isInverted, true);
      this._numPlatformsLanded = 0;
      this.setState({ level: this.state.level + 1 });
    }
  }

  onPlatformMissed() {
    this._numPlatformsLanded = 0;
    this.setIsInverted(!this._isInverted, false);
    if (this.state.level > 0) {
      this.setState({ level: this.state.level - 1 });
    } else {
      this.gameOver();
    }
  }

  setIsInverted(isInverted, isLevelUp) {
    this._isInverted = isInverted;
    if (this.state.gameStatus == GAME_STARTED) {
      this._player.setIsInverted(isInverted, isLevelUp);
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
  hud: {
    position: 'absolute',
    left: 12,
    top: Dimensions.get('window').height - 32,
    width: Dimensions.get('window').width,
    height: 32,
    backgroundColor: 'transparent',
  },
  levelText: {
    backgroundColor: 'transparent',
    fontSize: 24,
    fontWeight: '700',
  },
})
