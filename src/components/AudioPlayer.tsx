import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Music, WifiOff } from 'lucide-react';

interface AudioPlayerProps {
  isPlaying: boolean;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ isPlaying }) => {
  const [muted, setMuted] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const isSynthRunning = useRef(false);

  // YouTube Video ID
  const youtubeVideoId = 'cOIvolrzNIw';
  const embedUrl = `https://www.youtube.com/embed/${youtubeVideoId}?autoplay=1&loop=1&playlist=${youtubeVideoId}&enablejsapi=1&mute=${muted ? 1 : 0}&controls=0`;

  // Offline Synth Music Generator using Web Audio API
  useEffect(() => {
    if (!isPlaying || muted) {
      if (audioCtxRef.current && audioCtxRef.current.state === 'running') {
        audioCtxRef.current.suspend();
      }
      return;
    }

    // Play offline synth melodic notes if unmuted
    let timerId: any = null;
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          audioCtxRef.current = new AudioCtx();
        }
      }

      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }

      const notes = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25]; // C major notes
      let noteIdx = 0;

      const playNextNote = () => {
        if (!audioCtxRef.current || muted) return;
        const ctx = audioCtxRef.current;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(notes[noteIdx % notes.length], ctx.currentTime);
        noteIdx = (noteIdx + 1) % notes.length;

        gain.gain.setValueAtTime(0.015, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 1.2);
      };

      timerId = setInterval(playNextNote, 800);
    } catch (e) {
      console.log('Web Audio Synth offline fallback setup', e);
    }

    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [isPlaying, muted]);

  if (!isPlaying) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-40 bg-slate-900/90 border border-blue-500/40 rounded-full px-3 py-1.5 shadow-lg backdrop-blur-md flex items-center gap-2" dir="rtl">
      {/* Hidden YouTube Iframe for online music */}
      <iframe
        className="w-1 h-1 opacity-0 absolute pointer-events-none"
        src={embedUrl}
        title="Background Music"
        allow="autoplay"
      />

      <div className="flex items-center gap-1.5 text-xs font-medium text-blue-200">
        <Music className="w-4 h-4 text-amber-400 animate-pulse" />
        <span className="hidden sm:inline">موسيقى أوفلاين</span>
      </div>

      <button
        onClick={() => setMuted(!muted)}
        className="p-1 rounded-full bg-blue-600/30 hover:bg-blue-600/50 text-amber-300 transition-colors cursor-pointer"
        title={muted ? 'تشغيل الصوت' : 'كتم الصوت'}
      >
        {muted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400 animate-bounce" />}
      </button>
    </div>
  );
};
