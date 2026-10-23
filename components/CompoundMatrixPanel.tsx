'use client';

import React, { useState } from 'react';
import {
  SignalNode,
  SignalOperator,
  evaluateCompoundSignal,
} from '@/lib/axiom-core';
import { Layers, Plus, Sliders, Trash2, Activity, Zap } from 'lucide-react';

interface CompoundMatrixPanelProps {
  nodes: SignalNode[];
  onAddCompoundNode: (
    label: string,
    sourceAId: string,
    sourceBId: string,
    operator: SignalOperator,
    gain: number
  ) => void;
  onUpdateNodeGain: (id: string, gain: number) => void;
  onInjectManualImpulse: (id: string, delta: number) => void;
  onRemoveCompoundNode: (id: string) => void;
}

const OPERATORS: { op: SignalOperator; name: string; desc: string }[] = [
  { op: 'ADD', name: 'A + B (Additive)', desc: 'Sums two live telemetry streams' },
  { op: 'SUB', name: 'A - B (Differential)', desc: 'Measures divergence between streams' },
  { op: 'MUL', name: '(A × B) / 100 (Product)', desc: 'Cross-modulates two live signals' },
  { op: 'XOR', name: 'A ⊕ B (Bitwise XOR)', desc: 'Bitwise exclusive-OR across integer signals' },
  { op: 'MOD', name: 'A mod B (Modular)', desc: 'Cycles stream A within stream B bounds' },
  { op: 'AVG', name: '(A + B) / 2 (Mean)', desc: 'Harmonic/Arithmetic mean stabilizer' },
  { op: 'HARMONIC', name: '2AB / (A + B)', desc: 'Harmonic resonance coupling' },
];

export default function CompoundMatrixPanel({
  nodes,
  onAddCompoundNode,
  onUpdateNodeGain,
  onInjectManualImpulse,
  onRemoveCompoundNode,
}: CompoundMatrixPanelProps) {
  const [sourceAId, setSourceAId] = useState<string>(nodes[0]?.id || 'heap_mb');
  const [sourceBId, setSourceBId] = useState<string>(nodes[1]?.id || 'dom_nodes');
  const [operator, setOperator] = useState<SignalOperator>('XOR');
  const [gain, setGain] = useState<number>(1);
  const [customLabel, setCustomLabel] = useState<string>('');

  const nodeA = nodes.find((n) => n.id === sourceAId) || nodes[0];
  const nodeB = nodes.find((n) => n.id === sourceBId) || nodes[1] || nodes[0];

  const previewValue =
    nodeA && nodeB ? evaluateCompoundSignal(operator, nodeA.value, nodeB.value, gain) : 0;

  const handleSynthesize = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nodeA || !nodeB) return;
    const label =
      customLabel.trim() || `${nodeA.label.split(' ')[0]} ${operator} ${nodeB.label.split(' ')[0]}`;
    onAddCompoundNode(label, nodeA.id, nodeB.id, operator, gain);
    setCustomLabel('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">
            Infinite Compounding Live Telemetry &amp; Signal Matrix
          </h2>
          <p className="text-xs text-slate-400">
            Every widget reflects live runtime, hardware, or VM state and can be combined with any other widget indefinitely.
          </p>
        </div>
        <div className="text-xs font-mono text-slate-400 tabular-nums">
          Active Nodes: {nodes.length} · Base Streams: {nodes.filter((n) => n.category === 'source').length} · Compounded: {nodes.filter((n) => n.category === 'compound').length}
        </div>
      </div>

      {/* Compound Synthesizer Form */}
      <form
        onSubmit={handleSynthesize}
        className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-end"
      >
        <div className="md:col-span-3 space-y-1.5">
          <label htmlFor="compound-source-a" className="block text-xs font-medium text-slate-300">
            Input Stream A (Any Base or Compound Widget)
          </label>
          <select
            id="compound-source-a"
            value={sourceAId}
            onChange={(e) => setSourceAId(e.target.value)}
            className="w-full px-3 py-2 text-xs font-mono bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-sky-500"
          >
            {nodes.map((n) => (
              <option key={n.id} value={n.id}>
                {n.label} ({n.value} {n.unit})
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2 space-y-1.5">
          <label htmlFor="compound-operator" className="block text-xs font-medium text-slate-300">
            Combinator Operator
          </label>
          <select
            id="compound-operator"
            value={operator}
            onChange={(e) => setOperator(e.target.value as SignalOperator)}
            className="w-full px-3 py-2 text-xs font-mono bg-slate-950 border border-slate-800 rounded-lg text-sky-300 focus:outline-none focus:border-sky-500"
          >
            {OPERATORS.map((item) => (
              <option key={item.op} value={item.op}>
                {item.name}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-3 space-y-1.5">
          <label htmlFor="compound-source-b" className="block text-xs font-medium text-slate-300">
            Input Stream B (Any Base or Compound Widget)
          </label>
          <select
            id="compound-source-b"
            value={sourceBId}
            onChange={(e) => setSourceBId(e.target.value)}
            className="w-full px-3 py-2 text-xs font-mono bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-sky-500"
          >
            {nodes.map((n) => (
              <option key={n.id} value={n.id}>
                {n.label} ({n.value} {n.unit})
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2 space-y-1.5">
          <label htmlFor="compound-label" className="block text-xs font-medium text-slate-300">
            Node Identifier (Optional)
          </label>
          <input
            id="compound-label"
            type="text"
            placeholder="e.g. Entropy-Heap XOR"
            value={customLabel}
            onChange={(e) => setCustomLabel(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-sky-500"
          />
        </div>

        <div className="md:col-span-2">
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-950 bg-sky-400 rounded-lg hover:bg-sky-300 transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            Spawn Widget ({previewValue})
          </button>
        </div>
      </form>

      {/* Interactive Telemetry Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {nodes.map((node) => {
          const maxHist = Math.max(...node.history, 1);
          const minHist = Math.min(...node.history, 0);
          const span = Math.max(1, maxHist - minHist);

          return (
            <div
              key={node.id}
              className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    {node.category === 'compound' ? (
                      <Layers className="w-3.5 h-3.5 text-amber-400" />
                    ) : (
                      <Activity className="w-3.5 h-3.5 text-sky-400" />
                    )}
                    <span>{node.label}</span>
                  </div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-mono font-bold tabular-nums text-slate-100">
                      {node.value}
                    </span>
                    <span className="text-xs font-mono text-slate-400">{node.unit}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSourceAId(node.id);
                    }}
                    className="px-2 py-1 text-[11px] font-mono bg-slate-950 border border-slate-800 rounded text-slate-300 hover:border-sky-500 hover:text-sky-300 transition-colors"
                    title="Use as Input A"
                  >
                    Set A
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSourceBId(node.id);
                    }}
                    className="px-2 py-1 text-[11px] font-mono bg-slate-950 border border-slate-800 rounded text-slate-300 hover:border-sky-500 hover:text-sky-300 transition-colors"
                    title="Use as Input B"
                  >
                    Set B
                  </button>
                  {node.category === 'compound' && (
                    <button
                      type="button"
                      onClick={() => onRemoveCompoundNode(node.id)}
                      aria-label={`Remove ${node.label}`}
                      className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Sparkline Bar History */}
              <div className="h-12 flex items-end gap-1 pt-2 border-t border-slate-800/60">
                {node.history.slice(-20).map((val, i) => {
                  const pct = Math.max(12, Math.min(100, Math.round(((val - minHist) / span) * 100)));
                  return (
                    <div
                      key={i}
                      style={{ height: `${pct}%` }}
                      className={`flex-1 rounded-t transition-all ${
                        node.category === 'compound' ? 'bg-amber-400/70' : 'bg-sky-400/70'
                      }`}
                    />
                  );
                })}
              </div>

              {/* Interactive Controls per Widget */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-1.5 flex-1">
                  <Sliders className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="text-slate-400 text-[11px]">Gain:</span>
                  <input
                    type="range"
                    min={0.2}
                    max={5}
                    step={0.2}
                    value={node.gain ?? 1}
                    aria-label={`Gain for ${node.label}`}
                    onChange={(e) => onUpdateNodeGain(node.id, Number(e.target.value))}
                    className="w-full accent-sky-400"
                  />
                  <span className="font-mono text-[11px] tabular-nums text-slate-300">
                    {(node.gain ?? 1).toFixed(1)}x
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => onInjectManualImpulse(node.id, 16)}
                  className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-slate-950 border border-slate-800 rounded hover:border-emerald-500/60 text-emerald-300 transition-colors whitespace-nowrap shrink-0"
                >
                  <Zap className="w-3 h-3" />
                  +16 Impulse
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
