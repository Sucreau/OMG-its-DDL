import React, { useRef, useState } from 'react';
import { GameState } from '../types';
import { Upload, Music, Settings, X, Volume2, RotateCcw, Check, ToggleLeft, ToggleRight } from 'lucide-react';

interface Props {
  setGameState: (state: GameState) => void;
  setBgmUrl: (url: string) => void;
  bgmUrl: string | null;
  // Music Settings Props
  isMusicOn: boolean;
  setIsMusicOn: (on: boolean) => void;
  musicVolume: number;
  setMusicVolume: (vol: number) => void;
}

const MainMenu: React.FC<Props> = ({ 
  setGameState, 
  setBgmUrl, 
  bgmUrl,
  isMusicOn,
  setIsMusicOn,
  musicVolume,
  setMusicVolume
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showSettings, setShowSettings] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setBgmUrl(objectUrl);
    }
  };

  const handleResetVolume = () => {
    setMusicVolume(0.8);
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-yellow-100 text-slate-800 p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-10 left-10 text-9xl opacity-10 animate-pulse">⏰</div>
      <div className="absolute bottom-10 right-10 text-9xl opacity-10 animate-bounce">📚</div>

      <h1 className="text-6xl md:text-8xl font-black mb-8 text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-purple-800 tracking-tighter text-center">
        OMG<br/>it's DDL!
      </h1>
      
      <p className="text-xl mb-8 font-mono text-center max-w-lg">
        用你的鼻子控制方向。<br/>在截止日期前活下来并完成作业！
      </p>

      {/* Main Action Buttons */}
      <div className="flex flex-col gap-4 w-full max-w-md relative z-10 items-center">
        <button 
          onClick={() => setGameState(GameState.PLAYING)}
          className="w-full bg-black text-white text-2xl font-bold py-4 px-8 rounded-xl hover:scale-105 hover:bg-gray-800 transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,0.3)] border-2 border-black"
        >
          开始游戏
        </button>
        
        <button 
          onClick={() => setGameState(GameState.RULES)}
          className="w-full bg-white text-black text-xl font-bold py-4 px-8 rounded-xl hover:bg-gray-50 transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)] border-2 border-black"
        >
          查看规则
        </button>

        {/* Music Settings Button - Smaller and less prominent */}
        <button 
          onClick={() => setShowSettings(true)}
          className="mt-2 bg-white/50 text-slate-700 text-sm font-bold py-2 px-6 rounded-full hover:bg-white hover:shadow-md transition-all border border-black/10 flex items-center justify-center gap-2"
        >
          <Settings size={16} /> 音乐设置
          {bgmUrl && <span className="w-2 h-2 rounded-full bg-green-500"></span>}
        </button>
      </div>

      <div className="mt-12 text-sm text-gray-500">
        需要摄像头权限 • 推荐使用电脑端体验
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl border-4 border-black w-full max-w-md overflow-hidden animate-fade-up">
            {/* Modal Header */}
            <div className="bg-gray-100 p-4 border-b-2 border-gray-200 flex justify-between items-center">
              <h2 className="text-2xl font-black flex items-center gap-2">
                <Music className="text-purple-600" /> 音乐设置
              </h2>
              <button 
                onClick={() => setShowSettings(false)}
                className="p-1 hover:bg-gray-200 rounded-full transition"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              
              {/* 1. File Upload */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">背景音乐文件</label>
                <input 
                  type="file" 
                  accept="audio/*" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden" 
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full py-3 px-4 rounded-xl border-2 border-dashed flex items-center justify-center gap-2 transition-all group
                    ${bgmUrl ? 'bg-green-50 border-green-500 text-green-700' : 'bg-gray-50 border-gray-300 text-gray-500 hover:border-black hover:text-black'}`}
                >
                  {bgmUrl ? (
                    <>
                      <Check size={20} /> 音乐已加载 (点击更换)
                    </>
                  ) : (
                    <>
                      <Upload size={20} className="group-hover:-translate-y-1 transition-transform"/> 点击上传音频文件
                    </>
                  )}
                </button>
              </div>

              <div className="h-px bg-gray-200" />

              {/* 2. On/Off Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-lg font-bold">播放音乐</span>
                  <span className="text-xs text-gray-400">在游戏中启用背景音乐</span>
                </div>
                <button 
                  onClick={() => setIsMusicOn(!isMusicOn)}
                  className={`transition-colors duration-200 ${isMusicOn ? 'text-green-600' : 'text-gray-400'}`}
                >
                  {isMusicOn ? <ToggleRight size={48} fill="currentColor" className="text-white bg-green-500 rounded-full" /> : <ToggleLeft size={48} className="text-gray-300"/>}
                </button>
              </div>

              {/* 3. Volume Slider */}
              <div className={`space-y-3 transition-opacity ${!isMusicOn ? 'opacity-50 pointer-events-none' : ''}`}>
                <div className="flex justify-between items-end">
                  <label className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                    <Volume2 size={16} /> 音量大小 ({Math.round(musicVolume * 100)}%)
                  </label>
                  <button 
                    onClick={handleResetVolume}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 px-2 py-1 rounded hover:bg-blue-50 transition"
                    title="重置为 80%"
                  >
                    <RotateCcw size={12} /> 重置
                  </button>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.01" 
                  value={musicVolume}
                  onChange={(e) => setMusicVolume(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
                />
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button 
                onClick={() => setShowSettings(false)}
                className="bg-black text-white font-bold py-2 px-6 rounded-lg hover:bg-gray-800 transition"
              >
                完成
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MainMenu;