import React, { useState } from "react";
import { Sparkles, Trash2, ArrowRightLeft, FileText, Check, Loader2 } from "lucide-react";

interface TextViewProps {
  text: string;
  onChangeText: (newText: string) => void;
  onEnhanceText: (mode: string) => Promise<void>;
  isEnhancing: boolean;
}

export default function TextView({
  text,
  onChangeText,
  onEnhanceText,
  isEnhancing,
}: TextViewProps) {
  const [showEnhanceMenu, setShowEnhanceMenu] = useState(false);
  const [activeEnhanceMode, setActiveEnhanceMode] = useState<string | null>(null);

  const characterCount = text.length;
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  const enhanceModes = [
    { id: "formal", name: "Gaya Formal", desc: "Bahasa baku, tata kalimat resmi, sangat sopan.", color: "text-blue-400 bg-blue-950/40 border-blue-800" },
    { id: "casual", name: "Gaya Santai", desc: "Bernada kasual, hangat, akrab untuk sehari-hari.", color: "text-green-400 bg-green-950/40 border-green-800" },
    { id: "poetic", name: "Gaya Puitis/Sastra", desc: "Berjiwa puitis, kaya perumpamaan, dekoratif.", color: "text-pink-400 bg-pink-950/40 border-pink-800" },
    { id: "storytelling", name: "Kisah Dongeng", desc: "Interaktif, ekspresif, menghidupkan intonasi dongeng.", color: "text-amber-400 bg-amber-950/40 border-amber-800" },
  ];

  const handleSelectMode = async (modeId: string) => {
    setActiveEnhanceMode(modeId);
    try {
      await onEnhanceText(modeId);
    } finally {
      setActiveEnhanceMode(null);
      setShowEnhanceMenu(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col gap-4 relative">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-400" />
          <h2 className="text-white font-semibold font-display text-lg">Tulis Teks Anda</h2>
        </div>

        <div className="flex items-center gap-2 relative w-full sm:w-auto justify-between sm:justify-end">
          {/* AI Enhancer Dropdown trigger */}
          <button
            onClick={() => setShowEnhanceMenu(!showEnhanceMenu)}
            disabled={isEnhancing || !text.trim()}
            id="btn-enhance-dropdown"
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 border 
              ${!text.trim()
                ? 'bg-slate-800/40 border-slate-800/40 text-slate-500 cursor-not-allowed'
                : isEnhancing
                  ? 'bg-indigo-950/60 border-indigo-800 text-indigo-400 cursor-wait'
                  : 'bg-indigo-950/40 border-indigo-800/80 hover:border-indigo-600/80 text-indigo-300 hover:text-indigo-200 shadow-md shadow-indigo-500/5 cursor-pointer'}`}
          >
            {isEnhancing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                <span>Menyempurnakan Teks...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Sempurnakan dengan AI</span>
              </>
            )}
          </button>

          {/* Enhance Dropdown Menu */}
          {showEnhanceMenu && (
            <div className="absolute right-0 top-9 w-64 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl p-3 z-30 flex flex-col gap-1">
              <h4 className="text-slate-400 text-xs font-medium px-2 py-1 mb-1 border-b border-slate-800/60">Pilih Gaya Modifikasi Teks</h4>
              {enhanceModes.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => handleSelectMode(mode.id)}
                  disabled={isEnhancing}
                  className="w-full text-left p-2 rounded-lg hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-all duration-150 flex items-start gap-2 group cursor-pointer"
                >
                  <div className={`mt-0.5 p-1 rounded border text-[10px] shrink-0 font-medium ${mode.color}`}>
                    {activeEnhanceMode === mode.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Sparkles className="w-3 h-3 group-hover:scale-110 transition-transform duration-200" />
                    )}
                  </div>
                  <div>
                    <div className="text-white text-xs font-semibold">{mode.name}</div>
                    <div className="text-slate-500 text-[10px] leading-relaxed mt-0.5">{mode.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Clear button */}
          <button
            onClick={() => onChangeText("")}
            disabled={!text.trim() || isEnhancing}
            id="btn-clear-text"
            className={`p-2 rounded-lg border transition-all duration-150 
              ${!text.trim() || isEnhancing
                ? 'bg-slate-800/10 border-slate-800/20 text-slate-600 cursor-not-allowed'
                : 'bg-slate-850 hover:bg-rose-950/40 border-slate-800 hover:border-rose-900 text-slate-400 hover:text-rose-400 cursor-pointer'}`}
            title="Bersihkan Teks"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Textarea */}
      <div className="relative group">
        <textarea
          value={text}
          onChange={(e) => onChangeText(e.target.value)}
          placeholder="Ketik atau tempel paragraf teks Anda di sini dalam bahasa Indonesia atau bahasa Inggris..."
          rows={7}
          disabled={isEnhancing}
          id="textarea-input"
          className="w-full bg-slate-950 border border-slate-800/80 focus:border-indigo-500 rounded-xl p-4 text-slate-100 text-sm placeholder-slate-600 transition-all duration-300 outline-none focus:ring-1 focus:ring-indigo-500/20 leading-relaxed resize-none font-sans"
        />
        {/* Overlay pulse when enhancing */}
        {isEnhancing && (
          <div className="absolute inset-0 bg-slate-950/60 rounded-xl flex items-center justify-center backdrop-blur-[1px]">
            <div className="flex flex-col items-center gap-3">
              <div className="relative flex items-center justify-center">
                <div className="absolute w-12 h-12 bg-indigo-500/20 rounded-full animate-ping" />
                <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center border border-indigo-400">
                  <Sparkles className="w-5 h-5 text-white animate-pulse" />
                </div>
              </div>
              <span className="text-white text-xs font-medium font-sans">AI memoles tata bahasa...</span>
            </div>
          </div>
        )}
      </div>

      {/* Statistics and warning footer */}
      <div className="flex flex-col gap-3 border-t border-slate-800/40 pt-3">
        <div className="flex items-center justify-between text-slate-500 text-xs font-mono">
          <div className="flex items-center gap-4">
            <span>
              Karakter: <span className={`font-bold transition-colors duration-250 ${
                characterCount > 5000 
                  ? "text-rose-400 text-sm animate-pulse" 
                  : characterCount > 4000 
                    ? "text-amber-400" 
                    : "text-slate-300"
              }`}>{characterCount}</span>/5000
            </span>
            <span className="hidden sm:inline bg-slate-800 w-[1px] h-3.5"></span>
            <span>
              Kata: <span className="text-slate-300 font-semibold">{wordCount}</span>
            </span>
          </div>

          {/* Quick interactive character bar indicator */}
          <div className="hidden sm:flex items-center gap-1.5 w-32 bg-slate-950 border border-slate-800 rounded-full h-2 overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 ${
                characterCount > 5000 
                  ? "bg-rose-500" 
                  : characterCount > 4000 
                    ? "bg-amber-500" 
                    : "bg-indigo-500"
              }`}
              style={{ width: `${Math.min((characterCount / 5000) * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* Informative advice & visual warning alerts */}
        {characterCount > 5000 ? (
          <div className="bg-rose-950/40 border border-rose-900 rounded-xl p-3 flex items-start gap-2.5 transition-all duration-300 animate-pulse">
            <span className="text-rose-400 text-xs shrink-0 mt-0.5">⚠️</span>
            <div className="text-slate-300 text-xs font-sans leading-relaxed">
              <span className="text-rose-400 font-extrabold block mb-0.5">Peringatan Batas Maksimal Terlampaui!</span>
              Teks Anda saat ini berjumlah <strong className="text-rose-300">{characterCount} karakter</strong>, melebihi batas maksimal yang didukung yaitu <strong>5000 karakter</strong>. Mohon kurangi teks Anda agar sintesis suara dapat diproses dengan baik.
            </div>
          </div>
        ) : characterCount > 4000 ? (
          <div className="bg-amber-950/20 border border-amber-900/60 rounded-xl p-3 flex items-start gap-2.5 transition-all duration-300">
            <span className="text-amber-400 text-xs shrink-0 mt-0.5">⚠️</span>
            <div className="text-slate-300 text-xs font-sans leading-relaxed">
              <span className="text-amber-400 font-bold block mb-0.5">Mendekati Batas Maksimal</span>
              Teks Anda sudah mendekati batas kapasitas 5000 karakter. Pastikan kalimat terakhir Anda selesai sebelum batas terlampaui.
            </div>
          </div>
        ) : characterCount > 1000 ? (
          <div className="bg-indigo-950/20 border border-indigo-900/40 rounded-xl p-2.5 flex items-start gap-2">
            <span className="text-indigo-400 text-xs shrink-0 mt-0.5">💡</span>
            <span className="text-slate-400 text-[11px] font-sans leading-relaxed">
              Disarankan membagi teks dalam beberapa sesi apabila panjangnya melebihi 1000 karakter untuk mempertahankan performa konversi terbaik.
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
