import Character from './Character';
import * as GameClasses from './Classes';


test('Dont create Character class', () => {
  const err = () => new Character(4);
  expect(err).toThrow("Don't create Character(), use Classes");
});

test('Character class create from Classes', () => {
  const char = new GameClasses.Bowman(4);
  expect(char instanceof Character).toEqual(true);
});
