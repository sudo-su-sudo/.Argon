'use client';

import React, { useState, useMemo } from 'react';
import {
  compileAxiomSource,
  executeAxiomBytecode,
  VMState,
} from '@/lib/axiom-core';
import { Play, RotateCcw, Cpu, Binary, Terminal, ArrowRight } from 'lucide-react';

const PRESET_PROGRAMS: Record<string, { label: string; code: string; desc: string }> = {
  fibonacci: {
    label: 'Fibonacci Sequence',
    desc: 'Computes Fibonacci terms in R0/R1 and emits values to the output bus.',
    code: `; Axiom-0 First-Principles Fibonacci
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
HALT`,
  },
  cipher: {
    label: 'XOR Bitwise Cipher',
    desc: 'Applies a rolling XOR key across registers and stores encrypted bytes in RAM.',
    code: `; Rolling XOR Stream Cipher
LOAD R0, 65
LOAD R1, 42
LOAD R2, 5
LOAD R3, 1
CIPHER_LOOP:
MOV R4, R0
XOR R4, R1
STORE R4, [0x10]
EMIT R4
ADD R0, R3
SHL R1, 1
SUB R2, R3
JNZ CIPHER_LOOP
HALT`,
  },
  harmonic: {
    label: 'Harmonic Accumulator',
    desc: 'Generates stepped harmonic multiples for the Telemetry Matrix.',
    code: `; Stepped Harmonic Accumulator
LOAD R0, 12
LOAD R1, 3
LOAD R2, 6
LOAD R3, 1
HARM_LOOP:
MUL R0, R1
SHR R0, 1
STORE R0, [0x08]
EMIT R0
SUB R2, R3
JNZ HARM_LOOP
HALT`,
  },
};

interface BinaryVmPanelProps {
  sourceCode: string;
  onSourceChange: (code: string) => void;
  vmState: VMState;
  onExecute: (newState: VMState) => void;
  onPipeRegisterToMatrix: (regIndex: number, value: number) => void;
}

export default function BinaryVmPanel({
  sourceCode,
  onSourceChange,
  vmState,
  onExecute,
  onPipeRegisterToMatrix,
}: BinaryVmPanelProps) {
  const [selectedCell, setSelectedCell] = useState<number>(0x20);
  const [maxCycles, setMaxCycles] = useState<number>(256);

  const compiled = useMemo(() => compileAxiomSource(sourceCode), [sourceCode]);

  const handleRun = () => {
    const result = executeAxiomBytecode(compiled.bytecode, maxCycles);
    onExecute(result);
  };

  const handlePreset = (key: string) => {
    const nextCode = PRESET_PROGRAMS[key].code;
    onSourceChange(nextCode);
    const nextCompiled = compileAxiomSource(nextCode);
    onExecute(executeAxiomBytecode(nextCompiled.bytecode, maxCycles));
  };

  return (
    <div className="space-y-6">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">
            Axiom-0 Custom Language, Compiler &amp; Binary Virtual Machine
          </h2>
          <p className="text-xs text-slate-400">
            Zero-dependency 2-pass assembler translating mnemonics into 24-bit binary machine words executed on an 8-register CPU.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {Object.entries(PRESET_PROGRAMS).map(([key, item]) => (
            <button
              key={key}
              type="button"
              onClick={() => handlePreset(key)}
              className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-900 border border-slate-800 rounded-lg hover:border-slate-700 hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Load {item.label}
            </button>
          ))}
          <button
            type="button"
            onClick={handleRun}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-950 bg-sky-400 rounded-lg hover:bg-sky-300 transition-colors whitespace-nowrap shrink-0"
          >
            <Play className="w-3.5 h-3.5" />
            Compile &amp; Execute Binary
          </button>
        </div>
      </div>

      {/* Main 3-Column Compiler Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Column 1: Source Editor */}
        <div className="lg:col-span-4 flex flex-col justify-between bg-slate-900/70 border border-slate-800 rounded-xl p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label
                htmlFor="axiom-source-editor"
                className="text-xs font-semibold text-slate-200 flex items-center gap-1.5"
              >
                <Terminal className="w-3.5 h-3.5 text-sky-400" />
                Axiom-0 Assembly Source
              </label>
              <span className="text-xs font-mono tabular-nums text-slate-400">
                {compiled.bytecode.length} bytes · {compiled.disassembly.length} words
              </span>
            </div>

            <textarea
              id="axiom-source-editor"
              value={sourceCode}
              onChange={(e) => onSourceChange(e.target.value)}
              rows={14}
              spellCheck={false}
              className="w-full font-mono text-xs leading-relaxed bg-slate-950 text-sky-200 border border-slate-800 rounded-lg p-3 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="pt-3 mt-3 border-t border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="vm-cycle-budget" className="text-slate-400">
                Cycle Safety Budget
              </label>
              <span className="font-mono tabular-nums text-slate-200">{maxCycles} cycles</span>
            </div>
            <input
              id="vm-cycle-budget"
              type="range"
              min={16}
              max={1024}
              step={16}
              value={maxCycles}
              onChange={(e) => setMaxCycles(Number(e.target.value))}
              className="w-full accent-sky-400"
            />
            {compiled.errors.length > 0 ? (
              <div className="p-2 bg-rose-950/50 border border-rose-800 rounded text-xs text-rose-300 font-mono">
                {compiled.errors.map((err, i) => (
                  <div key={i}>{err}</div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-emerald-400 font-mono">
                Compiler Status: 0 errors · Ready for binary execution
              </div>
            )}
          </div>
        </div>

        {/* Column 2: Binary Machine Code & Disassembly Table */}
        <div className="lg:col-span-4 flex flex-col justify-between bg-slate-900/70 border border-slate-800 rounded-xl p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Binary className="w-3.5 h-3.5 text-sky-400" />
                Compiled 24-Bit Machine Words
              </h3>
              <span className="text-xs font-mono tabular-nums text-slate-400">
                PC: 0x{vmState.pc.toString(16).padStart(2, '0').toUpperCase()}
              </span>
            </div>

            <div className="max-h-64 overflow-y-auto border border-slate-800 rounded-lg divide-y divide-slate-800/70 bg-slate-950">
              {compiled.disassembly.map((row) => {
                const isCurrentPc = vmState.pc === row.offset;
                return (
                  <div
                    key={row.offset}
                    className={`px-3 py-1.5 text-xs font-mono flex items-center justify-between gap-2 ${
                      isCurrentPc ? 'bg-sky-950/60 text-sky-200' : 'text-slate-300'
                    }`}
                  >
                    <span className="text-slate-500 tabular-nums">
                      0x{row.offset.toString(16).padStart(2, '0').toUpperCase()}
                    </span>
                    <span className="text-amber-300 tabular-nums">{row.hex}</span>
                    <span className="text-slate-400 truncate max-w-[130px]">{row.mnemonic}</span>
                  </div>
                );
              })}
            </div>

            <div className="space-y-1">
              <div className="text-xs text-slate-400">Raw Binary Bitstream (MSB → LSB)</div>
              <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg font-mono text-[11px] text-slate-300 break-all max-h-24 overflow-y-auto leading-relaxed tabular-nums">
                {compiled.binaryDump || '00000000'}
              </div>
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Cycles Executed: {vmState.cycles}</span>
            <span>Halted: {vmState.flags.halted ? 'TRUE' : 'FALSE'}</span>
          </div>
        </div>

        {/* Column 3: Live CPU Registers & Execution Trace */}
        <div className="lg:col-span-4 flex flex-col justify-between bg-slate-900/70 border border-slate-800 rounded-xl p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-sky-400" />
                Registers (Click to Pipe to Matrix)
              </h3>
              <span className="text-xs font-mono text-slate-400">
                Z={vmState.flags.zero ? 1 : 0} · N={vmState.flags.negative ? 1 : 0}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {Array.from(vmState.registers).map((val, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onPipeRegisterToMatrix(idx, val)}
                  className="flex items-center justify-between px-3 py-2 bg-slate-950 border border-slate-800 hover:border-sky-500/60 rounded-lg text-left transition-colors group"
                >
                  <div>
                    <div className="text-[11px] font-mono text-slate-400 group-hover:text-sky-300">
                      R{idx}
                    </div>
                    <div className="text-sm font-mono font-semibold tabular-nums text-slate-100">
                      {val}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-mono text-slate-500 tabular-nums">
                      0x{(val & 0xff).toString(16).padStart(2, '0').toUpperCase()}
                    </div>
                    <ArrowRight className="w-3 h-3 text-slate-600 group-hover:text-sky-400 ml-auto mt-1" />
                  </div>
                </button>
              ))}
            </div>

            <div className="space-y-1">
              <div className="text-xs text-slate-400 flex items-center justify-between">
                <span>VM Output Bus (`EMIT`)</span>
                <span className="font-mono text-sky-300">
                  [{vmState.output.join(', ') || 'empty'}]
                </span>
              </div>
              <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg font-mono text-xs text-emerald-300 max-h-24 overflow-y-auto">
                {vmState.trace.slice(-8).map((line, i) => (
                  <div key={i}>{line}</div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">
              Memory Cell [0x{selectedCell.toString(16).padStart(2, '0').toUpperCase()}]:{' '}
              <strong className="font-mono text-slate-100">{vmState.memory[selectedCell]}</strong>
            </span>
            <button
              type="button"
              onClick={() => {
                const next = compileAxiomSource(sourceCode);
                onExecute(executeAxiomBytecode(next.bytecode, maxCycles));
              }}
              className="flex items-center gap-1 text-slate-300 hover:text-white font-medium"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset &amp; Step
            </button>
          </div>
        </div>
      </div>

      {/* 64-Byte Addressable RAM Hex Matrix */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-xs font-semibold text-slate-200">
            Interactive Addressable RAM Matrix (First 64 Bytes · Click Cell to Inspect &amp; Pipe)
          </h3>
          <span className="text-xs font-mono text-slate-400 tabular-nums">
            Selected Address: 0x{selectedCell.toString(16).padStart(2, '0').toUpperCase()} ={' '}
            {vmState.memory[selectedCell]} (0b
            {vmState.memory[selectedCell].toString(2).padStart(8, '0')})
          </span>
        </div>

        <div className="grid grid-cols-8 sm:grid-cols-16 gap-1.5">
          {Array.from(vmState.memory.slice(0, 64)).map((byteVal, addr) => {
            const isSelected = selectedCell === addr;
            const isNonZero = byteVal > 0;
            return (
              <button
                key={addr}
                type="button"
                onClick={() => {
                  setSelectedCell(addr);
                  onPipeRegisterToMatrix(addr, byteVal);
                }}
                aria-label={`Memory cell 0x${addr.toString(16).padStart(2, '0')}`}
                className={`py-1.5 px-1 rounded text-center font-mono text-xs tabular-nums transition-colors border ${
                  isSelected
                    ? 'bg-sky-500/20 border-sky-400 text-sky-200 font-semibold'
                    : isNonZero
                    ? 'bg-emerald-950/50 border-emerald-700/60 text-emerald-300'
                    : 'bg-slate-950 border-slate-800/80 text-slate-500 hover:border-slate-700'
                }`}
              >
                {byteVal.toString(16).padStart(2, '0').toUpperCase()}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
