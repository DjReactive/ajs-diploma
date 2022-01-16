import GameState from './GameState';

export default class GameScenarios {
  static game = GameState.game;

  static get(level = this.game.map.level) {
    let obj;
    switch (level) {
      case 1:
        obj = {
          players: {
            count: 2,
            maxlevel: 1,
          },
          ai: {
            playercount: false,
            count: 2,
            maxlevel: 1,
          }
        }
        break;
      case 2:
        obj = {
          players: {
            count: 1,
            maxlevel: 1,
          },
          ai: {
            playercount: true,
            maxlevel: 2,
          }
        }
        break;
      case 3:
        obj = {
          players: {
            count: 2,
            maxlevel: 2,
          },
          ai: {
            playercount: true,
            maxlevel: 3,
          }
        }
        break;
      case 4:
        obj = {
          players: {
            count: 2,
            maxlevel: 3,
          },
          ai: {
            playercount: true,
            maxlevel: 4,
          }
        }
        break;
      default:
        break;
    }
    return obj;
  }
}
