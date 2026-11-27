"use client";

import { useState } from "react";
import { Globe, Cpu, Users, Plus, LogIn, ArrowRight } from "lucide-react";

export default function Lobby({
  initialRoomCode = "",
  onCreateOnline,
  onJoinOnline,
  onStartOffline,
}) {
  const [activeTab, setActiveTab] = useState("online"); // "online" | "ai" | "local"
  const [playerName, setPlayerName] = useState("");
  const [roomInput, setRoomInput] = useState(initialRoomCode);
  const [boardSize, setBoardSize] = useState(15);
  const [ruleMode, setRuleMode] = useState("freestyle"); // "freestyle" | "caro_vn"
  const [aiDifficulty, setAiDifficulty] = useState("medium"); // "easy" | "medium" | "hard"
  const [humanSymbol, setHumanSymbol] = useState("X");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async () => {
    setError("");
    setLoading(true);
    try {
      await onCreateOnline({
        playerName: playerName.trim() || "Người chơi X",
        boardSize,
        ruleMode,
      });
    } catch (err) {
      setError(err.message || "Không thể tạo phòng. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!roomInput.trim()) {
      setError("Vui lòng nhập mã phòng (ví dụ: A1B2C).");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await onJoinOnline(roomInput.trim().toUpperCase(), playerName.trim() || "Người chơi O");
    } catch (err) {
      setError(err.message || "Không thể vào phòng.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      {/* Header */}
      <div className="text-center mb-6 max-w-md">
        <div className="inline-flex items-center justify-center gap-2 mb-3">
          <span className="w-8 h-8 rounded-lg bg-red-50 border border-red-200 text-red-600 font-extrabold flex items-center justify-center text-lg">
            X
          </span>
          <span className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 font-extrabold flex items-center justify-center text-lg">
            O
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-stone-900 mb-1.5">
          Cờ Caro Online
        </h1>
        <p className="text-stone-500 text-sm">
          Chơi cùng bạn bè qua mã phòng hoặc đấu với máy.
        </p>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-md bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Mode Tabs */}
        <div className="grid grid-cols-3 border-b border-stone-200 bg-stone-50 p-1.5 gap-1">
          <button
            type="button"
            onClick={() => { setActiveTab("online"); setError(""); }}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition ${
              activeTab === "online"
                ? "bg-white text-stone-900 shadow-sm border border-stone-200/80"
                : "text-stone-500 hover:text-stone-800"
            }`}
          >
            <Globe className="w-4 h-4 text-blue-600" />
            Online
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab("ai"); setError(""); }}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition ${
              activeTab === "ai"
                ? "bg-white text-stone-900 shadow-sm border border-stone-200/80"
                : "text-stone-500 hover:text-stone-800"
            }`}
          >
            <Cpu className="w-4 h-4 text-red-600" />
            Đấu Máy
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab("local"); setError(""); }}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition ${
              activeTab === "local"
                ? "bg-white text-stone-900 shadow-sm border border-stone-200/80"
                : "text-stone-500 hover:text-stone-800"
            }`}
          >
            <Users className="w-4 h-4 text-emerald-600" />
            2 Người
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-5">
          {/* Board Size & Rule Mode */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1.5">Bàn cờ</label>
              <div className="grid grid-cols-2 gap-1 bg-stone-100 p-1 rounded-lg">
                {[15, 19].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setBoardSize(size)}
                    className={`py-1.5 rounded-md text-xs font-semibold transition ${
                      boardSize === size
                        ? "bg-white text-stone-900 shadow-sm"
                        : "text-stone-500 hover:text-stone-800"
                    }`}
                  >
                    {size}×{size}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1.5">Luật chơi</label>
              <div className="grid grid-cols-2 gap-1 bg-stone-100 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setRuleMode("freestyle")}
                  className={`py-1.5 rounded-md text-xs font-semibold transition ${
                    ruleMode === "freestyle"
                      ? "bg-white text-stone-900 shadow-sm"
                      : "text-stone-500 hover:text-stone-800"
                  }`}
                >
                  Tự do
                </button>
                <button
                  type="button"
                  onClick={() => setRuleMode("caro_vn")}
                  className={`py-1.5 rounded-md text-xs font-semibold transition ${
                    ruleMode === "caro_vn"
                      ? "bg-white text-stone-900 shadow-sm"
                      : "text-stone-500 hover:text-stone-800"
                  }`}
                >
                  Caro VN
                </button>
              </div>
            </div>
          </div>

          {/* ONLINE TAB */}
          {activeTab === "online" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1.5">Tên của bạn</label>
                <input
                  type="text"
                  maxLength={20}
                  placeholder="Nhập tên hiển thị (tùy chọn)"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-stone-300 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition"
                />
              </div>

              <button
                type="button"
                disabled={loading}
                onClick={handleCreate}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-sm transition"
              >
                <Plus className="w-4 h-4" />
                {loading ? "Đang tạo phòng..." : "Tạo phòng mới (Quân X)"}
              </button>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-stone-200" />
                <span className="flex-shrink mx-3 text-xs text-stone-400">Hoặc vào phòng có sẵn</span>
                <div className="flex-grow border-t border-stone-200" />
              </div>

              <form onSubmit={handleJoin} className="flex gap-2">
                <input
                  type="text"
                  maxLength={8}
                  placeholder="Mã phòng (VD: A1B2C)"
                  value={roomInput}
                  onChange={(e) => setRoomInput(e.target.value.toUpperCase())}
                  className="flex-1 px-3 py-2.5 rounded-lg bg-white border border-stone-300 text-sm font-mono uppercase tracking-widest text-center text-stone-900 placeholder:text-stone-400 placeholder:tracking-normal placeholder:font-sans focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-sm transition"
                >
                  <LogIn className="w-4 h-4" />
                  Vào
                </button>
              </form>
            </div>
          )}

          {/* AI TAB */}
          {activeTab === "ai" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1.5">Độ khó</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "easy", label: "Dễ" },
                    { id: "medium", label: "Trung bình" },
                    { id: "hard", label: "Khó" },
                  ].map((lvl) => (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => setAiDifficulty(lvl.id)}
                      className={`py-2 rounded-lg text-xs font-semibold border transition ${
                        aiDifficulty === lvl.id
                          ? "bg-stone-900 border-stone-900 text-white"
                          : "bg-white border-stone-300 text-stone-700 hover:bg-stone-50"
                      }`}
                    >
                      {lvl.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-500 mb-1.5">Quân của bạn</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setHumanSymbol("X")}
                    className={`py-2 rounded-lg text-xs font-semibold border transition ${
                      humanSymbol === "X"
                        ? "bg-red-50 border-red-400 text-red-700"
                        : "bg-white border-stone-300 text-stone-700 hover:bg-stone-50"
                    }`}
                  >
                    Quân X (Đi trước)
                  </button>
                  <button
                    type="button"
                    onClick={() => setHumanSymbol("O")}
                    className={`py-2 rounded-lg text-xs font-semibold border transition ${
                      humanSymbol === "O"
                        ? "bg-blue-50 border-blue-400 text-blue-700"
                        : "bg-white border-stone-300 text-stone-700 hover:bg-stone-50"
                    }`}
                  >
                    Quân O (Đi sau)
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  onStartOffline({
                    mode: "ai",
                    boardSize,
                    ruleMode,
                    aiDifficulty,
                    humanSymbol,
                  })
                }
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-semibold text-sm transition"
              >
                Bắt đầu chơi
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* LOCAL 2P TAB */}
          {activeTab === "local" && (
            <div className="space-y-4">
              <p className="p-3 rounded-lg bg-stone-50 border border-stone-200 text-xs text-stone-600 leading-relaxed">
                Hai người chơi luân phiên trên cùng một máy. Hỗ trợ đi lại nước cờ và tính tỷ số qua nhiều ván.
              </p>

              <button
                type="button"
                onClick={() =>
                  onStartOffline({
                    mode: "local",
                    boardSize,
                    ruleMode,
                  })
                }
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-semibold text-sm transition"
              >
                Chơi 2 người ngay
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs text-center">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
