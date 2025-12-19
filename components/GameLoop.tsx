import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GamePhase, GameState, GameObject, ItemType, PlayerState, PopUpMessage, ActiveEffect } from '../types';
import { TOTAL_TIME, PHASE_THRESHOLDS, VITALITY_DECAY, MOVEMENT_SMOOTHING, PLAYER_SIZE, ITEM_SIZE, DEFAULT_EXPRESSIONS } from '../constants';
import { initializeFaceLandmarker, detectNose, isFaceLandmarkerLoaded } from '../services/visionService';
import { Smartphone, BookOpen, Utensils, Coffee, Search, MessageCircle, AlertTriangle, FileText, Loader2, Music } from 'lucide-react';

interface GameLoopProps {
  onGameOver: (state: GameState) => void;
  bgmUrl: string | null;
  // Music Settings passed from App
  isMusicOn: boolean;
  musicVolume: number;
}

const GameLoop: React.FC<GameLoopProps> = ({ onGameOver, bgmUrl, isMusicOn, musicVolume }) => {
  // Game State Refs (Mutable for performance)
  const playerRef = useRef<PlayerState>({
    x: 50, y: 50,
    vitality: 100,
    progress: 0,
    isStunned: false,
    stunEndTime: 0,
    faceExpression: '🙂',
    expressionEndTime: 0,
    activeEffects: []
  });
  
  const objectsRef = useRef<GameObject[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // UI Direct Refs (For high performance updates bypassing React state)
  const vitalityBarRef = useRef<HTMLDivElement>(null);
  const vitalityTextRef = useRef<HTMLSpanElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const progressTextRef = useRef<HTMLSpanElement>(null);
  
  // Audio Refs (For SFX only now)
  const audioCtxRef = useRef<AudioContext | null>(null);

  const requestRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const warmupStartTimeRef = useRef<number>(0);
  const lastTickRef = useRef<number>(Date.now());
  const spawnTimerRef = useRef<number>(0);
  const isGameOverRef = useRef<boolean>(false);
  const isWarmupDoneRef = useRef<boolean>(false);
  
  // UI State
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const [phase, setPhase] = useState<GamePhase>(GamePhase.DAY);
  const [uiPlayer, setUiPlayer] = useState<PlayerState>(playerRef.current);
  const [renderObjects, setRenderObjects] = useState<GameObject[]>([]);
  const [popups, setPopups] = useState<PopUpMessage[]>([]);
  const [isModelReady, setIsModelReady] = useState(false);
  const [showSkipButton, setShowSkipButton] = useState(false);
  const [countdownLabel, setCountdownLabel] = useState<string | null>(null);
  
  // BGM State
  const [isBgmPlaying, setIsBgmPlaying] = useState(false);
  const [showPlayButton, setShowPlayButton] = useState(false);

  // --- AUDIO SYSTEM (SFX Only) ---

  const initAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
        audioCtxRef.current = new AudioContext();
      }
    }
    // Resume if suspended (browser policy)
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  const playSFX = useCallback((type: 'progress' | 'vitality' | 'bad' | 'alert' | 'beep' | 'go') => {
    try {
      const ctx = initAudioContext();
      if (!ctx) return;
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      const now = ctx.currentTime;
      const vol = 0.1; // Master volume for SFX

      switch (type) {
        case 'progress': // High pitch chime (Sine)
          osc.type = 'sine';
          osc.frequency.setValueAtTime(523.25, now);
          osc.frequency.exponentialRampToValueAtTime(1046.50, now + 0.1);
          gain.gain.setValueAtTime(vol, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
          osc.start(now);
          osc.stop(now + 0.4);
          break;
        case 'vitality': // Warm rising tone (Triangle)
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(300, now);
          osc.frequency.linearRampToValueAtTime(500, now + 0.2);
          gain.gain.setValueAtTime(vol, now);
          gain.gain.linearRampToValueAtTime(0.001, now + 0.2);
          osc.start(now);
          osc.stop(now + 0.2);
          break;
        case 'bad': // Low descending buzz (Sawtooth)
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(150, now);
          osc.frequency.exponentialRampToValueAtTime(50, now + 0.4);
          gain.gain.setValueAtTime(vol, now);
          gain.gain.linearRampToValueAtTime(0.001, now + 0.4);
          osc.start(now);
          osc.stop(now + 0.4);
          break;
        case 'alert': // Sharp alarm (Square)
          osc.type = 'square';
          osc.frequency.setValueAtTime(880, now);
          osc.frequency.setValueAtTime(0, now + 0.1);
          osc.frequency.setValueAtTime(880, now + 0.15);
          gain.gain.setValueAtTime(vol, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
          osc.start(now);
          osc.stop(now + 0.4);
          break;
        case 'beep': // Short count beep
          osc.type = 'sine';
          osc.frequency.setValueAtTime(440, now);
          gain.gain.setValueAtTime(vol, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
          osc.start(now);
          osc.stop(now + 0.1);
          break;
        case 'go': // High Go beep
          osc.type = 'square';
          osc.frequency.setValueAtTime(880, now);
          gain.gain.setValueAtTime(vol, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
          osc.start(now);
          osc.stop(now + 0.4);
          break;
      }
    } catch (e) {
      console.error("Audio play failed", e);
    }
  }, [initAudioContext]);

  // Update Volume when prop changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = musicVolume;
    }
  }, [musicVolume]);

  // Handle BGM Playback
  const playBGM = useCallback(() => {
    if (!isMusicOn) return; // Do not play if disabled in settings

    if (audioRef.current && bgmUrl) {
      // Ensure volume is set before playing
      audioRef.current.volume = musicVolume;
      audioRef.current.play()
        .then(() => {
          setIsBgmPlaying(true);
          setShowPlayButton(false);
        })
        .catch(err => {
          console.warn("Autoplay blocked, showing button:", err);
          setShowPlayButton(true);
        });
    }
  }, [bgmUrl, isMusicOn, musicVolume]);

  const stopBGM = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsBgmPlaying(false);
    }
  }, []);

  // Setup Vision & Init
  useEffect(() => {
    initializeFaceLandmarker();
    isGameOverRef.current = false;
    isWarmupDoneRef.current = false;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Camera error:", err);
        alert("摄像头无法启动，请检查权限。");
      }
    };
    startCamera();

    // Poll for model ready
    const checkInterval = setInterval(() => {
      if (isFaceLandmarkerLoaded()) {
        handleGameStart();
        clearInterval(checkInterval);
      }
    }, 200);

    // Timeout safety net
    const timeoutTimer = setTimeout(() => {
      if (!isFaceLandmarkerLoaded()) {
        setShowSkipButton(true);
      }
    }, 3000);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      clearInterval(checkInterval);
      clearTimeout(timeoutTimer);
      stopBGM();
      // Close audio context on unmount
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
    };
  }, [stopBGM]);

  const handleGameStart = () => {
    if (isModelReady) return; 
    setIsModelReady(true);
    warmupStartTimeRef.current = Date.now();
    lastTickRef.current = Date.now();
  };

  const addPopup = (text: string, x: number, y: number, type: 'good' | 'bad' | 'neutral') => {
    setPopups(prev => [...prev, { id: Math.random().toString(), text, x, y, type, createdAt: Date.now() }]);
    setTimeout(() => {
      setPopups(prev => prev.filter(p => Date.now() - p.createdAt < 1500));
    }, 1500);
  };

  const spawnItem = (currentPhase: GamePhase, currentTime: number) => {
    const r = Math.random();
    let type: ItemType = ItemType.MATERIAL;
    let speed = 0.3; 
    let size = ITEM_SIZE;
    let isTracking = false;

    const isLowVitality = playerRef.current.vitality < 30;

    // Spawn logic
    if (currentPhase === GamePhase.DAY) {
      if (r < 0.4) type = ItemType.MATERIAL; 
      else if (r < 0.7) type = ItemType.PHONE; 
      else type = ItemType.SNACK; 
      speed = 0.2;
    } else if (currentPhase === GamePhase.DUSK) {
      if (r < 0.2) type = ItemType.DINNER; 
      else if (r < 0.4) type = ItemType.PHONE; 
      else if (r < 0.7) type = ItemType.MATERIAL; 
      else type = ItemType.SOCIAL_NOTIF; 
      speed = 0.4;
      if (type === ItemType.SOCIAL_NOTIF || type === ItemType.PHONE) isTracking = true;
    } else {
      if (r < 0.45) type = ItemType.COFFEE; 
      else if (r < 0.7) type = ItemType.SEARCH; 
      else type = ItemType.POPUP_OBSTACLE; 
      speed = 0.6;
    }

    if (isLowVitality && type !== ItemType.POPUP_OBSTACLE && Math.random() < 0.4) {
      type = ItemType.SNACK;
    }

    if (type === ItemType.POPUP_OBSTACLE) {
      playSFX('alert'); 
      const obj: GameObject = {
        id: Math.random().toString(36).substr(2, 9),
        type,
        x: Math.random() * 80 + 10,
        y: Math.random() * 80 + 10,
        width: 25,
        height: 15,
        dx: 0, dy: 0,
        createdAt: currentTime
      };
      objectsRef.current.push(obj);
      return;
    }

    if (type === ItemType.DINNER) size = ITEM_SIZE * 1.5; 
    if (type === ItemType.PHONE) size = ITEM_SIZE * 1.5;
    if (type === ItemType.SEARCH) size = ITEM_SIZE * 1.5;

    const side = Math.floor(Math.random() * 4); 
    let startX = 50, startY = 50;
    
    switch(side) {
      case 0: startX = Math.random() * 90 + 5; startY = -10; break;
      case 1: startX = 110; startY = Math.random() * 90 + 5; break;
      case 2: startX = Math.random() * 90 + 5; startY = 110; break;
      case 3: startX = -10; startY = Math.random() * 90 + 5; break;
    }

    const targetX = isTracking ? playerRef.current.x : 50 + (Math.random() * 40 - 20);
    const targetY = isTracking ? playerRef.current.y : 50 + (Math.random() * 40 - 20);
    
    const angle = Math.atan2(targetY - startY, targetX - startX);
    const dx = Math.cos(angle) * speed;
    const dy = Math.sin(angle) * speed;

    const obj: GameObject = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      x: startX,
      y: startY,
      width: size,
      height: size,
      dx, dy,
      createdAt: currentTime
    };
    objectsRef.current.push(obj);
  };

  const applyEffect = (player: PlayerState, type: 'vitality' | 'progress', amount: number, duration: number = 0) => {
    if (duration === 0) {
      if (type === 'vitality') player.vitality = Math.min(100, Math.max(0, player.vitality + amount));
      if (type === 'progress') player.progress = Math.min(100, Math.max(0, player.progress + amount));
    } else {
      player.activeEffects.push({
        id: Math.random().toString(),
        type,
        amount,
        duration,
        elapsed: 0
      });
    }
  };

  const setExpression = (player: PlayerState, exp: string, duration: number) => {
    player.faceExpression = exp;
    player.expressionEndTime = Date.now() + duration * 1000;
  };

  const handleItemCollision = (player: PlayerState, item: GameObject) => {
    if (player.isStunned) return;

    switch (item.type) {
      case ItemType.MATERIAL:
        playSFX('progress');
        applyEffect(player, 'progress', 10);
        addPopup("+10% 进度", player.x, player.y - 10, 'good');
        break;
      case ItemType.SNACK:
        playSFX('vitality');
        applyEffect(player, 'vitality', 10); 
        addPopup("+10% 活力", player.x, player.y - 10, 'good');
        break;
      case ItemType.PHONE:
        playSFX('bad');
        player.isStunned = true;
        player.stunEndTime = Date.now() + 1500; 
        setExpression(player, '🤩', 1.5);
        applyEffect(player, 'vitality', -10, 1.5); 
        addPopup("玩手机...", player.x, player.y - 10, 'bad');
        break;
      case ItemType.DINNER:
        playSFX('vitality');
        player.isStunned = true;
        player.stunEndTime = Date.now() + 1500; 
        setExpression(player, '😋', 1.5);
        applyEffect(player, 'vitality', 30, 1.5); 
        addPopup("真香！", player.x, player.y - 10, 'good');
        break;
      case ItemType.SOCIAL_NOTIF:
        if (Math.random() < 0.5) {
          playSFX('progress');
          addPopup("有效消息!", player.x, player.y - 15, 'good');
          setExpression(player, '😆', 1);
          applyEffect(player, 'progress', 20);
        } else {
          playSFX('bad');
          addPopup("无效消息...", player.x, player.y - 15, 'bad');
          setExpression(player, '😭', 1);
          applyEffect(player, 'vitality', -20);
        }
        break;
      case ItemType.COFFEE:
        playSFX('vitality');
        applyEffect(player, 'vitality', 10);
        addPopup("咖啡续命", player.x, player.y - 10, 'good');
        break;
      case ItemType.SEARCH:
        playSFX('progress');
        player.isStunned = true;
        player.stunEndTime = Date.now() + 3000;
        applyEffect(player, 'progress', 20, 3);
        addPopup("搜索中...", player.x, player.y - 10, 'good');
        break;
      default:
        break;
    }
  };

  const update = useCallback(() => {
    if (isGameOverRef.current) return;

    if (!isModelReady) {
      requestRef.current = requestAnimationFrame(update);
      return;
    }

    const now = Date.now();
    const dt = (now - lastTickRef.current) / 1000; 
    lastTickRef.current = now;

    // Handle Warmup Phase
    let isWarmup = !isWarmupDoneRef.current;
    if (isWarmup) {
      const warmupElapsed = (now - warmupStartTimeRef.current) / 1000;
      const remainingWarmup = 3 - warmupElapsed;
      
      if (remainingWarmup <= 0) {
        if (remainingWarmup > -1) {
           setCountdownLabel("冲！"); 
        } else {
           setCountdownLabel(null);
        }

        if (!isWarmupDoneRef.current && remainingWarmup <= 0) {
           isWarmupDoneRef.current = true;
           startTimeRef.current = now; 
           playSFX('go');
           
           // Start BGM (if enabled)
           playBGM();

           isWarmup = false;
        }
      } else {
        const newLabel = Math.ceil(remainingWarmup).toString();
        setCountdownLabel(prev => {
           if (prev !== newLabel) playSFX('beep');
           return newLabel;
        });
      }
    }

    // --- GAME LOGIC ---
    const player = playerRef.current;
    
    if (!isWarmup) {
      const elapsed = (now - startTimeRef.current) / 1000;
      const remaining = Math.max(0, TOTAL_TIME - elapsed);
      setTimeLeft(remaining);

      let currentPhase = GamePhase.DAY;
      if (elapsed > 40) currentPhase = GamePhase.NIGHT;
      else if (elapsed > 20) currentPhase = GamePhase.DUSK;
      
      if (phase !== currentPhase) setPhase(currentPhase);

      // Game Over Checks
      if (player.vitality <= 0) {
        isGameOverRef.current = true;
        stopBGM();
        onGameOver(GameState.GAME_OVER_FAIL);
        return; 
      }
      if (player.progress >= 100) {
        isGameOverRef.current = true;
        stopBGM();
        onGameOver(GameState.GAME_OVER_SUCCESS);
        return;
      }
      if (remaining <= 0) {
        isGameOverRef.current = true;
        stopBGM();
        onGameOver(GameState.GAME_OVER_NORMAL);
        return;
      }
    }

    // Movement
    if (videoRef.current && !player.isStunned) {
      const nose = detectNose(videoRef.current);
      if (nose) {
        const targetX = nose.x * 100;
        const targetY = nose.y * 100;
        const speedFactor = 0.2 + (player.vitality / 100) * 0.8;
        player.x += (targetX - player.x) * MOVEMENT_SMOOTHING * speedFactor;
        player.y += (targetY - player.y) * MOVEMENT_SMOOTHING * speedFactor;
      }
    }

    // Unstun
    if (player.isStunned && now > player.stunEndTime) {
      player.isStunned = false;
    }

    // Expression Reset
    if (now > player.expressionEndTime) {
      player.faceExpression = DEFAULT_EXPRESSIONS[phase];
    }

    // Stats
    if (!isWarmup) {
      const baseDecay = VITALITY_DECAY[phase];
      player.vitality -= baseDecay * dt;

      player.activeEffects = player.activeEffects.filter(eff => {
        const step = (eff.amount / eff.duration) * dt;
        if (eff.type === 'vitality') player.vitality += step;
        if (eff.type === 'progress') player.progress += step;
        
        eff.elapsed += dt;
        return eff.elapsed < eff.duration;
      });

      player.vitality = Math.max(0, Math.min(100, player.vitality));
      player.progress = Math.max(0, Math.min(100, player.progress));
    }

    // --- DIRECT DOM UPDATES (Fix for React render lag) ---
    // Instead of relying on setUiPlayer state update which might be batched/throttled by React,
    // we update the vital visual elements directly.
    if (vitalityBarRef.current && !isWarmup) {
       const v = Math.max(0, Math.min(100, player.vitality));
       const hue = Math.round(v * 1.2);
       vitalityBarRef.current.style.width = `${v}%`;
       vitalityBarRef.current.style.backgroundColor = `hsl(${hue}, 90%, 50%)`;
    }
    if (vitalityTextRef.current && !isWarmup) {
       vitalityTextRef.current.innerText = `${Math.round(player.vitality)}%`;
    }
    if (progressBarRef.current && !isWarmup) {
       const p = Math.max(0, Math.min(100, player.progress));
       progressBarRef.current.style.width = `${p}%`;
    }
    if (progressTextRef.current && !isWarmup) {
      progressTextRef.current.innerText = `${Math.round(player.progress)}%`;
    }


    // Spawn
    spawnTimerRef.current += dt;
    const spawnInterval = phase === GamePhase.NIGHT ? 0.8 : (phase === GamePhase.DUSK ? 1.5 : 2.0);
    if (spawnTimerRef.current > spawnInterval) {
      spawnItem(phase, now);
      spawnTimerRef.current = 0;
    }

    // Physics
    const pRadius = PLAYER_SIZE / 2;
    
    objectsRef.current.forEach((obj, idx) => {
      if (obj.type !== ItemType.POPUP_OBSTACLE) {
        obj.x += obj.dx;
        obj.y += obj.dy;
      }

      if (obj.x < -20 || obj.x > 120 || obj.y < -20 || obj.y > 120) {
        obj.createdAt = 0; 
        return;
      }

      if (!isWarmup) {
        const objRadius = obj.width / 2; 
        
        if (obj.type === ItemType.POPUP_OBSTACLE) {
          if (player.x + pRadius > obj.x && player.x - pRadius < obj.x + obj.width &&
              player.y + pRadius > obj.y && player.y - pRadius < obj.y + obj.height) {
             const centerX = obj.x + obj.width/2;
             const centerY = obj.y + obj.height/2;
             const pushDirX = player.x - centerX;
             const pushDirY = player.y - centerY;
             const len = Math.sqrt(pushDirX*pushDirX + pushDirY*pushDirY) || 1;
             player.x += (pushDirX/len) * 2;
             player.y += (pushDirY/len) * 2;
          }
        } else {
          const dist = Math.sqrt((player.x - obj.x)**2 + (player.y - obj.y)**2);
          if (dist < pRadius + objRadius) {
            handleItemCollision(player, obj);
            obj.createdAt = 0; 
          }
        }
      }
    });

    objectsRef.current = objectsRef.current.filter(o => o.createdAt !== 0);

    setUiPlayer({...player});
    setRenderObjects([...objectsRef.current]);

    if (!isGameOverRef.current) {
      requestRef.current = requestAnimationFrame(update);
    }
  }, [onGameOver, phase, playSFX, isModelReady, playBGM, stopBGM]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(requestRef.current);
  }, [update]);

  // Styles
  const getBgClass = () => {
    if (phase === GamePhase.DAY) return 'bg-sky-200/40';
    if (phase === GamePhase.DUSK) return 'bg-orange-200/40';
    return 'bg-slate-900/70';
  };

  const getOverlayClass = () => {
    if (phase === GamePhase.DAY) return 'opacity-0';
    if (phase === GamePhase.DUSK) return 'bg-orange-500/20';
    return 'bg-black/40';
  };

  // Initial render calculations (React state acts as fallback/initial value)
  const vitalityPercent = Math.max(0, Math.min(100, uiPlayer.vitality));
  const vitalityHue = Math.round(vitalityPercent * 1.2); 
  const isLowVitality = uiPlayer.vitality < 30;

  return (
    <div className={`relative w-full h-full overflow-hidden bg-black`}>
      {bgmUrl && (
        <audio 
          ref={audioRef}
          src={bgmUrl}
          loop
          preload="auto"
        />
      )}
      
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        muted 
        className="absolute inset-0 w-full h-full object-cover transform -scale-x-100" 
      />
      
      <div className={`absolute inset-0 pointer-events-none transition-colors duration-1000 ${getBgClass()}`} />
      <div className={`absolute inset-0 pointer-events-none transition-all duration-1000 ${getOverlayClass()}`} />

      {/* Loading Overlay */}
      {!isModelReady && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 text-white">
          <Loader2 className="w-12 h-12 animate-spin mb-4" />
          <div className="text-xl font-bold">正在加载 AI 模型...</div>
          <div className="text-sm opacity-70 mt-2">请稍候 (Need Camera Permission)</div>
          
          {showSkipButton && (
            <button 
              onClick={handleGameStart}
              className="mt-6 px-4 py-2 bg-red-600 rounded text-sm hover:bg-red-700 transition"
            >
              跳过等待 (AI可能未就绪)
            </button>
          )}
        </div>
      )}

      {/* Countdown Overlay */}
      {isModelReady && countdownLabel && (
        <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div 
            key={countdownLabel} 
            className={`text-9xl font-black text-yellow-400 drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] ${countdownLabel === "冲！" ? "animate-fade-out" : "animate-bounce scale-150"}`}
          >
            {countdownLabel}
          </div>
        </div>
      )}

      {/* Manual BGM Toggle */}
      {showPlayButton && bgmUrl && isMusicOn && (
        <button 
          onClick={() => playBGM()}
          className="absolute top-20 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-full shadow-lg hover:scale-105 transition-all bg-green-600 text-white animate-pulse"
        >
          <Music size={20} />
          <span className="text-xs font-bold">播放音乐</span>
        </button>
      )}

      {/* UI Header */}
      <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start pointer-events-none z-50">
        <div className="flex flex-col gap-2 w-1/2 md:w-1/3">
          {/* Vitality Bar */}
          <div className={`bg-white/80 p-2 rounded-lg shadow border backdrop-blur-sm transition-all duration-200 ${isLowVitality ? 'border-red-500 shake-anim bg-red-50/90' : 'border-gray-200'}`}>
            <div className="text-xs font-bold text-gray-600 mb-1 flex justify-between">
              <span className={isLowVitality ? "text-red-600 font-black" : ""}>活力 (Vitality)</span>
              <span ref={vitalityTextRef} className={isLowVitality ? "text-red-600 font-black" : ""}>{Math.round(uiPlayer.vitality)}%</span>
            </div>
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden border border-gray-300/50">
              <div 
                ref={vitalityBarRef}
                className="h-full ease-out" 
                style={{ 
                  width: `${vitalityPercent}%`,
                  backgroundColor: `hsl(${vitalityHue}, 90%, 50%)`
                }}
              />
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="bg-white/80 p-2 rounded-lg shadow border border-gray-200 backdrop-blur-sm">
            <div className="text-xs font-bold text-gray-600 mb-1 flex justify-between">
              <span>作业完成度 (Done)</span>
              <span ref={progressTextRef}>{Math.round(uiPlayer.progress)}%</span>
            </div>
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              <div 
                ref={progressBarRef}
                className="h-full bg-blue-600"
                style={{ width: `${Math.min(100, Math.max(0, uiPlayer.progress))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Timer */}
        <div className="text-4xl font-black text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] font-mono">
          {Math.ceil(timeLeft)}s
        </div>
      </div>

      {/* Phase Indicator Text */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 text-2xl font-bold text-white/90 uppercase pointer-events-none z-0 drop-shadow-md">
        {phase === GamePhase.DAY && "☀️ 白天"}
        {phase === GamePhase.DUSK && "🌆 傍晚"}
        {phase === GamePhase.NIGHT && "🌙 深夜"}
      </div>

      {/* Game Area */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Render Objects */}
        {renderObjects.map(obj => {
          let Icon = FileText;
          let color = 'text-gray-700';
          let bgColor = 'bg-white';
          let label: string | null = null;
          let shake = false;

          switch (obj.type) {
            case ItemType.MATERIAL: Icon = BookOpen; color='text-blue-600'; label='资料'; break;
            case ItemType.SNACK: Icon = Utensils; color='text-orange-500'; label='零食'; break;
            case ItemType.PHONE: Icon = Smartphone; color='text-purple-600'; label='玩手机'; break;
            case ItemType.DINNER: Icon = Utensils; color='text-yellow-600'; bgColor='bg-yellow-100'; label='晚饭'; break;
            case ItemType.SOCIAL_NOTIF: 
              Icon = MessageCircle; 
              color='text-white'; 
              bgColor='bg-green-500'; 
              shake = true; 
              break;
            case ItemType.COFFEE: Icon = Coffee; color='text-amber-800'; break;
            case ItemType.SEARCH: Icon = Search; color='text-indigo-600'; label='查资料'; break;
            case ItemType.POPUP_OBSTACLE: 
              Icon = AlertTriangle; 
              color='text-red-600'; 
              bgColor='bg-red-100';
              shake = true;
              break;
          }

          if (obj.type === ItemType.POPUP_OBSTACLE) {
            return (
              <div
                key={obj.id}
                className="absolute flex flex-col items-center justify-center border-4 border-red-500 shadow-xl bg-white/95 z-20"
                style={{
                  left: `${obj.x}%`,
                  top: `${obj.y}%`,
                  width: `${obj.width}%`,
                  height: `${obj.height}%`,
                  transform: 'translate(0, 0)'
                }}
              >
                <div className="flex items-center gap-2 text-red-600 font-bold text-center p-2">
                  <AlertTriangle size={32} />
                  <div className="text-sm font-black">DDL<br/>WARNING</div>
                </div>
              </div>
            );
          }

          return (
            <div
              key={obj.id}
              className={`absolute flex flex-col items-center justify-center rounded-full shadow-lg transition-transform ${shake ? 'animate-bounce' : ''} ${bgColor}`}
              style={{
                left: `${obj.x}%`,
                top: `${obj.y}%`,
                width: `${obj.width}vw`,
                height: `${obj.height}vw`,
                transform: 'translate(-50%, -50%)'
              }}
            >
              <div className={`${color}`}>
                 <Icon size={24} />
              </div>
              {label && <span className="absolute -bottom-6 bg-black/60 text-white text-[10px] px-1 rounded whitespace-nowrap backdrop-blur-md">{label}</span>}
            </div>
          );
        })}

        {/* Player */}
        <div 
          className="absolute z-30 flex items-center justify-center pointer-events-none transition-transform duration-75 ease-out"
          style={{
            left: `${uiPlayer.x}%`,
            top: `${uiPlayer.y}%`,
            width: `${PLAYER_SIZE}vw`,
            height: `${PLAYER_SIZE}vw`,
            transform: 'translate(-50%, -50%)'
          }}
        >
          <div className={`text-4xl md:text-5xl drop-shadow-lg ${uiPlayer.isStunned ? 'animate-spin' : ''}`}>
             {uiPlayer.faceExpression}
          </div>
        </div>

        {/* Popups */}
        {popups.map(p => (
           <div 
             key={p.id}
             className={`absolute z-40 px-3 py-1 rounded-full text-sm font-bold shadow-md animate-fade-up whitespace-nowrap
               ${p.type === 'good' ? 'bg-green-500 text-white' : (p.type === 'bad' ? 'bg-red-500 text-white' : 'bg-gray-600 text-white')}`}
             style={{ 
               left: `${p.x}%`, 
               top: `${p.y}%`,
               transform: 'translate(-50%, -150%)'
             }}
           >
             {p.text}
           </div>
        ))}
      </div>
    </div>
  );
};

export default GameLoop;