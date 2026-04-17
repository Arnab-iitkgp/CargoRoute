import React, { useEffect, useState } from 'react';
import { FaTruckFast } from 'react-icons/fa6';

export default function LandingPage({ onStart }) {
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Animation takes 2.5s
    const transitionTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, 3000);

    const completeTimer = setTimeout(() => {
      onStart();
    }, 3500);

    return () => {
      clearTimeout(transitionTimer);
      clearTimeout(completeTimer);
    };
  }, [onStart]);

  return (
    <div className={`fixed inset-0 z-[9999] bg-slate-50 flex flex-col items-center justify-center overflow-hidden font-sans ${isFadingOut ? 'animate-fade-out-splash' : ''}`}>

      {/* Structural Dot Matrix & Light Glows */}
      <div className="absolute inset-0 bg-dot-matrix opacity-40"></div>
      <div className="absolute inset-0 opacity-50 pointer-events-none mix-blend-multiply">
        <div className="absolute top-1/2 left-1/4 w-[15rem] h-[15rem] sm:w-[40rem] sm:h-[40rem] bg-blue-100 rounded-full blur-[60px] sm:blur-[120px] animate-float"></div>
        <div className="absolute top-1/3 right-1/4 w-[15rem] h-[15rem] sm:w-[40rem] sm:h-[40rem] bg-indigo-50 rounded-full blur-[60px] sm:blur-[120px] animate-float" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Architectural Border Lines */}
      <div className="absolute top-1/3 left-0 h-px bg-slate-200 animate-draw-line-h" style={{ animationDelay: '0.2s' }}></div>
      <div className="absolute bottom-1/3 left-0 h-px bg-slate-200 animate-draw-line-h" style={{ animationDelay: '0.4s' }}></div>
      <div className="absolute top-0 left-1/4 w-px bg-slate-200 animate-draw-line-v" style={{ animationDelay: '0.6s' }}></div>
      <div className="absolute top-0 right-1/4 w-px bg-slate-200 animate-draw-line-v" style={{ animationDelay: '0.8s' }}></div>

      {/* Animation Stage within a frosted glass structural container */}
      <div className="relative w-full max-w-5xl px-4 sm:px-10 flex flex-col items-center justify-center z-10">

        {/* Container for the text and the syncing truck */}
        <div className="relative isolate px-6 py-8 sm:px-12 sm:py-10 bg-white border-2 border-black shadow-[8px_8px_0px_#000] sm:shadow-[12px_12px_0px_#000] rounded-none w-max mx-auto">

          {/* Text Reveal Layer matched to App.jsx but elevated */}
          <div className="text-4xl sm:text-6xl md:text-8xl leading-none text-blue-600 select-none whitespace-nowrap animate-reveal-clip relative z-10 flex items-center py-2 tracking-tight">
            <span className="font-black italic">Cargo</span>
            <span className="font-semibold text-black ml-1">Route</span>
          </div>

          {/* The Truck Reveal Vehicle */}
          <div className="absolute top-1/2 -translate-y-1/2 left-0 h-full z-20 pointer-events-none w-full">
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-[65%] animate-sync-drive">
              <FaTruckFast className="text-blue-600 w-[60px] h-auto sm:w-[140px]" />
            </div>
          </div>

        </div>

        {/* Technical Subtext - Highly Minimal */}
        <div className="mt-12 flex flex-col items-center animate-fade-in-up" style={{ animationDelay: '2.4s' }}>
          <p className="text-slate-400 text-xs md:text-sm font-bold tracking-[0.3em] uppercase">
            Optimizing every mile
          </p>
          <div className="mt-6 flex gap-3">
            <span className="w-2 h-2 bg-blue-600 animate-pulse"></span>
            <span className="w-2 h-2 bg-blue-400 animate-pulse" style={{ animationDelay: '0.2s' }}></span>
            <span className="w-2 h-2 bg-black animate-pulse" style={{ animationDelay: '0.4s' }}></span>
          </div>
        </div>
      </div>

      {/* Credit Link */}
      <div className="absolute bottom-6 left-0 right-0 text-center z-20 animate-fade-in-up" style={{ animationDelay: '2.8s' }}>
        <a 
          href="https://arnb.in" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-slate-400 text-[10px] font-bold tracking-[0.2em] uppercase hover:text-blue-600 transition-colors"
        >
          arnb.in
        </a>
      </div>

      {/* Progress Line */}
      <div className="absolute bottom-0 left-0 h-1.5 bg-blue-600 transition-all duration-[3000ms] ease-linear" style={{ width: isFadingOut ? '100%' : '0%' }}></div>
    </div>
  );
}
