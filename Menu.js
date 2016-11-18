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

export default class Menu extends React.Component {
  render() {
    return (
      <View
        {...this.props}
        style={[this.props.style, styles.container]}>
        <View style={styles.instructions}>
          <Text style={styles.instructionsText}>
            PRESS AND HOLD TO MOVE
          </Text>
          <Text style={styles.instructionsText}>
            SWIPE WITH THE SAME FINGER TO JUMP
          </Text>
          <Text style={[styles.instructionsText, { color: '#ff0000' }]}>
            DO NOT CROSS THE DIMENSIONAL BARRIER
          </Text>
        </View>
        <TouchableWithoutFeedback onPress={this.props.onPressStart}>
          <View style={styles.startButton}>
            <Text style={styles.startText}>START</Text>
          </View>
        </TouchableWithoutFeedback>
      </View>
    );
  }
}

let styles = StyleSheet.create({
  container: {
    backgroundColor: '#000000',
    alignItems: 'center',
  },
  startButton: {
    padding: 16,
    backgroundColor: '#000000',
  },
  startText: {
    color: '#ffffff',
    fontSize: 64,
    textAlign: 'center',
    backgroundColor: 'transparent',
    fontFamily: 'monofont',
  },
  instructions: {
    padding: 16,
    backgroundColor: '#000000',
  },
  instructionsText: {
    textAlign: 'center',
    color: '#dddddd',
    fontSize: 16,
    paddingVertical: 8,
    fontFamily: 'monofont',
  },
});
