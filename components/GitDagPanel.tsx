'use client';

import React, { useState } from 'react';
import {
  LLMCommitSnapshot,
  IgnoreSurfaceEntry,
  diffStringsLineByLine,
} from '@/lib/axiom-core';
import { GitBranch, GitCommit, GitMerge, RotateCcw, RefreshCw, FileCode, Plus } from 'lucide-react';

interface GitDagPanelProps {
  commits: LLMCommitSnapshot[];
  activeCommitHash: string;
  activeBranch: string;
  branches: string[];
  ignoreSurfaces: IgnoreSurfaceEntry[];
  onCreateCommit: (message: string) => void;
  onCheckoutCommit: (commit: LLMCommitSnapshot) => void;
  onCreateBranch: (branchName: string) => void;
  onPurgeIgnoreCache: (filename?: string) => void;
  onAddIgnoreSurface: (filename: string) => void;
}

export default function GitDagPanel({
  commits,
  activeCommitHash,
  activeBranch,
  branches,
  ignoreSurfaces,
  onCreateCommit,
  onCheckoutCommit,
  onCreateBranch,
  onPurgeIgnoreCache,
  onAddIgnoreSurface,
}: GitDagPanelProps) {
  const [commitMsg, setCommitMsg] = useState<string>('');
  const [newBranchName, setNewBranchName] = useState<string>('');
  const [compareHash, setCompareHash] = useState<string>(commits[0]?.hash || '');
  const [newIgnoreFile, setNewIgnoreFile] = useState<string>('');

  const activeCommit = commits.find((c) => c.hash === activeCommitHash) || commits[0];
  const comparedCommit = commits.find((c) => c.hash === compareHash) || commits[0];

  const promptDiff =
    activeCommit && comparedCommit
      ? diffStringsLineByLine(comparedCommit.systemPrompt, activeCommit.systemPrompt)
      : [];

  const handleCommitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const msg =
      commitMsg.trim() || `Checkpoint on ${activeBranch} (${new Date().toLocaleTimeString()})`;
    onCreateCommit(msg);
    setCommitMsg('');
  };

  const handleBranchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranchName.trim()) return;
    onCreateBranch(newBranchName.trim().toLowerCase().replace(/\s+/g, '-'));
    setNewBranchName('');
  };

  const handleAddIgnore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIgnoreFile.trim()) return;
    const clean = newIgnoreFile.trim().startsWith('.')
      ? newIgnoreFile.trim()
      : `.${newIgnoreFile.trim()}`;
    onAddIgnoreSurface(clean);
    setNewIgnoreFile('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">
            Git-DAG LLM Progression &amp; Self-Referential Ignore Matrix
          </h2>
          <p className="text-xs text-slate-400">
            Content-addressed Merkle snapshots of system prompts, hyperparameters, and context windows with full diff &amp; checkout.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono text-slate-300">
          <span className="flex items-center gap-1.5">
            <GitBranch className="w-3.5 h-3.5 text-sky-400" />
            Branch: <strong>{activeBranch}</strong>
          </span>
          <span>·</span>
          <span>
            HEAD: <strong className="text-amber-300">{activeCommitHash}</strong>
          </span>
          <span>·</span>
          <span>{commits.length} Commits</span>
        </div>
      </div>

      {/* Commit & Branch Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <form
          onSubmit={handleCommitSubmit}
          className="lg:col-span-7 bg-slate-900/70 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-stretch sm:items-end gap-3"
        >
          <div className="flex-1 space-y-1.5">
            <label htmlFor="git-commit-msg" className="block text-xs font-medium text-slate-300">
              Snapshot Current LLM Progression State (Git-Style Commit)
            </label>
            <input
              id="git-commit-msg"
              type="text"
              placeholder="Describe prompt mutation, parameter calibration, or context state..."
              value={commitMsg}
              onChange={(e) => setCommitMsg(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-sky-500"
            />
          </div>
          <button
            type="submit"
            className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-950 bg-sky-400 rounded-lg hover:bg-sky-300 transition-colors whitespace-nowrap shrink-0"
          >
            <GitCommit className="w-3.5 h-3.5" />
            Commit LLM State
          </button>
        </form>

        <form
          onSubmit={handleBranchSubmit}
          className="lg:col-span-5 bg-slate-900/70 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-stretch sm:items-end gap-3"
        >
          <div className="flex-1 space-y-1.5">
            <label htmlFor="git-branch-input" className="block text-xs font-medium text-slate-300">
              Fork Divergent Reasoning Branch ({branches.join(', ')})
            </label>
            <input
              id="git-branch-input"
              type="text"
              placeholder="e.g. experiment-zero-entropy"
              value={newBranchName}
              onChange={(e) => setNewBranchName(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-sky-500"
            />
          </div>
          <button
            type="submit"
            className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-200 bg-slate-950 border border-slate-700 rounded-lg hover:border-sky-400 transition-colors whitespace-nowrap shrink-0"
          >
            <GitMerge className="w-3.5 h-3.5" />
            Create &amp; Checkout Branch
          </button>
        </form>
      </div>

      {/* Commit DAG Log & Diff Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Commit History List */}
        <div className="lg:col-span-7 bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-3">
          <h3 className="text-xs font-semibold text-slate-200">
            Merkle DAG Commit History (Click Checkout to Restore LLM State)
          </h3>

          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {commits.map((commit) => {
              const isHead = commit.hash === activeCommitHash;
              return (
                <div
                  key={commit.hash}
                  className={`p-3 rounded-lg border transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isHead
                      ? 'bg-sky-950/30 border-sky-500/60'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-mono font-semibold text-amber-300 tabular-nums">
                        {commit.hash}
                      </span>
                      <span className="text-slate-500">·</span>
                      <span className="font-mono text-sky-300">{commit.branch}</span>
                      <span className="text-slate-500">·</span>
                      <span className="font-mono text-slate-400">{commit.model}</span>
                      {isHead && (
                        <span className="text-emerald-400 font-mono font-semibold">
                          [HEAD]
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-medium text-slate-100">{commit.message}</div>
                    <div className="text-xs font-mono text-slate-400 tabular-nums">
                      Coherence: {commit.coherenceScore}% · Entropy: {commit.entropyBits} bits · Temp: {commit.temperature} · Msgs: {commit.contextMessages.length}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setCompareHash(commit.hash)}
                      className="px-2.5 py-1.5 text-xs font-mono text-slate-300 bg-slate-900 border border-slate-800 rounded hover:border-slate-600 transition-colors"
                    >
                      Diff vs HEAD
                    </button>
                    <button
                      type="button"
                      onClick={() => onCheckoutCommit(commit)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-950 bg-sky-400 rounded hover:bg-sky-300 transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Checkout
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* System Prompt & State Diff Inspector */}
        <div className="lg:col-span-5 bg-slate-900/70 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-200">
                System Prompt &amp; Hyperparameter Diff
              </h3>
              <span className="text-xs font-mono text-slate-400 tabular-nums">
                {comparedCommit?.hash} → {activeCommit?.hash}
              </span>
            </div>

            {activeCommit && comparedCommit && (
              <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-300 space-y-1 tabular-nums">
                <div>
                  Model: {comparedCommit.model} → <strong className="text-sky-300">{activeCommit.model}</strong>
                </div>
                <div>
                  Temp / TopP / TopK: {comparedCommit.temperature}/{comparedCommit.topP}/{comparedCommit.topK} →{' '}
                  <strong className="text-sky-300">
                    {activeCommit.temperature}/{activeCommit.topP}/{activeCommit.topK}
                  </strong>
                </div>
                <div>
                  Coherence Delta: {comparedCommit.coherenceScore}% →{' '}
                  <strong className="text-emerald-400">{activeCommit.coherenceScore}%</strong>
                </div>
              </div>
            )}

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg font-mono text-xs max-h-60 overflow-y-auto space-y-1">
              {promptDiff.map((line, idx) => (
                <div
                  key={idx}
                  className={
                    line.type === 'added'
                      ? 'text-emerald-300 bg-emerald-950/30 px-1.5 py-0.5 rounded'
                      : line.type === 'removed'
                      ? 'text-rose-300 bg-rose-950/30 px-1.5 py-0.5 rounded line-through'
                      : 'text-slate-400 px-1.5 py-0.5'
                  }
                >
                  {line.type === 'added' ? '+ ' : line.type === 'removed' ? '- ' : '  '}
                  {line.text}
                </div>
              ))}
            </div>
          </div>

          <div className="text-xs text-slate-400 pt-2 border-t border-slate-800">
            Checking out any commit immediately restores its System Prompt, model selection, temperature, and conversation context.
          </div>
        </div>
      </div>

      {/* Self-Referential .gitignore & Ignore-Surface Cache Manager */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <FileCode className="w-4 h-4 text-sky-400" />
              Self-Referential Ignore &amp; Cache Inversion Matrix (`.gitignore` → `.gitignore`)
            </h3>
            <p className="text-xs text-slate-400">
              All ignore mechanisms are inverted to contain only themselves and their caches are purged, eliminating hidden project state.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onPurgeIgnoreCache()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-emerald-400 rounded-lg hover:bg-emerald-300 transition-colors whitespace-nowrap shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Flush All Ignore Caches (`git rm --cached`)
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-2 px-3 font-medium">Ignore Surface File</th>
                <th className="py-2 px-3 font-medium">Exact File Content</th>
                <th className="py-2 px-3 font-medium">Cache State</th>
                <th className="py-2 px-3 font-medium">Architectural Effect</th>
                <th className="py-2 px-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {ignoreSurfaces.map((item) => (
                <tr key={item.filename} className="hover:bg-slate-950/60">
                  <td className="py-2.5 px-3 font-semibold text-slate-100">{item.filename}</td>
                  <td className="py-2.5 px-3 text-sky-300">{item.currentContent}</td>
                  <td className="py-2.5 px-3 text-emerald-400 tabular-nums">
                    PURGED ({item.lastPurgedAt.slice(11, 19)})
                  </td>
                  <td className="py-2.5 px-3 font-sans text-slate-300">{item.effectDescription}</td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      type="button"
                      onClick={() => onPurgeIgnoreCache(item.filename)}
                      className="px-2.5 py-1 text-xs bg-slate-950 border border-slate-800 rounded text-slate-300 hover:border-sky-500 hover:text-white transition-colors"
                    >
                      Re-Flush Cache
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <form onSubmit={handleAddIgnore} className="flex flex-wrap items-center gap-2 pt-2">
          <label htmlFor="new-ignore-surface" className="text-xs text-slate-400">
            Invert Additional Ignore Surface:
          </label>
          <input
            id="new-ignore-surface"
            type="text"
            placeholder="e.g. .cursorignore or .gcloudignore"
            value={newIgnoreFile}
            onChange={(e) => setNewIgnoreFile(e.target.value)}
            className="px-3 py-1.5 text-xs font-mono bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-sky-500"
          />
          <button
            type="submit"
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-slate-800 text-slate-100 rounded-lg hover:bg-slate-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Put Into Itself &amp; Purge Cache
          </button>
        </form>
      </div>
    </div>
  );
}
