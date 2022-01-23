import Character from './Character';
import * as GameClasses from './Classes';
import AppFunc from '../utils/functions';
import PositionedCharacter from './PositionedCharacter';

test('Dont create Character class', () => {
  const err = () => new Character(4);
  expect(err).toThrow("Don't create Character(), use Classes");
});

test('Character class create from Classes', () => {
  const char = new GameClasses.Bowman(4);
  expect(char instanceof Character).toEqual(true);
});

test('Targeted template', () => {
  const char = new GameClasses.Swordsman(1);
  const dmg = 20;
  let charObj = {
    health: char.health,
    level: char.level,
  }
  char.damage(dmg);
  char.levelup();
  // Получение урона + повышение уровня
  charObj.health = Math.min((charObj.health - dmg) + 80, 100);
  charObj.level += 1;
  const posChar = new PositionedCharacter(char, 1);
  expect(AppFunc.getCharacterInfo(posChar))
  .toEqual(`\u{1F396}${charObj.level} \u{2694}${char.attack} `
  + `\u{1F6E1}${char.defence} \u{2764}${charObj.health}`);
});
