export const DIRECTIONS = [
  [0, 1],  // Ngang
  [1, 0],  // Dọc
  [1, 1],  // Chéo chính
  [1, -1], // Chéo phụ
];

/**
 * Kiểm tra thắng thua tại nước đi cuối cùng.
 * @param {string[]} board
 * @param {number} index
 * @param {"X" | "O"} symbol
 * @param {number} boardSize
 * @param {"freestyle" | "caro_vn"} ruleMode
 * @returns {{ winner: "X" | "O", line: number[] } | null}
 */
export function checkWin(board, index, symbol, boardSize = 15, ruleMode = "freestyle") {
  if (index === null || index === undefined || index < 0) return null;
  const row = Math.floor(index / boardSize);
  const col = index % boardSize;
  const opponent = symbol === "X" ? "O" : "X";

  for (const [dr, dc] of DIRECTIONS) {
    const line = [index];

    // Duyệt tiến
    let stepForward = 1;
    while (true) {
      const r = row + dr * stepForward;
      const c = col + dc * stepForward;
      if (r < 0 || r >= boardSize || c < 0 || c >= boardSize) break;
      if (board[r * boardSize + c] === symbol) {
        line.push(r * boardSize + c);
        stepForward++;
      } else {
        break;
      }
    }

    // Duyệt lùi
    let stepBackward = 1;
    while (true) {
      const r = row - dr * stepBackward;
      const c = col - dc * stepBackward;
      if (r < 0 || r >= boardSize || c < 0 || c >= boardSize) break;
      if (board[r * boardSize + c] === symbol) {
        line.unshift(r * boardSize + c);
        stepBackward++;
      } else {
        break;
      }
    }

    if (line.length >= 5) {
      if (ruleMode === "caro_vn") {
        // Luật Caro VN: nếu bị chặn cả 2 đầu bởi quân đối thủ thì chưa thắng
        const fR = row + dr * stepForward;
        const fC = col + dc * stepForward;
        const bR = row - dr * stepBackward;
        const bC = col - dc * stepBackward;

        const blockedForward =
          fR >= 0 && fR < boardSize && fC >= 0 && fC < boardSize && board[fR * boardSize + fC] === opponent;
        const blockedBackward =
          bR >= 0 && bR < boardSize && bC >= 0 && bC < boardSize && board[bR * boardSize + bC] === opponent;

        if (blockedForward && blockedBackward) {
          continue;
        }
      }
      return { winner: symbol, line };
    }
  }

  return null;
}

export function isBoardFull(board) {
  return board.every((cell) => cell !== "");
}

/**
 * Đánh giá điểm thế cờ tại một ô trống cho AI.
 */
function evaluateCell(board, index, symbol, boardSize, ruleMode) {
  const row = Math.floor(index / boardSize);
  const col = index % boardSize;
  const opponent = symbol === "X" ? "O" : "X";
  let totalScore = 0;

  for (const [dr, dc] of DIRECTIONS) {
    let count = 1;
    let openEnds = 0;

    // Tiến
    let step = 1;
    while (true) {
      const r = row + dr * step;
      const c = col + dc * step;
      if (r < 0 || r >= boardSize || c < 0 || c >= boardSize) break;
      const val = board[r * boardSize + c];
      if (val === symbol) {
        count++;
        step++;
      } else {
        if (val === "") openEnds++;
        break;
      }
    }

    // Lùi
    step = 1;
    while (true) {
      const r = row - dr * step;
      const c = col - dc * step;
      if (r < 0 || r >= boardSize || c < 0 || c >= boardSize) break;
      const val = board[r * boardSize + c];
      if (val === symbol) {
        count++;
        step++;
      } else {
        if (val === "") openEnds++;
        break;
      }
    }

    if (count >= 5) {
      if (ruleMode === "caro_vn" && openEnds === 0) {
        // Kiểm tra xem có bị chặn 2 đầu bởi đối thủ không (hay biên bàn cờ)
        totalScore += 500;
      } else {
        totalScore += 100000;
      }
    } else if (count === 4) {
      if (openEnds === 2) totalScore += 15000;
      else if (openEnds === 1) totalScore += 2500;
    } else if (count === 3) {
      if (openEnds === 2) totalScore += 1800;
      else if (openEnds === 1) totalScore += 250;
    } else if (count === 2) {
      if (openEnds === 2) totalScore += 180;
      else if (openEnds === 1) totalScore += 30;
    } else {
      if (openEnds === 2) totalScore += 15;
    }
  }

  return totalScore;
}

/**
 * Tìm nước đi tốt nhất cho AI.
 * @param {string[]} board
 * @param {"X" | "O"} aiSymbol
 * @param {number} boardSize
 * @param {"easy" | "medium" | "hard"} difficulty
 * @param {"freestyle" | "caro_vn"} ruleMode
 * @returns {number}
 */
export function getBestAIMove(board, aiSymbol, boardSize = 15, difficulty = "medium", ruleMode = "freestyle") {
  const humanSymbol = aiSymbol === "X" ? "O" : "X";
  const hasAnyPiece = board.some((c) => c !== "");
  const center = Math.floor(boardSize / 2);

  if (!hasAnyPiece) {
    return center * boardSize + center;
  }

  // Thu thập các ô trống lân cận trong bán kính 2 ô
  const candidates = new Set();
  for (let i = 0; i < board.length; i++) {
    if (board[i] !== "") {
      const r = Math.floor(i / boardSize);
      const c = i % boardSize;
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < boardSize && nc >= 0 && nc < boardSize) {
            const nIdx = nr * boardSize + nc;
            if (board[nIdx] === "") candidates.add(nIdx);
          }
        }
      }
    }
  }

  const candidateList = Array.from(candidates);
  if (candidateList.length === 0) {
    return board.findIndex((c) => c === "");
  }

  const scoredMoves = candidateList.map((idx) => {
    const attackScore = evaluateCell(board, idx, aiSymbol, boardSize, ruleMode);
    const defenseScore = evaluateCell(board, idx, humanSymbol, boardSize, ruleMode);

    // Ưu tiên nhẹ vị trí gần tâm
    const r = Math.floor(idx / boardSize);
    const c = idx % boardSize;
    const distFromCenter = Math.abs(r - center) + Math.abs(c - center);
    const centerBonus = Math.max(0, 10 - distFromCenter);

    let score = 0;
    if (difficulty === "hard") {
      // Thắng ngay ưu tiên tuyệt đối, sau đó chặn thắng ngay, sau đó cân bằng công thủ
      if (attackScore >= 100000) score = 1000000;
      else if (defenseScore >= 100000) score = 500000;
      else score = attackScore * 1.15 + defenseScore * 1.05 + centerBonus;
    } else if (difficulty === "medium") {
      if (attackScore >= 100000) score = 1000000;
      else if (defenseScore >= 100000) score = 400000;
      else score = attackScore + defenseScore * 0.9 + centerBonus;
    } else {
      // Easy: vẫn chặn thắng trực tiếp thỉnh thoảng, nhưng có độ ngẫu nhiên cao
      score = attackScore * 0.6 + defenseScore * 0.5 + Math.random() * 400;
    }

    return { idx, score };
  });

  scoredMoves.sort((a, b) => b.score - a.score);

  if (difficulty === "easy") {
    const topPool = scoredMoves.slice(0, Math.min(5, scoredMoves.length));
    return topPool[Math.floor(Math.random() * topPool.length)].idx;
  }

  if (difficulty === "medium") {
    const bestScore = scoredMoves[0].score;
    const nearBest = scoredMoves.filter((m) => m.score >= bestScore * 0.92);
    return nearBest[Math.floor(Math.random() * nearBest.length)].idx;
  }

  return scoredMoves[0].idx;
}
