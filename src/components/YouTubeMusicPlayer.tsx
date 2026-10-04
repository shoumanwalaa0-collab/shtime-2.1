import React, { useEffect, useRef } from 'react';

/**
 * Continuous YouTube Background Music Player
 * Video URL: https://youtu.be/S-XBFN6LR0Y?si=poaAIGBjlsRCThwe
 * Video ID: S-XBFN6LR0Y
 *
 * Rules:
 * - Plays continuously throughout the whole game from start to finish.
 * - Cannot be paused or stopped by the user (no buttons, no controls).
 * - Only stops when the user exits/closes the game.
 * - Handles browser autoplay restrictions by unmuting and playing on the very first user interaction.
 */

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

export const YouTubeMusicPlayer: React.FC = () => {
  const playerRef = useRef<any>(null);
  const videoId = 'S-XBFN6LR0Y';

  useEffect(() => {
    let player: any = null;

    const startAudio = () => {
      if (player && typeof player.playVideo === 'function') {
        try {
          player.unMute();
          player.setVolume(100);
          player.playVideo();
        } catch {
          // ignore
        }
      } else {
        // Fallback postMessage to iframe
        const iframe = document.getElementById('yt-game-bg-music') as HTMLIFrameElement | null;
        if (iframe && iframe.contentWindow) {
          try {
            iframe.contentWindow.postMessage('{"event":"command","func":"unMute","args":""}', '*');
            iframe.contentWindow.postMessage('{"event":"command","func":"setVolume","args":[100]}', '*');
            iframe.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
          } catch {
            // ignore
          }
        }
      }
    };

    const initPlayer = () => {
      if (!window.YT || !window.YT.Player) return;
      try {
        player = new window.YT.Player('yt-game-bg-music', {
          videoId,
          playerVars: {
            autoplay: 1,
            loop: 1,
            playlist: videoId,
            controls: 0,
            disablekb: 1,
            fs: 0,
            playsinline: 1,
            modestbranding: 1,
            rel: 0,
          },
          events: {
            onReady: (event: any) => {
              playerRef.current = event.target;
              try {
                event.target.unMute();
                event.target.setVolume(100);
                event.target.playVideo();
              } catch {
                // Autoplay with sound might require user gesture
              }
            },
            onStateChange: (event: any) => {
              // If ended or paused unintentionally, resume immediately
              if (event.data === window.YT.PlayerState.ENDED) {
                event.target.seekTo(0);
                event.target.playVideo();
              } else if (event.data === window.YT.PlayerState.PAUSED) {
                event.target.playVideo();
              }
            },
          },
        });
      } catch {
        // fallback
      }
    };

    // Load YouTube API script if not present
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
      window.onYouTubeIframeAPIReady = () => {
        initPlayer();
      };
    } else {
      initPlayer();
    }

    // Browsers block audio until the user touches or clicks anywhere
    // On any interaction, immediately unmute and play
    const handleUserInteraction = () => {
      startAudio();
    };

    window.addEventListener('click', handleUserInteraction);
    window.addEventListener('touchstart', handleUserInteraction);
    window.addEventListener('pointerdown', handleUserInteraction);
    window.addEventListener('keydown', handleUserInteraction);

    return () => {
      window.removeEventListener('click', handleUserInteraction);
      window.removeEventListener('touchstart', handleUserInteraction);
      window.removeEventListener('pointerdown', handleUserInteraction);
      window.removeEventListener('keydown', handleUserInteraction);
      if (player && typeof player.destroy === 'function') {
        try {
          player.destroy();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  return (
    <div
      className="fixed bottom-0 right-0 w-2 h-2 opacity-[0.02] pointer-events-none overflow-hidden z-0 select-none"
      aria-hidden="true"
    >
      <iframe
        id="yt-game-bg-music"
        title="Game Music"
        src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&loop=1&playlist=${videoId}&enablejsapi=1&controls=0&disablekb=1&fs=0&playsinline=1`}
        allow="autoplay; encrypted-media"
        className="w-2 h-2 opacity-[0.02] pointer-events-none"
      />
    </div>
  );
};


