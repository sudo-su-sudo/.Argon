'use client';

import React, { useState } from 'react';
import { SignalNode, VMState } from '@/lib/axiom-core';
import {
  Smartphone,
  Shield,
  Cpu,
  Download,
  Play,
  Layers,
  Check,
  Terminal,
  WifiOff,
  Sliders,
} from 'lucide-react';

export interface AndroidPermissionItem {
  id: string;
  manifestName: string;
  label: string;
  granted: boolean;
  lastTestedResult: string;
}

export interface MicroAppBlueprint {
  id: string;
  name: string;
  packageId: string;
  versionCode: number;
  attachedSignalId: string;
  vmRoutine: string;
  offlineEnabled: boolean;
  permissions: string[];
}

interface AndroidStudioPanelProps {
  permissions: AndroidPermissionItem[];
  onTogglePermission: (id: string) => void;
  onTestHardwareBridge: (id: string) => void;
  signalNodes: SignalNode[];
  vmState: VMState;
  serverTelemetry: {
    pid?: number;
    nodeVersion?: string;
    platform?: string;
    arch?: string;
    uptimeSeconds?: number;
    rssMB?: number;
    heapUsedMB?: number;
    gitignoreRawState?: string;
  } | null;
  temperature: number;
  onTemperatureChange: (val: number) => void;
  topK: number;
  onTopKChange: (val: number) => void;
  isOfflineSimulated: boolean;
  onToggleOfflineSimulation: () => void;
  onTriggerPwaInstall: () => void;
}

export default function AndroidStudioPanel({
  permissions,
  onTogglePermission,
  onTestHardwareBridge,
  signalNodes,
  vmState,
  serverTelemetry,
  temperature,
  onTemperatureChange,
  topK,
  onTopKChange,
  isOfflineSimulated,
  onToggleOfflineSimulation,
  onTriggerPwaInstall,
}: AndroidStudioPanelProps) {
  const [microApps, setMicroApps] = useState<MicroAppBlueprint[]>([
    {
      id: 'app-1',
      name: 'Axiom Telemetry Pulse',
      packageId: 'io.axiom0.telemetry.pulse',
      versionCode: 104,
      attachedSignalId: signalNodes[0]?.id || 'heap_mb',
      vmRoutine: 'LOAD R0, 64\nSHL R0, 1\nEMIT R0\nHALT',
      offlineEnabled: true,
      permissions: ['VIBRATE', 'WAKE_LOCK', 'FOREGROUND_SERVICE'],
    },
    {
      id: 'app-2',
      name: 'Sovereign Field Cryptor',
      packageId: 'io.axiom0.field.cryptor',
      versionCode: 201,
      attachedSignalId: signalNodes[1]?.id || 'entropy_bits',
      vmRoutine: 'LOAD R0, 42\nLOAD R1, 99\nXOR R0, R1\nEMIT R0\nHALT',
      offlineEnabled: true,
      permissions: ['CAMERA', 'ACCESS_FINE_LOCATION'],
    },
  ]);

  const [activeAppId, setActiveAppId] = useState<string>('app-1');
  const [newAppName, setNewAppName] = useState<string>('');
  const [newAppPkg, setNewAppPkg] = useState<string>('');
  const [selectedSignalId, setSelectedSignalId] = useState<string>(
    signalNodes[0]?.id || 'heap_mb'
  );
  const [exportedBundleJson, setExportedBundleJson] = useState<string | null>(null);

  const activeApp = microApps.find((a) => a.id === activeAppId) || microApps[0];
  const attachedSignal =
    signalNodes.find((s) => s.id === activeApp?.attachedSignalId) || signalNodes[0];

  const handleCreateMicroApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAppName.trim()) return;
    const cleanSlug = newAppName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '');
    const pkg = newAppPkg.trim() || `io.axiom0.mobile.${cleanSlug || 'custom'}`;
    const created: MicroAppBlueprint = {
      id: `app-${Date.now()}`,
      name: newAppName.trim(),
      packageId: pkg,
      versionCode: 100,
      attachedSignalId: selectedSignalId,
      vmRoutine: 'LOAD R0, 88\nEMIT R0\nHALT',
      offlineEnabled: true,
      permissions: permissions.filter((p) => p.granted).map((p) => p.id),
    };
    setMicroApps((prev) => [created, ...prev]);
    setActiveAppId(created.id);
    setNewAppName('');
    setNewAppPkg('');
  };

  const handleExportApkManifest = () => {
    if (!activeApp) return;
    const bundle = {
      schema: 'AXIOM_ANDROID_WEBAPK_V1',
      generatedAt: new Date().toISOString(),
      package: activeApp.packageId,
      name: activeApp.name,
      versionCode: activeApp.versionCode,
      display: 'standalone',
      offlineServiceWorker: '/sw.js',
      gitignoreInversionState: serverTelemetry?.gitignoreRawState || '.gitignore',
      permissions: permissions.filter((p) => p.granted).map((p) => p.manifestName),
      embeddedVmBytecodeHex: Array.from(vmState.bytecode)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join(''),
    };
    setExportedBundleJson(JSON.stringify(bundle, null, 2));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">
            Android App Builder, Hardware Privileges &amp; Nested Process Transparency
          </h2>
          <p className="text-xs text-slate-400">
            Build standalone mobile apps directly on your phone, calibrate Android hardware permissions, and inspect nested backend/runtime layers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onToggleOfflineSimulation}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              isOfflineSimulated
                ? 'bg-amber-950/60 border-amber-500 text-amber-200'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <WifiOff className="w-3.5 h-3.5" />
            {isOfflineSimulated ? 'Offline Mode Active (Local Engine)' : 'Test Offline Disconnect'}
          </button>

          <button
            type="button"
            onClick={onTriggerPwaInstall}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-950 bg-sky-400 rounded-lg hover:bg-sky-300 transition-colors whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            Install Android / PWA App
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 4 Cols: On-Device Mobile App Builder & Live Phone Preview */}
        <div className="lg:col-span-5 bg-slate-900/70 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-sky-400" />
                On-Device Android App Studio
              </h3>
              <span className="text-xs font-mono text-slate-400">
                {microApps.length} Installed Blueprints
              </span>
            </div>

            {/* Create New Mobile App Form */}
            <form onSubmit={handleCreateMicroApp} className="space-y-2.5 bg-slate-950 p-3 rounded-lg border border-slate-800">
              <div className="text-xs font-medium text-slate-300">
                Create New Mobile App Blueprint
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="App Name (e.g. Neural Radar)"
                  aria-label="New Android App Name"
                  value={newAppName}
                  onChange={(e) => setNewAppName(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded text-slate-100 focus:outline-none focus:border-sky-500"
                />
                <input
                  type="text"
                  placeholder="Package (io.axiom0.radar)"
                  aria-label="New Android Package ID"
                  value={newAppPkg}
                  onChange={(e) => setNewAppPkg(e.target.value)}
                  className="px-2.5 py-1.5 text-xs font-mono bg-slate-900 border border-slate-800 rounded text-slate-100 focus:outline-none focus:border-sky-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <select
                  aria-label="Attach Live Telemetry Stream"
                  value={selectedSignalId}
                  onChange={(e) => setSelectedSignalId(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 text-xs font-mono bg-slate-900 border border-slate-800 rounded text-slate-200"
                >
                  {signalNodes.map((s) => (
                    <option key={s.id} value={s.id}>
                      Pipe Stream: {s.label} ({s.value} {s.unit})
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs font-semibold text-slate-950 bg-sky-400 rounded hover:bg-sky-300 transition-colors whitespace-nowrap shrink-0"
                >
                  Build App
                </button>
              </div>
            </form>

            {/* Selector Tabs for Micro-Apps */}
            <div className="flex flex-wrap gap-1.5">
              {microApps.map((app) => (
                <button
                  key={app.id}
                  type="button"
                  onClick={() => setActiveAppId(app.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                    activeAppId === app.id
                      ? 'bg-sky-500/20 border-sky-400 text-sky-200'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {app.name}
                </button>
              ))}
            </div>

            {/* Simulated Android Device Viewport */}
            {activeApp && (
              <div className="border-2 border-slate-700 rounded-2xl bg-slate-950 p-4 space-y-3">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 border-b border-slate-800 pb-2">
                  <span>ANDROID 15 · {activeApp.packageId}</span>
                  <span className="text-emerald-400">v{activeApp.versionCode} · OFFLINE-READY</span>
                </div>

                <div className="space-y-1">
                  <div className="text-sm font-semibold text-slate-100">{activeApp.name}</div>
                  <div className="text-xs text-slate-400">
                    Bound Telemetry Widget: <strong className="text-sky-300">{attachedSignal?.label}</strong>
                  </div>
                </div>

                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="text-[11px] text-slate-400">Live Compound Sensor Readout</div>
                    <div className="text-xl font-mono font-bold text-slate-100 tabular-nums">
                      {attachedSignal?.value ?? 0} {attachedSignal?.unit}
                    </div>
                  </div>
                  <div className="text-right font-mono text-xs text-emerald-400 tabular-nums">
                    VM R0: {vmState.registers[0]}
                    <br />
                    Cycles: {vmState.cycles}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleExportApkManifest}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-lg transition-colors"
                  >
                    <Play className="w-3.5 h-3.5 text-sky-400" />
                    Generate WebAPK Bundle
                  </button>
                </div>

                {exportedBundleJson && (
                  <pre className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg font-mono text-[11px] text-sky-300 max-h-36 overflow-y-auto">
                    {exportedBundleJson}
                  </pre>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right 7 Cols: Android Privileges Matrix + Nested Backend Transparency */}
        <div className="lg:col-span-7 space-y-6">
          {/* Android Manifest Privileges */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-sky-400" />
                Android System Privileges &amp; Hardware API Bridges
              </h3>
              <span className="text-xs font-mono text-slate-400 tabular-nums">
                {permissions.filter((p) => p.granted).length}/{permissions.length} Active
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {permissions.map((perm) => (
                <div
                  key={perm.id}
                  className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex flex-col justify-between gap-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs font-semibold text-slate-100">{perm.label}</div>
                      <div className="text-[11px] font-mono text-slate-400">
                        {perm.manifestName}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onTogglePermission(perm.id)}
                      className={`px-2.5 py-1 text-[11px] font-mono rounded border transition-colors ${
                        perm.granted
                          ? 'bg-emerald-950/60 border-emerald-600 text-emerald-300'
                          : 'bg-slate-900 border-slate-700 text-slate-400'
                      }`}
                    >
                      {perm.granted ? 'GRANTED' : 'REVOKED'}
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-1.5 border-t border-slate-900 text-[11px]">
                    <span className="font-mono text-slate-400 truncate max-w-[180px]">
                      {perm.lastTestedResult}
                    </span>
                    <button
                      type="button"
                      onClick={() => onTestHardwareBridge(perm.id)}
                      className="text-sky-400 hover:text-sky-300 font-medium whitespace-nowrap"
                    >
                      Probe Hardware
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Nested 4-Layer Backend & Process Transparency Matrix */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-sky-400" />
                Nested Multi-Layer Backend &amp; Runtime Transparency Inspector
              </h3>
              <span className="text-xs font-mono text-emerald-400">
                100% Transparent State Tree
              </span>
            </div>

            <div className="space-y-2.5 font-mono text-xs">
              {/* Layer 0: Binary & VM */}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-1.5">
                <div className="flex items-center justify-between text-sky-300 font-semibold font-sans">
                  <span>01. Binary &amp; Register Substrate</span>
                  <span className="font-mono">PC=0x{vmState.pc.toString(16).padStart(2, '0')} · {vmState.bytecode.length} Bytes</span>
                </div>
                <div className="text-slate-400 text-[11px] tabular-nums">
                  Registers: [{Array.from(vmState.registers).join(', ')}] · Output Bus: [{vmState.output.join(', ')}]
                </div>
              </div>

              {/* Layer 1: Server Node.js Process & V8 Heap */}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-1.5">
                <div className="flex items-center justify-between text-amber-300 font-semibold font-sans">
                  <span>02. Server Node.js Process &amp; V8 Heap</span>
                  <span className="font-mono">
                    PID: {serverTelemetry?.pid ?? 1} · {serverTelemetry?.nodeVersion ?? 'v22.x'}
                  </span>
                </div>
                <div className="text-slate-400 text-[11px] tabular-nums">
                  RSS: {serverTelemetry?.rssMB ?? 84.2} MB · Heap Used: {serverTelemetry?.heapUsedMB ?? 41.8} MB · Uptime: {serverTelemetry?.uptimeSeconds ?? 120}s · .gitignore Raw: &quot;{serverTelemetry?.gitignoreRawState ?? '.gitignore'}&quot;
                </div>
              </div>

              {/* Layer 2: Inline Kernel Parameter Calibration */}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
                <div className="flex items-center justify-between text-emerald-300 font-semibold font-sans">
                  <span className="flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5" />
                    03. Live Hyperparameter Calibration Bus
                  </span>
                  <span className="font-mono">Temp: {temperature} · TopK: {topK}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 font-sans">
                  <div>
                    <label htmlFor="nested-temp-slider" className="block text-[11px] text-slate-400 mb-1">
                      Sampling Temperature ({temperature})
                    </label>
                    <input
                      id="nested-temp-slider"
                      type="range"
                      min={0}
                      max={2}
                      step={0.05}
                      value={temperature}
                      onChange={(e) => onTemperatureChange(Number(e.target.value))}
                      className="w-full accent-sky-400"
                    />
                  </div>
                  <div>
                    <label htmlFor="nested-topk-slider" className="block text-[11px] text-slate-400 mb-1">
                      Top-K Token Cutoff ({topK})
                    </label>
                    <input
                      id="nested-topk-slider"
                      type="range"
                      min={1}
                      max={128}
                      step={1}
                      value={topK}
                      onChange={(e) => onTopKChange(Number(e.target.value))}
                      className="w-full accent-sky-400"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
