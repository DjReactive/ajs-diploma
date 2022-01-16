export function calcTileType(index, boardSize) {
  const boardSquare = boardSize * boardSize;
  // TODO: write logic here
  switch (index) {
    case 0: return 'top-left';
    case (boardSize - 1): return 'top-right';
    case (boardSquare - boardSize): return 'bottom-left';
    case (boardSquare - 1): return 'bottom-right';
    default:
      if (index < boardSize) return 'top';
      if (index > (boardSquare - boardSize)) return 'bottom';
      if (index % boardSize === 0) return 'left';
      if ((index + 1) % boardSize === 0) return 'right';
      break;
  }
  return 'center';
}

export function calcHealthLevel(health) {
  if (health < 15) {
    return 'critical';
  }

  if (health < 50) {
    return 'normal';
  }

  return 'high';
}
