import React, { useState } from 'react';
import { GameState } from './types';
import MainMenu from './components/MainMenu';
import Rules from './components/Rules';
import GameLoop from './components/GameLoop';
import ResultScreen from './components/ResultScreen';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [bgmUrl, setBgmUrl] = useState<string | null>(null);
  
  // Music Settings State
  const [isMusicOn, setIsMusicOn] = useState<boolean>(true);
  const [musicVolume, setMusicVolume] = useState<number>(0.8); // Default 80%

  return (
    <div className="w-full h-screen overflow-hidden">
      {gameState === GameState.MENU && (
        <MainMenu 
          setGameState={setGameState} 
          setBgmUrl={setBgmUrl} 
          bgmUrl={bgmUrl}
          isMusicOn={isMusicOn}
          setIsMusicOn={setIsMusicOn}
          musicVolume={musicVolume}
          setMusicVolume={setMusicVolume}
        />
      )}
      
      {gameState === GameState.RULES && (
        <Rules setGameState={setGameState} />
      )}

      {gameState === GameState.PLAYING && (
        <GameLoop 
          onGameOver={setGameState} 
          bgmUrl={bgmUrl} 
          isMusicOn={isMusicOn}
          musicVolume={musicVolume}
        />
      )}

      {(gameState === GameState.GAME_OVER_FAIL || 
        gameState === GameState.GAME_OVER_SUCCESS || 
        gameState === GameState.GAME_OVER_NORMAL) && (
        <ResultScreen state={gameState} setGameState={setGameState} />
      )}
    </div>
  );
};

export default App;