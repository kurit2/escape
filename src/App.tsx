import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Heart, 
  Volume2, 
  VolumeX, 
  Play, 
  RotateCcw, 
  Info, 
  Sparkles, 
  TrendingUp, 
  Gamepad2, 
  CheckCircle, 
  Skull, 
  HelpCircle, 
  Trophy, 
  Eye, 
  AlertTriangle,
  MousePointerClick,
  Keyboard,
  Clock,
  History
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { sound } from './sound';
import { DIALOGUE_EVENTS, YANDERE_IMAGES } from './data';
import { Knife, Sentiment, DialogueEvent, ScoreRecord } from './types';

export default function App() {
  // Game state
  const [gameStatus, setGameStatus] = useState<'start' | 'playing' | 'dialogue' | 'gameover' | 'clear'>('start');
  const [currentAffection, setCurrentAffection] = useState<number>(0);
  const [currentLevel, setCurrentLevel] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [controlMode, setControlMode] = useState<'keyboard' | 'mouse'>('mouse');
  const [highScores, setHighScores] = useState<ScoreRecord[]>([]);
  const [timeSurvived, setTimeSurvived] = useState<number>(0);

  // Active dialogue states
  const [currentDialogue, setCurrentDialogue] = useState<DialogueEvent | null>(null);
  const [dialogueIndex, setDialogueIndex] = useState<number>(0);
  const [dialogueResponse, setDialogueResponse] = useState<{
    text: string;
    reaction: Sentiment;
    affectionChange: number;
  } | null>(null);

  // General configuration
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // High performance game state refs to prevent React state bottleneck inside 60fps frame
  const playerRef = useRef<{
    x: number;
    y: number;
    radius: number;
    hitRadius: number;
    speed: number;
  }>({
    x: 300,
    y: 300,
    radius: 22, // Increased size from 12 to 22 for better visibility
    hitRadius: 8, // Fine-tuned precise hitbox to stay fair and highly editable (5 -> 8)
    speed: 5.5 // Slightly tuned up speed for smoother feel on a larger scale
  });

  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const mousePosRef = useRef<{ x: number; y: number }>({ x: 300, y: 300 });
  const isMouseDownRef = useRef<boolean>(false);
  const isDraggingPlayerRef = useRef<boolean>(false);
  
  const knivesRef = useRef<Knife[]>([]);
  const resumeDelayRef = useRef<number>(0);
  const particlesRef = useRef<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    alpha: number;
    color: string;
    type: 'star' | 'circle' | 'heart';
    decay: number;
  }[]>([]);

  // Timer values inside refs
  const timeSurvivedRef = useRef<number>(0);
  const lastSpawnTimeRef = useRef<number>(0);
  const dialogueTimerRef = useRef<number>(10.0); // Trigger every 10 seconds
  const autoAffectionTimerRef = useRef<number>(10.0); // Auto +1 affection every 10 seconds
  const currentLevelRef = useRef<number>(1);
  const currentAffectionRef = useRef<number>(0);

  // Load High Scores initially
  useEffect(() => {
    try {
      const stored = localStorage.getItem('yandere_high_scores');
      if (stored) {
        setHighScores(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to parse high scores', e);
    }
  }, []);

  // Save score helper
  const saveScoreRecord = useCallback((cleared: boolean) => {
    const record: ScoreRecord = {
      affection: currentAffectionRef.current,
      level: currentLevelRef.current,
      timeSurvived: Math.floor(timeSurvivedRef.current),
      cleared,
      date: new Date().toLocaleDateString('ja-JP', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    };

    const newScores = [record, ...highScores].slice(0, 10);
    setHighScores(newScores);
    try {
      localStorage.setItem('yandere_high_scores', JSON.stringify(newScores));
    } catch (e) {
      console.error(e);
    }
  }, [highScores]);

  // Audio mute sync
  const toggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    sound.setMuted(nextMute);
  };

  // Safe initialize sound
  const handleInteractionSoundInit = () => {
    sound.setMuted(isMuted);
    sound.unlockAudio();
  };

  // Get reactive subtitle based on affection
  const getYandereQuote = () => {
    if (currentAffection >= 75) {
      return "「あぁ、ダーリン！ どんどん私たちの心が重なっていくね。一生、ずっと一緒だよ…♡」";
    } else if (currentAffection >= 40) {
      return "「ねえ、私の料理を食べてくれる？ ずっと私だけを愛して、逃げないって約束してくれるよね？」";
    } else if (currentAffection >= 15) {
      return "「さっき誰と話してたの…？ 嘘ついたら私怒っちゃうよ。ねえ、目を見て答えて？」";
    } else {
      return "「刃物はね、私たちの深い愛を結ぶリボンなの。だから絶対に避けずに抱きしめて…うふふ♡」";
    }
  };

  // Helper to trigger custom particle bursts
  const spawnParticles = (x: number, y: number, count: number, type: 'star' | 'circle' | 'heart' = 'circle', colorRange: string[] = ['#f43f5e', '#ec4899', '#fda4af']) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3 + 1;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 6 + (type === 'heart' ? 8 : 2),
        alpha: 1.0,
        color: colorRange[Math.floor(Math.random() * colorRange.length)],
        type,
        decay: Math.random() * 0.02 + 0.01
      });
    }
  };

  // Start active game run
  const startGame = () => {
    handleInteractionSoundInit();
    sound.playCorrect();
    // Reset survival values
    playerRef.current.x = 300;
    playerRef.current.y = 300;
    knivesRef.current = [];
    particlesRef.current = [];
    timeSurvivedRef.current = 0;
    lastSpawnTimeRef.current = 0;
    dialogueTimerRef.current = 10.0;
    autoAffectionTimerRef.current = 10.0;
    resumeDelayRef.current = 0;
    currentLevelRef.current = 1;
    currentAffectionRef.current = 0;

    setCurrentLevel(1);
    setCurrentAffection(0);
    setTimeSurvived(0);
    setDialogueIndex(0);
    setCurrentDialogue(null);
    setDialogueResponse(null);

    // Initial heart particles
    spawnParticles(300, 300, 15, 'heart');

    setGameStatus('playing');
  };

  // Trigger dialogue event
  const triggerDialogue = useCallback(() => {
    sound.playHeartbeat();
    
    // Choose which dialogue to display
    let dialogueItem: DialogueEvent;
    
    if (dialogueIndex < DIALOGUE_EVENTS.length) {
      dialogueItem = DIALOGUE_EVENTS[dialogueIndex];
      setDialogueIndex((prev) => prev + 1);
    } else {
      // If we run out, pull a random one to loop nicely
      const randIndex = Math.floor(Math.random() * DIALOGUE_EVENTS.length);
      dialogueItem = {
        ...DIALOGUE_EVENTS[randIndex],
        id: dialogueIndex + 1 // increment visual index
      };
      setDialogueIndex((prev) => prev + 1);
    }

    setCurrentDialogue(dialogueItem);
    setDialogueResponse(null);
    setGameStatus('dialogue');
  }, [dialogueIndex]);

  // Answer a dialogue option
  const handleAnswerOption = (option: any) => {
    // Sound FX
    if (option.isSuccess) {
      sound.playCorrect();
    } else {
      sound.playWrong();
    }

    // Apply affection change
    const newAff = Math.min(100, Math.max(0, currentAffectionRef.current + option.value));
    currentAffectionRef.current = newAff;
    setCurrentAffection(newAff);

    // 好感度が100になった瞬間にクリアにするため、会話イベントがこれ以上進行しないよう即時クリア遷移
    if (newAff >= 100) {
      sound.playClear();
      saveScoreRecord(true);
      setGameStatus('clear');
      return;
    }

    // Show response details
    setDialogueResponse({
      text: option.response,
      reaction: option.reaction,
      affectionChange: option.value
    });

    // Spawn massive beautiful heart particles on success!
    if (option.isSuccess) {
      spawnParticles(300, 150, 30, 'heart', ['#ff3366', '#ff0033', '#ff6699']);
    } else {
      // Dark red splattered particles for angery failures
      spawnParticles(300, 150, 20, 'star', ['#7f1d1d', '#991b1b', '#370617']);
    }
  };

  // Resuming after dialogue
  const handleProgressDialogue = () => {
    // Check win condition instantly (first to hit >= 100 favorability wins!)
    if (currentAffectionRef.current >= 100) {
      sound.playClear();
      saveScoreRecord(true);
      setGameStatus('clear');
      return;
    }

    // Level progression
    const nextLevel = Math.min(10, currentLevelRef.current + 1);
    currentLevelRef.current = nextLevel;
    setCurrentLevel(nextLevel);

    // Dynamic graphic burst to state level-up excitement
    spawnParticles(300, 200, 15, 'star', ['#f43f5e', '#fb8500', '#ffb703']);

    // Clear old knives to give a refreshing break for the new level
    knivesRef.current = [];
    dialogueTimerRef.current = 10.0;
    resumeDelayRef.current = 2.0;
    setGameStatus('playing');
  };

  // Trigger game over
  const triggerGameOver = useCallback(() => {
    sound.playHit();
    saveScoreRecord(false);
    setGameStatus('gameover');
  }, [saveScoreRecord]);

  // 60FPS Game loop inside Canvas
  useEffect(() => {
    if (gameStatus !== 'playing') return;

    let animId: number;
    let lastTime = performance.now();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    // Movement speeds
    const player = playerRef.current;

    // Keyboard handlers
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.code] = true;
      // Prevent scrolling with arrows or space
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.key)) {
        e.preventDefault();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.code] = false;
    };

    // Mouse/Touch handlers
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvasWidth / rect.width;
      const scaleY = canvasHeight / rect.height;
      mousePosRef.current = {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
      };
    };

    const handleMouseDown = (e: MouseEvent) => {
      isMouseDownRef.current = true;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvasWidth / rect.width;
      const scaleY = canvasHeight / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;
      
      // Check if clicked near the player to drag
      const dist = Math.hypot(x - player.x, y - player.y);
      if (dist < 30) {
        isDraggingPlayerRef.current = true;
      }
    };

    const handleMouseUp = () => {
      isMouseDownRef.current = false;
      isDraggingPlayerRef.current = false;
    };

    // Touch support (important for mobile)
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 0) return;
      e.preventDefault(); // Stop mobile scrolling
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvasWidth / rect.width;
      const scaleY = canvasHeight / rect.height;
      mousePosRef.current = {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY
      };
      
      if (controlMode === 'mouse') {
        player.x = mousePosRef.current.x;
        player.y = mousePosRef.current.y;
        // clamp inside canvas
        player.x = Math.max(player.radius, Math.min(canvasWidth - player.radius, player.x));
        player.y = Math.max(player.radius, Math.min(canvasHeight - player.radius, player.y));
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 0) return;
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvasWidth / rect.width;
      const scaleY = canvasHeight / rect.height;
      const x = (touch.clientX - rect.left) * scaleX;
      const y = (touch.clientY - rect.top) * scaleY;
      
      mousePosRef.current = { x, y };
      
      if (controlMode === 'mouse') {
        player.x = x;
        player.y = y;
        isDraggingPlayerRef.current = true;
      }
    };

    // Attach listeners
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchend', handleMouseUp);

    // Initial placement of player if out of boundary
    if (player.x < 10 || player.x > canvasWidth - 10) player.x = 300;
    if (player.y < 10 || player.y > canvasHeight - 10) player.y = 300;

    // Inside frame loop
    const frame = (timestamp: number) => {
      const dt = (timestamp - lastTime) / 1000;
      lastTime = timestamp;

      if (dt > 0.1) {
        // Prevent massive physics skip on tab lag
        animId = requestAnimationFrame(frame);
        return;
      }

      // 会話再開時の2秒間の静止バッファ
      if (resumeDelayRef.current > 0) {
        resumeDelayRef.current -= dt;

        // プレイヤーの操作による移動のみを許可（準備・微調整用）
        if (controlMode === 'keyboard') {
          let dx = 0;
          let dy = 0;
          if (keysPressed.current['ArrowLeft'] || keysPressed.current['KeyA']) dx -= 1;
          if (keysPressed.current['ArrowRight'] || keysPressed.current['KeyD']) dx += 1;
          if (keysPressed.current['ArrowUp'] || keysPressed.current['KeyW']) dy -= 1;
          if (keysPressed.current['ArrowDown'] || keysPressed.current['KeyS']) dy += 1;

          if (dx !== 0 && dy !== 0) {
            dx *= 0.7071;
            dy *= 0.7071;
          }

          player.x += dx * player.speed;
          player.y += dy * player.speed;
        } else {
          const targetX = mousePosRef.current.x;
          const targetY = mousePosRef.current.y;
          
          player.x += (targetX - player.x) * 0.25;
          player.y += (targetY - player.y) * 0.25;
        }

        player.x = Math.max(player.radius, Math.min(canvasWidth - player.radius, player.x));
        player.y = Math.max(player.radius, Math.min(canvasHeight - player.radius, player.y));

        // ウェイト中の刃物のスポーンタイマーのギャップを防ぐため、lastSpawnTimeRefを押し進める
        lastSpawnTimeRef.current += dt * 1000;

      } else {
        // 通常のゲーム進行処理

        // 1. Update Game Timers
        timeSurvivedRef.current += dt;
        setTimeSurvived(Math.floor(timeSurvivedRef.current));

        dialogueTimerRef.current -= dt;
        autoAffectionTimerRef.current -= dt;

        // Every 10 seconds: +1 affection automatically
        if (autoAffectionTimerRef.current <= 0) {
          autoAffectionTimerRef.current = 10.0;
          const autoAff = Math.min(100, currentAffectionRef.current + 1);
          currentAffectionRef.current = autoAff;
          setCurrentAffection(autoAff);
          // Play visual confirmation floating tiny heart
          spawnParticles(player.x, player.y - player.radius, 1, 'heart', ['#f43f5e']);

          if (autoAff >= 100) {
            sound.playClear();
            saveScoreRecord(true);
            setGameStatus('clear');
            return;
          }
        }

        // Every 10 seconds: trigger dialogue event
        if (dialogueTimerRef.current <= 0) {
          // Trigger event
          cancelAnimationFrame(animId);
          triggerDialogue();
          return;
        }

        // 2. Player Controls Position Logic
        if (controlMode === 'keyboard') {
          let dx = 0;
          let dy = 0;
          if (keysPressed.current['ArrowLeft'] || keysPressed.current['KeyA']) dx -= 1;
          if (keysPressed.current['ArrowRight'] || keysPressed.current['KeyD']) dx += 1;
          if (keysPressed.current['ArrowUp'] || keysPressed.current['KeyW']) dy -= 1;
          if (keysPressed.current['ArrowDown'] || keysPressed.current['KeyS']) dy += 1;

          if (dx !== 0 && dy !== 0) {
            // Normalize speed diagonal movement
            dx *= 0.7071;
            dy *= 0.7071;
          }

          player.x += dx * player.speed;
          player.y += dy * player.speed;
        } else {
          // Mouse follow/drag
          // We use smooth interpolating follow
          const targetX = mousePosRef.current.x;
          const targetY = mousePosRef.current.y;
          
          player.x += (targetX - player.x) * 0.25;
          player.y += (targetY - player.y) * 0.25;
        }

        // Clamp player into canvas bounds
        player.x = Math.max(player.radius, Math.min(canvasWidth - player.radius, player.x));
        player.y = Math.max(player.radius, Math.min(canvasHeight - player.radius, player.y));

        // Leave a tiny trace particles trail behind the player's heart
        if (Math.random() < 0.3) {
          particlesRef.current.push({
            x: player.x,
            y: player.y + 4,
            vx: (Math.random() - 0.5) * 0.5,
            vy: Math.random() * 0.5 + 0.5,
            size: Math.random() * 4 + 3,
            alpha: 0.5,
            color: 'rgba(244, 63, 94, 0.4)',
            type: 'circle',
            decay: 0.04
          });
        }

        // 3. Spawning Knives Logic based on Level
        const level = currentLevelRef.current;
        const speedFactor = 1.0 + level * 0.15;
        // 刃物の最大数を2倍に増加
        const maxKnives = (3 + Math.floor(level * 1.2)) * 2;
        // 出現頻度を2倍にするため、出現間隔(spawnInterval)をこれまでの半分に短縮
        const spawnInterval = Math.max(0.16, (1.25 - level * 0.09) / 2) * 1000; 

        if (timestamp - lastSpawnTimeRef.current > spawnInterval && knivesRef.current.length < maxKnives) {
          lastSpawnTimeRef.current = timestamp;

          // Visual alert swoosh audio
          sound.playSwoosh();

          // Roll knife types based on Level
          let type: 'falling' | 'homing' | 'bouncing' | 'expanding' = 'falling';
          if (level >= 4 && Math.random() < 0.25) {
            type = 'homing';
          } else if (level >= 7 && Math.random() < 0.3) {
            type = 'bouncing';
          } else if (level >= 9 && Math.random() < 0.2) {
            type = 'expanding';
          }

          const size = type === 'expanding' ? 36 : 26; // Much larger sizes from 22/15 to 36/26 for dramatic visibility
          const x = Math.random() * (canvasWidth - 40) + 20;
          const y = -25;
          
          // Calculate initial velocities
          let vx = (Math.random() - 0.5) * 1.5;
          let vy = (Math.random() * 2 + 2) * speedFactor;

          if (type === 'homing') {
            // Homing targets player position! Needs high threat
            const angle = Math.atan2(player.y - y, player.x - x);
            const speed = (Math.random() * 1.5 + 3.0) * speedFactor;
            vx = Math.cos(angle) * speed;
            vy = Math.sin(angle) * speed;
          }

          knivesRef.current.push({
            id: Math.random(),
            x,
            y,
            vx,
            vy,
            angle: Math.atan2(vy, vx) + Math.PI / 2, // point to motion direction
            rotationSpeed: type === 'bouncing' ? 0.08 : 0, // Bouncing knives spin!
            speed: Math.hypot(vx, vy),
            type,
            size
          });
        }

        // 4. Update Projectiles (Knives)
        for (let i = knivesRef.current.length - 1; i >= 0; i--) {
          const k = knivesRef.current[i];
          
          // Update physics
          if (k.type === 'bouncing') {
            k.x += k.vx;
            k.y += k.vy;
            k.angle += k.rotationSpeed; // Spinniness!
            
            // Bounce off side borders
            if (k.x - k.size < 0 || k.x + k.size > canvasWidth) {
              k.vx = -k.vx;
              sound.playSwoosh(); // Sound bounce
              spawnParticles(k.x, k.y, 4, 'star', ['#94a3b8', '#cbd5e1']);
            }
            // Bounce off bottom once
            if (k.y + k.size > canvasHeight) {
              k.vy = -Math.abs(k.vy) * 0.85; // lose some speed
              k.y = canvasHeight - k.size - 2;
              sound.playSwoosh();
              spawnParticles(k.x, k.y, 4, 'star', ['#94a3b8', '#cbd5e1']);
            }
          } else if (k.type === 'expanding') {
            // Slowly moves down, then splits!
            k.x += k.vx;
            k.y += k.vy;
            k.angle += 0.02;

            // Split check after passing half-point height
            if (k.y > 180 && k.type === 'expanding') {
              // Explode into 4 tiny needles going cardinal directions!
              const needleSpeed = 4.5 * speedFactor;
              const needleDirections = [
                { vx: 0, vy: -needleSpeed }, // up
                { vx: 0, vy: needleSpeed },  // down
                { vx: -needleSpeed, vy: 0 }, // left
                { vx: needleSpeed, vy: 0 }   // right
              ];

              needleDirections.forEach((dir) => {
                knivesRef.current.push({
                  id: Math.random(),
                  x: k.x,
                  y: k.y,
                  vx: dir.vx,
                  vy: dir.vy,
                  angle: Math.atan2(dir.vy, dir.vx) + Math.PI / 2,
                  rotationSpeed: 0,
                  speed: needleSpeed,
                  type: 'needle',
                  size: 14, // Increased from 8 to 14 for visibility
                  color: '#ef4444', // vibrant red warning needles
                  glow: true
                });
              });

              // Play shatter synth sound
              sound.playSwoosh();
              // Spawn explosion shards
              spawnParticles(k.x, k.y, 10, 'star', ['#ef4444', '#fecdd3', '#e11d48']);
              
              // Remove the parent expanding knife
              knivesRef.current.splice(i, 1);
              continue;
            }
          } else {
            // Standard falling & homing
            k.x += k.vx;
            k.y += k.vy;
          }

          // Leave tiny glitters or smoke trails behind knives
          if (Math.random() < 0.15) {
            particlesRef.current.push({
              x: k.x,
              y: k.y,
              vx: -k.vx * 0.1,
              vy: -k.vy * 0.1,
              size: Math.random() * 2 + 1,
              alpha: 0.6,
              color: k.glow ? 'rgba(239, 68, 68, 0.5)' : 'rgba(148, 163, 184, 0.4)',
              type: 'circle',
              decay: 0.05
            });
          }

          // Remove out-of-screen knives
          if (k.y > canvasHeight + 40 || k.y < -60 || k.x < -40 || k.x > canvasWidth + 40) {
            knivesRef.current.splice(i, 1);
            continue;
          }

          // 5. Collision Check (Small precise player hitbox!)
          const distToPlayer = Math.hypot(k.x - player.x, k.y - player.y);
          const collisionRadius = player.hitRadius + (k.size * 0.6); // slight hit box scale padding
          if (distToPlayer < collisionRadius) {
            // Hit! Game Over triggered!
            cancelAnimationFrame(animId);
            triggerGameOver();
            return;
          }
        }

        // 6. Update Particles
        for (let i = particlesRef.current.length - 1; i >= 0; i--) {
          const p = particlesRef.current[i];
          p.x += p.vx;
          p.y += p.vy;
          p.alpha -= p.decay;
          if (p.alpha <= 0) {
            particlesRef.current.splice(i, 1);
          }
        }
      }

      // 7. Render Everything on Canvas
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      // Render aesthetic background grid check lines
      ctx.strokeStyle = 'rgba(244, 63, 94, 0.04)';
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < canvasWidth; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvasHeight);
        ctx.stroke();
      }
      for (let y = 0; y < canvasHeight; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvasWidth, y);
        ctx.stroke();
      }

      // Draw danger glowing board alert if near knife is close
      let nearDanger = false;
      knivesRef.current.forEach((k) => {
        if (Math.hypot(k.x - player.x, k.y - player.y) < 70) {
          nearDanger = true;
        }
      });
      if (nearDanger) {
        ctx.strokeStyle = `rgba(225, 29, 72, ${0.1 + Math.sin(timestamp * 0.01) * 0.05})`;
        ctx.lineWidth = 6;
        ctx.strokeRect(0, 0, canvasWidth, canvasHeight);
      }

      // Draw Homing target warnings lines! (Draws line from prospective spawn downwards or targeting)
      knivesRef.current.forEach((k) => {
        if (k.type === 'homing' && k.y < 20) {
          ctx.strokeStyle = 'rgba(244, 63, 94, 0.2)';
          ctx.lineWidth = 1;
          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          ctx.moveTo(k.x, k.y);
          // Draw projected line to player
          ctx.lineTo(player.x, player.y);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      });

      // Render Particles
      particlesRef.current.forEach((p) => {
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        
        if (p.type === 'heart') {
          // Draw a tiny path heart
          ctx.translate(p.x, p.y);
          ctx.beginPath();
          const d = p.size;
          ctx.moveTo(0, d / 4);
          ctx.quadraticCurveTo(0, 0, d / 4, 0);
          ctx.quadraticCurveTo(d / 2, 0, d / 2, d / 3);
          ctx.quadraticCurveTo(d / 2, d / 2, 0, d * 0.95);
          ctx.quadraticCurveTo(-d / 2, d / 2, -d / 2, d / 3);
          ctx.quadraticCurveTo(-d / 2, 0, -d / 4, 0);
          ctx.quadraticCurveTo(0, 0, 0, d / 4);
          ctx.closePath();
          ctx.fill();
        } else if (p.type === 'star') {
          // Draw small sparks
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });

      // Render Projectiles (Knives / Blades)
      knivesRef.current.forEach((k) => {
        ctx.save();
        ctx.translate(k.x, k.y);
        ctx.rotate(k.angle);

        // Neon red/pink glow for dangerous needle/homing
        if (k.glow || k.type === 'homing') {
          ctx.shadowColor = '#f43f5e';
          ctx.shadowBlur = 10;
        }

        const size = k.size;

        if (k.color) {
          ctx.fillStyle = k.color;
          // Small sleek laser needle shape
          ctx.beginPath();
          ctx.moveTo(0, -size);
          ctx.lineTo(-size / 3, 0);
          ctx.lineTo(-size / 5, size);
          ctx.lineTo(size / 5, size);
          ctx.lineTo(size / 3, 0);
          ctx.closePath();
          ctx.fill();
        } else {
          // Beautiful detailed kitchen knife model
          // Metal Steel Blade (Silver grey)
          ctx.fillStyle = '#cbd5e1';
          ctx.beginPath();
          ctx.moveTo(0, -size); // point
          ctx.lineTo(-size * 0.3, size * 0.2); // knife width edge
          ctx.lineTo(0, size * 0.2); // back edge
          ctx.closePath();
          ctx.fill();

          // Blade cutting edge gleam (white highlight)
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(0, -size);
          ctx.lineTo(-size * 0.3, size * 0.2);
          ctx.stroke();

          // Handguard (Dark yellow bronze)
          ctx.fillStyle = '#b45309';
          ctx.fillRect(-size * 0.25, size * 0.2, size * 0.5, size * 0.1);

          // Wood Handle (Dark Brown)
          ctx.fillStyle = '#78350f';
          ctx.fillRect(-size * 0.1, size * 0.3, size * 0.2, size * 0.45);

          // Cute tiny pink ribbon hanging from the handle (Very Yandere! Love knots)
          ctx.strokeStyle = 'rgba(244, 63, 94, 0.85)';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(0, size * 0.75);
          ctx.bezierCurveTo(size * 0.2, size * 0.9, -size * 0.2, size * 1.0, 0, size * 1.25);
          ctx.stroke();
        }

        ctx.restore();
      });

      // Render Player (Stunning floating heartbeat Heart!)
      ctx.save();
      ctx.translate(player.x, player.y);
      
      // Breathing throbbing wave effect based on time survived
      const absoluteScale = 1.0 + Math.sin(timestamp * 0.01) * 0.08;
      ctx.scale(absoluteScale, absoluteScale);

      // Pink outer glow
      ctx.shadowColor = '#ec4899';
      ctx.shadowBlur = 12;

      // Draw clean red Heart shape
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      const d = player.radius * 1.2;
      ctx.moveTo(0, d / 4);
      ctx.quadraticCurveTo(0, 0, d / 4, 0);
      ctx.quadraticCurveTo(d / 2, 0, d / 2, d / 3);
      ctx.quadraticCurveTo(d / 2, d / 2, 0, d * 0.95);
      ctx.quadraticCurveTo(-d / 2, d / 2, -d / 2, d / 3);
      ctx.quadraticCurveTo(-d / 2, 0, -d / 4, 0);
      ctx.quadraticCurveTo(0, 0, 0, d / 4);
      ctx.closePath();
      ctx.fill();

      // Gleam white accent highlight mapping inside the heart
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.beginPath();
      // left top glow spot
      ctx.arc(-d / 5, d / 12, d / 5, 0, Math.PI * 2);
      ctx.fill();

      // Show tiny glowing white core representing player's ultra-precise HITBOX point!
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, d / 3, 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // Loop frame
      animId = requestAnimationFrame(frame);
    };

    animId = requestAnimationFrame(frame);

    // Unmount cleanup
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchend', handleMouseUp);
    };
  }, [gameStatus, controlMode, triggerDialogue, triggerGameOver]);


  // Helper mapping character sentiment postures with fallback values
  const getAvatarSource = (sentiment: Sentiment) => {
    switch(sentiment) {
      case 'happy': return YANDERE_IMAGES.happy;
      case 'crazy': return YANDERE_IMAGES.crazy;
      default: return YANDERE_IMAGES.neutral;
    }
  };

  // Human reaction label formatting
  const getSentimentLabel = () => {
    if (gameStatus === 'gameover') return '狂乱 / 達成（絶頂）';
    if (gameStatus === 'clear') return '大歓喜 / 超愛♡';
    if (currentAffection >= 75) return '溺愛 / 執着モード';
    if (currentAffection >= 45) return '悦び / ドキドキ';
    if (currentAffection >= 15) return '監視中 / 不安モード';
    return '冷たい笑顔 / 試査中';
  };

  return (
    <div id="game-app-root" className="min-h-screen bg-neutral-950 font-sans text-neutral-100 flex flex-col justify-start items-center p-3 md:p-6 select-none selection:bg-rose-500/30 overflow-x-hidden relative">
      
      {/* Intricately styled background lights */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-rose-950/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-fuchsia-950/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main UI Framed Header wrapper */}
      <header id="game-header" className="w-full max-w-4xl flex flex-col md:flex-row justify-between items-center bg-neutral-900/60 border border-neutral-800/80 backdrop-blur-md rounded-2xl p-4 mb-4 gap-4 shadow-xl relative z-10">
        
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-rose-950/40 relative">
            <Heart className="w-6 h-6 text-white stroke-[2.5]" />
            <motion.div 
              animate={{ scale: [1, 1.4, 1] }} 
              transition={{ repeat: Infinity, duration: 1.2 }}
              className="absolute inset-0 border border-fuchsia-400 rounded-xl pointer-events-none" 
            />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-red-400 via-rose-300 to-fuchsia-400 bg-clip-text text-transparent">
              ヤンデレ刃物回避ゲーム
            </h1>
            <p className="text-xs text-rose-400/80 font-medium">愛の刃物をくぐり抜け、好感度100％の楽園を目指せ！</p>
          </div>
        </div>

        {/* Global Toolbar buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Audio toggle */}
          <button
            id="audio-toggle-btn"
            onClick={toggleMute}
            className="flex items-center gap-2 text-xs font-semibold px-3 py-2 bg-neutral-950 hover:bg-rose-950/40 border border-neutral-800 hover:border-rose-800 rounded-xl transition-all duration-200 shadow-md cursor-pointer"
            title="サウンド設定"
          >
            {isMuted ? (
              <>
                <VolumeX className="w-4 h-4 text-rose-500" />
                <span className="text-rose-500 text-[10px] md:text-xs">消音</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400 text-[10px] md:text-xs">音あり</span>
              </>
            )}
          </button>

          {/* Control Mode selector */}
          <div className="flex bg-neutral-950 border border-neutral-800 p-0.5 rounded-xl">
            <button
              id="ctrl-mouse-btn"
              onClick={() => setControlMode('mouse')}
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg transition-all duration-200 cursor-pointer ${
                controlMode === 'mouse' 
                  ? 'bg-rose-600 font-bold text-white shadow-md' 
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              <MousePointerClick className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">マウス/追従</span>
            </button>
            <button
              id="ctrl-keyboard-btn"
              onClick={() => setControlMode('keyboard')}
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg transition-all duration-200 cursor-pointer ${
                controlMode === 'keyboard' 
                  ? 'bg-rose-600 font-bold text-white shadow-md' 
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              <Keyboard className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">キー(WASD)</span>
            </button>
          </div>
        </div>

      </header>

      {/* Main Container Workspace */}
      <main id="game-main-content" className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 gap-4 relative z-10 items-start">
        
        {/* Left Side: Yandere status card & dialogue center (Spans 4 columns) */}
        <div id="yandere-card-column" className="md:col-span-4 w-full flex flex-col gap-4">
          
          <div className="bg-neutral-900/60 border border-neutral-800 backdrop-blur-md rounded-2xl p-4 shadow-lg overflow-hidden relative group">
            
            {/* Visual warning flash overlay */}
            <div className={`absolute top-0 left-0 w-2 h-full transition-all duration-300 ${
              currentAffection >= 75 ? 'bg-fuchsia-500 shadow-lg shadow-fuchsia-500' :
              currentAffection >= 40 ? 'bg-rose-500' : 'bg-red-600'
            }`} />

            {/* Title / Mood indicator */}
            <div className="flex justify-between items-center pl-2 pb-3 border-b border-neutral-800">
              <div className="flex flex-col">
                <span className="text-xl font-black text-rose-100 tracking-wider">美夜 (Miya)</span>
                <span className="text-[10px] text-fuchsia-400 flex items-center gap-1 mt-0.5 tracking-tight font-mono font-semibold">
                  <span className="inline-block w-2 h-2 rounded-full bg-rose-600 animate-ping" />
                  {getSentimentLabel()}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase tracking-widest text-neutral-500 font-mono">レベル</span>
                <div className="text-2xl font-black font-mono text-rose-500 tracking-tighter">LV.{currentLevel}/10</div>
              </div>
            </div>

            {/* Profile Picture Frame */}
            <div className="my-4 aspect-square max-w-[220px] mx-auto rounded-xl overflow-hidden border-2 border-neutral-800 relative shadow-inner bg-neutral-950">
              <AnimatePresence mode="wait">
                <motion.img
                  key={gameStatus === 'dialogue' && dialogueResponse ? dialogueResponse.reaction : (currentAffection >= 75 ? 'happy' : currentAffection >= 30 ? 'neutral' : 'crazy')}
                  src={getAvatarSource(
                    gameStatus === 'dialogue' && dialogueResponse 
                    ? dialogueResponse.reaction 
                    : (currentAffection >= 75 ? 'happy' : currentAffection >= 30 ? 'neutral' : 'crazy')
                  )}
                  alt="Yandere Miya"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover select-none pointer-events-none"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                />
              </AnimatePresence>

              {/* Heart floating loops based on high affection */}
              {currentAffection >= 50 && (
                <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1.5 pointer-events-none">
                  {Array.from({ length: 4 }).map((_, idx) => (
                    <motion.div
                      key={idx}
                      className="text-pink-500 fill-pink-500 drop-shadow"
                      animate={{ y: [-10, -50], opacity: [0.9, 0], scale: [0.6, 1.2] }}
                      transition={{ 
                        repeat: Infinity, 
                        duration: 1.5 + idx * 0.4, 
                        delay: idx * 0.5, 
                        ease: "easeOut" 
                      }}
                    >
                      ♥
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* stats gauge display */}
            <div className="space-y-2 mt-4 pl-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-rose-300 flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 animate-pulse" />
                  好感度 (Affection)
                </span>
                <span className="font-bold text-rose-300 text-sm font-mono">{currentAffection}%</span>
              </div>
              
              {/* Complex styled progress bar */}
              <div className="w-full h-4 bg-neutral-950 rounded-full border border-neutral-800 overflow-hidden relative">
                <motion.div
                  className="h-full bg-gradient-to-r from-red-600 via-rose-500 to-fuchsia-500 shadow-[0_0_12px_rgba(244,63,94,0.4)]"
                  initial={{ width: '0%' }}
                  animate={{ width: `${currentAffection}%` }}
                  transition={{ duration: 0.3 }}
                />
                
                {/* 100% boundary clear indicator */}
                <span className="absolute top-0 right-0 w-1.5 h-full bg-yellow-400 animate-pulse block" title="目標" />
              </div>
              <p className="text-[10px] text-neutral-500 text-right italic font-mono">100%好感度クリア！</p>
            </div>

            {/* Dialogue bubble */}
            <div className="mt-4 p-3 bg-neutral-950/80 border border-neutral-800/80 rounded-xl relative">
              <div className="absolute -top-1.5 left-6 w-3 h-3 bg-neutral-950 border-t border-l border-neutral-800/80 rotate-45" />
              <p className="text-xs text-rose-200 leading-relaxed font-medium">
                {getYandereQuote()}
              </p>
            </div>

          </div>

          {/* Quick instructions board */}
          <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-4 text-xs space-y-2 text-neutral-400">
            <h4 className="font-bold text-neutral-300 flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-rose-400" />
              ルール説明
            </h4>
            <ul className="list-disc list-inside space-y-1 text-[11px]">
              <li><strong className="text-rose-400">10秒毎</strong>に究極の会話イベントが発生。</li>
              <li>正解で<strong className="text-emerald-400">+10好感度</strong>、誤解答で<strong className="text-rose-500">-5好感度</strong>。</li>
              <li>同時、自動で生存<strong className="text-rose-400">10秒ごとに自動+1好感度</strong>。</li>
              <li>会話の後に警戒レベルが1段階上がり（最大10段階）、刃物・クナイの攻撃弾幕が激化！</li>
              <li>避ける側のハートの当たり判定は、中央の<strong className="text-white">白い極小コア</strong>のみ！</li>
              <li>刃物に衝突すると即座に<strong className="text-red-500">ゲームオーバー</strong>。</li>
            </ul>
          </div>

        </div>

        {/* Right Side: Interactive Action Stage Canvas space (Spans 8 columns) */}
        <div id="game-stage-column" className="md:col-span-8 w-full flex flex-col gap-4">
          
          {/* Main Action Field Card wrapper */}
          <div className="bg-neutral-900/60 border border-neutral-800 backdrop-blur-md rounded-2xl p-4 shadow-2xl relative overflow-hidden flex flex-col justify-start items-center">
            
            {/* Top real-time indicators */}
            <div className="w-full flex justify-between items-center mb-3">
              <div className="flex items-center gap-3 bg-neutral-950 border border-neutral-800/80 px-4 py-1.5 rounded-full shadow-inner">
                <span className="text-[10px] text-neutral-400 font-bold tracking-wider uppercase flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                  生存時間:
                </span>
                <span className="text-sm font-bold font-mono text-rose-400 w-12 text-center">
                  {timeSurvived}s
                </span>
              </div>

              {/* Progress timer circle display */}
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-[9px] text-neutral-500 font-mono tracking-tight">次の会話まで</p>
                  <p className="text-xs font-bold text-fuchsia-400 font-mono">
                    {gameStatus === 'playing' ? Math.max(0, dialogTimerIntRefValue()).toFixed(1) : '10.0'}秒
                  </p>
                </div>
                
                {/* Visual shrinking time pill bar */}
                <div className="w-20 h-2 bg-neutral-950/80 rounded-full overflow-hidden border border-neutral-800">
                  <div 
                    className="h-full bg-gradient-to-r from-fuchsia-600 to-indigo-500 transition-all duration-100 ease-linear"
                    style={{ 
                      width: `${gameStatus === 'playing' ? (dialogTimerIntRefValue() / 10.0) * 100 : 100}%` 
                    }}
                  />
                </div>
              </div>
            </div>

            {/* ACTION CARD SCREEN AREA */}
            <div id="canvas-wrapper-container" className="relative w-full max-w-[600px] h-[380px] bg-neutral-950/90 rounded-xl border border-neutral-800 overflow-hidden shadow-2xl group cursor-crosshair">
              
              {/* HTML5 Canvas */}
              <canvas
                id="interactive-battle-canvas"
                ref={canvasRef}
                width={600}
                height={380}
                className="w-full h-full block relative z-10"
              />

              {/* Dynamic overlays based on applet status */}
              <AnimatePresence>
                
                {/* 1. START OUTLAY MENU */}
                {gameStatus === 'start' && (
                  <motion.div
                    key="start-screen"
                    className="absolute inset-0 bg-neutral-950/95 backdrop-blur-sm z-20 flex flex-col justify-center items-center p-6 text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="text-center space-y-4 max-w-md">
                      <motion.div 
                        animate={{ scale: [1, 1.05, 1] }} 
                        transition={{ repeat: Infinity, duration: 2.0 }}
                        className="inline-block relative p-2"
                      >
                        <Heart className="w-16 h-16 text-rose-500 fill-rose-500 drop-shadow-[0_0_15px_rgba(244,63,94,0.6)]" />
                      </motion.div>
                      
                      <h2 className="text-2xl font-black text-rose-100 uppercase tracking-widest bg-gradient-to-r from-red-500 via-rose-300 to-fuchsia-500 bg-clip-text text-transparent">
                        ヤンデレ愛の刃物回避
                      </h2>
                      <p className="text-xs text-neutral-400">
                        彼女のヤンデレ感情は最高潮！ 飛び交う刃物を避け続け、10秒毎に迫る会話イベントで最高の選択肢を選び、好感度を100％に到達させましょう。
                      </p>

                      <div className="bg-neutral-900 border border-neutral-800 p-3 rounded-xl space-y-1 text-left text-[11px] text-neutral-300 uppercase tracking-tight">
                        <div className="font-bold text-rose-400 mb-1 border-b border-neutral-800 pb-0.5">制御方法</div>
                        <div>マウス追従：カーソルのある場所にハートが吸い寄せられます。</div>
                        <div>キー(WASD)：上下左右キー/WASDで精密操作。</div>
                        <div className="text-neutral-500 mt-1 font-mono">※ 現操作モード: {controlMode === 'mouse' ? 'マウス追従' : 'キーボード操作'}</div>
                      </div>

                      <button
                        id="start-play-btn"
                        onClick={startGame}
                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 via-rose-600 to-fuchsia-600 hover:from-red-500 hover:to-fuchsia-500 text-white font-bold tracking-widest text-sm py-3 px-6 rounded-xl shadow-lg hover:shadow-rose-500/20 active:scale-95 transition-all duration-200 cursor-pointer"
                      >
                        <Play className="w-4 h-4 fill-white" />
                        ゲーム開始（愛を回避する）
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* 2. LIVE DYNAMIC DIALOGUE TRIGGER MODAL */}
                {gameStatus === 'dialogue' && currentDialogue && (
                  <motion.div
                    key="dialogue-screen"
                    className="absolute inset-0 bg-neutral-950/90 backdrop-blur-md z-20 flex flex-col justify-center items-center p-5"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="w-full max-w-lg bg-neutral-900/90 border border-rose-950/60 rounded-2xl p-4 md:p-5 shadow-2xl relative flex flex-col gap-4 text-center">
                      
                      {/* Character image pop out inside Dialogue modal */}
                      <div className="flex items-center gap-3 bg-neutral-950 border border-rose-950/30 p-2.5 rounded-xl text-left">
                        <div className="w-14 h-14 rounded-lg overflow-hidden border border-neutral-800 shrink-0">
                          <img
                            src={getAvatarSource(dialogueResponse ? dialogueResponse.reaction : 'neutral')}
                            alt="Yandere reaction"
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-rose-400">美夜 (Miya)からの問いかけ...</div>
                          <div className="text-xs text-neutral-400 font-mono">第 {dialogueIndex} 章</div>
                        </div>
                      </div>

                      {/* Question Text with slight typewriter glow */}
                      <p className="text-sm md:text-base font-bold text-rose-100 tracking-wide text-left py-2 px-3 bg-rose-950/15 border-l-4 border-rose-500 rounded-lg">
                        {currentDialogue.question}
                      </p>

                      {/* Choice items selection wrapper */}
                      <div className="space-y-2 text-left">
                        {dialogueResponse ? (
                          // AFTER REACTION MODE VIEW
                          <motion.div 
                            className="p-4 rounded-xl border bg-neutral-950 text-xs text-rose-200 flex flex-col gap-3"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                          >
                            <p className="font-semibold text-rose-100 italic leading-relaxed">
                              {dialogueResponse.text}
                            </p>
                            
                            <div className="flex justify-between items-center border-t border-neutral-800/80 pt-2.5 mt-1 font-mono">
                              <span className="text-[11px] font-bold flex items-center gap-1 text-neutral-400">
                                結果: 
                                {dialogueResponse.affectionChange > 0 ? (
                                  <span className="text-emerald-400 flex items-center outline-none animate-pulse">成功 (+10好感度)</span>
                                ) : (
                                  <span className="text-red-500">ミス (-5好感度)</span>
                                )}
                              </span>
                              
                              <button
                                id="dialogue-continue-btn"
                                onClick={handleProgressDialogue}
                                className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold hover:shadow-lg cursor-pointer transition-all duration-200"
                              >
                                戦闘再開 (次レベルヘ)
                              </button>
                            </div>
                          </motion.div>
                        ) : (
                          // ACTIVE PROMPT CHOICE SELECTION
                          <div className="space-y-2.5">
                            {currentDialogue.options.map((opt, i) => (
                              <button
                                key={i}
                                onClick={() => handleAnswerOption(opt)}
                                className="w-full text-left text-xs p-3 rounded-xl border border-neutral-800/80 bg-neutral-950/60 hover:bg-rose-950/25 hover:border-rose-500/80 text-rose-200 hover:text-white hover:scale-[1.01] transition-all duration-150 shadow-sm cursor-pointer flex items-start gap-1.5"
                              >
                                <span className="w-5 h-5 rounded-full bg-rose-950 border border-rose-800 flex items-center justify-center text-[10px] text-rose-400 font-mono font-bold shrink-0 mt-0.5">
                                  {i + 1}
                                </span>
                                <span className="font-bold flex-1 leading-relaxed">
                                  {opt.text}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                    </div>
                  </motion.div>
                )}

                {/* 3. GAMEOVER OVERLAY */}
                {gameStatus === 'gameover' && (
                  <motion.div
                    key="gameover-screen"
                    className="absolute inset-0 bg-red-950/90 backdrop-blur-sm z-20 flex flex-col justify-center items-center p-6 text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="max-w-md space-y-4 text-center">
                      <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center mx-auto shadow-xl shadow-red-950/80 animate-bounce">
                        <Skull className="w-9 h-9 text-slate-100" />
                      </div>

                      <h2 className="text-3xl font-black text-red-500 uppercase tracking-widest font-mono">
                        GAME OVER
                      </h2>
                      
                      <div className="bg-neutral-950 p-4 border border-rose-950 rounded-xl space-y-2">
                        <p className="text-xs text-rose-300 font-serif italic">
                          「捕まえた…♡ これで誰とも喋れないね。死んでも私のそばを離れちゃダメだよ。うふふ♡」
                        </p>
                        
                        <div className="flex justify-around items-center pt-3 border-t border-neutral-900 font-mono text-xs">
                          <div>
                            <span className="text-neutral-500 block uppercase text-[10px]">生存時間</span>
                            <span className="text-rose-400 font-black text-lg">{timeSurvived}秒</span>
                          </div>
                          <div>
                            <span className="text-neutral-500 block uppercase text-[10px]">好感度</span>
                            <span className="text-rose-400 font-black text-lg">{currentAffection}%</span>
                          </div>
                          <div>
                            <span className="text-neutral-500 block uppercase text-[10px]">到達段階</span>
                            <span className="text-rose-400 font-black text-lg">LV.{currentLevel}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 w-full">
                        <button
                          id="retry-game-btn"
                          onClick={startGame}
                          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-rose-600/30 cursor-pointer text-sm tracking-wider animate-pulse"
                        >
                          <RotateCcw className="w-4 h-4" />
                          もう一度挑戦する（愛から逃げる）
                        </button>
                        <button
                          id="back-to-title-btn"
                          onClick={() => setGameStatus('start')}
                          className="w-full flex items-center justify-center gap-2 bg-neutral-900/60 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 font-bold py-3 rounded-xl cursor-pointer text-xs tracking-wider transition-all duration-150"
                        >
                          タイトルに戻る
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 4. GAME CLEAR SUCCESS WINS SCREEN */}
                {gameStatus === 'clear' && (
                  <motion.div
                    key="clear-screen"
                    className="absolute inset-0 bg-neutral-900/95 backdrop-blur-md z-20 flex flex-col justify-center items-center p-6 text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="max-w-md space-y-4 text-center">
                      <div className="w-16 h-16 rounded-full bg-yellow-500 flex items-center justify-center mx-auto shadow-xl shadow-yellow-500/30 relative">
                        <Trophy className="w-9 h-9 text-neutral-950" />
                        <span className="absolute inset-x-0 top-0 w-2 h-2 rounded-full bg-white animate-ping" />
                      </div>

                      <h2 className="text-3xl font-black text-yellow-400 tracking-wider uppercase font-serif">
                        GAME CLEAR
                      </h2>
                      <p className="text-xs text-rose-300 font-bold">★ 好好感度100％到達！ Yandere Conquest Clear! ★</p>

                      <div className="bg-neutral-950 p-4 border border-rose-950/60 rounded-xl space-y-2">
                        <p className="text-xs text-rose-200 font-medium italic">
                          「私の全人生、全細胞を、あなたに捧げるね。本当に…本当に愛してるよ、私のダーリン。もう何も私たちを邪魔させないよ…♡」
                        </p>
                        
                        <div className="flex justify-around items-center pt-3 border-t border-neutral-900 font-mono text-xs">
                          <div>
                            <span className="text-neutral-500 block uppercase text-[10px]">クリアタイム</span>
                            <span className="text-emerald-400 font-black text-lg">{timeSurvived}秒</span>
                          </div>
                          <div>
                            <span className="text-neutral-500 block uppercase text-[10px]">最大好感度</span>
                            <span className="text-emerald-400 font-black text-lg">100%</span>
                          </div>
                          <div>
                            <span className="text-neutral-500 block uppercase text-[10px]">到達段階</span>
                            <span className="text-emerald-400 font-black text-lg">LEVEL {currentLevel}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 w-full">
                        <button
                          id="restart-clear-btn"
                          onClick={startGame}
                          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-neutral-950 font-extrabold py-3 rounded-xl shadow-lg cursor-pointer text-sm font-bold"
                        >
                          <RotateCcw className="w-4 h-4 text-neutral-950" />
                          もう一度遊ぶ（さらなる深淵へ）
                        </button>
                        <button
                          id="clear-back-to-title-btn"
                          onClick={() => setGameStatus('start')}
                          className="w-full flex items-center justify-center gap-2 bg-neutral-950 hover:bg-neutral-900 border border-neutral-800/80 text-neutral-300 font-bold py-3 rounded-xl cursor-pointer text-xs tracking-wider transition-all duration-150"
                        >
                          タイトルに戻る
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>

            </div>

            {/* Display Interactive Active Key controls inside visual canvas card footer */}
            {gameStatus === 'playing' && controlMode === 'keyboard' && (
              <div id="keyboard-visualizer" className="flex justify-center items-center gap-5 mt-3 self-stretch bg-neutral-950/60 border border-neutral-800/60 p-2.5 rounded-xl font-mono text-xs">
                <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">キーの入力表示:</span>
                <div className="flex gap-1.5 text-[10px]">
                  <span className={`w-6 h-6 rounded flex items-center justify-center border font-bold ${keysPressed.current['ArrowLeft'] || keysPressed.current['KeyA'] ? 'bg-rose-500 border-rose-400 text-white shadow' : 'border-neutral-800 text-neutral-500'}`}>A</span>
                  <span className={`w-6 h-6 rounded flex items-center justify-center border font-bold ${keysPressed.current['ArrowDown'] || keysPressed.current['KeyS'] ? 'bg-rose-500 border-rose-400 text-white shadow' : 'border-neutral-800 text-neutral-500'}`}>S</span>
                  <span className={`w-6 h-6 rounded flex items-center justify-center border font-bold ${keysPressed.current['ArrowRight'] || keysPressed.current['KeyD'] ? 'bg-rose-500 border-rose-400 text-white shadow' : 'border-neutral-800 text-neutral-500'}`}>D</span>
                  <span className={`w-6 h-6 rounded flex items-center justify-center border font-bold ${keysPressed.current['ArrowUp'] || keysPressed.current['KeyW'] ? 'bg-rose-500 border-rose-400 text-white shadow' : 'border-neutral-800 text-neutral-500'}`}>W</span>
                </div>
              </div>
            )}

            {gameStatus === 'playing' && controlMode === 'mouse' && (
              <div id="mouse-visualizer" className="flex justify-center items-center gap-2 mt-3 self-stretch bg-neutral-950/60 border border-neutral-800/60 p-2.5 rounded-xl text-[11px] text-neutral-400 select-none">
                <MousePointerClick className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                <span>画面内をマウス移動、または画面上をタッチして、赤いハートを滑らかに誘導してください。</span>
              </div>
            )}

          </div>

          {/* High Scores record table */}
          <div id="high-score-section-card" className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-4">
            <h3 className="text-sm font-bold text-rose-300 flex items-center gap-1 pb-2 border-b border-neutral-800 mb-3 uppercase tracking-wider">
              <History className="w-4 h-4 text-rose-500" />
              直近の試行ログ / 回避成績一覧
            </h3>

            {highScores.length === 0 ? (
              <div className="text-center py-6 text-xs text-neutral-500 italic">
                まだデータがありません。好感度100%を目指してプレイを開始してください！
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono text-neutral-400 border-collapse">
                  <thead>
                    <tr className="text-[10px] text-neutral-500 uppercase border-b border-neutral-800 tracking-wider">
                      <th className="py-2 px-1">日付</th>
                      <th className="py-2 px-1 text-center">結果</th>
                      <th className="py-2 px-1 text-center">好感度</th>
                      <th className="py-2 px-1 text-center">警戒LV</th>
                      <th className="py-2 px-1 text-center">生存秒数</th>
                    </tr>
                  </thead>
                  <tbody>
                    {highScores.map((sc, i) => (
                      <tr key={i} className="border-b border-neutral-800/40 hover:bg-neutral-900/30 transition-all duration-150">
                        <td className="py-2 px-1 text-neutral-400 font-medium text-[11px]">{sc.date}</td>
                        <td className="py-2 px-1 text-center font-bold">
                          {sc.cleared ? (
                            <span className="text-yellow-400 flex items-center justify-center gap-0.5"><CheckCircle className="w-3 h-3 text-yellow-500" /> CLEAR</span>
                          ) : (
                            <span className="text-rose-500 block">OVER</span>
                          )}
                        </td>
                        <td className="py-2 px-1 text-center font-extrabold text-rose-300">{sc.affection}%</td>
                        <td className="py-2 px-1 text-center text-rose-400">LV.{sc.level}</td>
                        <td className="py-2 px-1 text-center text-neutral-300">{sc.timeSurvived}秒</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

      </main>

    </div>
  );

  // Helper getters to bypass timer variable referencing cleanly
  function dialogTimerIntRefValue() {
    return dialogueTimerRef.current;
  }
}
