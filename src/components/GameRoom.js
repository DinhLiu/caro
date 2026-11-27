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

const QUICK_CHATS = ["Chào bạn!", "Nước hay!", "Chờ xíu nhé", "Ván nữa nhé!"];

export default function GameRoom({ session, onLeave }) {
  const isOnline = session.mode === "online";
  const isAI = session.mode === "ai";

  const [boardSize, setBoardSize] = useState(session.boardSize || 15);
  const [ruleMode, setRuleMode] = useState(session.ruleMode || "freestyle");
  const [board, setBoard] = useState(() =>
    Array((session.boardSize || 15) * (session.boardSize || 15)).fill("")
  );
  const [turn, setTurn] = useState("X");
  const [winner, setWinner] = useState(null);
  const [winningLine, setWinningLine] = useState([]);
  const [lastMove, setLastMove] = useState(null);
  const [moveHistory, setMoveHistory] = useState([]);
  const [scores, setScores] = useState({ X: 0, O: 0, draws: 0 });
  const [players, setPlayers] = useState(() => {
    if (isAI) {
      return {
        X: session.humanSymbol === "X" ? "Bạn" : `Máy (${session.aiDifficulty})`,
        O: session.humanSymbol === "O" ? "Bạn" : `Máy (${session.aiDifficulty})`,
      };
    }
    if (session.mode === "local") {
      return { X: "Người chơi X", O: "Người chơi O" };
    }
    return { X: session.playerName || "Người chơi X", O: null };
  });

  const [muted, setMuted] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");

  const prevWinnerRef = useRef(null);
  const prevMoveCountRef = useRef(0);
  const prevChatCountRef = useRef(0);
  const chatContainerRef = useRef(null);

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

  // Chỉ cuộn nội bộ khung chat khi có tin nhắn mới (không cuộn trang trên điện thoại)
  useEffect(() => {
    if (chatMessages.length > prevChatCountRef.current && chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
    prevChatCountRef.current = chatMessages.length;
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
    }, 300);

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

  let statusContent = null;
  if (winner === "DRAW") {
    statusContent = (
      <span className="flex items-center gap-1.5 text-amber-700 font-semibold">
        <Trophy className="w-4 h-4 shrink-0" />
        Hòa nhau!
      </span>
    );
  } else if (winner) {
    const winnerName = players[winner] || `Người chơi ${winner}`;
    statusContent = (
      <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
        <Trophy className="w-4 h-4 shrink-0" />
        {winnerName} ({winner}) thắng!
      </span>
    );
  } else if (isOnline && !players.O) {
    statusContent = (
      <span className="flex items-center gap-1.5 text-amber-700 font-medium">
        <Clock className="w-4 h-4 shrink-0 animate-spin" />
        Đang chờ đối thủ vào phòng...
      </span>
    );
  } else if (isOnline && session.role === "SPECTATOR") {
    statusContent = (
      <span className="flex items-center gap-1.5 text-stone-600 font-medium">
        <Eye className="w-4 h-4 shrink-0 text-blue-600" />
        Đang xem • Lượt {turn}
      </span>
    );
  } else if (canPlay) {
    statusContent = (
      <span className="flex items-center gap-2 text-stone-900 font-semibold">
        <span className={`w-2.5 h-2.5 rounded-full ${turn === "X" ? "bg-red-600" : "bg-blue-600"}`} />
        Lượt {isOnline || isAI ? "của bạn" : `người chơi ${turn}`} ({turn})
      </span>
    );
  } else {
    statusContent = (
      <span className="flex items-center gap-1.5 text-stone-500 font-medium">
        <Clock className="w-4 h-4 shrink-0" />
        {isAI ? "Máy đang tính..." : `Đang chờ đối thủ (${turn})...`}
      </span>
    );
  }

  return (
    <div className="min-h-screen flex flex-col max-w-5xl mx-auto px-3 sm:px-6 py-3 sm:py-6">
      {/* Top Bar */}
      <header className="flex items-center justify-between gap-2 mb-3 sm:mb-5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onLeave}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-lg bg-white border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs sm:text-sm font-medium transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Thoát</span>
          </button>

          <span className="hidden sm:inline-flex items-center px-2.5 py-1.5 rounded-lg bg-stone-200/70 text-stone-600 text-xs font-medium">
            {boardSize}×{boardSize} • {ruleMode === "caro_vn" ? "Caro VN" : "Tự do"}
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {isOnline && (
            <>
              <button
                type="button"
                onClick={copyRoomCode}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-white border border-stone-300 hover:border-stone-400 text-xs sm:text-sm font-mono font-bold text-stone-800 transition"
                title="Sao chép mã phòng"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-stone-500" />}
                {session.roomId}
              </button>
              <button
                type="button"
                onClick={copyInviteLink}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 text-xs sm:text-sm font-medium transition"
                title="Sao chép link mời"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <LinkIcon className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{copiedLink ? "Đã chép!" : "Mời bạn"}</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => setMuted((m) => !m)}
            aria-label={muted ? "Bật âm thanh" : "Tắt âm thanh"}
            className="p-2 rounded-lg bg-white border border-stone-300 hover:bg-stone-50 text-stone-600 transition"
          >
            {muted ? <VolumeX className="w-4 h-4 text-stone-400" /> : <Volume2 className="w-4 h-4 text-stone-700" />}
          </button>
        </div>
      </header>

      {/* Main Responsive Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 sm:gap-6 items-start">
        {/* Left/Center: Mobile compact scoreboard + Turn bar + Board */}
        <div className="flex flex-col items-center gap-3">
          {/* Compact Score Strip on Mobile & Tablet (< lg) */}
          <div className="w-full max-w-[min(94vw,540px)] grid grid-cols-2 gap-2 lg:hidden">
            <div
              className={`flex items-center justify-between px-3 py-2 rounded-lg border bg-white ${
                !winner && turn === "X" ? "border-red-400 ring-1 ring-red-200" : "border-stone-200"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">X</span>
                <span className="text-xs font-medium text-stone-800 truncate">{players.X || "Người chơi X"}</span>
              </div>
              <span className="text-sm font-bold font-mono text-stone-900 ml-2">{scores.X}</span>
            </div>
            <div
              className={`flex items-center justify-between px-3 py-2 rounded-lg border bg-white ${
                !winner && turn === "O" ? "border-blue-400 ring-1 ring-blue-200" : "border-stone-200"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">O</span>
                <span className="text-xs font-medium text-stone-800 truncate">{players.O || "Đang chờ..."}</span>
              </div>
              <span className="text-sm font-bold font-mono text-stone-900 ml-2">{scores.O}</span>
            </div>
          </div>

          {/* Turn / Result Banner */}
          <div className="w-full max-w-[min(94vw,540px)] flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 text-xs sm:text-sm shadow-xs">
            {statusContent}
            {winner && (
              <button
                type="button"
                onClick={handleRematch}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Ván mới
              </button>
            )}
          </div>

          {/* Board */}
          <Board
            board={board}
            boardSize={boardSize}
            lastMove={lastMove}
            winningLine={winningLine}
            canPlay={canPlay}
            currentTurn={turn}
            onCellClick={handleCellClick}
          />

          {/* Action Buttons on Mobile (< lg) */}
          <div className="w-full max-w-[min(94vw,540px)] flex gap-2 lg:hidden">
            {!isOnline && (
              <button
                type="button"
                disabled={Boolean(winner) || moveHistory.length === 0}
                onClick={handleUndo}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-white border border-stone-300 hover:bg-stone-50 disabled:opacity-40 text-stone-700 text-xs font-semibold transition"
              >
                <Undo2 className="w-4 h-4" />
                Đi lại
              </button>
            )}
            {!winner && (!isOnline || session.role !== "SPECTATOR") && (
              <button
                type="button"
                onClick={handleSurrender}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-white border border-red-200 hover:bg-red-50 text-red-600 text-xs font-semibold transition"
              >
                <Flag className="w-4 h-4" />
                Đầu hàng
              </button>
            )}
            <button
              type="button"
              onClick={handleRematch}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-white border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs font-semibold transition"
            >
              <RotateCcw className="w-4 h-4" />
              Làm mới
            </button>
          </div>
        </div>

        {/* Right Sidebar (Desktop Scoreboard + Controls, and Chat on all screens) */}
        <aside className="w-full max-w-[min(94vw,540px)] mx-auto lg:max-w-none flex flex-col gap-3 sm:gap-4">
          {/* Desktop Scoreboard */}
          <div className="hidden lg:block bg-white border border-stone-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs font-medium text-stone-500">
              <span>Tỷ số trận đấu</span>
              <span>Hòa: {scores.draws}</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div
                className={`p-3 rounded-lg border transition ${
                  !winner && turn === "X"
                    ? "bg-red-50/70 border-red-300"
                    : "bg-stone-50 border-stone-200"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-700">X</span>
                  <span className="text-lg font-bold font-mono text-stone-900">{scores.X}</span>
                </div>
                <p className="text-xs text-stone-700 truncate font-medium">
                  {players.X || "Người chơi X"}
                  {isOnline && session.role === "X" && " (Bạn)"}
                </p>
              </div>

              <div
                className={`p-3 rounded-lg border transition ${
                  !winner && turn === "O"
                    ? "bg-blue-50/70 border-blue-300"
                    : "bg-stone-50 border-stone-200"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">O</span>
                  <span className="text-lg font-bold font-mono text-stone-900">{scores.O}</span>
                </div>
                <p className="text-xs text-stone-700 truncate font-medium">
                  {players.O || "Đang chờ..."}
                  {isOnline && session.role === "O" && " (Bạn)"}
                </p>
              </div>
            </div>
          </div>

          {/* Desktop Action Buttons */}
          <div className="hidden lg:flex bg-white border border-stone-200 rounded-xl p-3 gap-2">
            {!isOnline && (
              <button
                type="button"
                disabled={Boolean(winner) || moveHistory.length === 0}
                onClick={handleUndo}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-stone-100 hover:bg-stone-200 disabled:opacity-40 disabled:pointer-events-none text-stone-800 text-xs font-semibold transition"
              >
                <Undo2 className="w-4 h-4" />
                Đi lại
              </button>
            )}

            {!winner && (!isOnline || session.role !== "SPECTATOR") && (
              <button
                type="button"
                onClick={handleSurrender}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 text-xs font-semibold transition"
              >
                <Flag className="w-4 h-4" />
                Đầu hàng
              </button>
            )}

            <button
              type="button"
              onClick={handleRematch}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold transition"
            >
              <RotateCcw className="w-4 h-4" />
              Làm mới
            </button>
          </div>

          {/* Online Chat Box */}
          {isOnline && (
            <div className="bg-white border border-stone-200 rounded-xl p-3.5 flex flex-col h-[230px] lg:h-[290px]">
              <div className="text-xs font-semibold text-stone-500 mb-2">Trò chuyện</div>

              <div
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto space-y-1.5 pr-1 mb-2.5 text-xs"
              >
                {chatMessages.length === 0 ? (
                  <p className="text-stone-400 text-center mt-8">Chưa có tin nhắn nào.</p>
                ) : (
                  chatMessages.map((msg) => (
                    <div key={msg.id} className="bg-stone-50 border border-stone-200/80 rounded-lg px-2.5 py-1.5">
                      <span
                        className={`font-semibold mr-1.5 ${
                          msg.role === "X"
                            ? "text-red-600"
                            : msg.role === "O"
                            ? "text-blue-600"
                            : "text-amber-600"
                        }`}
                      >
                        {msg.sender}:
                      </span>
                      <span className="text-stone-800 break-words">{msg.text}</span>
                    </div>
                  ))
                )}
              </div>

              <div className="flex gap-1.5 overflow-x-auto pb-1.5 mb-1">
                {QUICK_CHATS.map((text) => (
                  <button
                    key={text}
                    type="button"
                    onClick={() => sendRoomChat(session.roomId, session.playerName || "Khách", session.role, text)}
                    className="shrink-0 px-2 py-1 rounded-md bg-stone-100 hover:bg-stone-200 text-[11px] text-stone-700 transition"
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
                  className="flex-1 px-3 py-1.5 rounded-lg bg-white border border-stone-300 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-blue-600"
                />
                <button
                  type="submit"
                  className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition"
                  aria-label="Gửi tin nhắn"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
