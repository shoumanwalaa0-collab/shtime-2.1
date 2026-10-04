import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Globe2, Zap, Coins, PlusCircle, LogIn, Sparkles, 
  Lock, KeyRound, ShieldCheck, AlertTriangle, CheckCircle2, 
  Users, Play, ArrowRight, UserCheck, Trash2, RefreshCw, HelpCircle,
  Mic, MicOff, Volume2, Radio
} from 'lucide-react';
import { UserGameState } from '../types';
import { soundFx } from '../utils/soundEffects';
import { RandomQuestionsGame } from './RandomQuestionsGame';
import { BraAlsalfaGame } from './BraAlsalfaGame';
import { MafiaGame } from './MafiaGame';

interface OnlineGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameState: UserGameState;
  onOpenUpgrades: () => void;
  onForceDeductLiras: (amount: number, reason: string) => void;
  onAddLiras: (amount: number) => void;
}

export interface CreatedMap {
  id: string;
  mapName: string;
  password: string;
  selectedGame: 'questions' | 'braAlsalfa' | 'mafia';
  creatorName: string;
  playersCount: number; // max 16
  playersList: string[];
}

const ONLINE_MAPS_STORAGE_KEY = 'RIDDLE_GAME_REAL_ONLINE_MAPS_V2';

export const OnlineGameModal: React.FC<OnlineGameModalProps> = ({
  isOpen,
  onClose,
  gameState,
  onOpenUpgrades,
  onForceDeductLiras,
  onAddLiras,
}) => {
  const [viewState, setViewState] = useState<'hub' | 'create_step1' | 'create_step2' | 'join_list' | 'waiting_room'>('hub');
  const [activeSubgame, setActiveSubgame] = useState<'questions' | 'braAlsalfa' | 'mafia' | null>(null);
  
  // Create Map Form State
  const [mapName, setMapName] = useState('');
  const [mapPassword, setMapPassword] = useState('');
  const [selectedGame, setSelectedGame] = useState<'questions' | 'braAlsalfa' | 'mafia'>('questions');

  // Real-time Voice Chat state
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [incomingSpeaker, setIncomingSpeaker] = useState<string | null>(null);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const lastVoiceTimestampRef = useRef<number>(Date.now());
  const playedVoiceIdsRef = useRef<Set<string>>(new Set());
  
  // REAL online maps synced with real backend server API across all devices
  const [createdMaps, setCreatedMaps] = useState<CreatedMap[]>(() => {
    try {
      const saved = localStorage.getItem(ONLINE_MAPS_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // fallback
    }
    return [];
  });

  // Join Map State
  const [selectedMapToJoin, setSelectedMapToJoin] = useState<CreatedMap | null>(null);
  const [enteredPassword, setEnteredPassword] = useState('');
  const [currentJoinedMap, setCurrentJoinedMap] = useState<CreatedMap | null>(null);
  const [isCreator, setIsCreator] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Direct join by name + password state
  const [directJoinName, setDirectJoinName] = useState('');
  const [directJoinPassword, setDirectJoinPassword] = useState('');
  
  // Fetch real maps from backend server periodically
  const fetchMapsFromServer = async () => {
    try {
      const res = await fetch('/api/internal/app-sync');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.mapsList)) {
          setCreatedMaps(data.mapsList);
          localStorage.setItem(ONLINE_MAPS_STORAGE_KEY, JSON.stringify(data.mapsList));
          
          // Also update current joined map if active
          if (currentJoinedMap) {
            const updatedCurrent = data.mapsList.find((m: CreatedMap) => m.id === currentJoinedMap.id);
            if (updatedCurrent) {
              setCurrentJoinedMap(updatedCurrent);
            }
          }
        }
      } else {
        // Fallback to legacy /api/maps
        const res2 = await fetch('/api/maps');
        if (res2.ok) {
          const data2 = await res2.json();
          if (Array.isArray(data2.maps)) {
            setCreatedMaps(data2.maps);
            localStorage.setItem(ONLINE_MAPS_STORAGE_KEY, JSON.stringify(data2.maps));
            if (currentJoinedMap) {
              const updatedCurrent = data2.maps.find((m: CreatedMap) => m.id === currentJoinedMap.id);
              if (updatedCurrent) {
                setCurrentJoinedMap(updatedCurrent);
              }
            }
          }
        }
      }
    } catch {
      // Network fallback to localStorage
    }
  };

  useEffect(() => {
    fetchMapsFromServer();
    // Poll every 3 seconds while modal is open to get new players & maps in real-time
    const interval = setInterval(fetchMapsFromServer, 3000);
    return () => clearInterval(interval);
  }, [currentJoinedMap?.id]);

  // Sync maps to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(ONLINE_MAPS_STORAGE_KEY, JSON.stringify(createdMaps));
    } catch {
      // ignore
    }
  }, [createdMaps]);

  // Audio stream cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Poll incoming voice audio clips from other players in this room
  useEffect(() => {
    if (!currentJoinedMap) {
      if (isVoiceActive) {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
        }
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((t) => t.stop());
          mediaStreamRef.current = null;
        }
        setIsVoiceActive(false);
      }
      return;
    }

    const pollVoice = async () => {
      try {
        const res = await fetch(`/api/maps/${currentJoinedMap.id}/voice?since=${lastVoiceTimestampRef.current}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.messages) && data.messages.length > 0) {
            for (const msg of data.messages) {
              if (!playedVoiceIdsRef.current.has(msg.id)) {
                playedVoiceIdsRef.current.add(msg.id);
                lastVoiceTimestampRef.current = Math.max(lastVoiceTimestampRef.current, msg.timestamp);

                const myTag = isCreator ? 'المنشئ (أنت)' : 'لاعب منضم';
                if (msg.sender !== myTag && msg.audioBase64) {
                  setIncomingSpeaker(msg.sender);
                  try {
                    const audio = new Audio(msg.audioBase64);
                    audio.play().catch(() => {});
                    audio.onended = () => setIncomingSpeaker(null);
                  } catch {
                    setIncomingSpeaker(null);
                  }
                }
              }
            }
          }
        }
      } catch {
        // ignore network hiccups
      }
    };

    const interval = setInterval(pollVoice, 1500);
    return () => clearInterval(interval);
  }, [currentJoinedMap?.id, isCreator, isVoiceActive]);

  const toggleVoiceChat = async () => {
    soundFx.playClickSound();
    if (isVoiceActive) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
      setIsVoiceActive(false);
      setVoiceNotice('تم إيقاف الميكروفون');
      setTimeout(() => setVoiceNotice(null), 2500);
      return;
    }

    // Turn ON microphone
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : '';
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = async (e) => {
        if (e.data && e.data.size > 0 && currentJoinedMap) {
          const reader = new FileReader();
          reader.onloadend = async () => {
            const base64Audio = reader.result as string;
            try {
              await fetch(`/api/maps/${currentJoinedMap.id}/voice`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  sender: isCreator ? 'المنشئ (أنت)' : 'لاعب منضم',
                  audioBase64: base64Audio,
                }),
              });
            } catch {
              // ignore
            }
          };
          reader.readAsDataURL(e.data);
        }
      };

      recorder.start(2500);
      setIsVoiceActive(true);
      soundFx.playWinSound();
      setVoiceNotice('🎙️ تم فتح الفويس! تحدث بحرية ويصل كلامك لكل من في الماب');
      setTimeout(() => setVoiceNotice(null), 3000);
    } catch (err) {
      console.error(err);
      soundFx.playWrongSound();
      setVoiceNotice('❌ تعذر فتح الميكروفون! يرجى السماح بصلاحية المايكروفون.');
      setIsVoiceActive(false);
    }
  };

  if (!isOpen) return null;

  const handleRefreshMaps = () => {
    soundFx.playClickSound();
    fetchMapsFromServer();
  };

  // Validation for Map Name (> 3 chars and unique)
  const handleProceedToStep2 = () => {
    soundFx.playClickSound();
    const trimmedName = mapName.trim();
    if (trimmedName.length <= 3) {
      setErrorMsg('اسم الماب يجب أن يكون أكثر من 3 حروف!');
      return;
    }
    const isExisting = createdMaps.some((m) => m.mapName.toLowerCase() === trimmedName.toLowerCase());
    if (isExisting) {
      setErrorMsg('عذراً، هذا الاسم مستخدم مسبقاً لماب آخر. اختر اسماً فريداً!');
      return;
    }
    setErrorMsg(null);
    setViewState('create_step2');
  };

  // Validation for Password (> 6 chars and contains letters & numbers)
  const handleFinalizeCreation = async () => {
    soundFx.playClickSound();
    const hasLetters = /[a-zA-Zأ-ي]/.test(mapPassword);
    const hasNumbers = /[0-9]/.test(mapPassword);

    if (mapPassword.length <= 6 || !hasLetters || !hasNumbers) {
      setErrorMsg('كلمة المرور يجب أن تكون أكثر من 6 خانات وتحتوي على أحرف وأرقام معاً!');
      return;
    }

    if (gameState.liras < 40) {
      soundFx.playWrongSound();
      setErrorMsg('أنت لا تملك أي مال كافٍ! صناعة الماب تتطلب 40 ليرة.');
      setTimeout(() => {
        onClose();
        setViewState('hub');
      }, 3000);
      return;
    }

    // Deduct 40 liras for creation
    onForceDeductLiras(40, 'صناعة ماب لعب أون لاين: تم خصم 40 ليرة');
    soundFx.playWinSound();

    const newMapId = Date.now().toString();
    const newMap: CreatedMap = {
      id: newMapId,
      mapName: mapName.trim(),
      password: mapPassword,
      selectedGame,
      creatorName: 'أنت (المنشئ)',
      playersCount: 1,
      playersList: ['أنت (المنشئ)'],
    };

    // Send to backend server so all phones see it immediately!
    try {
      const res = await fetch('/api/maps/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mapName: mapName.trim(),
          password: mapPassword,
          selectedGame,
          creatorName: 'أنت (المنشئ)',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.map) {
          setCurrentJoinedMap(data.map);
          setCreatedMaps(data.maps);
        }
      } else {
        const errData = await res.json();
        if (errData.error) {
          setErrorMsg(errData.error);
          return;
        }
      }
    } catch {
      // Fallback local update
      const updatedMaps = [newMap, ...createdMaps];
      setCreatedMaps(updatedMaps);
      setCurrentJoinedMap(newMap);
    }

    setIsCreator(true);
    setSuccessMsg('🎉 تم إنشاء الماب بنجاح ونشره لجميع اللاعبين أونلاين!');
    
    setTimeout(() => {
      setSuccessMsg(null);
      setMapName('');
      setMapPassword('');
      // Enter waiting room / game room automatically as requested
      setViewState('waiting_room');
    }, 1500);
  };

  // Attempt to join map with password check & 20 liras deduction
  const handleAttemptJoinMap = (map: CreatedMap) => {
    soundFx.playClickSound();
    if (map.playersCount >= 16) {
      setErrorMsg('عذراً، هذا الماب ممتلئ تماماً (الحد الأقصى 16 شخصاً)!');
      return;
    }
    setSelectedMapToJoin(map);
    setEnteredPassword('');
    setErrorMsg(null);
  };

  const handleVerifyJoinPassword = async () => {
    soundFx.playClickSound();
    if (!selectedMapToJoin) return;

    if (gameState.liras < 20) {
      soundFx.playWrongSound();
      setErrorMsg('أنت لا تملك ليرات كافية للانضمام! (التكلفة 20 ليرة).');
      return;
    }

    try {
      const res = await fetch('/api/internal/join-map', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mapId: selectedMapToJoin.id,
          password: enteredPassword.trim(),
          playerName: 'أنت (لاعب منضم)',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        soundFx.playWrongSound();
        setErrorMsg(data.error || '❌ الباسورد غلط! كلمة المرور غير صحيحة');
        return;
      }

      // Deduct 20 liras for joining upon verified password
      onForceDeductLiras(20, `انضمام إلى ماب ${selectedMapToJoin.mapName}: تم خصم 20 ليرة`);
      soundFx.playWinSound();

      if (data.map) {
        setCurrentJoinedMap(data.map);
      }
      if (data.maps) {
        setCreatedMaps(data.maps);
      }

      setIsCreator(false);
      setSelectedMapToJoin(null);
      setEnteredPassword('');

      setSuccessMsg(`✅ تم الدخول والانضمام إلى الماب بنجاح (${selectedMapToJoin.mapName})!`);
      setTimeout(() => {
        setSuccessMsg(null);
        setViewState('waiting_room');
      }, 1200);
    } catch {
      // Fallback
      if (selectedMapToJoin.password && enteredPassword.trim() !== selectedMapToJoin.password.trim()) {
        soundFx.playWrongSound();
        setErrorMsg('❌ الباسورد غلط! كلمة المرور غير صحيحة');
        return;
      }

      onForceDeductLiras(20, `انضمام إلى ماب ${selectedMapToJoin.mapName}: تم خصم 20 ليرة`);
      soundFx.playWinSound();

      const updatedMap: CreatedMap = {
        ...selectedMapToJoin,
        playersCount: selectedMapToJoin.playersCount + 1,
        playersList: [...selectedMapToJoin.playersList, 'أنت (لاعب منضم)'],
      };
      const newMapsList = createdMaps.map((m) => (m.id === updatedMap.id ? updatedMap : m));
      setCreatedMaps(newMapsList);
      setCurrentJoinedMap(updatedMap);

      setIsCreator(false);
      setSelectedMapToJoin(null);
      setEnteredPassword('');

      setSuccessMsg(`✅ تم الدخول والانضمام إلى الماب بنجاح (${selectedMapToJoin.mapName})!`);
      setTimeout(() => {
        setSuccessMsg(null);
        setViewState('waiting_room');
      }, 1200);
    }
  };

  const handleDirectJoinByNameAndPassword = async () => {
    soundFx.playClickSound();
    const trimmedName = directJoinName.trim();
    const trimmedPass = directJoinPassword.trim();

    if (!trimmedName || !trimmedPass) {
      setErrorMsg('يرجى إدخال اسم الماب وكلمة المرور للدخول المباشر!');
      return;
    }

    const targetMap = createdMaps.find((m) => m.mapName.toLowerCase() === trimmedName.toLowerCase());
    if (!targetMap) {
      soundFx.playWrongSound();
      setErrorMsg('❌ لم يتم العثور على ماب بهذا الاسم! تأكد من كتابة الاسم بدقة.');
      return;
    }

    if (targetMap.playersCount >= 16) {
      soundFx.playWrongSound();
      setErrorMsg('الماب ممتلئ بالكامل (16/16 لاعبين)!');
      return;
    }

    if (gameState.liras < 20) {
      soundFx.playWrongSound();
      setErrorMsg('أنت لا تملك ليرات كافية للانضمام! (التكلفة 20 ليرة).');
      return;
    }

    try {
      const res = await fetch('/api/internal/join-map', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mapId: targetMap.id,
          password: trimmedPass,
          playerName: 'أنت (لاعب منضم)',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        soundFx.playWrongSound();
        setErrorMsg(data.error || '❌ الباسورد غلط! كلمة المرور غير صحيحة');
        return;
      }

      onForceDeductLiras(20, `انضمام إلى ماب ${targetMap.mapName}: تم خصم 20 ليرة`);
      soundFx.playWinSound();

      if (data.map) setCurrentJoinedMap(data.map);
      if (data.maps) setCreatedMaps(data.maps);

      setIsCreator(false);
      setDirectJoinName('');
      setDirectJoinPassword('');

      setSuccessMsg(`✅ تم الدخول والانضمام إلى الماب بنجاح (${targetMap.mapName})!`);
      setTimeout(() => {
        setSuccessMsg(null);
        setViewState('waiting_room');
      }, 1200);
    } catch {
      if (targetMap.password && targetMap.password.trim() !== trimmedPass) {
        soundFx.playWrongSound();
        setErrorMsg('❌ الباسورد غلط! كلمة المرور غير صحيحة');
        return;
      }

      onForceDeductLiras(20, `انضمام إلى ماب ${targetMap.mapName}: تم خصم 20 ليرة`);
      soundFx.playWinSound();

      const updatedMap: CreatedMap = {
        ...targetMap,
        playersCount: targetMap.playersCount + 1,
        playersList: [...targetMap.playersList, 'أنت (لاعب منضم)'],
      };
      setCreatedMaps(createdMaps.map((m) => (m.id === updatedMap.id ? updatedMap : m)));
      setCurrentJoinedMap(updatedMap);

      setIsCreator(false);
      setDirectJoinName('');
      setDirectJoinPassword('');

      setSuccessMsg(`✅ تم الدخول والانضمام إلى الماب بنجاح (${targetMap.mapName})!`);
      setTimeout(() => {
        setSuccessMsg(null);
        setViewState('waiting_room');
      }, 1200);
    }
  };

  const handleDeleteMap = async (mapId: string) => {
    soundFx.playClickSound();
    if (confirm('هل أنت متأكد من حذف هذا الماب نهائياً؟')) {
      try {
        await fetch(`/api/maps/${mapId}`, { method: 'DELETE' });
      } catch {
        // ignore
      }
      const filtered = createdMaps.filter((m) => m.id !== mapId);
      setCreatedMaps(filtered);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fade-in select-none" dir="rtl">
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-[#0f172a] via-[#090d16] to-[#020617] border-2 border-cyan-400/80 rounded-3xl p-5 sm:p-7 shadow-[0_0_80px_rgba(6,182,212,0.5)] my-auto flex flex-col max-h-[95vh] overflow-y-auto">
        
        {/* TOP BAR: Title & Close Button */}
        <div className="flex items-center justify-between border-b border-cyan-500/30 pb-3 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-500/20 border border-cyan-400/40 rounded-2xl text-cyan-300">
              <Globe2 className="w-6 h-6 animate-spin" style={{ animationDuration: '8s' }} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white">العب أونلاين الحقيقي (مع الأصدقاء)</h2>
              <p className="text-xs text-cyan-300">رصيدك الحالي: <span className="text-amber-300 font-bold">{gameState.liras} ليرة 🪙</span></p>
            </div>
          </div>

          <button
            onClick={() => {
              soundFx.playClickSound();
              onClose();
            }}
            className="p-2 text-cyan-300 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-full border border-cyan-500/40 transition-all cursor-pointer"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ERROR / SUCCESS TOASTS */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-red-950/90 border-2 border-red-500 text-red-200 font-black text-xs sm:text-sm rounded-2xl text-center shadow-lg animate-shake flex items-center justify-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-950/90 border-2 border-emerald-500 text-emerald-200 font-black text-xs sm:text-sm rounded-2xl text-center shadow-lg animate-bounce flex items-center justify-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* VIEW 1: HUB (Choose between Create Map or Join Map)              */}
        {/* ---------------------------------------------------------------- */}
        {viewState === 'hub' && (
          <div className="space-y-5 animate-fade-in py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Card 1: Create Map */}
              <button
                onClick={() => {
                  soundFx.playClickSound();
                  if (gameState.liras < 40) {
                    setErrorMsg('أنت لا تملك ليرات كافية! صناعة الماب تتطلب 40 ليرة.');
                    return;
                  }
                  setMapName('');
                  setMapPassword('');
                  setSelectedGame('questions');
                  setErrorMsg(null);
                  setViewState('create_step1');
                }}
                className="relative overflow-hidden group p-6 rounded-3xl bg-gradient-to-br from-cyan-950/80 via-slate-900 to-slate-950 border-2 border-cyan-500/50 hover:border-cyan-400 text-right flex flex-col justify-between transition-all hover:scale-[1.02] shadow-[0_0_30px_rgba(6,182,212,0.25)] cursor-pointer"
              >
                <div className="absolute top-0 left-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-all"></div>
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 mb-4 shadow">
                    <PlusCircle className="w-6 h-6 animate-bounce" />
                  </div>
                  <h3 className="text-lg font-black text-white mb-1">صناعة ماب أونلاين جديد</h3>
                  <p className="text-xs text-cyan-200/80 leading-relaxed">
                    أنشئ ماب خاص بك واجعله متاحاً للأصدقاء عبر الإنترنت لكي يلعبوا معك (التكلفة: 40 ليرة).
                  </p>
                </div>
                <div className="mt-5 flex items-center justify-between text-xs font-black text-cyan-300">
                  <span>إنشاء الآن ⚡</span>
                  <ArrowRight className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                </div>
              </button>

              {/* Card 2: Join Map */}
              <button
                onClick={() => {
                  soundFx.playClickSound();
                  handleRefreshMaps();
                  setErrorMsg(null);
                  setViewState('join_list');
                }}
                className="relative overflow-hidden group p-6 rounded-3xl bg-gradient-to-br from-indigo-950/80 via-slate-900 to-slate-950 border-2 border-indigo-500/50 hover:border-indigo-400 text-right flex flex-col justify-between transition-all hover:scale-[1.02] shadow-[0_0_30px_rgba(99,102,241,0.25)] cursor-pointer"
              >
                <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all"></div>
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-300 mb-4 shadow">
                    <LogIn className="w-6 h-6 animate-bounce" />
                  </div>
                  <h3 className="text-lg font-black text-white mb-1">دخول ماب أونلاين</h3>
                  <p className="text-xs text-indigo-200/80 leading-relaxed">
                    استعرض المابز الحقيقية التي صنعها اللاعبون المتصلون وانضم إليهم (التكلفة: 20 ليرة).
                  </p>
                </div>
                <div className="mt-5 flex items-center justify-between text-xs font-black text-indigo-300">
                  <span>تصفح المابز 🎮</span>
                  <ArrowRight className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                </div>
              </button>

            </div>
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* VIEW 2: CREATE MAP - STEP 1 (Name & Game Type)                   */}
        {/* ---------------------------------------------------------------- */}
        {viewState === 'create_step1' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-cyan-300">الخطوة 1: تفاصيل الماب واختيار اللعبة</h3>
              <button onClick={() => setViewState('hub')} className="text-xs text-slate-400 hover:text-white underline cursor-pointer">
                العودة للخلف
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-cyan-200">اسم الماب (&gt; 3 حروف، فريد):</label>
              <input
                type="text"
                value={mapName}
                onChange={(e) => setMapName(e.target.value)}
                placeholder="مثال: تحدي_العباقرة_2026"
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border-2 border-cyan-500/50 text-white font-bold text-sm focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-cyan-200">اختر لعبة الماب اونلاين:</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedGame('questions')}
                  className={`p-3 rounded-2xl border text-right transition-all cursor-pointer ${
                    selectedGame === 'questions'
                      ? 'bg-cyan-600/30 border-cyan-400 text-white shadow-lg'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="font-black text-sm mb-1 text-cyan-300">❓ أسئلة عشوائية</div>
                  <div className="text-[11px] text-slate-300">تحدي الذكاء وسرعة الإجابة</div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedGame('braAlsalfa')}
                  className={`p-3 rounded-2xl border text-right transition-all cursor-pointer ${
                    selectedGame === 'braAlsalfa'
                      ? 'bg-cyan-600/30 border-cyan-400 text-white shadow-lg'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="font-black text-sm mb-1 text-cyan-300">🕵️ برّا السالفة</div>
                  <div className="text-[11px] text-slate-300">كشف الشخص الغريب (3-6 لاعبين)</div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedGame('mafia')}
                  className={`p-3 rounded-2xl border text-right transition-all cursor-pointer ${
                    selectedGame === 'mafia'
                      ? 'bg-cyan-600/30 border-cyan-400 text-white shadow-lg'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="font-black text-sm mb-1 text-cyan-300">👥 لعبة المافيا</div>
                  <div className="text-[11px] text-slate-300">المحققون ضد المجرمين (3-6 لاعبين)</div>
                </button>
              </div>
            </div>

            <button
              onClick={handleProceedToStep2}
              className="mt-4 w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black text-sm shadow-[0_0_20px_rgba(6,182,212,0.5)] cursor-pointer flex items-center justify-center gap-2"
            >
              <span>التالي: إعداد كلمة المرور</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* VIEW 3: CREATE MAP - STEP 2 (Password & Finalize)                */}
        {/* ---------------------------------------------------------------- */}
        {viewState === 'create_step2' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-cyan-300">الخطوة 2: كلمة مرور الماب وحمايته</h3>
              <button onClick={() => setViewState('create_step1')} className="text-xs text-slate-400 hover:text-white underline cursor-pointer">
                العودة للخلف
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-cyan-200">كلمة المرور السرية (&gt; 6 خانات، أحرف وأرقام):</label>
              <input
                type="password"
                value={mapPassword}
                onChange={(e) => setMapPassword(e.target.value)}
                placeholder="مثال: MapPass2026"
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border-2 border-cyan-500/50 text-white font-bold text-sm focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-200 text-xs font-bold leading-relaxed">
              💡 ملاحظة: عند اكتمال الإنشاء، سيتم خصم 40 ليرة وتوجيهك **تلقائياً وفوراً** إلى غرفة الانتظار وقائمة الألعاب (برّا السالفة، المافيا، أو الأسئلة العشوائية) لتبدأ باللعب مع أصدقائك عبر الإنترنت!
            </div>

            <button
              onClick={handleFinalizeCreation}
              className="mt-4 w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-black text-sm shadow-[0_0_25px_rgba(16,185,129,0.5)] cursor-pointer flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-5 h-5" />
              <span>تأكيد ودفع 40 ليرة للإنشاء والدخول الفوري 🚀</span>
            </button>
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* VIEW 4: JOIN MAP LIST (Real maps created by players only)         */}
        {/* ---------------------------------------------------------------- */}
        {viewState === 'join_list' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-cyan-300">قائمة المابز المصنوعة أونلاين</h3>
                <p className="text-xs text-slate-400 mt-0.5">فقط المابز الحقيقية التي صنعها لاعبون متصلون تظهر هنا</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleRefreshMaps}
                  className="px-3 py-1.5 bg-slate-900 border border-slate-700 hover:border-cyan-400 text-cyan-300 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '4s' }} />
                  <span>تحديث</span>
                </button>
                <button onClick={() => setViewState('hub')} className="text-xs text-slate-400 hover:text-white underline cursor-pointer">
                  العودة
                </button>
              </div>
            </div>

            {/* Direct Join by Name and Password */}
            <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-slate-950 via-indigo-950/40 to-slate-950 border border-indigo-500/40 shadow-md">
              <h4 className="text-xs sm:text-sm font-black text-indigo-300 mb-2 flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-indigo-400" />
                <span>دخول مباشر بكتابة اسم الماب وكلمة المرور (20 ليرة)</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  value={directJoinName}
                  onChange={(e) => setDirectJoinName(e.target.value)}
                  placeholder="اسم الماب..."
                  className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold text-xs focus:outline-none focus:border-indigo-400"
                />
                <input
                  type="password"
                  value={directJoinPassword}
                  onChange={(e) => setDirectJoinPassword(e.target.value)}
                  placeholder="كلمة مرور الماب..."
                  className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold text-xs focus:outline-none focus:border-indigo-400"
                />
                <button
                  onClick={handleDirectJoinByNameAndPassword}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-black text-xs rounded-xl shadow hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center gap-1"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>دخول الماب</span>
                </button>
              </div>
            </div>

            {/* Password verification prompt when selecting a map from the list */}
            {selectedMapToJoin && (
              <div className="p-4 rounded-2xl bg-slate-950 border-2 border-indigo-500 shadow-xl mb-3 animate-fade-in">
                <h4 className="text-sm font-black text-indigo-300 mb-2">
                  🔐 أدخل باسورد الانضمام لماب: <span className="text-white">{selectedMapToJoin.mapName}</span> (التكلفة 20 ليرة)
                </h4>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={enteredPassword}
                    onChange={(e) => setEnteredPassword(e.target.value)}
                    placeholder="اكتب كلمة مرور الماب..."
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold text-sm focus:outline-none focus:border-indigo-400"
                  />
                  <button
                    onClick={handleVerifyJoinPassword}
                    className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-black text-xs rounded-xl shadow hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    دخول (20 🪙)
                  </button>
                  <button
                    onClick={() => {
                      setSelectedMapToJoin(null);
                      setEnteredPassword('');
                    }}
                    className="px-3 py-2 bg-slate-900 text-slate-400 font-bold text-xs rounded-xl hover:text-white cursor-pointer"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-1">
              {createdMaps.length === 0 ? (
                <div className="text-center py-12 bg-slate-950/80 border border-slate-800 rounded-2xl flex flex-col items-center justify-center gap-3">
                  <Globe2 className="w-10 h-10 text-slate-600 animate-pulse" />
                  <div className="text-sm font-black text-slate-300">لا يوجد أي مابز مصنوعة أونلاين حالياً!</div>
                  <p className="text-xs text-slate-500 max-w-xs">
                    لم يقم أي شخص حقيقي بإنشاء ماب بعد. كن أول من ينشئ ماب أونلاين ليلعب معك الأصدقاء!
                  </p>
                  <button
                    onClick={() => setViewState('create_step1')}
                    className="mt-2 px-4 py-2 bg-cyan-600 text-white font-black text-xs rounded-xl hover:bg-cyan-500 cursor-pointer"
                  >
                    صناعة أول ماب الآن ⚡
                  </button>
                </div>
              ) : (
                createdMaps.map((map) => (
                  <div
                    key={map.id}
                    className="p-4 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-cyan-500/40 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md"
                  >
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 font-black shrink-0">
                        🗺️
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-black text-white">{map.mapName}</h4>
                          <span className="px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 text-[10px] font-bold border border-cyan-500/30">
                            {map.selectedGame === 'questions' ? '❓ أسئلة' : map.selectedGame === 'braAlsalfa' ? '🕵️ برّا السالفة' : '👥 مافيا'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          المنشئ: <span className="text-cyan-200 font-bold">{map.creatorName}</span> | عدد اللاعبين: <span className="text-amber-300 font-bold">{map.playersCount}/16</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <button
                        onClick={() => handleAttemptJoinMap(map)}
                        className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl font-black text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white border border-indigo-400/50 hover:scale-105 active:scale-95"
                      >
                        <LogIn className="w-4 h-4" />
                        <span>انضمام (20 🪙)</span>
                      </button>

                      <button
                        onClick={() => handleDeleteMap(map.id)}
                        className="p-2.5 rounded-xl bg-red-950/50 border border-red-800 text-red-300 hover:bg-red-900/80 cursor-pointer"
                        title="حذف الماب"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* VIEW 5: WAITING ROOM & AUTOMATIC GAME SELECTION (برّا السالفة / مافيا / أسئلة) */}
        {/* ---------------------------------------------------------------- */}
        {viewState === 'waiting_room' && currentJoinedMap && (
          <div className="space-y-5 animate-fade-in py-2">
            
            {/* Top Bar: Real-Time Voice Chat Circular Button for Multiple Players */}
            <div className="p-4 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-900 border-2 border-cyan-500/50 shadow-2xl space-y-3">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3.5 w-full sm:w-auto">
                  {/* Circular Voice Button */}
                  <div className="relative flex items-center justify-center shrink-0">
                    {isVoiceActive && (
                      <span className="absolute w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-emerald-500/40 animate-ping" />
                    )}
                    <button
                      onClick={toggleVoiceChat}
                      className={`relative z-10 w-13 h-13 sm:w-15 sm:h-15 rounded-full flex items-center justify-center transition-all shadow-xl cursor-pointer ${
                        isVoiceActive
                          ? 'bg-gradient-to-tr from-emerald-500 to-green-400 text-slate-950 border-2 border-white ring-4 ring-emerald-500/40 scale-105 animate-pulse'
                          : 'bg-slate-800 text-slate-300 border-2 border-slate-600 hover:border-cyan-400 hover:text-cyan-300 active:scale-95'
                      }`}
                      title={isVoiceActive ? 'الفويس مفعل - اضغط للإيقاف' : 'اضغط لتشغيل الفويس المباشر'}
                    >
                      {isVoiceActive ? (
                        <Mic className="w-6 h-6 sm:w-7 sm:h-7" />
                      ) : (
                        <MicOff className="w-6 h-6 sm:w-7 sm:h-7" />
                      )}
                    </button>
                  </div>

                  {/* Voice Chat Status & Info */}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
                        <Radio className={`w-4 h-4 ${isVoiceActive ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
                        <span>{isVoiceActive ? '🎙️ الفويس الصوتي مباشر وحقيقي' : '🔇 الفويس الصوتي مغلق'}</span>
                      </span>
                      {currentJoinedMap.playersCount > 1 && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 text-[10px] font-bold border border-emerald-500/40">
                          {currentJoinedMap.playersCount} لاعبين في الروم
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      {isVoiceActive
                        ? (incomingSpeaker ? `🔊 ${incomingSpeaker} يتحدث الآن...` : 'ميكروفونك ينقل صوتك مباشرة لجميع اللاعبين الآخرين!')
                        : 'اضغط على زر الفويس الدائري للتحدث وسماع باقي اللاعبين مباشرة!'}
                    </p>
                  </div>
                </div>

                {/* Speaker indicator badge */}
                {incomingSpeaker && (
                  <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-emerald-950/90 border border-emerald-400 text-emerald-300 text-xs font-black animate-pulse shadow-lg">
                    <Volume2 className="w-4 h-4" />
                    <span>{incomingSpeaker} يتحدث الآن 🔊</span>
                  </div>
                )}
              </div>

              {voiceNotice && (
                <div className="text-center p-2 rounded-xl bg-slate-950 border border-cyan-500/40 text-xs font-bold text-cyan-300 animate-fade-in">
                  {voiceNotice}
                </div>
              )}
            </div>

            {/* If subgame is active, render the specific game component directly */}
            {activeSubgame === 'questions' ? (
              <RandomQuestionsGame
                playersList={currentJoinedMap.playersList}
                isCreator={isCreator}
                onBackToRoom={() => setActiveSubgame(null)}
                onForceDeductLiras={onForceDeductLiras}
                onAddLiras={onAddLiras}
              />
            ) : activeSubgame === 'braAlsalfa' ? (
              <BraAlsalfaGame
                playersList={currentJoinedMap.playersList}
                isCreator={isCreator}
                onBackToRoom={() => setActiveSubgame(null)}
                onAddLiras={onAddLiras}
              />
            ) : activeSubgame === 'mafia' ? (
              <MafiaGame
                playersList={currentJoinedMap.playersList}
                isCreator={isCreator}
                onBackToRoom={() => setActiveSubgame(null)}
                onAddLiras={onAddLiras}
              />
            ) : (
              <>
                <div className="text-center p-4 rounded-3xl bg-gradient-to-r from-cyan-950 via-slate-900 to-indigo-950 border-2 border-cyan-400/60 shadow-[0_0_30px_rgba(6,182,212,0.3)]">
                  <div className="inline-block px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-black mb-2 border border-cyan-400/30">
                    🎮 غرفة الانتظار النشطة أونلاين
                  </div>
                  <h3 className="text-2xl font-black text-white mb-1">{currentJoinedMap.mapName}</h3>
                  <p className="text-xs text-slate-300 font-bold">
                    نوع اللعبة: <span className="text-amber-300">{currentJoinedMap.selectedGame === 'questions' ? '❓ أسئلة عشوائية' : currentJoinedMap.selectedGame === 'braAlsalfa' ? '🕵️ برّا السالفة' : '👥 لعبة المافيا'}</span>
                  </p>
                </div>

                {/* Players List Grid */}
                <div className="bg-slate-950/80 border border-cyan-500/30 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-black text-cyan-300 flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-cyan-400" />
                      <span>اللاعبون المنضمون للماب ({currentJoinedMap.playersCount}/16):</span>
                    </span>
                    <span className="text-[11px] text-emerald-400 font-bold animate-pulse">● متصل أونلاين</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {currentJoinedMap.playersList.map((player, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="text-xs font-bold text-white truncate">{player}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Game Menu Hub based on selectedGame */}
                <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-950/80 via-slate-900 to-slate-950 border-2 border-purple-500/50 shadow-xl text-center space-y-4">
                  <h4 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-200 via-white to-cyan-200">
                    🚀 قائمة ألعاب الأونلاين التفاعلية
                  </h4>
                  <p className="text-xs text-slate-300">
                    لقد دخلت الماب تلقائياً! اختر اللعبة التي ترغب في خوض غمارها الآن مع أصدقائك:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      onClick={() => {
                        soundFx.playWinSound();
                        setActiveSubgame('questions');
                      }}
                      className="p-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black text-sm shadow-[0_0_20px_rgba(168,85,247,0.5)] border border-purple-400 hover:scale-105 active:scale-95 cursor-pointer flex flex-col items-center gap-2"
                    >
                      <Sparkles className="w-5 h-5 text-yellow-300 animate-bounce" />
                      <span>بدء الأسئلة العشوائية</span>
                    </button>

                    <button
                      onClick={() => {
                        soundFx.playWinSound();
                        setActiveSubgame('braAlsalfa');
                      }}
                      className="p-4 rounded-2xl bg-gradient-to-r from-amber-600 to-yellow-600 text-slate-950 font-black text-sm shadow-[0_0_20px_rgba(245,158,11,0.5)] border border-yellow-300 hover:scale-105 active:scale-95 cursor-pointer flex flex-col items-center gap-2"
                    >
                      <Users className="w-5 h-5 text-slate-950 animate-bounce" />
                      <span>بدء برّا السالفة</span>
                    </button>

                    <button
                      onClick={() => {
                        soundFx.playWinSound();
                        setActiveSubgame('mafia');
                      }}
                      className="p-4 rounded-2xl bg-gradient-to-r from-red-600 to-rose-700 text-white font-black text-sm shadow-[0_0_20px_rgba(239,68,68,0.5)] border border-red-400 hover:scale-105 active:scale-95 cursor-pointer flex flex-col items-center gap-2"
                    >
                      <ShieldCheck className="w-5 h-5 text-cyan-300 animate-bounce" />
                      <span>بدء لعبة المافيا</span>
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <button
                    onClick={() => {
                      setCurrentJoinedMap(null);
                      setActiveSubgame(null);
                      setViewState('hub');
                    }}
                    className="px-4 py-2 bg-slate-900 text-slate-300 font-bold text-xs rounded-xl hover:text-white border border-slate-700 cursor-pointer"
                  >
                    الخروج من الغرفة
                  </button>

                  <span className="text-[11px] text-cyan-400 font-semibold">
                    طريقة اللعب مدعومة كلياً للأصدقاء والمتصلين حقيقياً 🌐
                  </span>
                </div>
              </>
            )}

          </div>
        )}

      </div>
    </div>
  );
};
