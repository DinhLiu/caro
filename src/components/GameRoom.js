"use client";

import { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  Copy,
  Check,
  Volume2,
  VolumeX,
  RotateCcw,
  Undo2,
  Flag,
  Send,
  Trophy,
  Clock,
  Eye,
  Link as LinkIcon,
} from "lucide-react";
import Board from "./Board";
import { checkWin, isBoardFull, getBestAIMove } from "../lib/gameLogic";
import { subscribeToRoom, updateRoomState, sendRoomChat } from "../lib/firebase";
import { playMoveSound, playWinSound, playDrawSound } from "../lib/sound";

const QUICK_CHATS = ["Chào bạn! 👋", "Nước hay! 👏", "Chờ xíu nhé ⏳", "Ván nữa nhé! 🔥"];

export default function GameRoom({ session, onLeave }) {
  const isOnline = session.mode === "online";
  const isAI = session.mode === "ai";

  // Shared state
  const [boardSize, setBoardSize] = useState(session.boardSize || 15);
  const [ruleMode, setRuleMode] = useState(session.ruleMode || "freestyle");
  const [board, setBoard] = useState(() => Array((session.boardSize || 15) * (session.boardSize || 15)).fill(""));
  const [turn, setTurn] = useState("X");
  const [winner, setWinner] = useState(null); // "X" | "O" | "DRAW" | null
  const [winningLine, setWinningLine] = useState([]);
  const [lastMove, setLastMove] = useState(null);
  const [moveHistory, setMoveHistory] = useState([]);
  const [scores, setScores] = useState({ X: 0, O: 0, draws: 0 });
  const [players, setPlayers] = useState(() => {
    if (isAI) {
      return {
        X: session.humanSymbol === "X" ? "Bạn" : `AI (${session.aiDifficulty})`,
        O: session.humanSymbol === "O" ? "Bạn" : `AI (${session.aiDifficulty})`,
      };
    }
    if (session.mode === "local") {
      return { X: "Người chơi X", O: "Người chơi O" };
    }
    return { X: session.playerName || "Người chơi X", O: null };
  });

  // UI state
  const [muted, setMuted] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const prevWinnerRef = useRef(null);
  const prevMoveCountRef = useRef(0);
  const chatEndRef = useRef(null);

  // Lắng nghe Firebase khi chơi Online
  useEffect(() => {
    if (!isOnline || !session.roomId) return;

    const unsubscribe = subscribeToRoom(session.roomId, (data) => {
      if (!data) return;
      const size = data.boardSize || 15;
      setBoardSize(size);
      setRuleMode(data.ruleMode || "freestyle");
      setBoard(data.board || Array(size * size).fill(""));
      setTurn(data.turn || "X");
      setWinner(data.winner || null);
      setWinningLine(data.winningLine || []);
      setLastMove(data.lastMove ?? null);
      setPlayers(data.players || { X: "Người chơi X", O: null });
      setScores(data.scores || { X: 0, O: 0, draws: 0 });

      if (data.chat) {
        const list = Object.entries(data.chat).map(([id, msg]) => ({ id, ...msg }));
        list.sort((a, b) => a.ts - b.ts);
        setChatMessages(list);
      } else {
        setChatMessages([]);
      }

      // Âm thanh khi đối thủ đánh hoặc kết thúc ván
      const moveCount = data.moveCount || 0;
      if (moveCount > prevMoveCountRef.current && !data.winner) {
        playMoveSound(data.turn === "X" ? "O" : "X", muted);
      }
      prevMoveCountRef.current = moveCount;

      if (data.winner && data.winner !== prevWinnerRef.current) {
        if (data.winner === "DRAW") playDrawSound(muted);
        else playWinSound(muted);
      }
      prevWinnerRef.current = data.winner || null;
    });

    return () => unsubscribe();
  }, [isOnline, session.roomId, muted]);

  // Cuộn chat xuống cuối
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Lượt của AI
  useEffect(() => {
    if (!isAI || winner) return;
    const aiSymbol = session.humanSymbol === "X" ? "O" : "X";
    if (turn !== aiSymbol) return;

    const timer = setTimeout(() => {
      const aiIdx = getBestAIMove(board, aiSymbol, boardSize, session.aiDifficulty, ruleMode);
      if (aiIdx === -1 || board[aiIdx] !== "") return;
      applyLocalMove(aiIdx, aiSymbol);
    }, 320);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAI, turn, winner, board]);

  const applyLocalMove = (index, symbol) => {
    const newBoard = [...board];
    newBoard[index] = symbol;
    const winResult = checkWin(newBoard, index, symbol, boardSize, ruleMode);
    const isDraw = !winResult && isBoardFull(newBoard);

    setBoard(newBoard);
    setLastMove(index);
    setMoveHistory((prev) => [...prev, index]);

    if (winResult) {
      setWinner(winResult.winner);
      setWinningLine(winResult.line);
      setScores((prev) => ({ ...prev, [winResult.winner]: prev[winResult.winner] + 1 }));
      playWinSound(muted);
    } else if (isDraw) {
      setWinner("DRAW");
      setWinningLine([]);
      setScores((prev) => ({ ...prev, draws: prev.draws + 1 }));
      playDrawSound(muted);
    } else {
      setTurn(symbol === "X" ? "O" : "X");
      playMoveSound(symbol, muted);
    }
  };

  const handleCellClick = async (index) => {
    if (winner || board[index] !== "") return;

    if (isOnline) {
      if (session.role === "SPECTATOR" || turn !== session.role) return;
      const mySymbol = session.role;
      const newBoard = [...board];
      newBoard[index] = mySymbol;

      const winResult = checkWin(newBoard, index, mySymbol, boardSize, ruleMode);
      const isDraw = !winResult && isBoardFull(newBoard);

      const nextScores = { ...scores };
      let nextWinner = null;
      let nextWinLine = null;

      if (winResult) {
        nextWinner = winResult.winner;
        nextWinLine = winResult.line;
        nextScores[winResult.winner] = (nextScores[winResult.winner] || 0) + 1;
      } else if (isDraw) {
        nextWinner = "DRAW";
        nextScores.draws = (nextScores.draws || 0) + 1;
      }

      await updateRoomState(session.roomId, {
        board: newBoard,
        turn: mySymbol === "X" ? "O" : "X",
        winner: nextWinner,
        winningLine: nextWinLine,
        lastMove: index,
        moveCount: (prevMoveCountRef.current || 0) + 1,
        scores: nextScores,
      });
      return;
    }

    if (isAI && turn !== session.humanSymbol) return;
    applyLocalMove(index, turn);
  };

  const handleUndo = () => {
    if (isOnline || winner || moveHistory.length === 0) return;

    const stepsToUndo = isAI ? Math.min(2, moveHistory.length) : 1;
    // Nếu AI đi trước và mới có 1 nước thì không undo
    if (isAI && moveHistory.length === 1 && session.humanSymbol === "O") return;

    const nextHistory = moveHistory.slice(0, moveHistory.length - stepsToUndo);
    const nextBoard = [...board];
    for (let i = moveHistory.length - stepsToUndo; i < moveHistory.length; i++) {
      nextBoard[moveHistory[i]] = "";
    }

    setBoard(nextBoard);
    setMoveHistory(nextHistory);
    setLastMove(nextHistory.length > 0 ? nextHistory[nextHistory.length - 1] : null);
    if (!isAI) {
      setTurn((prev) => (prev === "X" ? "O" : "X"));
    } else {
      setTurn(session.humanSymbol);
    }
  };

  const handleSurrender = async () => {
    if (winner) return;
    const loser = isOnline ? session.role : isAI ? session.humanSymbol : turn;
    if (loser === "SPECTATOR") return;
    const victor = loser === "X" ? "O" : "X";

    if (isOnline) {
      const nextScores = { ...scores, [victor]: (scores[victor] || 0) + 1 };
      await updateRoomState(session.roomId, {
        winner: victor,
        winningLine: null,
        scores: nextScores,
      });
    } else {
      setWinner(victor);
      setScores((prev) => ({ ...prev, [victor]: prev[victor] + 1 }));
      playWinSound(muted);
    }
  };

  const handleRematch = async () => {
    const emptyBoard = Array(boardSize * boardSize).fill("");
    if (isOnline) {
      await updateRoomState(session.roomId, {
        board: emptyBoard,
        turn: "X",
        winner: null,
        winningLine: null,
        lastMove: null,
        moveCount: 0,
      });
    } else {
      setBoard(emptyBoard);
      setTurn("X");
      setWinner(null);
      setWinningLine([]);
      setLastMove(null);
      setMoveHistory([]);
    }
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(session.roomId);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 1800);
  };

  const copyInviteLink = () => {
    const url = `${window.location.origin}?room=${session.roomId}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 1800);
  };

  const handleSendChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !isOnline) return;
    const text = chatInput;
    setChatInput("");
    await sendRoomChat(session.roomId, session.playerName || "Khách", session.role, text);
  };

  const canPlay =
    !winner &&
    (isOnline
      ? session.role !== "SPECTATOR" && turn === session.role && Boolean(players.O)
      : isAI
      ? turn === session.humanSymbol
      : true);

  // Status banner text
  let statusBadge = null;
  if (winner === "DRAW") {
    statusBadge = (
      <div className="flex items-center gap-2 text-amber-300 font-bold">
        <Trophy className="w-5 h-5" />
        Hòa nhau! Bàn cờ đã kín.
      </div>
    );
  } else if (winner) {
    const winnerName = players[winner] || `Người chơi ${winner}`;
    statusBadge = (
      <div className="flex items-center gap-2 text-emerald-400 font-bold">
        <Trophy className="w-5 h-5" />
        {winnerName} ({winner}) chiến thắng!
      </div>
    );
  } else if (isOnline && !players.O) {
    statusBadge = (
      <div className="flex items-center gap-2 text-amber-300 font-medium">
        <Clock className="w-4 h-4 animate-spin" />
        Đang chờ đối thủ vào phòng ({session.roomId})...
      </div>
    );
  } else if (isOnline && session.role === "SPECTATOR") {
    statusBadge = (
      <div className="flex items-center gap-2 text-slate-300 font-medium">
        <Eye className="w-4 h-4 text-sky-400" />
        Chế độ khán giả • Lượt của {turn}
      </div>
    );
  } else if (canPlay) {
    statusBadge = (
      <div className="flex items-center gap-2 text-white font-semibold">
        <span className={`w-2.5 h-2.5 rounded-full animate-pulse ${turn === "X" ? "bg-rose-500" : "bg-sky-400"}`} />
        Đến lượt {isOnline || isAI ? "của bạn" : `người chơi ${turn}`} ({turn})
      </div>
    );
  } else {
    statusBadge = (
      <div className="flex items-center gap-2 text-slate-400 font-medium">
        <Clock className="w-4 h-4 animate-pulse" />
        {isAI ? "AI đang suy nghĩ..." : `Đang chờ đối thủ (${turn})...`}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
      {/* Top Bar */}
      <header className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onLeave}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs sm:text-sm font-medium transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Rời phòng
          </button>

          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/70 border border-slate-800 text-xs text-slate-400">
            <span>{boardSize}×{boardSize}</span>
            <span>•</span>
            <span>{ruleMode === "caro_vn" ? "Luật Caro VN" : "Luật Tự Do"}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isOnline && (
            <>
              <button
                type="button"
                onClick={copyRoomCode}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 text-xs sm:text-sm font-mono font-bold text-amber-300 transition"
                title="Sao chép mã phòng"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {session.roomId}
              </button>
              <button
                type="button"
                onClick={copyInviteLink}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sky-500/15 border border-sky-500/30 hover:bg-sky-500/25 text-sky-300 text-xs sm:text-sm font-medium transition"
                title="Sao chép link mời"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <LinkIcon className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{copiedLink ? "Đã chép link!" : "Mời bạn"}</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => setMuted((m) => !m)}
            aria-label={muted ? "Bật âm thanh" : "Tắt âm thanh"}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 transition"
          >
            {muted ? <VolumeX className="w-4 h-4 text-slate-500" /> : <Volume2 className="w-4 h-4 text-sky-400" />}
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">
        {/* Left/Center: Status + Board */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-full max-w-[560px] flex items-center justify-between px-4 py-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-sm sm:text-base shadow-lg">
            {statusBadge}
            {winner && (
              <button
                type="button"
                onClick={handleRematch}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-xs sm:text-sm font-semibold shadow-md transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Ván mới
              </button>
            )}
          </div>

          <Board
            board={board}
            boardSize={boardSize}
            lastMove={lastMove}
            winningLine={winningLine}
            canPlay={canPlay}
            currentTurn={turn}
            onCellClick={handleCellClick}
          />
        </div>

        {/* Right Sidebar: Players, Controls, Chat */}
        <aside className="w-full max-w-[560px] mx-auto lg:max-w-none flex flex-col gap-4">
          {/* Scoreboard */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs font-medium text-slate-400 uppercase tracking-wider">
              <span>Bảng điểm</span>
              <span>Hòa: {scores.draws}</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Player X */}
              <div
                className={`p-3 rounded-xl border transition ${
                  !winner && turn === "X"
                    ? "bg-rose-500/10 border-rose-500/50 shadow-[0_0_20px_-5px_rgba(244,63,94,0.3)]"
                    : "bg-slate-950/60 border-slate-800"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-400">
                    QUÂN X
                  </span>
                  <span className="text-lg font-extrabold font-mono text-white">{scores.X}</span>
                </div>
                <p className="text-xs text-slate-300 truncate font-medium">
                  {players.X || "Người chơi X"}
                  {isOnline && session.role === "X" && " (Bạn)"}
                </p>
              </div>

              {/* Player O */}
              <div
                className={`p-3 rounded-xl border transition ${
                  !winner && turn === "O"
                    ? "bg-sky-500/10 border-sky-500/50 shadow-[0_0_20px_-5px_rgba(56,189,248,0.3)]"
                    : "bg-slate-950/60 border-slate-800"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-400">
                    QUÂN O
                  </span>
                  <span className="text-lg font-extrabold font-mono text-white">{scores.O}</span>
                </div>
                <p className="text-xs text-slate-300 truncate font-medium">
                  {players.O || "Đang chờ..."}
                  {isOnline && session.role === "O" && " (Bạn)"}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 flex flex-wrap gap-2">
            {!isOnline && (
              <button
                type="button"
                disabled={Boolean(winner) || moveHistory.length === 0}
                onClick={handleUndo}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-slate-200 text-xs font-semibold transition"
              >
                <Undo2 className="w-4 h-4" />
                Đi lại
              </button>
            )}

            {!winner && (!isOnline || session.role !== "SPECTATOR") && (
              <button
                type="button"
                onClick={handleSurrender}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-300 text-xs font-semibold transition"
              >
                <Flag className="w-4 h-4" />
                Đầu hàng
              </button>
            )}

            <button
              type="button"
              onClick={handleRematch}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 text-xs font-semibold transition"
            >
              <RotateCcw className="w-4 h-4" />
              Làm mới bàn
            </button>
          </div>

          {/* Online Chat Box */}
          {isOnline && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col h-[280px]">
              <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2.5">
                Trò chuyện phòng
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1 mb-3 text-xs">
                {chatMessages.length === 0 ? (
                  <p className="text-slate-600 text-center mt-10">Chưa có tin nhắn nào. Hãy gửi lời chào!</p>
                ) : (
                  chatMessages.map((msg) => (
                    <div key={msg.id} className="bg-slate-950/70 border border-slate-800/80 rounded-xl px-3 py-2">
                      <span
                        className={`font-bold mr-1.5 ${
                          msg.role === "X"
                            ? "text-rose-400"
                            : msg.role === "O"
                            ? "text-sky-400"
                            : "text-amber-400"
                        }`}
                      >
                        {msg.sender}:
                      </span>
                      <span className="text-slate-200 break-words">{msg.text}</span>
                    </div>
                  ))
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Quick replies */}
              <div className="flex gap-1.5 overflow-x-auto pb-2 mb-1">
                {QUICK_CHATS.map((text) => (
                  <button
                    key={text}
                    type="button"
                    onClick={() => sendRoomChat(session.roomId, session.playerName || "Khách", session.role, text)}
                    className="shrink-0 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-[11px] text-slate-300 transition"
                  >
                    {text}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSendChat} className="flex gap-2">
                <input
                  type="text"
                  maxLength={120}
                  placeholder="Nhắn tin..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-sky-500"
                />
                <button
                  type="submit"
                  className="p-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 transition"
                  aria-label="Gửi tin nhắn"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
