"use client";

import { useState, useEffect } from "react";
import Lobby from "../components/Lobby";
import GameRoom from "../components/GameRoom";
import { createOnlineRoom, joinOnlineRoom } from "../lib/firebase";

export default function CaroPage() {
  const [session, setSession] = useState(null);
  const [initialRoomCode, setInitialRoomCode] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const room = params.get("room");
      if (room) {
        setInitialRoomCode(room.toUpperCase());
      }
    }
  }, []);

  const handleCreateOnline = async ({ playerName, boardSize, ruleMode }) => {
    const roomId = await createOnlineRoom({ playerName, boardSize, ruleMode });
    setSession({
      mode: "online",
      roomId,
      role: "X",
      playerName,
      boardSize,
      ruleMode,
    });
  };

  const handleJoinOnline = async (roomId, playerName) => {
    const { roomId: cleanId, role, data } = await joinOnlineRoom(roomId, playerName);
    setSession({
      mode: "online",
      roomId: cleanId,
      role,
      playerName,
      boardSize: data.boardSize || 15,
      ruleMode: data.ruleMode || "freestyle",
    });
  };

  const handleStartOffline = (config) => {
    setSession(config);
  };

  const handleLeave = () => {
    setSession(null);
  };

  if (!session) {
    return (
      <Lobby
        initialRoomCode={initialRoomCode}
        onCreateOnline={handleCreateOnline}
        onJoinOnline={handleJoinOnline}
        onStartOffline={handleStartOffline}
      />
    );
  }

  return <GameRoom session={session} onLeave={handleLeave} />;
}
