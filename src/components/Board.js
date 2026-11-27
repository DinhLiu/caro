"use client";

import { useMemo } from "react";

function PieceIcon({ symbol, isGhost = false, isWinning = false }) {
  if (symbol === "X") {
    return (
      <svg
        viewBox="0 0 24 24"
        className={`w-[68%] h-[68%] ${
          isGhost
            ? "opacity-30 text-rose-400"
            : isWinning
            ? "text-rose-400 drop-shadow-[0_0_8px_rgba(251,113,133,0.8)] animate-win-pulse"
            : "text-rose-500 drop-shadow-[0_1px_3px_rgba(244,63,94,0.4)] animate-pop-in"
        }`}
        fill="none"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
      >
        <line x1="5" y1="5" x2="19" y2="19" />
        <line x1="19" y1="5" x2="5" y2="19" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      className={`w-[66%] h-[66%] ${
        isGhost
          ? "opacity-30 text-sky-400"
          : isWinning
          ? "text-sky-300 drop-shadow-[0_0_8px_rgba(56,189,248,0.85)] animate-win-pulse"
          : "text-sky-400 drop-shadow-[0_1px_3px_rgba(56,189,248,0.4)] animate-pop-in"
      }`}
      fill="none"
      stroke="currentColor"
      strokeWidth="3.2"
    >
      <circle cx="12" cy="12" r="7.5" />
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
    <div className="relative p-2 sm:p-3 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] backdrop-blur-sm">
      <div
        className="grid bg-slate-700/70 gap-[1px] rounded-xl overflow-hidden border border-slate-700/80 select-none"
        style={{
          gridTemplateColumns: `repeat(${boardSize}, minmax(0, 1fr))`,
          width: "min(92vw, 560px)",
          height: "min(92vw, 560px)",
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
              className={`group relative flex items-center justify-center transition-colors duration-100 focus:outline-none ${
                isWin
                  ? "bg-emerald-500/25 ring-1 ring-inset ring-emerald-400/60"
                  : isLast
                  ? "bg-amber-500/15"
                  : "bg-slate-900/95"
              } ${canPlay && isEmpty ? "cursor-pointer hover:bg-slate-800/90" : "cursor-default"}`}
            >
              {/* Star point dot */}
              {isEmpty && isStar && (
                <span className="absolute w-1.5 h-1.5 rounded-full bg-slate-600/80 pointer-events-none group-hover:opacity-0 transition-opacity" />
              )}

              {/* Placed piece */}
              {!isEmpty && <PieceIcon symbol={cell} isWinning={isWin} />}

              {/* Hover ghost preview */}
              {isEmpty && canPlay && (
                <span className="hidden group-hover:flex items-center justify-center w-full h-full pointer-events-none">
                  <PieceIcon symbol={currentTurn} isGhost />
                </span>
              )}

              {/* Last move subtle corner indicator */}
              {isLast && !isWin && (
                <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.9)] pointer-events-none" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
