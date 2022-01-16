export default class Team {
  constructor(isPlayer = true) {
    this.characters = new Set();
    this.isPlayer = isPlayer;
  }

  add(character) {
    if (this.characters.has(character)) { throw new Error('Такой персонаж уже имеется в команде'); }

    this.characters.add(character);
  }

  addAll(...objs) {
    objs.forEach((obj) => this.characters.add(obj));
  }

  toArray() {
    return [...this.characters];
  }
}
