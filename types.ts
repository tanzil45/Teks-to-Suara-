export interface VoiceOption {
  id: string; // Puck, Charon, Kore, Fenrir, Zephyr for Gemini AI, or the voice name/URI for SpeechSynthesis
  name: string;
  lang: string;
  gender: "Laki-laki" | "Perempuan" | "Netral";
  engine: "ai" | "system";
  isLocal?: boolean;
  nativeVoice?: SpeechSynthesisVoice; // Reference to browser voice object
  baseVoice?: string; // Optional underlying AI prebuilt voice id (e.g. Puck, Charon, Fenrir)
  description?: string; // Deskripsi gaya suara karakter
}

export interface PresetText {
  id: string;
  title: string;
  category: "Gaya Pidato/Formal" | "Santai / Percakapan" | "Dongeng / Cerita" | "Sastra/Puisi";
  text: string;
}

export interface HistoryItem {
  id: string;
  text: string;
  timestamp: string;
  engine: "ai" | "system";
  voiceId: string;
  voiceName: string;
  emotion?: string;
  speed?: number;
  pitch?: number;
  audioBase64?: string; // Store base64 data for AI playbacks
  audioMimeType?: string; // Store MIME type of the cached audio
}

