import React, { useEffect } from 'react';
import { GameState } from '../types';

interface Props {
  state: GameState;
  setGameState: (state: GameState) => void;
}

const ResultScreen: React.FC<Props> = ({ state, setGameState }) => {
  let title = "";
  let sub = "";
  let bgClass = "";
  let emoji = "";

  switch (state) {
    case GameState.GAME_OVER_FAIL:
      title = "失败";
      sub = "你累死了。再忙也要注意身体！";
      bgClass = "bg-red-900 text-white";
      emoji = "💀";
      break;
    case GameState.GAME_OVER_SUCCESS:
      title = "成功";
      sub = "刚好赶上了，可喜可贺！";
      bgClass = "bg-green-600 text-white";
      emoji = "🎉";
      break;
    case GameState.GAME_OVER_NORMAL:
      title = "DDL截止了";
      sub = "你没有完成作业。想想该怎么和老师解释吧。";
      bgClass = "bg-gray-800 text-gray-200";
      emoji = "😐";
      break;
    default:
      break;
  }

  useEffect(() => {
    const playEndSound = () => {
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        const now = ctx.currentTime;
        const vol = 0.2;

        if (state === GameState.GAME_OVER_SUCCESS) {
          // Major Arpeggio
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(523.25, now);
          osc.frequency.setValueAtTime(659.25, now + 0.1);
          osc.frequency.setValueAtTime(783.99, now + 0.2);
          osc.frequency.setValueAtTime(1046.50, now + 0.3);
          gain.gain.setValueAtTime(vol, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
          osc.start(now);
          osc.stop(now + 1.5);
        } else if (state === GameState.GAME_OVER_FAIL) {
          // Sad slide
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(200, now);
          osc.frequency.linearRampToValueAtTime(50, now + 1.0);
          gain.gain.setValueAtTime(vol, now);
          gain.gain.linearRampToValueAtTime(0.001, now + 1.0);
          osc.start(now);
          osc.stop(now + 1.0);
        } else {
          // Neutral thud
          osc.type = 'square';
          osc.frequency.setValueAtTime(100, now);
          gain.gain.setValueAtTime(vol, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
          osc.start(now);
          osc.stop(now + 0.3);
        }
      } catch (e) {
        console.error(e);
      }
    };
    playEndSound();
  }, [state]);

  return (
    <div className={`flex flex-col items-center justify-center h-screen p-8 text-center ${bgClass}`}>
      <div className="text-9xl mb-8 animate-bounce">{emoji}</div>
      <h1 className="text-6xl md:text-8xl font-black mb-4 uppercase tracking-widest">{title}</h1>
      <p className="text-xl md:text-2xl font-mono mb-12 max-w-2xl">{sub}</p>
      
      <button 
        onClick={() => setGameState(GameState.MENU)}
        className="bg-white text-black text-xl font-bold py-4 px-12 rounded-full hover:scale-105 transition-transform shadow-lg border-4 border-current"
      >
        回到首页
      </button>
    </div>
  );
};

export default ResultScreen;