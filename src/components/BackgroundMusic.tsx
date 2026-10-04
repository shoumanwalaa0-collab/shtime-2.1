import React, { useEffect, useRef } from 'react';

/**
 * Continuous Background Music Player
 * Playing link: https://youtu.be/S-XBFN6LR0Y?si=poaAIGBjlsRCThwe
 * No buttons, no pause, no stop. Plays continuously from start to finish
 * and only stops when closing or exiting the game.
 */
export const BackgroundMusic: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoId = 'S-XBFN6LR0Y';

  // Ensure autoplay triggers even if browser policy requires initial gesture
  useEffect(() => {
    const handleFirstInteraction = () => {
      const iframe = containerRef.current?.querySelector('iframe');
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
      }
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
    };

    window.addEventListener('click', handleFirstInteraction, { once: true });
    window.addEventListener('keydown', handleFirstInteraction, { once: true });
    window.addEventListener('touchstart', handleFirstInteraction, { once: true });

    return () => {
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
    };
  }, []);

  return (
    <div ref={containerRef} className="fixed -top-96 -left-96 w-1 h-1 opacity-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
      <iframe
        title="Background Music"
        src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&loop=1&playlist=${videoId}&enablejsapi=1&controls=0&disablekb=1&fs=0&playsinline=1`}
        allow="autoplay; encrypted-media"
        className="w-1 h-1 opacity-0 pointer-events-none"
      />
    </div>
  );
};
