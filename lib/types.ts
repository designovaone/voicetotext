export interface Transcription {
  id: number;
  text: string;
  segments: number;
  created_at: string;
  updated_at: string;
}

export type AudioFormat = 'mp4' | 'm4a' | 'aac' | 'wav' | 'webm' | 'mp3';

export function mimeToFormat(mimeType: string): AudioFormat | null {
  const m = mimeType.toLowerCase().split(';')[0].trim();
  switch (m) {
    case 'audio/mp4':
      return 'mp4';
    case 'audio/m4a':
    case 'audio/x-m4a':
      return 'm4a';
    case 'audio/aac':
      return 'aac';
    case 'audio/wav':
    case 'audio/x-wav':
      return 'wav';
    case 'audio/webm':
      return 'webm';
    case 'audio/mpeg':
    case 'audio/mp3':
      return 'mp3';
    default:
      return null;
  }
}
