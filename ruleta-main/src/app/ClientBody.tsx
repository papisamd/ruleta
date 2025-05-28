"use client";

import { useState, useEffect, useRef } from 'react';
import RouletteGame from '../components/RouletteGame';

export default function ClientBody() {
  const [isSoundOn, setIsSoundOn] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const gameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Inicializar audio
    audioRef.current = new Audio('/casino-ambiente.mp3');
    audioRef.current.loop = true;
    audioRef.current.volume = 0.5;

    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 200);
    };

    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      if (isSoundOn) {
        audioRef.current.play().catch(e => console.log('Error al reproducir audio:', e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isSoundOn]);

  const scrollToGame = () => {
    gameRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-900">
      <div className="container mx-auto px-4 py-4 md:py-8">
        <header className="text-center mb-16 relative">
          <h1 className="text-4xl md:text-6xl font-bold text-gold bg-gradient-to-r from-yellow-400 via-yellow-200 to-yellow-400 bg-clip-text text-transparent drop-shadow-lg">
            Papiweb CASINO ROYAL
          </h1>
          <p className="text-lg md:text-xl text-gray-200 mt-2 font-light">
            Ruleta Europea Profesional
          </p>
          <button
            onClick={scrollToGame}
            className="absolute left-1/2 transform -translate-x-1/2 translate-y-8 bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-2 px-4 rounded-full shadow-lg animate-bounce"
            aria-label="Ir a la mesa de apuestas"
          >
            Jugar Ahora ↓
          </button>
        </header>

        <main ref={gameRef} className="flex-1">
          <RouletteGame />
        </main>

        <footer className="mt-8 py-4 border-t border-emerald-700">
          <div className="flex justify-center items-center space-x-4">
            <button
              className="p-2 rounded-full bg-emerald-700 hover:bg-emerald-600 transition-colors"
              onClick={() => setIsSoundOn(prev => !prev)}
            >
              {isSoundOn ? (
                <span className="text-yellow-300 text-2xl">🔊</span>
              ) : (
                <span className="text-yellow-300 text-2xl">🔇</span>
              )}
            </button>
            <p className="text-gray-300 text-sm">
              © {new Date().getFullYear()} Casino Royal. Todos los derechos reservados.
            </p>
          </div>
        </footer>
      </div>

      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 bg-emerald-700 hover:bg-emerald-600 text-yellow-300 font-bold p-4 rounded-full shadow-lg transition-all duration-300 z-50"
          aria-label="Volver arriba"
        >
          <span className="text-2xl">↑</span>
        </button>
      )}
    </div>
  );
}
