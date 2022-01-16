export default class AppFunc {
  static boardSize = 0;
  /*
    Проверка персонажа в ячейке
  */
  static checkCellCharacter(index, charsArray) {
    let character = null;
    charsArray.forEach((char) => {
      if (char.position === index) character = char;
    });
    return character;
  }

  /*
  Метод создает массив из ячеек, куда может сходить персонаж игрока
  с учетом его особенностей
  @character - персонаж, для которого производится вычисление
  @index - ячейка, в которой находится персонаж
  @brdSize - размер поля (Number)
  @current.array - массив из значений одной линии поля, в которой находится игрок
  @current.number - ячейка в этом массиве
  */
  static setAllowedCharacterStep(character, index, brdSize, charsArray) {
    let lines = [], stepsArr = [], current = { array: [], number: -1 };
    let arrIndex = -1;

    for (let line = [], next = 0, i = 0; i <= (brdSize * brdSize); i++) {
      if (Math.floor(i / brdSize) === next) {
        line.push(i);
      } else {
        if (current.number === next) current.array = line;
        lines.push(line);
        line = [i];
        next++;
      }
      if (index === i) current.number = next;
    }
    arrIndex = current.array.indexOf(index);
    //Движение
    let step, n;
    // в правую сторону
    for (step = character.step, n = arrIndex + 1; n < current.array.length; n++) {
      if (step > 0) {
        if (this.checkCellCharacter(current.array[n], charsArray)) step = 0;
        else { stepsArr.push(current.array[n]);  step--; }
    }}
    //в левую сторону
    for (step = character.step, n = arrIndex - 1; n >= 0; n--) {
      if (step > 0) {
        if (this.checkCellCharacter(current.array[n], charsArray)) step = 0;
        else { stepsArr.push(current.array[n]);  step--; }
    }}
    // вниз
    for (step = character.step, n = current.number + 1; n < lines.length; n++) {
      if (step > 0) {
        if (this.checkCellCharacter(lines[n][arrIndex], charsArray)) step = 0;
        else { stepsArr.push(lines[n][arrIndex]);  step--; }
    }}
    // вверх
    for (step = character.step, n = current.number - 1; n >= 0; n--) {
      if (step > 0) {
        if (this.checkCellCharacter(lines[n][arrIndex], charsArray)) step = 0;
        else { stepsArr.push(lines[n][arrIndex]);  step--; }
    }}
    // верхние диагонали
    let stepA = character.step, stepB = stepA;
    let left = arrIndex, right = arrIndex;
    for (n = current.number - 1; n >= 0; n--) {
      if (stepA > 0 && left > 0) {
        left--;  stepsArr.push(lines[n][left]);  stepA--;
      }
      if (stepB > 0 && right < (current.array.length - 1)) {
        right++;  stepsArr.push(lines[n][right]);  stepB--;
      }
    }
    // нижние диагонали
    stepA = character.step, stepB = stepA;
    left = arrIndex, right = arrIndex;
    for (n = current.number + 1; n < lines.length; n++) {
      if (stepA > 0 && left > 0) {
        left--;  stepsArr.push(lines[n][left]);  stepA--;
      }
      if (stepB > 0 && right < (current.array.length - 1)) {
        right++;  stepsArr.push(lines[n][right]);  stepB--;
      }
    }
    return [stepsArr, lines];
  }

  static checkAllowedCharacterStep(index, stepsArray) {
    return stepsArray.indexOf(index) > -1 ? true : false;
  }

  /*
    Метод проверяет, может ли игрок атаковать персонажа в клетке index
  */
  static checkAllowedCharacterAttack(enemyIndex, attackIndex, attacker, brdLines) {
    const radius = attacker.radius;
    let enemy = { x: -1, y: -1 };
    let player = { x: -1, y: -1 };
    for (let i = 0; i < brdLines.length; i++) {
      player.x = brdLines[i].indexOf(attackIndex);
      if (player.x > -1) {
        player.y = i;
        break;
      }
    }
    for (let i = 0; i < brdLines.length; i++) {
      enemy.x = brdLines[i].indexOf(enemyIndex);
      if (enemy.x > -1) {
        enemy.y = i;
        break;
      }
    }
    if (Math.abs(enemy.x - player.x) <= radius && Math.abs(enemy.y - player.y) <= radius)
      return true;

    return false;
  }

  // Возвращает дистанцию/радиус от одной клетки до другой
  static getCellRadius(idx1, idx2, boardLines) {
    let hor1, vert1, hor2, vert2;
    for (let v = 0; v < boardLines.length; v++) {
      for (let h = 0; h < boardLines[v].length; h++) {
        if (boardLines[v][h] === idx1) {
          hor1 = h;   vert1 = v;
        }
        if (boardLines[v][h] === idx2) {
          hor2 = h;   vert2 = v;
        }
      }
    }
    return Math.max(Math.abs(hor1 - hor2), Math.abs(vert1 - vert2));
  }

  /*
    получает массив индексов определенного столбца квадратного поля
    @boardSize - размер квадратного поля: size x size
    @columnsArr - массив номеров столбцов, чьи индексы необходимо получить (начиная с 0)
  */
  static getIndexArrayColumn(boardSize, columnsArr) {
    let arr = [];
    for (let c = 0; c < columnsArr.length; c++) {
      for (let i = 0; i < (boardSize * boardSize); i++) {
        if ((i - columnsArr[c]) % boardSize === 0) arr.push(i);
      }
    }
    return arr;
  }

  /*
    Получает массив ячеек, куда можно расположить персонажа для игрока или AI
    @brdSize - размер поля
    @isPlayer - true - массив будет для игрока, иначе для AI
  */
  static getCellsArray(brdSize, isPlayer = true) {
    return AppFunc.getIndexArrayColumn(brdSize, isPlayer ? [0,1] : [(brdSize-2),(brdSize-1)]);
  }
  /*
    Снимает выделение со всех ячеек, кроме @index, если был передан
  */
  static deselectAll(gamePlay, index = -1) {
    const brdSize = gamePlay.boardSize;
    for (let i = 0; i < (brdSize * brdSize); i++) {
      if (index !== i) gamePlay.deselectCell(i);
    }
  }
}
