import Character from './Character';

export class Bowman extends Character {
  constructor(level, type = 'bowman') {
    super(level, type);
    super.setSettings(100, 25, 25, 2, 2, level);
  }
}
export class Swordsman extends Character {
  constructor(level, type = 'swordsman') {
    super(level, type);
    super.setSettings(100, 40, 10, 4, 1, level);
  }
}
export class Magician extends Character {
  constructor(level, type = 'magician') {
    super(level, type);
    super.setSettings(100, 10, 40, 1, 4, level);
  }
}
export class Undead extends Character {
  constructor(level, type = 'undead') {
    super(level, type);
    super.setSettings(100, 40, 10, 4, 1, level);
  }
}
export class Zombie extends Character {
  constructor(level, type = 'zombie') {
    super(level, type);
    super.setSettings(100, 25, 25, 2, 2, level);
  }
}
export class Daemon extends Character {
  constructor(level, type = 'daemon') {
    super(level, type);
    super.setSettings(100, 10, 40, 1, 4, level);
  }
}
