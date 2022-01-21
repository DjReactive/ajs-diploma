import GameStateService from './GameStateService';

jest.mock('./GameStateService', () => {
  const { default: mock } = jest.requireActual('./GameStateService');
  mock.prototype.load = function () {
    throw new Error('Invalid state (mock)');
  };
  return mock;
});

class TestStorage {
  constructor() {
    this.state = {};
  }

  setItem(key, value) {
    this.state[key] = value;
  }

  getItem(key) {
    return this.state[key];
  }
}
const storage = new TestStorage();
const obj = {
  id: 9,
  created: 1546300800,
  userInfo: {
    id: 1,
    name: 'Hitman',
    level: 10,
    points: 2000,
  },
};
const save = { state: JSON.stringify(obj) };

// =============================== TESTS ================================

test('Error loading state', () => {
  const state = new GameStateService(storage);
  try {
    state.load();
  } catch (error) {
    expect(error).toEqual(new Error('Invalid state (mock)'));
  }
});

test('Succefull loading state', () => {
  const state = new GameStateService(storage);
  jest.spyOn(state, 'load').mockImplementation(() => JSON.parse(save.state));
  expect(state.load()).toEqual(obj);
});
