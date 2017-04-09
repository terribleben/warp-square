import Expo from 'expo';
import React from 'react';
import {
  Alert,
  StyleSheet,
} from 'react-native';

import Game from './Game';
import Menu from './Menu';
import SoundManager from './Assets/SoundManager';
import cacheAssetsAsync from './Assets/cacheAssetsAsync';

class App extends React.Component {
  state = {
    loaded: false,
    isShowingMenu: true,
  }

  componentWillMount() {
    // THREE warns about unavailable WebGL extensions.
    console.disableYellowBox = true;
    this.load();
  }

  async load() {
    try {
      await cacheAssetsAsync({
        images: [],
        fonts: [
          {'monofont': require('./Assets/monofont.ttf')},
        ],
        sounds: {
          jump: require('./Assets/jump.wav'),
          land: require('./Assets/land.wav'),
          morepwr: require('./Assets/morepwr.wav'),
          pwrup: require('./Assets/pwrup-2.wav'),
          pwrdown: require('./Assets/pwrdown.wav'),
          gameover: require('./Assets/gameover-long-filter.wav'),
          select: require('./Assets/select.wav'),
          music: require('./Assets/music.mp3'),
        },
      });
    } catch(e) {
      console.warn(
        'There was an error caching assets (see: main.js), perhaps due to a ' +
        'network timeout, so we skipped caching. Reload the app to try again.'
      );
      console.log(e.message);
    } finally {
      this.setState({loaded: true});
    }
  }

  _onPressStart = () => {
    SoundManager.playSoundAsync('select');
    this.setState({ isShowingMenu: false });
  }

  render() {
    if (this.state.loaded) {
      if (this.state.isShowingMenu) {
        return (
          <Menu
            style={styles.container}
            onPressStart={this._onPressStart} />
          );
      } else {
        return (<Game style={styles.container} />);
      }
    } else {
      return (<Expo.AppLoading />);
    }
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

Expo.registerRootComponent(App);
