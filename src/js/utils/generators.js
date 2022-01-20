import Team from '../character/Team';
import PositionedCharacter from '../character/PositionedCharacter';
import AppFunc from './functions';

/*
  Получает случайное целое число в интервале от min до max (включительно)
*/
export function getRandomIntInclusive(min, max) {
  return Math.floor(Math.random() * (Math.floor(max) - Math.ceil(min) + 1)) + Math.ceil(min);
}

/**
 * Generates random characters
 *
 * @param allowedTypes iterable of classes
 * @param maxLevel max character level
 * @returns Character type children (ex. Magician, Bowman, etc)
 */
export function* characterGenerator(allowedTypes, maxLevel) {
  // TODO: write logic here
  let rndType; let rndLevel; let Char;
  while (true) {
    rndLevel = getRandomIntInclusive(1, maxLevel);
    rndType = getRandomIntInclusive(0, (allowedTypes.length - 1));
    Char = allowedTypes[rndType];
    yield new Char(rndLevel);
  }
}

/*
  Метод добавляет персонажей в команду
  @team - Команда, в которую необходимо добавить персонажей
  @allowClasses - допустимые классы для персонажа
  @maxLevel - Максимальный уровень, например 4, то будет рандомный от 1 до 4
  @count - количество создаваемых персонажей (классы также рандомны и берутся из @classArray)
*/
export function addCharactersOnTeam(team, allowClasses, maxLevel = 1, count = 1, isPlayer = true) {
  const fncGenerate = characterGenerator(allowClasses, maxLevel);
  const columns = AppFunc.getCellsArray(AppFunc.boardSize, isPlayer);
  for (let rnd, char, charPos, i = 0; i < count; i++) {
    char = fncGenerate.next().value;
    // idx = classes.indexOf(char.type);
    // classes.splice(idx, 1);
    rnd = columns[getRandomIntInclusive(0, columns.length - 1)];
    while (AppFunc.checkCellCharacter(rnd, team.characters) !== null) {
      rnd = columns[getRandomIntInclusive(0, columns.length - 1)];
    }
    charPos = new PositionedCharacter(char, rnd, isPlayer);
    team.add(charPos);
  }
}

/*
  Метод добавляет готового персонажа в команду
  @team - Команда, в которую необходимо добавить персонажей
  @charObj - объект со свойствами Character
  @position - позиция для размещения
*/
export function addCharacterOnTeam(team, ClassObj, charObj) {
  const Char = new ClassObj();
  Char.level = charObj.level;
  Char.health = charObj.health;
  Char.attack = charObj.attack;
  Char.defence = charObj.defence;
  const charPos = new PositionedCharacter(Char, charObj.position, charObj.isPlayer);
  team.add(charPos);
}

export function generateTeam(allowedTypes, maxLevel, charsCount, isPlayer) {
  // TODO: write logic here
  const team = new Team(isPlayer);
  addCharactersOnTeam(team, allowedTypes, maxLevel, charsCount, isPlayer);
  return team;
}
