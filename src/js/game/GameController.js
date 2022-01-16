import themes from '../themes';
import {
  characterGenerator, generateTeam,
  addCharacterOnTeam, addCharactersOnTeam,
  getRandomIntInclusive,
} from '../utils/generators';
import GameState from './GameState';
import GameStateService from './GameStateService';
import GameScenarios from './GameScenarios';
import AppFunc from '../utils/functions';

export default class GameController {
  constructor(gamePlay, stateService) {
    this.startSettings(gamePlay, stateService);
  }

  startSettings(gamePlay, stateService) {
    this.gamePlay = gamePlay;
    this.stateService = stateService;
    this.charTeams = []; // массив с командами PositionedCharacter
    this.allPosCharacters = []; // массив со всеми PositionedCharacter
    this.charStepsAllow = []; // массив в котором находятся допустимые для игрока ячейки для будущего хода
    this.boardLines = []; // массив с разделением каждой линии поля (нужен для приведения его к двумерному виду)
    this.charSelected = { // информация о текущем выбранном персонаже, если такой имеется
      index: -1,
      character: null,
      action: null,
    };
  }

  init() {
    AppFunc.boardSize = this.gamePlay.boardSize;
    // TODO: add event listeners to gamePlay events
    // binding
    this.onCellEnter = this.onCellEnter.bind(this);
    this.onCellClick = this.onCellClick.bind(this);
    this.onCellLeave = this.onCellLeave.bind(this);
    this.clickSaveGame = this.clickSaveGame.bind(this);
    this.clickLoadGame = this.clickLoadGame.bind(this);
    this.clickNewGame = this.clickNewGame.bind(this);

    // Add Event listeners
    this.gamePlay.addCellEnterListener(this.onCellEnter);
    this.gamePlay.addCellClickListener(this.onCellClick);
    this.gamePlay.addCellLeaveListener(this.onCellLeave);
    // Add Buttons listeners
    this.gamePlay.addSaveGameListener(this.clickSaveGame);
    this.gamePlay.addLoadGameListener(this.clickLoadGame);
    this.gamePlay.addNewGameListener(this.clickNewGame);

    this.startNewGame();
    // TODO: load saved stated from stateService
  }

  startNewGame() {
    // spawn characters with get scenario on level
    const sc = GameScenarios.get(1);
    this.createTeam(GameState.playerClasses, sc.players.maxlevel, sc.players.count, true);
    this.createTeam(GameState.aiClasses, sc.ai.maxlevel, sc.ai.count, false);

    // указываем модулю, что команды для игры сформированы
    GameState.init({
      controller: this,
      gamePlay: this.gamePlay,
      debug: true,
    });

    this.gamePlay.drawUi(themes.prairie);
    this.gamePlay.redrawPositions(this.allPosCharacters);
  }

  onCellClick(index) {
    // TODO: react to click
    if (!GameState.isPlayerTeam()) return;

    const char = AppFunc.checkCellCharacter(index, this.allPosCharacters);
    const selected = this.charSelected;
    if (char !== null) {
      if (selected.index === index) {
        AppFunc.deselectAll(this.gamePlay);
        this.selectOff();
      } else if (char.character.health > 0) {
        if ((selected.character === null) || (selected.character.isPlayer === char.isPlayer)) {
          if (char.isPlayer) {
            AppFunc.deselectAll(this.gamePlay);
            this.gamePlay.selectCell(index);
            selected.index = index;
            selected.character = char;
            [this.charStepsAllow, this.boardLines] = AppFunc.setAllowedCharacterStep(
              selected.character.character,
              selected.index,
              this.gamePlay.boardSize,
              this.allPosCharacters,
            );
          } else this.gamePlay.showError('Выберите своего персонажа!');
        } else {
          if (AppFunc.checkAllowedCharacterAttack(index, selected.index, selected.character.character, this.boardLines)
            && !selected.action) {
            // Игрок атакует
            selected.action = 'attack';
            (async () => {
              const dmg = char.character.damage(selected.character.character.attack, true);
              await this.gamePlay.showDamage(index, dmg);
              GameState.actionMessage(selected.action, {
                attacker: selected.character,
                victim: char,
                damage: dmg,
              });
              this.makingMove('attack', index, selected.character, char);
            })();
          } // else this.gamePlay.showError('Враг недоступен для атаки в данный момент');
        }
      } else this.gamePlay.showError('Выберите живого персонажа!');
    } else if (selected.character !== null) {
      if (AppFunc.checkAllowedCharacterStep(index, this.charStepsAllow)) {
        // Игрок передвигается
        selected.action = 'move';
        GameState.actionMessage(selected.action, {
          character: selected.character,
          position: index,
        });
        this.makingMove('move', index, selected.character);
      }
    }
  }

  onCellEnter(index) {
    // TODO: react to mouse enter
    const char = AppFunc.checkCellCharacter(index, this.allPosCharacters);
    const selected = this.charSelected;
    if (char !== null) {
      this.gamePlay.setCursor('pointer');
      this.gamePlay.showCellTooltip(
        `\u{1F396}${char.character.level} \u{2694}${char.character.attack} `
      + `\u{1F6E1}${char.character.defence} \u{2764}${char.character.health}`,
        index,
      );
    }

    if (selected.character !== null) {
      AppFunc.deselectAll(this.gamePlay, selected.index);
      if ((AppFunc.checkAllowedCharacterStep(index, this.charStepsAllow) && char === null)
      || (AppFunc.checkAllowedCharacterAttack(index, selected.index, selected.character.character, this.boardLines)
      && char !== null)) {
        if (selected.index !== index) {
          if (char !== null) {
            if (char.isPlayer !== selected.character.isPlayer) {
              this.gamePlay.setCursor('crosshair');
              this.gamePlay.selectCell(index, 'red');
            }
          } else {
            this.gamePlay.setCursor('pointer');
            this.gamePlay.selectCell(index, 'green');
          }
        }
      } else if (char === null || char.isPlayer !== selected.character.isPlayer) { this.gamePlay.setCursor('not-allowed'); }
    }
  }

  onCellLeave(index) {
    // TODO: react to mouse leave
    this.gamePlay.setCursor('default');
    this.gamePlay.hideCellTooltip(index);
  }

  makingMove(action, index, charPos, ...args) {
    switch (action) {
      case 'attack':
        if (args.length < 1) throw new Error('Ошибка передачи аргумента');
        const enemyPos = args[0];
        charPos.character.attacking(enemyPos.character);
        if (enemyPos.character.health <= 0) this.refreshTeams();
        break;
      case 'move':
        charPos.position = index;
        break;
    }
    this.charSelected.action = null;
    this.updateBoard();

    // Если после последнего хода уровень был завершен, осуществляем обновление уровня
    const gamestate = GameState.next(() => this.update());
    if (typeof gamestate === 'object') this.nextLevel(gamestate.nextmap, gamestate.level);
  }

  nextLevel(mapname, level) {
    const scenario = GameScenarios.get(level);

    // Добавляем персонажей игроку по сценарию
    const teamPlayer = this.getTeam();
    const countPlayer = scenario.players.count;
    addCharactersOnTeam(teamPlayer, GameState.playerClasses, scenario.players.maxlevel, countPlayer);

    // Добавляем персонажей AI по сценарию
    const teamAi = this.getTeam(false);
    const countAi = scenario.ai.playercount ? teamPlayer.characters.size : scenario.ai.count;
    addCharactersOnTeam(teamAi, GameState.aiClasses, scenario.ai.maxlevel, countAi, false);

    this.update();
    this.gamePlay.drawUi(themes[mapname]);
    this.gamePlay.redrawPositions(this.allPosCharacters);
  }

  update() {
    this.refreshTeams();
    this.updateBoard();
  }

  updateBoard() {
    AppFunc.deselectAll(this.gamePlay);
    this.selectOff();
    this.gamePlay.redrawPositions(this.allPosCharacters);
  }

  /*
    Сброс выделенного персонажа
  */
  selectOff() {
    this.charSelected.index = -1;
    this.charSelected.character = null;
    this.charStepsAllow = [];
    this.boardLines = [];
  }

  /*
    создание команды из нескольких случайных персонажей
    @classArray - массив классов, случайный из них будет назначен созданному персонажу
    @maxLevel - максиммальный уровень персонажа
    @count - количество создаваемых персонажей (классы также рандомны и берутся из @classArray)
    @player - если персонажи генерируются для игрока, то true - иначе false
  */
  createTeam(classArray, maxLevel, count, isPlayer = true) {
    const team = generateTeam(classArray, maxLevel, count, isPlayer);
    for (const char of team.characters) this.allPosCharacters.push(char);
    this.charTeams.push(team);
  }

  /*
    обновляет командные данные, сравнивая показатели жизней
    Если уровень жизней 0, то удаляет из командны персонажа.
  */
  refreshTeams(deleteAll = false) {
    this.allPosCharacters = [];
    for (let i = 0; i < this.charTeams.length; i++) {
      for (const char of this.charTeams[i].characters) {
        if (char.character.health > 0 && !deleteAll) this.allPosCharacters.push(char);
        else this.charTeams[i].characters.delete(char);
      }
    }
  }

  getTeam(isPlayer = true) {
    let tm = null;
    this.charTeams.forEach((team) => {
      if (team.isPlayer === isPlayer) tm = team;
    });
    return tm;
  }

  // ======================== BUTTONS ============================

  clickNewGame() {
    this.startSettings(this.gamePlay, this.stateService);
    this.startNewGame();
  }

  clickSaveGame() {
    this.stateService.save(GameState.from());
    GameState.logMessage('Игра успешно сохранена!');
  }

  clickLoadGame() {
    const loadState = this.stateService.load();
    if (!loadState.date) {
      GameState.logMessage('Не удалось загрузить. Отсутствует сохранение!');
      return;
    }

    // Обнуляем поле от персонажей, не удаляя при этом "ячейки" команд из модуля Team
    this.refreshTeams(true);

    const teamAI = this.getTeam(false);
    const teamP = this.getTeam();
    loadState.characters.forEach((loadChar) => {
      addCharacterOnTeam(loadChar.isPlayer ? teamP : teamAI,
        GameState.allClasses[loadChar.type], loadChar);
    });

    this.refreshTeams();
    this.updateBoard();

    GameState.init({
      controller: this,
      gamePlay: this.gamePlay,
      debug: true,
    }, loadState.gameinfo.number, loadState.gameinfo);
    GameState.gamePoints = loadState.points;

    this.gamePlay.drawUi(themes[loadState.gameinfo.map.name]);
    this.gamePlay.redrawPositions(this.allPosCharacters);
    GameState.logMessage(`Загружена игра от ${loadState.date}`);
  }
}
