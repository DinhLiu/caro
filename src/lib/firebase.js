import { initializeApp, getApps } from "firebase/app";
import { getDatabase, ref, set, get, update, onValue, push } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCTSy8yNXhpbkrImYc3H-UojP8DiBwm27A",
  authDomain: "caro-26d30.firebaseapp.com",
  databaseURL: "https://caro-26d30-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "caro-26d30",
  storageBucket: "caro-26d30.firebasestorage.app",
  messagingSenderId: "485369878738",
  appId: "1:485369878738:web:a59789c0b526dcaee0750b",
  measurementId: "G-SEVDJGCZP8",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getDatabase(app);

export function generateRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 5; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function createOnlineRoom({ playerName, boardSize = 15, ruleMode = "freestyle" }) {
  const roomId = generateRoomCode();
  const initialBoard = Array(boardSize * boardSize).fill("");

  await set(ref(db, `rooms/${roomId}`), {
    board: initialBoard,
    boardSize,
    ruleMode,
    turn: "X",
    winner: null,
    winningLine: null,
    lastMove: null,
    moveCount: 0,
    players: {
      X: playerName || "Người chơi X",
      O: null,
    },
    scores: {
      X: 0,
      O: 0,
      draws: 0,
    },
    createdAt: Date.now(),
  });

  return roomId;
}

export async function joinOnlineRoom(roomId, playerName) {
  const cleanId = roomId.trim().toUpperCase();
  const roomRef = ref(db, `rooms/${cleanId}`);
  const snapshot = await get(roomRef);

  if (!snapshot.exists()) {
    throw new Error("Không tìm thấy phòng với mã này. Vui lòng kiểm tra lại!");
  }

  const data = snapshot.val();
  const players = data.players || {};

  if (!players.O) {
    await update(ref(db, `rooms/${cleanId}/players`), {
      O: playerName || "Người chơi O",
    });
    return { roomId: cleanId, role: "O", data };
  }

  // Phòng đã đủ 2 người -> vào xem với tư cách khán giả
  return { roomId: cleanId, role: "SPECTATOR", data };
}

export function subscribeToRoom(roomId, callback) {
  const roomRef = ref(db, `rooms/${roomId}`);
  return onValue(roomRef, (snapshot) => {
    callback(snapshot.val());
  });
}

export async function updateRoomState(roomId, payload) {
  return update(ref(db, `rooms/${roomId}`), payload);
}

export async function sendRoomChat(roomId, senderName, senderRole, text) {
  if (!text.trim()) return;
  const chatRef = ref(db, `rooms/${roomId}/chat`);
  await push(chatRef, {
    sender: senderName,
    role: senderRole,
    text: text.trim().slice(0, 120),
    ts: Date.now(),
  });
}
