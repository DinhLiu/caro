"use client";
import { useState, useEffect } from "react";
import { initializeApp, getApps } from "firebase/app";
import { getDatabase, ref, set, onValue, update } from "firebase/database";

// THAY THẾ CONFIG FIREBASE CỦA BẠN VÀO ĐÂY
const firebaseConfig = {
    apiKey: "AIzaSyCTSy8yNXhpbkrImYc3H-UojP8DiBwm27A",

    authDomain: "caro-26d30.firebaseapp.com",

    databaseURL: "https://caro-26d30-default-rtdb.asia-southeast1.firebasedatabase.app",

    projectId: "caro-26d30",

    storageBucket: "caro-26d30.firebasestorage.app",

    messagingSenderId: "485369878738",

    appId: "1:485369878738:web:a59789c0b526dcaee0750b",

    measurementId: "G-SEVDJGCZP8"

};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getDatabase(app);

const BOARD_SIZE = 15;

export default function CaroGame() {
  const [roomId, setRoomId] = useState("");
  const [inRoom, setInRoom] = useState(false);
  const [playerSymbol, setPlayerSymbol] = useState(null); // 'X' hoặc 'O'
  const [board, setBoard] = useState(Array(BOARD_SIZE * BOARD_SIZE).fill(""));
  const [turn, setTurn] = useState("X");
  const [winner, setWinner] = useState(null);
  const [lastMove, setLastMove] = useState(null);

  // Lắng nghe thay đổi từ phòng chơi trên Firebase
  useEffect(() => {
    if (!inRoom || !roomId) return;
    const roomRef = ref(db, `rooms/${roomId}`);
    
    const unsubscribe = onValue(roomRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setBoard(data.board || Array(BOARD_SIZE * BOARD_SIZE).fill(""));
        setTurn(data.turn || "X");
        setWinner(data.winner || null);
        setLastMove(data.lastMove ?? null);
      }
    });

    return () => unsubscribe();
  }, [inRoom, roomId]);

  // Tạo phòng mới (Cầm quân X)
  const createRoom = () => {
    const newId = Math.random().toString(36).substring(2, 7).toUpperCase();
    const initialBoard = Array(BOARD_SIZE * BOARD_SIZE).fill("");
    set(ref(db, `rooms/${newId}`), {
      board: initialBoard,
      turn: "X",
      winner: null,
      lastMove: null,
    });
    setRoomId(newId);
    setPlayerSymbol("X");
    setInRoom(true);
  };

  // Vào phòng có sẵn (Cầm quân O)
  const joinRoom = () => {
    if (!roomId.trim()) return alert("Vui lòng nhập mã phòng!");
    setRoomId(roomId.toUpperCase());
    setPlayerSymbol("O");
    setInRoom(true);
  };

  // Kiểm tra thắng thua (5 quân liên tiếp)
  const checkWin = (currentBoard, index, symbol) => {
    const row = Math.floor(index / BOARD_SIZE);
    const col = index % BOARD_SIZE;
    const directions = [
      [0, 1],  // Ngang
      [1, 0],  // Dọc
      [1, 1],  // Chéo chính
      [1, -1], // Chéo phụ
    ];

    for (let [dr, dc] of directions) {
      let count = 1;

      // Duyệt tiến
      for (let i = 1; i < 5; i++) {
        const r = row + dr * i;
        const c = col + dc * i;
        if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && currentBoard[r * BOARD_SIZE + c] === symbol) {
          count++;
        } else break;
      }

      // Duyệt lùi
      for (let i = 1; i < 5; i++) {
        const r = row - dr * i;
        const c = col - dc * i;
        if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && currentBoard[r * BOARD_SIZE + c] === symbol) {
          count++;
        } else break;
      }

      if (count >= 5) return true;
    }
    return false;
  };

  // Xử lý đánh cờ
  const handleCellClick = (index) => {
    if (winner || board[index] !== "" || turn !== playerSymbol) return;

    const newBoard = [...board];
    newBoard[index] = playerSymbol;
    const isWin = checkWin(newBoard, index, playerSymbol);

    update(ref(db, `rooms/${roomId}`), {
      board: newBoard,
      turn: playerSymbol === "X" ? "O" : "X",
      winner: isWin ? playerSymbol : null,
      lastMove: index,
    });
  };

  // Chơi lại ván mới
  const resetGame = () => {
    update(ref(db, `rooms/${roomId}`), {
      board: Array(BOARD_SIZE * BOARD_SIZE).fill(""),
      turn: "X",
      winner: null,
      lastMove: null,
    });
  };

  if (!inRoom) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h1 className="text-4xl font-bold mb-8 text-sky-400">CỜ CARO ONLINE</h1>
        <div className="bg-slate-800 p-6 rounded-xl shadow-lg w-full max-w-sm space-y-6">
          <button
            onClick={createRoom}
            className="w-full py-3 bg-sky-500 hover:bg-sky-600 rounded-lg font-bold text-lg transition"
          >
            Tạo Phòng Mới (Quân X)
          </button>

          <div className="border-t border-slate-700 pt-4 space-y-3">
            <input
              type="text"
              placeholder="Nhập mã phòng (VD: A1B2C)"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value.toUpperCase())}
              className="w-full p-3 rounded-lg bg-slate-900 border border-slate-700 text-center uppercase tracking-widest font-bold"
            />
            <button
              onClick={joinRoom}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 rounded-lg font-bold text-lg transition"
            >
              Vào Phòng (Quân O)
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between w-full max-w-[500px] bg-slate-800 p-3 rounded-lg">
        <div>
          <span className="text-slate-400 text-sm">Mã phòng: </span>
          <span className="font-mono font-bold text-yellow-400 text-lg select-all">{roomId}</span>
        </div>
        <div>
          <span className="text-slate-400 text-sm">Bạn cầm: </span>
          <span className={`font-bold text-lg ${playerSymbol === "X" ? "text-rose-400" : "text-sky-400"}`}>
            {playerSymbol}
          </span>
        </div>
      </div>

      {/* Trạng thái lượt đi */}
      <div className="mb-4 text-xl font-semibold">
        {winner ? (
          <span className="text-emerald-400">🎉 Người chơi {winner} đã chiến thắng!</span>
        ) : turn === playerSymbol ? (
          <span className="text-yellow-300">👉 Đến lượt của bạn ({playerSymbol})</span>
        ) : (
          <span className="text-slate-400">⏳ Đang chờ đối thủ ({turn})...</span>
        )}
      </div>

      {/* Bàn cờ 15x15 */}
      <div
        className="grid bg-slate-700 gap-[1px] border-2 border-slate-600 shadow-2xl"
        style={{
          gridTemplateColumns: `repeat(${BOARD_SIZE}, minmax(0, 1fr))`,
          width: "min(92vw, 500px)",
          height: "min(92vw, 500px)",
        }}
      >
        {board.map((cell, idx) => (
          <button
            key={idx}
            onClick={() => handleCellClick(idx)}
            className={`flex items-center justify-center font-bold text-sm sm:text-lg transition
              ${lastMove === idx ? "bg-slate-600" : "bg-slate-900 hover:bg-slate-800"}
              ${cell === "X" ? "text-rose-500" : "text-sky-400"}
            `}
          >
            {cell}
          </button>
        ))}
      </div>

      {winner && (
        <button
          onClick={resetGame}
          className="mt-6 px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 rounded-lg font-bold shadow-lg transition"
        >
          Chơi Lại Ván Mới
        </button>
      )}
    </div>
  );
}