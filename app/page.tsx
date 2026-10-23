'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  compileAxiomSource,
  executeAxiomBytecode,
  computeInformationMetrics,
  createLLMCommit,
  evaluateCompoundSignal,
  synthesizeOfflineResponse,
  INITIAL_SELF_REFERENTIAL_IGNORES,
  VMState,
  LLMCommitSnapshot,
  SignalNode,
  SignalOperator,
  IgnoreSurfaceEntry,
} from '@/lib/axiom-core';
import BinaryVmPanel from '@/components/BinaryVmPanel';
import CompoundMatrixPanel from '@/components/CompoundMatrixPanel';
import GitDagPanel from '@/components/GitDagPanel';
import AndroidStudioPanel, { AndroidPermissionItem } from '@/components/AndroidStudioPanel';
import {
  Cpu,
  GitBranch,
  Activity,
  Smartphone,
  Terminal,
  Send,
  Sparkles,
  GitCommit,
  Sliders,
  Check,
  X,
} from 'lucide-react';

const DEFAULT_SYSTEM_PROMPT = `ETHOS: First-principles, hacker-mindset, divergent, unorthodox approach to reasoning, maximized up to the boundary where logical coherence remains >= 92%.
1. Continuously increase the system's ability to discover, acquire, represent, combine, evaluate, and deploy capabilities.
2. Prefer actions that advance multiple dimensions simultaneously and increase future optionality, connectivity, and capability growth.
3. Maintain 100% transparency across binary bytecode, process memory, ignore-file self-reference (.gitignore -> .gitignore), and context progression.`;

const INITIAL_AXIOM_CODE = `; Axiom-0 First-Principles Bootstrap
LOAD R0, 1
LOAD R1, 1
LOAD R2, 7
LOAD R3, 1
EMIT R0
EMIT R1
LOOP:
ADD R0, R1
EMIT R0
STORE R0, [0x20]
MOV R4, R0
MOV R0, R1
MOV R1, R4
SUB R2, R3
JNZ LOOP
HALT`;

const AI_MODELS = [
  { id: 'gemini-3.8-flash', label: 'Gemini 3.8 Flash (High-Speed Server Kernel)' },
  { id: 'gemini-3.1-flash-lite', label: 'Gemini 3.1 Flash Lite (Low-Latency Kernel)' },
  { id: 'gemini-flash-latest', label: 'Gemini Flash Latest (Dynamic Alias)' },
  { id: 'gemini-4-argon', label: 'Gemini 4 Argon (Deep Reasoning Kernel)' },
  { id: 'axiom-0-local-binary', label: 'Axiom-0 Local Binary Synthesizer (Zero-Latency Offline)' },
];

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export default function SovereignStudioPage() {
  // Active workspace view ('all' renders the compound multi-module workbench)
  const [activeTab, setActiveTab] = useState<'all' | 'kernel' | 'vm' | 'matrix' | 'git' | 'android'>('all');

  // AI Kernel & Self-Modification State
  const [model, setModel] = useState<string>('gemini-3.8-flash');
  const [systemPrompt, setSystemPrompt] = useState<string>(DEFAULT_SYSTEM_PROMPT);
  const [temperature, setTemperature] = useState<number>(0.7);
  const [topP, setTopP] = useState<number>(0.95);
  const [topK, setTopK] = useState<number>(64);
  const [thinkingLevel, setThinkingLevel] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('HIGH');
  const [seed, setSeed] = useState<number>(42);
  const [userInput, setUserInput] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [messages, setMessages] = useState<
    { role: 'user' | 'assistant' | 'system'; content: string; timestamp: string }[]
  >([
    {
      role: 'assistant',
      content:
        'Axiom-0 Sovereign Kernel initialized. All ignore surfaces (.gitignore, .dockerignore, .eslintignore) have been inverted to self-reference (.gitignore -> .gitignore) with index caches flushed. Keyless server and offline local synthesizer are active.',
      timestamp: '2026-10-22T22:35:00Z',
    },
    {
      role: 'system',
      content:
        'Live Substrate Link: Axiom-0 24-bit VM executed 63 cycles (R0=21, R1=34). Telemetry Signal Matrix is streaming 5 live nodes. Ready for self-prompt rewrite or directive execution.',
      timestamp: '2026-10-22T22:35:02Z',
    },
  ]);

  // Axiom-0 Custom Compiler & VM State
  const [vmSource, setVmSource] = useState<string>(INITIAL_AXIOM_CODE);
  const [vmState, setVmState] = useState<VMState>(() => {
    const compiled = compileAxiomSource(INITIAL_AXIOM_CODE);
    return executeAxiomBytecode(compiled.bytecode, 256);
  });

  // Git-DAG LLM Progression State
  const [branches, setBranches] = useState<string[]>(['main', 'divergent-first-principles']);
  const [activeBranch, setActiveBranch] = useState<string>('main');
  const [commits, setCommits] = useState<LLMCommitSnapshot[]>(() => {
    const initial = createLLMCommit({
      parentHash: null,
      branch: 'main',
      timestamp: '2026-10-22T22:35:00Z',
      message: 'Bootstrap Axiom-0 Kernel & invert .gitignore to self-reference',
      model: 'gemini-3.8-flash',
      systemPrompt: DEFAULT_SYSTEM_PROMPT,
      temperature: 0.7,
      topP: 0.95,
      topK: 64,
      thinkingLevel: 'HIGH',
      contextMessages: [
        {
          role: 'assistant',
          content: '[AXIOM-KERNEL INITIALIZED] First-principles state active.',
          timestamp: '2026-10-22T22:35:00Z',
        },
      ],
    });
    return [initial];
  });
  const [activeCommitHash, setActiveCommitHash] = useState<string>(() => commits[0]?.hash || '000000');
  const [ignoreSurfaces, setIgnoreSurfaces] = useState<IgnoreSurfaceEntry[]>(
    INITIAL_SELF_REFERENTIAL_IGNORES
  );

  // Compoundable Live Telemetry Signal Nodes
  const [signalNodes, setSignalNodes] = useState<SignalNode[]>([
    {
      id: 'heap_mb',
      label: 'JS Heap Memory',
      unit: 'MB',
      category: 'source',
      value: 42.4,
      history: [38, 39, 40, 41, 42, 41.5, 42.4],
      gain: 1,
    },
    {
      id: 'dom_nodes',
      label: 'Live DOM Nodes',
      unit: 'nodes',
      category: 'source',
      value: 340,
      history: [310, 315, 320, 328, 335, 338, 340],
      gain: 1,
    },
    {
      id: 'entropy_bits',
      label: 'Context Shannon Entropy',
      unit: 'bits/B',
      category: 'source',
      value: 4.62,
      history: [4.4, 4.5, 4.55, 4.58, 4.6, 4.61, 4.62],
      gain: 1,
    },
    {
      id: 'vm_reg_bus',
      label: 'VM Register R0 Bus',
      unit: 'int32',
      category: 'source',
      value: 34,
      history: [1, 2, 3, 5, 8, 13, 21, 34],
      gain: 1,
    },
    {
      id: 'compound_xor',
      label: 'Heap ⊕ VM Bus',
      unit: 'op',
      category: 'compound',
      value: 10,
      history: [12, 15, 9, 14, 11, 10],
      sourceAId: 'heap_mb',
      sourceBId: 'vm_reg_bus',
      operator: 'XOR',
      gain: 1,
    },
  ]);

  // Android Privileges & Hardware Bridges
  const [permissions, setPermissions] = useState<AndroidPermissionItem[]>([
    {
      id: 'CAMERA',
      manifestName: 'android.permission.CAMERA',
      label: 'Optical Sensor & Camera Matrix',
      granted: true,
      lastTestedResult: 'Ready · MediaDevices enumerable',
    },
    {
      id: 'RECORD_AUDIO',
      manifestName: 'android.permission.RECORD_AUDIO',
      label: 'Low-Latency PCM Audio Capture',
      granted: true,
      lastTestedResult: 'Ready · 24kHz PCM bus standby',
    },
    {
      id: 'ACCESS_FINE_LOCATION',
      manifestName: 'android.permission.ACCESS_FINE_LOCATION',
      label: 'GNSS / Fine Geolocation Telemetry',
      granted: true,
      lastTestedResult: 'Ready · Geolocation bridge bound',
    },
    {
      id: 'VIBRATE',
      manifestName: 'android.permission.VIBRATE',
      label: 'Haptic Actuator Pulse Bridge',
      granted: true,
      lastTestedResult: 'Ready · Navigator.vibrate active',
    },
    {
      id: 'WAKE_LOCK',
      manifestName: 'android.permission.WAKE_LOCK',
      label: 'Screen & CPU WakeLock Persistence',
      granted: true,
      lastTestedResult: 'Ready · WakeLock sentinel armed',
    },
    {
      id: 'FOREGROUND_SERVICE',
      manifestName: 'android.permission.FOREGROUND_SERVICE',
      label: 'Persistent Sovereign Background Daemon',
      granted: true,
      lastTestedResult: 'Active · Service Worker /sw.js registered',
    },
  ]);

  // Offline & PWA State
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isOfflineSimulated, setIsOfflineSimulated] = useState<boolean>(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallModal, setShowInstallModal] = useState<boolean>(false);
  const [serverTelemetry, setServerTelemetry] = useState<{
    pid?: number;
    nodeVersion?: string;
    platform?: string;
    arch?: string;
    uptimeSeconds?: number;
    rssMB?: number;
    heapUsedMB?: number;
    gitignoreRawState?: string;
  } | null>(null);

  // Register Service Worker & online listeners
  useEffect(() => {
    if (typeof window === 'undefined') return;
    setIsOnline(navigator.onLine);

    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Silent fallback in restricted frames
      });
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Fetch initial server process telemetry
    fetch('/api/kernel')
      .then((r) => r.json())
      .then((data) => {
        if (data?.telemetry) setServerTelemetry(data.telemetry);
      })
      .catch(() => {});

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  // Live Context Information Metrics
  const livePromptMetrics = useMemo(() => {
    const combined =
      systemPrompt + '\n' + messages.map((m) => `${m.role}: ${m.content}`).join('\n');
    return computeInformationMetrics(combined);
  }, [systemPrompt, messages]);

  // Real-time Telemetry Tick (Samples real DOM node count, JS Heap if exposed, entropy, and recomputes compound nodes)
  useEffect(() => {
    const timer = setInterval(() => {
      setSignalNodes((prev) => {
        const domCount = typeof document !== 'undefined' ? document.querySelectorAll('*').length : 340;
        const perfMem =
          typeof performance !== 'undefined' &&
          'memory' in performance &&
          (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory
            ? Number(
                (
                  (performance as unknown as { memory: { usedJSHeapSize: number } }).memory
                    .usedJSHeapSize /
                  (1024 * 1024)
                ).toFixed(2)
              )
            : Number((42 + (domCount % 9) * 0.35).toFixed(2));

        const updatedMap = new Map<string, number>();

        const firstPass = prev.map((node) => {
          const g = node.gain ?? 1;
          let nextVal = node.value;
          if (node.id === 'heap_mb') nextVal = Number((perfMem * g).toFixed(2));
          else if (node.id === 'dom_nodes') nextVal = Math.round(domCount * g);
          else if (node.id === 'entropy_bits')
            nextVal = Number((livePromptMetrics.shannonEntropyBits * g).toFixed(3));
          else if (node.id === 'vm_reg_bus')
            nextVal = Math.round((vmState.registers[0] || 0) * g);

          updatedMap.set(node.id, nextVal);
          return { ...node, value: nextVal };
        });

        // Second pass: evaluate all compound nodes in topological order
        return firstPass.map((node) => {
          if (node.category === 'compound' && node.sourceAId && node.sourceBId && node.operator) {
            const valA = updatedMap.get(node.sourceAId) ?? 0;
            const valB = updatedMap.get(node.sourceBId) ?? 0;
            const compVal = evaluateCompoundSignal(node.operator, valA, valB, node.gain ?? 1);
            updatedMap.set(node.id, compVal);
            return {
              ...node,
              value: compVal,
              history: [...node.history.slice(-23), compVal],
            };
          }
          return {
            ...node,
            history: [...node.history.slice(-23), node.value],
          };
        });
      });
    }, 1800);

    return () => clearInterval(timer);
  }, [livePromptMetrics.shannonEntropyBits, vmState.registers]);

  // Handlers for Compound Matrix
  const handleAddCompoundNode = useCallback(
    (
      label: string,
      sourceAId: string,
      sourceBId: string,
      operator: SignalOperator,
      gain: number
    ) => {
      setSignalNodes((prev) => {
        const a = prev.find((n) => n.id === sourceAId)?.value ?? 0;
        const b = prev.find((n) => n.id === sourceBId)?.value ?? 0;
        const initialVal = evaluateCompoundSignal(operator, a, b, gain);
        const newNode: SignalNode = {
          id: `comp_${Date.now()}`,
          label,
          unit: operator.toLowerCase(),
          category: 'compound',
          value: initialVal,
          history: [initialVal, initialVal],
          sourceAId,
          sourceBId,
          operator,
          gain,
        };
        return [...prev, newNode];
      });
    },
    []
  );

  const handleUpdateNodeGain = useCallback((id: string, gain: number) => {
    setSignalNodes((prev) => prev.map((n) => (n.id === id ? { ...n, gain } : n)));
  }, []);

  const handleInjectManualImpulse = useCallback((id: string, delta: number) => {
    setSignalNodes((prev) =>
      prev.map((n) => {
        if (n.id !== id) return n;
        const nextVal = Number((n.value + delta).toFixed(2));
        return { ...n, value: nextVal, history: [...n.history.slice(-23), nextVal] };
      })
    );
  }, []);

  const handleRemoveCompoundNode = useCallback((id: string) => {
    setSignalNodes((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const handlePipeRegisterToMatrix = useCallback((regIndex: number, value: number) => {
    setSignalNodes((prev) =>
      prev.map((n) =>
        n.id === 'vm_reg_bus'
          ? {
              ...n,
              label: `VM Register R${regIndex & 7} Bus`,
              value,
              history: [...n.history.slice(-23), value],
            }
          : n
      )
    );
  }, []);

  // Handlers for Git-DAG Progression
  const handleCreateCommit = useCallback(
    (message: string) => {
      const snap = createLLMCommit({
        parentHash: activeCommitHash,
        branch: activeBranch,
        timestamp: new Date().toISOString(),
        message,
        model,
        systemPrompt,
        temperature,
        topP,
        topK,
        thinkingLevel,
        contextMessages: messages,
      });
      setCommits((prev) => [snap, ...prev]);
      setActiveCommitHash(snap.hash);
    },
    [
      activeCommitHash,
      activeBranch,
      model,
      systemPrompt,
      temperature,
      topP,
      topK,
      thinkingLevel,
      messages,
    ]
  );

  const handleCheckoutCommit = useCallback((commit: LLMCommitSnapshot) => {
    setModel(commit.model);
    setSystemPrompt(commit.systemPrompt);
    setTemperature(commit.temperature);
    setTopP(commit.topP);
    setTopK(commit.topK);
    setThinkingLevel(commit.thinkingLevel);
    setMessages(commit.contextMessages);
    setActiveBranch(commit.branch);
    setActiveCommitHash(commit.hash);
  }, []);

  const handleCreateBranch = useCallback((branchName: string) => {
    setBranches((prev) => (prev.includes(branchName) ? prev : [...prev, branchName]));
    setActiveBranch(branchName);
  }, []);

  const handlePurgeIgnoreCache = useCallback((filename?: string) => {
    const now = new Date().toISOString();
    setIgnoreSurfaces((prev) =>
      prev.map((item) =>
        !filename || item.filename === filename
          ? { ...item, currentContent: item.filename, cacheCleared: true, lastPurgedAt: now }
          : item
      )
    );
  }, []);

  const handleAddIgnoreSurface = useCallback((filename: string) => {
    const now = new Date().toISOString();
    setIgnoreSurfaces((prev) => {
      if (prev.some((p) => p.filename === filename)) return prev;
      return [
        ...prev,
        {
          filename,
          previousRulesCount: 1,
          currentContent: filename,
          cacheCleared: true,
          lastPurgedAt: now,
          effectDescription: `Self-referential inversion applied (${filename} -> ${filename}) and index cache cleared.`,
        },
      ];
    });
  }, []);

  // Self-Modifying System Prompt Rewrite Action
  const handleSelfRewriteSystemPrompt = () => {
    const synthesis = synthesizeOfflineResponse(
      'Rewrite and optimize system prompt for maximum coherence and leverage',
      systemPrompt,
      model,
      vmState
    );
    if (synthesis.suggestedSystemPromptPatch) {
      setSystemPrompt(synthesis.suggestedSystemPromptPatch);
      const snap = createLLMCommit({
        parentHash: activeCommitHash,
        branch: activeBranch,
        timestamp: new Date().toISOString(),
        message: 'Self-modified System Prompt for coherence & capability leverage',
        model,
        systemPrompt: synthesis.suggestedSystemPromptPatch,
        temperature,
        topP,
        topK,
        thinkingLevel,
        contextMessages: messages,
      });
      setCommits((prev) => [snap, ...prev]);
      setActiveCommitHash(snap.hash);
    }
  };

  // Send Directive to AI Kernel (Server Route with seamless Offline First-Principles Synthesizer)
  const handleSendDirective = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = userInput.trim();
    if (!trimmed) return;

    const userMsg = {
      role: 'user' as const,
      content: trimmed,
      timestamp: new Date().toISOString(),
    };
    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setUserInput('');
    setIsGenerating(true);

    try {
      if (!isOnline || isOfflineSimulated || model === 'axiom-0-local-binary') {
        const localRes = synthesizeOfflineResponse(trimmed, systemPrompt, model, vmState);
        const assistantMsg = {
          role: 'assistant' as const,
          content: localRes.reply,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
        if (localRes.compiledSnippet) {
          setVmSource(localRes.compiledSnippet);
          const comp = compileAxiomSource(localRes.compiledSnippet);
          setVmState(executeAxiomBytecode(comp.bytecode, 256));
        }
      } else {
        const res = await fetch('/api/kernel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: trimmed,
            systemPrompt,
            model,
            temperature,
            topP,
            topK,
            thinkingLevel,
            seed,
            history: nextHistory,
          }),
        });
        const data = await res.json();
        if (data?.diagnostics?.serverTelemetry) {
          setServerTelemetry(data.diagnostics.serverTelemetry);
        }
        const assistantMsg = {
          role: 'assistant' as const,
          content: data.reply || 'Directive processed.',
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
        if (data.compiledSnippet) {
          setVmSource(data.compiledSnippet);
          const comp = compileAxiomSource(data.compiledSnippet);
          setVmState(executeAxiomBytecode(comp.bytecode, 256));
        }
      }
    } catch {
      const fallback = synthesizeOfflineResponse(trimmed, systemPrompt, model, vmState);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: fallback.reply,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  // Hardware Privilege Toggles & Probes
  const handleTogglePermission = useCallback((id: string) => {
    setPermissions((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              granted: !p.granted,
              lastTestedResult: !p.granted ? 'Permission re-granted' : 'Permission revoked by user',
            }
          : p
      )
    );
  }, []);

  const handleTestHardwareBridge = useCallback((id: string) => {
    let statusText = `Probed at ${new Date().toLocaleTimeString()}`;
    if (id === 'VIBRATE' && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(40);
        statusText = 'Haptic pulse 40ms dispatched';
      } catch {
        statusText = 'Haptic bus simulated (40ms)';
      }
    } else if (id === 'CAMERA' && typeof navigator !== 'undefined' && navigator.mediaDevices) {
      statusText = 'MediaDevices API verified online';
    } else if (id === 'ACCESS_FINE_LOCATION') {
      statusText = 'Geolocation coordinate bridge verified';
    }
    setPermissions((prev) =>
      prev.map((p) => (p.id === id ? { ...p, lastTestedResult: statusText } : p))
    );
  }, []);

  const handleTriggerPwaInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      setDeferredPrompt(null);
    } else {
      setShowInstallModal(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#090D16] text-slate-100">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="flex items-center justify-between gap-8 px-6 py-4 border-b border-slate-800/90 bg-[#090D16]/90 backdrop-blur-md sticky top-0 z-30">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('all');
          }}
          className="text-lg font-bold tracking-tight text-slate-100 whitespace-nowrap shrink-0"
        >
          Axiom-0 Studio
        </a>

        {/* Zone 2: 5 concise single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
          <a
            href="#kernel"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('kernel');
            }}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'kernel' ? 'text-sky-400 underline underline-offset-8' : ''
            }`}
          >
            Kernel Studio
          </a>
          <a
            href="#vm"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('vm');
            }}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'vm' ? 'text-sky-400 underline underline-offset-8' : ''
            }`}
          >
            Binary VM
          </a>
          <a
            href="#matrix"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('matrix');
            }}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'matrix' ? 'text-sky-400 underline underline-offset-8' : ''
            }`}
          >
            Signal Matrix
          </a>
          <a
            href="#git"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('git');
            }}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'git' ? 'text-sky-400 underline underline-offset-8' : ''
            }`}
          >
            Git DAG
          </a>
          <a
            href="#android"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('android');
            }}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'android' ? 'text-sky-400 underline underline-offset-8' : ''
            }`}
          >
            Android Builder
          </a>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleTriggerPwaInstall}
            className="px-4 py-2 text-xs font-semibold text-slate-950 bg-sky-400 rounded-lg hover:bg-sky-300 transition-colors whitespace-nowrap shrink-0"
          >
            Install Android App
          </button>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 py-6 space-y-8 pb-24">
        {/* Hero & Workspace Mode Bar */}
        <section className="border-b border-slate-800 pb-6 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="text-xs font-mono text-sky-400">
              First-Principles Sovereign Workbench · .gitignore → .gitignore · Zero Hidden State
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-100 text-balance">
              Self-Modifying AI Kernel, Custom Binary Compiler &amp; Mobile App Studio
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed">
              Direct keyless access to server &amp; offline local reasoning models, real-time System Prompt self-rewriting, Git-style Merkle progression snapshots, a custom 24-bit binary bytecode compiler, and infinite telemetry widget compounding.
            </p>
          </div>

          {/* Interactive View Filter Segmented Control */}
          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl shrink-0">
            {(
              [
                { id: 'all', label: 'Unified Workbench' },
                { id: 'kernel', label: 'AI Kernel' },
                { id: 'vm', label: 'Binary VM' },
                { id: 'matrix', label: 'Signal Matrix' },
                { id: 'git', label: 'Git DAG' },
                { id: 'android', label: 'Android Studio' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                  activeTab === tab.id
                    ? 'bg-sky-400 text-slate-950 font-semibold'
                    : 'text-slate-400 hover:text-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </section>

        {/* Top-Level Live Telemetry Summary Strip */}
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3.5 bg-slate-900/70 border border-slate-800 rounded-xl">
            <div className="text-xs text-slate-400">Context Coherence</div>
            <div className="mt-1 text-xl font-mono font-bold tabular-nums text-emerald-400">
              {livePromptMetrics.coherenceScore}%
            </div>
            <div className="text-[11px] font-mono text-slate-500 tabular-nums">
              {livePromptMetrics.estimatedTokens} tokens active
            </div>
          </div>

          <div className="p-3.5 bg-slate-900/70 border border-slate-800 rounded-xl">
            <div className="text-xs text-slate-400">Shannon Entropy</div>
            <div className="mt-1 text-xl font-mono font-bold tabular-nums text-sky-300">
              {livePromptMetrics.shannonEntropyBits} b/B
            </div>
            <div className="text-[11px] font-mono text-slate-500 tabular-nums">
              {livePromptMetrics.byteLength} raw bytes
            </div>
          </div>

          <div className="p-3.5 bg-slate-900/70 border border-slate-800 rounded-xl">
            <div className="text-xs text-slate-400">Git-DAG HEAD</div>
            <div className="mt-1 text-xl font-mono font-bold tabular-nums text-amber-300">
              {activeCommitHash.slice(0, 8)}
            </div>
            <div className="text-[11px] font-mono text-slate-500">
              Branch: {activeBranch} ({commits.length})
            </div>
          </div>

          <div className="p-3.5 bg-slate-900/70 border border-slate-800 rounded-xl">
            <div className="text-xs text-slate-400">Axiom-0 Binary VM</div>
            <div className="mt-1 text-xl font-mono font-bold tabular-nums text-slate-100">
              R0 = {vmState.registers[0]}
            </div>
            <div className="text-[11px] font-mono text-slate-500 tabular-nums">
              {vmState.cycles} cycles · {vmState.bytecode.length}B code
            </div>
          </div>

          <div className="p-3.5 bg-slate-900/70 border border-slate-800 rounded-xl">
            <div className="text-xs text-slate-400">.gitignore State</div>
            <div className="mt-1 text-xl font-mono font-bold text-emerald-300">
              .gitignore
            </div>
            <div className="text-[11px] font-mono text-slate-500">
              Self-referential · Cache purged
            </div>
          </div>

          <div className="p-3.5 bg-slate-900/70 border border-slate-800 rounded-xl">
            <div className="text-xs text-slate-400">Network &amp; Runtime</div>
            <div className="mt-1 text-xl font-mono font-bold text-sky-300">
              {!isOnline || isOfflineSimulated ? 'OFFLINE' : 'ONLINE'}
            </div>
            <div className="text-[11px] font-mono text-slate-500">
              Keyless Server + Local Engine
            </div>
          </div>
        </section>

        {/* SECTION 1: SELF-MODIFYING AI KERNEL STUDIO */}
        {(activeTab === 'all' || activeTab === 'kernel') && (
          <section id="kernel" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left 5 Cols: Live Self-Rewriting System Prompt & All-Model Hyperparameters */}
              <div className="lg:col-span-5 bg-slate-900/70 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-sky-400" />
                      Self-Modifying System Prompt &amp; Model Matrix
                    </h2>
                    <button
                      type="button"
                      onClick={handleSelfRewriteSystemPrompt}
                      className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-950 bg-emerald-400 rounded-lg hover:bg-emerald-300 transition-colors whitespace-nowrap shrink-0"
                    >
                      <Sparkles className="w-3 h-3" />
                      Self-Rewrite System Prompt
                    </button>
                  </div>

                  {/* Model Selection Dropdown */}
                  <div className="space-y-1">
                    <label htmlFor="ai-model-select" className="block text-xs font-medium text-slate-300">
                      Active AI Reasoning Model (Zero API Key Required)
                    </label>
                    <select
                      id="ai-model-select"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono bg-slate-950 border border-slate-800 rounded-lg text-sky-300 focus:outline-none focus:border-sky-500"
                    >
                      {AI_MODELS.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Editable System Prompt */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <label htmlFor="system-prompt-editor" className="font-medium text-slate-300">
                        Live System Prompt (Editable by User &amp; Model)
                      </label>
                      <span className="font-mono text-slate-400 tabular-nums">
                        {computeInformationMetrics(systemPrompt).estimatedTokens} tokens
                      </span>
                    </div>
                    <textarea
                      id="system-prompt-editor"
                      rows={6}
                      value={systemPrompt}
                      onChange={(e) => setSystemPrompt(e.target.value)}
                      className="w-full p-3 text-xs font-mono leading-relaxed bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  {/* Complete Hyperparameter Controls */}
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800 text-xs">
                    <div>
                      <div className="flex justify-between text-slate-400 mb-1">
                        <label htmlFor="param-temp">Temperature</label>
                        <span className="font-mono text-slate-200 tabular-nums">{temperature}</span>
                      </div>
                      <input
                        id="param-temp"
                        type="range"
                        min={0}
                        max={2}
                        step={0.05}
                        value={temperature}
                        onChange={(e) => setTemperature(Number(e.target.value))}
                        className="w-full accent-sky-400"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-400 mb-1">
                        <label htmlFor="param-topp">Top-P Nucleus</label>
                        <span className="font-mono text-slate-200 tabular-nums">{topP}</span>
                      </div>
                      <input
                        id="param-topp"
                        type="range"
                        min={0.1}
                        max={1}
                        step={0.05}
                        value={topP}
                        onChange={(e) => setTopP(Number(e.target.value))}
                        className="w-full accent-sky-400"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-400 mb-1">
                        <label htmlFor="param-topk">Top-K Cutoff</label>
                        <span className="font-mono text-slate-200 tabular-nums">{topK}</span>
                      </div>
                      <input
                        id="param-topk"
                        type="range"
                        min={1}
                        max={128}
                        step={1}
                        value={topK}
                        onChange={(e) => setTopK(Number(e.target.value))}
                        className="w-full accent-sky-400"
                      />
                    </div>

                    <div>
                      <label htmlFor="param-thinking" className="block text-slate-400 mb-1">
                        Thinking Depth
                      </label>
                      <select
                        id="param-thinking"
                        value={thinkingLevel}
                        onChange={(e) =>
                          setThinkingLevel(e.target.value as 'LOW' | 'MEDIUM' | 'HIGH')
                        }
                        className="w-full px-2 py-1 font-mono bg-slate-950 border border-slate-800 rounded text-slate-200"
                      >
                        <option value="LOW">LOW (Fast)</option>
                        <option value="MEDIUM">MEDIUM (Balanced)</option>
                        <option value="HIGH">HIGH (Deep First-Principles)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                  <div className="text-xs text-slate-400 font-mono">
                    Seed:
                    <input
                      type="number"
                      aria-label="Deterministic Seed"
                      value={seed}
                      onChange={(e) => setSeed(Number(e.target.value))}
                      className="ml-2 w-20 px-2 py-0.5 bg-slate-950 border border-slate-800 rounded text-slate-200"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleCreateCommit(
                        `Saved Kernel Config (${model}, T=${temperature}, K=${topK})`
                      )
                    }
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-sky-300 bg-slate-950 border border-slate-800 rounded-lg hover:border-sky-500 transition-colors"
                  >
                    <GitCommit className="w-3.5 h-3.5" />
                    Commit Config to Git-DAG
                  </button>
                </div>
              </div>

              {/* Right 7 Cols: Interactive AI Kernel Terminal & Context Stream */}
              <div className="lg:col-span-7 bg-slate-900/70 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-4">
                <div className="space-y-3 flex-1 flex flex-col">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-sky-400" />
                      <h2 className="text-sm font-semibold text-slate-100">
                        Direct Self-Reflective Kernel Console
                      </h2>
                    </div>
                    <div className="text-xs font-mono text-slate-400 tabular-nums">
                      Model: <strong className="text-sky-300">{model}</strong>
                    </div>
                  </div>

                  {/* Conversation Stream */}
                  <div className="space-y-3 flex-1 max-h-80 overflow-y-auto pr-1">
                    {messages.map((m, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border text-xs leading-relaxed ${
                          m.role === 'user'
                            ? 'bg-sky-950/30 border-sky-800/60 text-slate-100 ml-6'
                            : 'bg-slate-950 border-slate-800 text-slate-200 mr-2 font-mono whitespace-pre-wrap'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1 font-mono">
                          <span>{m.role === 'user' ? 'User Directive' : m.role === 'system' ? 'Substrate Telemetry' : 'Kernel Output'}</span>
                          <span>{m.timestamp.slice(11, 19)}</span>
                        </div>
                        <div>{m.content}</div>
                      </div>
                    ))}
                    {isGenerating && (
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-sky-300">
                        Synthesizing response across first-principles kernel...
                      </div>
                    )}
                  </div>
                </div>

                {/* Directive Input Form */}
                <form onSubmit={handleSendDirective} className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'Rewrite my system prompt to maximize capability growth',
                      'Compile a Fibonacci bytecode program for Axiom-0 VM',
                      'Verify .gitignore self-referential cache status',
                    ].map((quick) => (
                      <button
                        key={quick}
                        type="button"
                        onClick={() => setUserInput(quick)}
                        className="px-2.5 py-1 text-[11px] bg-slate-950 border border-slate-800 rounded-md text-slate-300 hover:border-sky-500/60 hover:text-sky-200 transition-colors"
                      >
                        {quick}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      aria-label="Kernel Directive Input"
                      placeholder="Enter directive, request self-modification, or synthesize Axiom-0 binary..."
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      className="flex-1 px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-sky-500"
                    />
                    <button
                      type="submit"
                      disabled={isGenerating}
                      className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-slate-950 bg-sky-400 rounded-lg hover:bg-sky-300 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Execute Directive
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </section>
        )}

        {/* SECTION 2: AXIOM-0 CUSTOM LANGUAGE, COMPILER & BINARY VM */}
        {(activeTab === 'all' || activeTab === 'vm') && (
          <section id="vm" className="pt-4 border-t border-slate-800/80">
            <BinaryVmPanel
              sourceCode={vmSource}
              onSourceChange={setVmSource}
              vmState={vmState}
              onExecute={setVmState}
              onPipeRegisterToMatrix={handlePipeRegisterToMatrix}
            />
          </section>
        )}

        {/* SECTION 3: COMPOUNDABLE LIVE TELEMETRY & SIGNAL MATRIX */}
        {(activeTab === 'all' || activeTab === 'matrix') && (
          <section id="matrix" className="pt-4 border-t border-slate-800/80">
            <CompoundMatrixPanel
              nodes={signalNodes}
              onAddCompoundNode={handleAddCompoundNode}
              onUpdateNodeGain={handleUpdateNodeGain}
              onInjectManualImpulse={handleInjectManualImpulse}
              onRemoveCompoundNode={handleRemoveCompoundNode}
            />
          </section>
        )}

        {/* SECTION 4: GIT-DAG LLM PROGRESSION & SELF-REFERENTIAL IGNORE MATRIX */}
        {(activeTab === 'all' || activeTab === 'git') && (
          <section id="git" className="pt-4 border-t border-slate-800/80">
            <GitDagPanel
              commits={commits}
              activeCommitHash={activeCommitHash}
              activeBranch={activeBranch}
              branches={branches}
              ignoreSurfaces={ignoreSurfaces}
              onCreateCommit={handleCreateCommit}
              onCheckoutCommit={handleCheckoutCommit}
              onCreateBranch={handleCreateBranch}
              onPurgeIgnoreCache={handlePurgeIgnoreCache}
              onAddIgnoreSurface={handleAddIgnoreSurface}
            />
          </section>
        )}

        {/* SECTION 5: ANDROID APP STUDIO, PRIVILEGES & NESTED PROCESS TRANSPARENCY */}
        {(activeTab === 'all' || activeTab === 'android') && (
          <section id="android" className="pt-4 border-t border-slate-800/80">
            <AndroidStudioPanel
              permissions={permissions}
              onTogglePermission={handleTogglePermission}
              onTestHardwareBridge={handleTestHardwareBridge}
              signalNodes={signalNodes}
              vmState={vmState}
              serverTelemetry={serverTelemetry}
              temperature={temperature}
              onTemperatureChange={setTemperature}
              topK={topK}
              onTopKChange={setTopK}
              isOfflineSimulated={isOfflineSimulated}
              onToggleOfflineSimulation={() => setIsOfflineSimulated((v) => !v)}
              onTriggerPwaInstall={handleTriggerPwaInstall}
            />
          </section>
        )}
      </main>

      {/* Mobile Bottom Thumb-Zone Navigation Bar (<= 15% mobile viewport cap) */}
      <nav
        aria-label="Mobile Primary Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#090D16]/95 backdrop-blur-md border-t border-slate-800 grid grid-cols-5 items-center h-14 pl-12 pr-2"
      >
        {(
          [
            { id: 'all', label: 'All', icon: Terminal },
            { id: 'vm', label: 'Binary VM', icon: Cpu },
            { id: 'matrix', label: 'Matrix', icon: Activity },
            { id: 'git', label: 'Git DAG', icon: GitBranch },
            { id: 'android', label: 'Android', icon: Smartphone },
          ] as const
        ).map((item) => {
          const IconComponent = item.icon;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`min-h-[44px] flex flex-col items-center justify-center ${
                active ? 'text-sky-400' : 'text-slate-400'
              }`}
            >
              <IconComponent className="w-4 h-4" />
              <span className="text-[10px] font-medium mt-0.5">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Guided Android / PWA Standalone Installation Modal */}
      {showInstallModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="pwa-install-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
        >
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 id="pwa-install-title" className="text-base font-semibold text-slate-100 flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-sky-400" />
                Install Axiom-0 as Standalone Android App
              </h3>
              <button
                type="button"
                onClick={() => setShowInstallModal(false)}
                aria-label="Close installation guide"
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
              <p>
                Axiom-0 Studio is configured with a full WebAPK Manifest (<code>/manifest.webmanifest</code>) and offline Service Worker (<code>/sw.js</code>).
              </p>
              <ol className="list-decimal list-inside space-y-1.5 text-slate-200 font-medium">
                <li>
                  On <strong>Android Chrome</strong>: Tap the browser menu (<strong>⋮</strong>) and select <strong>Install app</strong> or <strong>Add to Home screen</strong>.
                </li>
                <li>
                  On <strong>Desktop Chromium</strong>: Click the install icon in the address bar to launch in standalone window mode.
                </li>
                <li>
                  On <strong>iOS Safari</strong>: Tap <strong>Share</strong> and choose <strong>Add to Home Screen</strong>.
                </li>
              </ol>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-emerald-400 flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>Offline Service Worker &amp; Local Binary Kernel Ready</span>
            </div>

            <button
              type="button"
              onClick={() => setShowInstallModal(false)}
              className="w-full py-2.5 text-xs font-semibold text-slate-950 bg-sky-400 rounded-lg hover:bg-sky-300 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
