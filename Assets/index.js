import Exponent from 'exponent';

const modules = {
  'player-sprite': require('./avatar2.png'),
}

// Export map of asset names to `Exponent.Asset` objects.
export default Object.assign({}, ...Object.keys(modules).map((name) =>
  ({ [name]: Exponent.Asset.fromModule(modules[name]) })));
