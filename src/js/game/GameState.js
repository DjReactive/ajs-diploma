import themes from '../themes';
import CustomAI from '../character/AI';
import AppFunc from '../utils/functions';
import * as WarClasses from '../character/Classes';
import { getRandomIntInclusive } from '../utils/generators';

export default class GameState {
  static game = {};
  static debug = false;
  static teamAI = null;
  static AiControl;
  static gamePlay;
  static gamePoints = 0;
  static levels = [
    '-',  //default 0
    'prairie',
    'desert',
    'arctic',
    'mountain'
  ];
  static allClasses = {
    bowman: WarClasses.Bowman,
    swordsman: WarClasses.Swordsman,
    magician: WarClasses.Magician,
    daemon: WarClasses.Daemon,
    undead: WarClasses.Undead,
    zombie: WarClasses.Zombie,
  };
  static playerClasses = [
    WarClasses.Bowman,      // лучник 2кл
    WarClasses.Swordsman,   // мечник 4кл
    WarClasses.Magician,    // маг 1кл
  ];
  static aiClasses = [
    WarClasses.Daemon,      // демон 1кл
    WarClasses.Undead,      // скелет 4кл
    WarClasses.Zombie,      // вампир 2кл
  ];

  static initGame(current, initObj) {
    this.game.steps = initObj ? initObj.steps : 1;
    this.game.teams = [];
    this.game.number = current; // индекс в массиве teams, определяет текущую команду, чей ход
    this.game.map = {
      level: initObj ? initObj.map.level : 1,
      name: initObj ? initObj.map.name : this.levels[1],
    };
  }

  /*
  @current - индекс в массиве команд, с которой начнется игрока
  */
  static init (gameObj, current = 0, initObj = null) {
    this.initGame(current, initObj);
    this.gamePlay = gameObj.gamePlay;
    this.control = gameObj.controller;
    this.game.teams = gameObj.controller.charTeams;
    this.debug = (gameObj.debug !== undefined) ? gameObj.debug : false;

    this.game.teams.forEach(team => {
      if (!this.isPlayerTeam(team)) this.teamAI = team;
    })

    if (!this.teamAI) throw new Error('Комады для AI в массиве команд не найдено!');
    this.AiControl = new CustomAI(gameObj);

    this.logMessage(`[= = = = = Retro Game = = = = =]`);
    this.next(null, true);
  }

  // Создание объекта для сохранения игры
  static from() {
    let date = new Date();
    // TODO: create object
    return {
      date: this.getDate(date),
      gameinfo: this.game,
      characters: this.getCharacters(),
      points: this.gamePoints,
    }
  }

  static getDate(date) {
    let obj = {
      day: date.getDate(),
      month: (date.getMonth() + 1),
      year: date.getFullYear(),
      hours: date.getHours(),
      minutes: date.getMinutes(),
    }
    for (let key of Object.keys(obj)) {
      obj[key] = obj[key] < 10 ? `0${obj[key]}` : String(obj[key]);
    }
    return `${obj.day}.${obj.month}.${obj.year} (${obj.hours}:${obj.minutes})`;
  }

  static getCharacters() {
    let arr = [];
    let chars = this.control.allPosCharacters;
    for (let i = 0; i < chars.length; i++) {
      let obj = {
        type: chars[i].character.type,
        level: chars[i].character.level,
        health: chars[i].character.health,
        attack: chars[i].character.attack,
        defence: chars[i].character.defence,
        position: chars[i].position,
        isPlayer: chars[i].isPlayer,
      }
      arr.push(obj);
    }
    return arr;
  }

  static logMessage(msg) {
    if (this.debug && msg.length > 0) console.log(msg);
  }

  static actionMessage(action, ...array) {
    let type, message = '', args = (typeof array === 'object') ? array[0] : null;
    switch (action) {
      case 'attack':
        /*
        object type for 'args':
        @attacker: <instance of PositionedCharacter>,
        @victim: <instance of PositionedCharacter>,
        @damage: <index position on board>
        */
        type = args.attacker.isPlayer ? 'Player' : 'AI';
        message = `${type} (${args.attacker.character.type} ${args.attacker.character.level} ур.):
        ${(args.victim.character.health > 0 ? `Наносит ${args.damage} урона` : `Убивает`)} ` +
        `${args.victim.character.type} (${args.victim.character.level} ур.)`;
        break;
      case 'move':
        /*
        object type for 'args':
        @character: <instance of PositionedCharacter>,
        @position: <index position on board>
        */
        type = args.character.isPlayer ? 'Player' : 'AI';
        message = `${type} (${args.character.character.type} ${args.character.character.level} ур.):
        Передвигается на позицию ${args.position}`;
        break;
      case 'points':
        message = `[Ваше текущее количество баллов: ${this.gamePoints}]`;
        break;
      default:
        break;
    }
    this.logMessage(message);
  }

  /*
  @isPlayer - проверить команду на принадлежность реальному игроку
  */
  static isPlayerTeam(team = this.current()) {
    for (let char of team.characters) return char.isPlayer ? true : false;
  }

  static current() {
    return this.game.teams[this.game.number];
  }

  static isComplete() {
    return (this.current().characters.size < 1) ? true : false;
  }

  static winPoints(add = true) {
    let health = 0;
    for (let char of this.current().characters) health += char.character.health;
    if (add) this.gamePoints += health;
    this.actionMessage('points');
  }

  // @withoutStats - не учитывать ход в статистику
  static step(withoutStats = false) {
    if (!withoutStats) this.game.steps++;
    this.game.number++;
    if (this.game.number >= this.game.teams.length)
      this.game.number = 0;
  }

  static next(callback, stepFreeze = false) {
    if (!stepFreeze) this.step();

    if (this.isComplete()) {
      this.step(true);
      this.logMessage(`${this.game.map.level} Уровень завершен! Вы ${ this.isPlayerTeam() ? 'победили' : 'проиграли'} AI!`);
      if (!this.isPlayerTeam()) {
        this.gamePlay.showError('Вы проиграли!');
        return;
      } else this.winPoints();

      // Если уровень существует, то создаем переход на него
      if (this.levels.length > (this.game.map.level + 1)) {
        let arr = [];
        arr = AppFunc.getIndexArrayColumn(this.gamePlay.boardSize, [0, 1]);
        let fnc = function (arr) {
          return arr[getRandomIntInclusive(0, arr.length - 1)];
        }
        // Данная итерация повышает уровень всех выживших персонажей и переносит на начальные клетки в новом уровне
        this.current().characters.forEach(char => {
          let position;
          char.character.levelup();
          position = fnc(arr);
          while (AppFunc.checkCellCharacter(position, this.current().characters) !== null) position = fnc(arr);
          char.position = position;
        });

        this.game.map.level += 1;
        this.game.map.name = this.levels[this.game.map.level];
        this.logMessage(`[= = = = = Переходим на ${this.game.map.name} (${this.game.map.level} уровень)  = = = = = ]`);
        this.logMessage(`[${this.game.steps} ход] Ход игрока`);
        return {
          nextmap: this.game.map.name,
          level: this.game.map.level
        };
      } else {
        this.gamePlay.showMessage('Вы полностью прошли игру, поздравляем!');
        return;
      }
    }
    if (!this.isPlayerTeam()) {
      this.AiControl.think(callback);
      this.logMessage(`[${this.game.steps} ход] Ход компьютера`);
    } else {
      this.logMessage(`[${this.game.steps} ход] Ход игрока`);
    }
  }
}
