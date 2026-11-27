"use client";

import { useMemo } from "react";

function PieceIcon({ symbol, isGhost = false }) {
  if (symbol === "X") {
    return (
      <svg
        viewBox="0 0 24 24"
        className={`w-[68%] h-[68%] block shrink-0 ${
          isGhost ? "opacity-25 text-red-600" : "text-red-600 animate-pop-in"
        }`}
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      >
        <line x1="5.5" y1="5.5" x2="18.5" y2="18.5" />
        <line x1="18.5" y1="5.5" x2="5.5" y2="18.5" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      className={`w-[66%] h-[66%] block shrink-0 ${
        isGhost ? "opacity-25 text-blue-600" : "text-blue-600 animate-pop-in"
      }`}
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
    >
      <circle cx="12" cy="12" r="7" />
    </svg>
  );
}

function getStarPoints(boardSize) {
  if (boardSize === 15) {
    const pts = [3, 7, 11];
    const set = new Set();
    for (const r of pts) {
      for (const c of pts) {
        if ((r === 7 && c === 7) || (r !== 7 && c !== 7)) {
          set.add(r * boardSize + c);
        }
      }
    }
    return set;
  }
  if (boardSize === 19) {
    const pts = [3, 9, 15];
    const set = new Set();
    for (const r of pts) {
      for (const c of pts) {
        set.add(r * boardSize + c);
      }
    }
    return set;
  }
  return new Set();
}

export default function Board({
  board,
  boardSize = 15,
  lastMove,
  winningLine = [],
  canPlay = false,
  currentTurn = "X",
  onCellClick,
}) {
  const winSet = useMemo(() => new Set(winningLine || []), [winningLine]);
  const starPoints = useMemo(() => getStarPoints(boardSize), [boardSize]);

  return (
    <div className="w-full max-w-[min(94vw,540px)] mx-auto bg-white p-1.5 sm:p-2.5 rounded-xl border border-stone-300 shadow-sm">
      <div
        className="grid w-full aspect-square bg-stone-300 gap-[1px] border border-stone-400 select-none overflow-hidden"
        style={{
          gridTemplateColumns: `repeat(${boardSize}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${boardSize}, minmax(0, 1fr))`,
        }}
      >
        {board.map((cell, idx) => {
          const isLast = lastMove === idx;
          const isWin = winSet.has(idx);
          const isEmpty = cell === "";
          const isStar = starPoints.has(idx);

          return (
            <button
              key={idx}
              type="button"
              disabled={!canPlay || !isEmpty}
              onClick={() => canPlay && isEmpty && onCellClick(idx)}
              aria-label={`Ô ${Math.floor(idx / boardSize) + 1}-${(idx % boardSize) + 1}${cell ? ` (${cell})` : ""}`}
              className={`group relative w-full h-full min-w-0 min-h-0 flex items-center justify-center p-0 overflow-hidden focus:outline-none ${
                isWin
                  ? "bg-emerald-100"
                  : isLast
                  ? "bg-amber-100"
                  : "bg-[#fdfcf8]"
              } ${canPlay && isEmpty ? "cursor-pointer sm:hover:bg-stone-100 active:bg-stone-200" : "cursor-default"}`}
            >
              {isEmpty && isStar && (
                <span className="w-1.5 h-1.5 rounded-full bg-stone-400 pointer-events-none" />
              )}

              {!isEmpty && <PieceIcon symbol={cell} />}

              {isEmpty && canPlay && (
                <span className="hidden sm:group-hover:flex items-center justify-center w-full h-full pointer-events-none">
                  <PieceIcon symbol={currentTurn} isGhost />
                </span>
              )}

              {isLast && !isWin && (
                <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-amber-500 pointer-events-none" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
