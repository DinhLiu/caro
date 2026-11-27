"use client";

import { useState } from "react";
import { Globe, Cpu, Users, Sparkles, ArrowRight, Plus, LogIn, ShieldCheck } from "lucide-react";

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
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10">
      {/* Hero Title */}
      <div className="text-center mb-8 max-w-lg">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs font-medium mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          Cờ Caro Thế Hệ Mới • 15×15 & 19×19
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-3">
          Caro <span className="bg-gradient-to-r from-rose-400 via-fuchsia-400 to-sky-400 bg-clip-text text-transparent">Arena</span>
        </h1>
        <p className="text-slate-400 text-sm sm:text-base">
          Thách đấu bạn bè trực tuyến qua mã phòng, hoặc luyện tập cùng AI thông minh.
        </p>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-md bg-slate-900/80 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur-md overflow-hidden">
        {/* Mode Tabs */}
        <div className="grid grid-cols-3 border-b border-slate-800 bg-slate-950/50 p-1.5 gap-1">
          <button
            type="button"
            onClick={() => { setActiveTab("online"); setError(""); }}
            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition ${
              activeTab === "online"
                ? "bg-slate-800 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Globe className="w-4 h-4 text-sky-400" />
            Online
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab("ai"); setError(""); }}
            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition ${
              activeTab === "ai"
                ? "bg-slate-800 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Cpu className="w-4 h-4 text-rose-400" />
            Đấu AI
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab("local"); setError(""); }}
            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition ${
              activeTab === "local"
                ? "bg-slate-800 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Users className="w-4 h-4 text-emerald-400" />
            2P Offline
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Shared Board & Rule Settings */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Kích thước bàn</label>
              <div className="grid grid-cols-2 gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                {[15, 19].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setBoardSize(size)}
                    className={`py-1.5 rounded-lg text-xs font-semibold transition ${
                      boardSize === size
                        ? "bg-slate-800 text-sky-300"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {size}×{size}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Luật chơi</label>
              <div className="grid grid-cols-2 gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setRuleMode("freestyle")}
                  title="Đủ 5 quân liên tiếp là thắng"
                  className={`py-1.5 rounded-lg text-xs font-semibold transition ${
                    ruleMode === "freestyle"
                      ? "bg-slate-800 text-sky-300"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Tự do
                </button>
                <button
                  type="button"
                  onClick={() => setRuleMode("caro_vn")}
                  title="Chặn 2 đầu không thắng"
                  className={`py-1.5 rounded-lg text-xs font-semibold transition ${
                    ruleMode === "caro_vn"
                      ? "bg-slate-800 text-sky-300"
                      : "text-slate-400 hover:text-slate-200"
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
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Tên hiển thị của bạn</label>
                <input
                  type="text"
                  maxLength={20}
                  placeholder="Nhập tên (tùy chọn)..."
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-sky-500 transition"
                />
              </div>

              <button
                type="button"
                disabled={loading}
                onClick={handleCreate}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 disabled:opacity-50 text-white font-semibold text-sm shadow-lg shadow-sky-500/20 transition"
              >
                <Plus className="w-4 h-4" />
                {loading ? "Đang xử lý..." : "Tạo Phòng Mới (Cầm quân X)"}
              </button>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-800" />
                <span className="flex-shrink mx-3 text-xs text-slate-500 uppercase tracking-wider">Hoặc vào phòng</span>
                <div className="flex-grow border-t border-slate-800" />
              </div>

              <form onSubmit={handleJoin} className="flex gap-2">
                <input
                  type="text"
                  maxLength={8}
                  placeholder="Mã phòng (VD: A1B2C)"
                  value={roomInput}
                  onChange={(e) => setRoomInput(e.target.value.toUpperCase())}
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm font-mono uppercase tracking-widest text-center text-amber-300 placeholder:text-slate-600 placeholder:tracking-normal placeholder:font-sans focus:outline-none focus:border-emerald-500 transition"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-sm transition"
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
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Độ khó AI</label>
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
                      className={`py-2 rounded-xl text-xs font-semibold border transition ${
                        aiDifficulty === lvl.id
                          ? "bg-rose-500/15 border-rose-500/50 text-rose-300"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {lvl.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Chọn quân của bạn</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setHumanSymbol("X")}
                    className={`py-2 rounded-xl text-xs font-semibold border transition ${
                      humanSymbol === "X"
                        ? "bg-rose-500/15 border-rose-500/50 text-rose-300"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Quân X (Đi trước)
                  </button>
                  <button
                    type="button"
                    onClick={() => setHumanSymbol("O")}
                    className={`py-2 rounded-xl text-xs font-semibold border transition ${
                      humanSymbol === "O"
                        ? "bg-sky-500/15 border-sky-500/50 text-sky-300"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
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
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-400 hover:to-orange-400 text-white font-semibold text-sm shadow-lg shadow-rose-500/20 transition"
              >
                Bắt Đầu Đấu AI
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* LOCAL 2P TAB */}
          {activeTab === "local" && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-400 leading-relaxed flex gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  Hai người chơi luân phiên trên cùng một thiết bị. Hỗ trợ đi lại nước cờ và tính điểm nhiều ván.
                </span>
              </div>

              <button
                type="button"
                onClick={() =>
                  onStartOffline({
                    mode: "local",
                    boardSize,
                    ruleMode,
                  })
                }
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition"
              >
                Chơi 2 Người Ngay
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs text-center">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
