/**
 * Entry point of app: don't change this
 */
import GamePlay from './game/GamePlay';
import GameController from './game/GameController';
import GameStateService from './game/GameStateService';

const gamePlay = new GamePlay();
gamePlay.bindToDOM(document.querySelector('#game-container'));

const stateService = new GameStateService(localStorage);

const gameCtrl = new GameController(gamePlay, stateService);
gameCtrl.init();

// don't write your code here
