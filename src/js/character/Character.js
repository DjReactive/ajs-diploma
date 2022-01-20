export default class Character {
  constructor(level, type = 'generic') {
    this.level = 1;
    this.attack = 1;
    this.defence = 0;
    this.health = 100;
    this.type = type;
    this.maxlevel = 4;

    // TODO: throw error if user use "new Character()"
    if (new.target.name === 'Character') { throw new Error("Don't create Character(), use Classes"); }
  }

  levelup(level = (this.level + 1)) {
    if (this.health === 0) { throw new Error('Ошибка. Мертвый игрок не может получить уровень'); }

    for (let i = this.level; i < level; i++) {
      if (this.level + 1 <= this.maxlevel) {
        this.level += 1;
        this.attack = Math.ceil(Math.max(this.attack, (this.attack * (80 + this.health)) / 100));
        this.defence = Math.ceil(Math.max(this.defence, (this.defence * (80 + this.health)) / 100));
        this.health = Math.min(this.health + 80, 100);
      }
    }
  }

  setSettings(health, attack, defence, step, radius, level = 1) {
    this.health = health;
    this.attack = attack;
    this.defence = defence;
    this.step = step;
    this.radius = radius;

    this.levelup(level);
  }

  damage(points, calculate = false) {
    const dmg = Math.max(points - this.defence, points * 0.1);
    const { health } = this;
    if (!calculate) this.health = Math.max(0, this.health - dmg);
    return (health - dmg) > 0 ? dmg : health;
  }

  attacking(enemy, points = this.attack) {
    return enemy.damage(points);
  }
}
