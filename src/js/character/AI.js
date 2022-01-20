import AppFunc from '../utils/functions';
import { getRandomIntInclusive } from '../utils/generators';

export default class CustomAI {
  constructor(gameObj, gameState) {
    this.ctrl = gameObj.controller;
    this.charTeams = gameObj.controller.charTeams;
    this.gamePlay = gameObj.gamePlay;
    this.state = gameObj.state;
    this.allCharacters = gameObj.controller.allPosCharacters;
    this.boardSize = gameObj.gamePlay.boardSize;
    this.gameState = gameState;

    this.aiTeam = this.getAiTeam();
    this.aiChars = [];
    this.boardLines = [];
  }

  /*
    Метод, который запускает процесс анализа для хода AI
  */
  think(callback) {
    this.getCharsInfo();
    const tactic = this.getTacticArray();

    const timeThink = getRandomIntInclusive(1200, 1500);

    // setTimeout(( function(tactic, gamePlay) {
    //   gamePlay.selectCell(tactic.ai.position);
    // }).bind(null, tactic, this.gamePlay), timeThink - 500);

    setTimeout(() => this.gamePlay.selectCell(tactic.ai.position), timeThink - 800);
    setTimeout(() => {
      if (tactic.action === 'attack') this.gamePlay.selectCell(tactic.target.position, 'red');
      else this.gamePlay.selectCell(tactic.position, 'green');
    }, timeThink - 400);

    setTimeout(() => {
      switch (tactic.action) {
        case 'attack':
          this.gamePlay.deselectCell(tactic.target.position);
          this.attack(tactic.ai, tactic.target, callback);
          break;
        default: // move
          this.gamePlay.deselectCell(tactic.position);
          this.move(tactic.ai, tactic.position, callback);
          break;
      }
    }, timeThink);
  }

  attack(ai, target, callback) {
    (async () => {
      const dmg = ai.character.attacking(target.character);
      await this.gamePlay.showDamage(target.position, dmg);
      this.gameState.actionMessage('attack', {
        attacker: ai,
        victim: target,
        damage: dmg,
      });
      this.refreshTeams();
      callback();
      this.gameState.next();
    })();
  }

  move(ai, position, callback) {
    ai.position = position;
    this.gameState.actionMessage('move', {
      character: ai,
      position,
    });
    this.refreshTeams();
    callback();
    this.gameState.next();
  }

  /*
  = = = = = = Другие косвенные команды и функции для AI
  */

  getTacticArray() {
    let action; let finalObj = {}; const victims = []; const
      tactics = [];
    /*
    Цикл осуществляет запись в массив tactics, который показывает
    доступность хода до каждого игрока
    */
    Array.from(this.allCharacters).forEach((charPos) => {
      if (charPos.isPlayer) {
        for (let aiChar, i = 0; i < this.aiChars.length; i++) {
          aiChar = this.aiChars[i].ai;
          const obj = {
            ai: aiChar,
            player: charPos,
            radius: AppFunc.getCellRadius(aiChar.position, charPos.position, this.boardLines),
          };
          obj.canAttack = obj.radius <= aiChar.character.radius;
          tactics.push(obj);
        }
      }
    });
    // Выбор всех AI, кто имеет доступ для атаки
    for (let i = 0; i < tactics.length; i++) {
      if (tactics[i].canAttack) {
        action = 'attack';
        const obj = {
          player: tactics[i].player,
          health: tactics[i].player.character.health,
          ai: tactics[i].ai,
        };
        victims.push(obj);
      }
    }
    // Если нет доступности для атаки, то выбираем персонажа для передвижения в сторону игрока
    // В приоритете персонажи с большим шагом
    if (!action) {
      for (let i = 0; i < tactics.length; i++) {
        if (!finalObj.ai || (tactics[i].radius <= finalObj.radius)) {
          action = 'move';
          finalObj.player = tactics[i].player;
          finalObj.radius = tactics[i].radius;
          finalObj.ai = tactics[i].ai;
        }
      }

      Array.from(this.aiChars).forEach((char) => {
        if (char.ai === finalObj.ai) {
          let position; let
            radius = this.boardSize;
          const arrIndexes = [];
          for (let i = 0; i < char.allowsteps.length; i++) {
            position = char.allowsteps[i];
            radius = AppFunc.getCellRadius(finalObj.player.position, position, this.boardLines);
            if ((radius < finalObj.radius && position !== finalObj.player.position
            && finalObj.radius !== finalObj.ai.character.radius)) {
              finalObj.position = position;
              finalObj.radius = radius;
            }
            if (radius === finalObj.ai.character.radius) arrIndexes.push(position);
          }
          if (arrIndexes.length > 0) {
            finalObj.position = arrIndexes[getRandomIntInclusive(0, arrIndexes.length - 1)];
          }
        }
      });
    } else {
      // Выбор персонажа AI, который может нанести больше урона
      for (let dmg, i = 0; i < victims.length; i++) {
        dmg = victims[i].ai.character.damage(victims[i].player.character.attack, true);
        if (!finalObj.ai || dmg >= finalObj.damage || (finalObj.health <= dmg)) {
          finalObj = victims[i];
          finalObj.damage = dmg;
        }
      }
    }

    switch (action) {
      case 'attack':
        return {
          action: 'attack',
          ai: finalObj.ai,
          target: finalObj.player,
        };
      default:
        return {
          action: 'move',
          ai: finalObj.ai,
          position: finalObj.position,
        };
    }
  }

  // Метод выдает информацию для всех AI, доступные клетки для хода
  getCharsInfo() {
    this.aiChars = [];
    const appFncStep = AppFunc.setAllowedCharacterStep.bind(AppFunc);
    for (const char of this.aiTeam.characters) {
      const obj = {};
      const args = [char.character, char.position, this.boardSize, this.allCharacters];
      obj.ai = char;
      [obj.allowsteps, this.boardLines] = appFncStep(...args);
      this.aiChars.push(obj);
    }
  }

  // Метод возвращает команду, принадлежащую AI
  getAiTeam() {
    const teamsArr = this.ctrl.charTeams;
    for (let i = 0; i < teamsArr.length; i++) {
      if (!this.gameState.isPlayerTeam(teamsArr[i])) {
        return teamsArr[i];
      }
    }
    return null;
  }

  refreshTeams() {
    this.allCharacters = [];
    for (let i = 0; i < this.charTeams.length; i++) {
      for (const char of this.charTeams[i].characters) {
        if (char.character.health > 0) this.allCharacters.push(char);
        else this.charTeams[i].characters.delete(char);
      }
    }
  }
}
