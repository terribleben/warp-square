import Exponent from 'exponent';
import React from 'react';
import {
  Alert,
  StyleSheet,
} from 'react-native';

import Game from './Game';

class App extends React.Component {
  state = {
    loaded: false,
  }

  componentWillMount() {
    // THREE warns about unavailable WebGL extensions.
    console.disableYellowBox = true;
    this.load();
  }

  async load() {
    this.setState({ loaded: true });
  }

  render() {
    return (this.state.loaded) ? (
      <Game style={styles.container} />
    ) : (
      <Exponent.Components.AppLoading />
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

Exponent.registerRootComponent(App);
