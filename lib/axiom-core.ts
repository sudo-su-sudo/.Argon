// Axiom-0 First-Principles Core Engine
// Zero external dependencies. Pure bitwise, compiler, VM, Git-DAG, and signal-graph primitives.

export interface VMState {
  registers: Int32Array; // R0 - R7
  pc: number;
  sp: number;
  flags: { zero: boolean; negative: boolean; overflow: boolean; halted: boolean };
  memory: Uint8Array; // 256 bytes addressable RAM
  bytecode: Uint8Array;
  output: number[];
  asciiOutput: string;
  cycles: number;
  trace: string[];
}

export enum Opcode {
  NOP = 0x00,
  LOAD = 0x01,  // LOAD Rx, imm8
  MOV = 0x02,   // MOV Rx, Ry
  ADD = 0x03,   // ADD Rx, Ry
  SUB = 0x04,   // SUB Rx, Ry
  MUL = 0x05,   // MUL Rx, Ry
  XOR = 0x06,   // XOR Rx, Ry
  AND = 0x07,   // AND Rx, Ry
  SHL = 0x08,   // SHL Rx, imm8
  SHR = 0x09,   // SHR Rx, imm8
  STORE = 0x0a, // STORE Rx, [addr8]
  FETCH = 0x0b, // FETCH Rx, [addr8]
  CMP = 0x0c,   // CMP Rx, Ry
  JMP = 0x0d,   // JMP addr8
  JZ = 0x0e,    // JZ addr8
  JNZ = 0x0f,   // JNZ addr8
  EMIT = 0x10,  // EMIT Rx (outputs value & ASCII char)
  HALT = 0xff,  // HALT
}

export interface CompiledProgram {
  bytecode: Uint8Array;
  hexDump: string;
  binaryDump: string;
  disassembly: { offset: number; hex: string; binary: string; mnemonic: string }[];
  labels: Record<string, number>;
  errors: string[];
}

/**
 * Pure First-Principles 256-bit Deterministic Hash (8 x 32-bit lanes with avalanche mixing)
 * Used for Git-DAG Commit Hashes and Binary State Integrity
 */
export function computeFirstPrinciplesHash(input: string): string {
  const lanes = new Uint32Array([
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ]);

  for (let i = 0; i < input.length; i++) {
    const code = input.charCodeAt(i);
    const laneIdx = i & 7;
    let v = lanes[laneIdx] ^ (code + Math.imul(i + 1, 0x9e3779b9));
    v = Math.imul(v ^ (v >>> 16), 0x85ebca6b);
    v = Math.imul(v ^ (v >>> 13), 0xc2b2ae35);
    v = (v ^ (v >>> 16)) >>> 0;
    lanes[laneIdx] = v;
    lanes[(laneIdx + 1) & 7] = (lanes[(laneIdx + 1) & 7] + ((v << 7) | (v >>> 25))) >>> 0;
  }

  // Final cross-lane avalanche pass
  for (let round = 0; round < 16; round++) {
    const idx = round & 7;
    const prev = lanes[(idx + 7) & 7];
    let mix = (lanes[idx] ^ ((prev << 11) | (prev >>> 21))) >>> 0;
    mix = Math.imul(mix ^ (mix >>> 15), 0x27d4eb2d) >>> 0;
    lanes[idx] = mix;
  }

  let hex = '';
  for (let i = 0; i < 8; i++) {
    hex += lanes[i].toString(16).padStart(8, '0');
  }
  return hex;
}

/**
 * Compute Shannon Entropy (bits per symbol, 0.0 to 8.0) and Context Coherence Metrics
 */
export function computeInformationMetrics(text: string): {
  byteLength: number;
  estimatedTokens: number;
  shannonEntropyBits: number;
  compressionPotentialPct: number;
  lexicalDiversity: number;
  coherenceScore: number;
} {
  if (!text || text.length === 0) {
    return {
      byteLength: 0,
      estimatedTokens: 0,
      shannonEntropyBits: 0,
      compressionPotentialPct: 0,
      lexicalDiversity: 0,
      coherenceScore: 100,
    };
  }

  const freq = new Uint32Array(256);
  const len = text.length;
  for (let i = 0; i < len; i++) {
    freq[text.charCodeAt(i) & 0xff]++;
  }

  let entropy = 0;
  for (let i = 0; i < 256; i++) {
    if (freq[i] > 0) {
      const p = freq[i] / len;
      entropy -= p * Math.log2(p);
    }
  }

  const words = text
    .toLowerCase()
    .split(/[^a-z0-9_]+/)
    .filter(Boolean);
  const uniqueWords = new Set(words);
  const lexicalDiversity = words.length > 0 ? uniqueWords.size / words.length : 1;
  const estimatedTokens = Math.max(1, Math.ceil(len / 3.8));
  const compressionPotentialPct = Math.max(0, Math.min(95, Math.round((1 - entropy / 8) * 100)));

  // Coherence balances structured density (entropy ~ 4.2-5.4 bits) and lexical diversity
  const entropyDelta = Math.abs(entropy - 4.7);
  const coherenceScore = Math.max(
    10,
    Math.min(100, Math.round(100 - entropyDelta * 8 + lexicalDiversity * 12))
  );

  return {
    byteLength: len,
    estimatedTokens,
    shannonEntropyBits: Number(entropy.toFixed(3)),
    compressionPotentialPct,
    lexicalDiversity: Number(lexicalDiversity.toFixed(3)),
    coherenceScore,
  };
}

function parseRegister(token: string): number | null {
  const cleaned = token.replace(/,/g, '').trim().toUpperCase();
  if (/^R[0-7]$/.test(cleaned)) {
    return parseInt(cleaned.slice(1), 10);
  }
  return null;
}

function parseImmediate(token: string, labels: Record<string, number>): number | null {
  const cleaned = token.replace(/[,[\]]/g, '').trim();
  if (cleaned in labels) {
    return labels[cleaned] & 0xff;
  }
  if (/^0x[0-9a-fA-F]+$/.test(cleaned)) {
    return parseInt(cleaned, 16) & 0xff;
  }
  if (/^0b[01]+$/.test(cleaned)) {
    return parseInt(cleaned.slice(2), 2) & 0xff;
  }
  if (/^-?\d+$/.test(cleaned)) {
    return parseInt(cleaned, 10) & 0xff;
  }
  if (/^'.'$/.test(cleaned)) {
    return cleaned.charCodeAt(1) & 0xff;
  }
  return null;
}

/**
 * Axiom-0 Two-Pass Assembler & Compiler (Source -> Raw Binary Bytecode)
 * Each instruction is encoded into a fixed 3-byte word: [OPCODE, ARG1, ARG2]
 */
export function compileAxiomSource(source: string): CompiledProgram {
  const lines = source.split(/\r?\n/);
  const labels: Record<string, number> = {};
  const errors: string[] = [];
  const rawInstructions: { lineNo: number; parts: string[]; raw: string }[] = [];

  // Pass 1: Strip comments, collect labels, measure offsets (3 bytes per instruction)
  let byteOffset = 0;
  for (let i = 0; i < lines.length; i++) {
    const withoutComment = lines[i].split(';')[0].split('//')[0].trim();
    if (!withoutComment) continue;

    let rest = withoutComment;
    if (rest.includes(':')) {
      const [labelName, afterLabel] = rest.split(':');
      const cleanLabel = labelName.trim();
      if (cleanLabel) {
        labels[cleanLabel] = byteOffset;
      }
      rest = (afterLabel || '').trim();
    }

    if (!rest) continue;
    const parts = rest.split(/\s+/).filter(Boolean);
    rawInstructions.push({ lineNo: i + 1, parts, raw: rest });
    byteOffset += 3;
  }

  // Pass 2: Emit 3-byte machine words
  const bytes: number[] = [];
  const disassembly: { offset: number; hex: string; binary: string; mnemonic: string }[] = [];

  for (let idx = 0; idx < rawInstructions.length; idx++) {
    const { lineNo, parts } = rawInstructions[idx];
    const opName = parts[0].toUpperCase();
    const offset = idx * 3;
    let op = Opcode.NOP;
    let a1 = 0;
    let a2 = 0;

    switch (opName) {
      case 'NOP':
        op = Opcode.NOP;
        break;
      case 'LOAD': {
        op = Opcode.LOAD;
        const r = parseRegister(parts[1] || '');
        const imm = parseImmediate(parts[2] || '', labels);
        if (r === null || imm === null) {
          errors.push(`Line ${lineNo}: Invalid LOAD syntax. Expected LOAD R0, <imm>`);
        } else {
          a1 = r;
          a2 = imm;
        }
        break;
      }
      case 'MOV': {
        op = Opcode.MOV;
        const rx = parseRegister(parts[1] || '');
        const ry = parseRegister(parts[2] || '');
        if (rx === null || ry === null) {
          errors.push(`Line ${lineNo}: Invalid MOV syntax. Expected MOV Rx, Ry`);
        } else {
          a1 = rx;
          a2 = ry;
        }
        break;
      }
      case 'ADD':
      case 'SUB':
      case 'MUL':
      case 'XOR':
      case 'AND':
      case 'CMP': {
        op = Opcode[opName as keyof typeof Opcode];
        const rx = parseRegister(parts[1] || '');
        const ry = parseRegister(parts[2] || '');
        if (rx === null || ry === null) {
          errors.push(`Line ${lineNo}: Invalid ${opName} syntax. Expected ${opName} Rx, Ry`);
        } else {
          a1 = rx;
          a2 = ry;
        }
        break;
      }
      case 'SHL':
      case 'SHR': {
        op = Opcode[opName as keyof typeof Opcode];
        const rx = parseRegister(parts[1] || '');
        const imm = parseImmediate(parts[2] || '', labels);
        if (rx === null || imm === null) {
          errors.push(`Line ${lineNo}: Invalid ${opName} syntax. Expected ${opName} Rx, <imm>`);
        } else {
          a1 = rx;
          a2 = imm;
        }
        break;
      }
      case 'STORE':
      case 'FETCH': {
        op = Opcode[opName as keyof typeof Opcode];
        const rx = parseRegister(parts[1] || '');
        const addr = parseImmediate(parts[2] || '', labels);
        if (rx === null || addr === null) {
          errors.push(`Line ${lineNo}: Invalid ${opName} syntax. Expected ${opName} Rx, [addr]`);
        } else {
          a1 = rx;
          a2 = addr;
        }
        break;
      }
      case 'JMP':
      case 'JZ':
      case 'JNZ': {
        op = Opcode[opName as keyof typeof Opcode];
        const addr = parseImmediate(parts[1] || '', labels);
        if (addr === null) {
          errors.push(`Line ${lineNo}: Invalid ${opName} target.`);
        } else {
          a1 = addr;
          a2 = 0;
        }
        break;
      }
      case 'EMIT': {
        op = Opcode.EMIT;
        const rx = parseRegister(parts[1] || '');
        if (rx === null) {
          errors.push(`Line ${lineNo}: Invalid EMIT syntax. Expected EMIT Rx`);
        } else {
          a1 = rx;
        }
        break;
      }
      case 'HALT':
        op = Opcode.HALT;
        break;
      default:
        errors.push(`Line ${lineNo}: Unknown opcode '${opName}'`);
    }

    bytes.push(op & 0xff, a1 & 0xff, a2 & 0xff);
    const wordHex = [op, a1, a2].map((b) => (b & 0xff).toString(16).padStart(2, '0').toUpperCase()).join(' ');
    const wordBin = [op, a1, a2].map((b) => (b & 0xff).toString(2).padStart(8, '0')).join(' ');
    disassembly.push({
      offset,
      hex: wordHex,
      binary: wordBin,
      mnemonic: parts.join(' '),
    });
  }

  const bytecode = new Uint8Array(bytes);
  const hexDump = Array.from(bytecode)
    .map((b) => b.toString(16).padStart(2, '0').toUpperCase())
    .join(' ');
  const binaryDump = Array.from(bytecode)
    .map((b) => b.toString(2).padStart(8, '0'))
    .join(' ');

  return { bytecode, hexDump, binaryDump, disassembly, labels, errors };
}

/**
 * Execute compiled Axiom-0 bytecode on our deterministic 8-register Virtual Machine
 */
export function executeAxiomBytecode(bytecode: Uint8Array, maxCycles = 512): VMState {
  const registers = new Int32Array(8);
  const memory = new Uint8Array(256);
  const output: number[] = [];
  const trace: string[] = [];
  let pc = 0;
  const sp = 255;
  const flags = { zero: false, negative: false, overflow: false, halted: false };
  let cycles = 0;

  while (pc + 2 < bytecode.length && !flags.halted && cycles < maxCycles) {
    const op = bytecode[pc];
    const a1 = bytecode[pc + 1];
    const a2 = bytecode[pc + 2];
    const currentPc = pc;
    pc += 3;
    cycles++;

    switch (op) {
      case Opcode.NOP:
        trace.push(`[0x${currentPc.toString(16).padStart(2, '0')}] NOP`);
        break;
      case Opcode.LOAD:
        registers[a1 & 7] = a2;
        flags.zero = a2 === 0;
        trace.push(`[0x${currentPc.toString(16).padStart(2, '0')}] LOAD R${a1 & 7} <- ${a2}`);
        break;
      case Opcode.MOV:
        registers[a1 & 7] = registers[a2 & 7];
        flags.zero = registers[a1 & 7] === 0;
        trace.push(`[0x${currentPc.toString(16).padStart(2, '0')}] MOV R${a1 & 7} <- R${a2 & 7} (${registers[a1 & 7]})`);
        break;
      case Opcode.ADD: {
        const res = registers[a1 & 7] + registers[a2 & 7];
        registers[a1 & 7] = res | 0;
        flags.zero = registers[a1 & 7] === 0;
        flags.negative = registers[a1 & 7] < 0;
        trace.push(`[0x${currentPc.toString(16).padStart(2, '0')}] ADD R${a1 & 7} += R${a2 & 7} => ${registers[a1 & 7]}`);
        break;
      }
      case Opcode.SUB: {
        const res = registers[a1 & 7] - registers[a2 & 7];
        registers[a1 & 7] = res | 0;
        flags.zero = registers[a1 & 7] === 0;
        flags.negative = registers[a1 & 7] < 0;
        trace.push(`[0x${currentPc.toString(16).padStart(2, '0')}] SUB R${a1 & 7} -= R${a2 & 7} => ${registers[a1 & 7]}`);
        break;
      }
      case Opcode.MUL: {
        const res = Math.imul(registers[a1 & 7], registers[a2 & 7]);
        registers[a1 & 7] = res | 0;
        flags.zero = registers[a1 & 7] === 0;
        flags.negative = registers[a1 & 7] < 0;
        trace.push(`[0x${currentPc.toString(16).padStart(2, '0')}] MUL R${a1 & 7} *= R${a2 & 7} => ${registers[a1 & 7]}`);
        break;
      }
      case Opcode.XOR: {
        registers[a1 & 7] = registers[a1 & 7] ^ registers[a2 & 7];
        flags.zero = registers[a1 & 7] === 0;
        trace.push(`[0x${currentPc.toString(16).padStart(2, '0')}] XOR R${a1 & 7} ^= R${a2 & 7} => ${registers[a1 & 7]}`);
        break;
      }
      case Opcode.AND: {
        registers[a1 & 7] = registers[a1 & 7] & registers[a2 & 7];
        flags.zero = registers[a1 & 7] === 0;
        trace.push(`[0x${currentPc.toString(16).padStart(2, '0')}] AND R${a1 & 7} &= R${a2 & 7} => ${registers[a1 & 7]}`);
        break;
      }
      case Opcode.SHL: {
        registers[a1 & 7] = registers[a1 & 7] << (a2 & 31);
        flags.zero = registers[a1 & 7] === 0;
        trace.push(`[0x${currentPc.toString(16).padStart(2, '0')}] SHL R${a1 & 7} << ${a2} => ${registers[a1 & 7]}`);
        break;
      }
      case Opcode.SHR: {
        registers[a1 & 7] = registers[a1 & 7] >>> (a2 & 31);
        flags.zero = registers[a1 & 7] === 0;
        trace.push(`[0x${currentPc.toString(16).padStart(2, '0')}] SHR R${a1 & 7} >>> ${a2} => ${registers[a1 & 7]}`);
        break;
      }
      case Opcode.STORE: {
        memory[a2 & 0xff] = registers[a1 & 7] & 0xff;
        trace.push(`[0x${currentPc.toString(16).padStart(2, '0')}] STORE MEM[0x${(a2 & 0xff).toString(16)}] <- ${registers[a1 & 7] & 0xff}`);
        break;
      }
      case Opcode.FETCH: {
        registers[a1 & 7] = memory[a2 & 0xff];
        flags.zero = registers[a1 & 7] === 0;
        trace.push(`[0x${currentPc.toString(16).padStart(2, '0')}] FETCH R${a1 & 7} <- MEM[0x${(a2 & 0xff).toString(16)}] (${registers[a1 & 7]})`);
        break;
      }
      case Opcode.CMP: {
        const diff = registers[a1 & 7] - registers[a2 & 7];
        flags.zero = diff === 0;
        flags.negative = diff < 0;
        trace.push(`[0x${currentPc.toString(16).padStart(2, '0')}] CMP R${a1 & 7}(${registers[a1 & 7]}), R${a2 & 7}(${registers[a2 & 7]}) -> Z=${flags.zero ? 1 : 0}`);
        break;
      }
      case Opcode.JMP:
        pc = a1;
        trace.push(`[0x${currentPc.toString(16).padStart(2, '0')}] JMP -> 0x${a1.toString(16)}`);
        break;
      case Opcode.JZ:
        if (flags.zero) {
          pc = a1;
          trace.push(`[0x${currentPc.toString(16).padStart(2, '0')}] JZ (taken) -> 0x${a1.toString(16)}`);
        } else {
          trace.push(`[0x${currentPc.toString(16).padStart(2, '0')}] JZ (not taken)`);
        }
        break;
      case Opcode.JNZ:
        if (!flags.zero) {
          pc = a1;
          trace.push(`[0x${currentPc.toString(16).padStart(2, '0')}] JNZ (taken) -> 0x${a1.toString(16)}`);
        } else {
          trace.push(`[0x${currentPc.toString(16).padStart(2, '0')}] JNZ (not taken)`);
        }
        break;
      case Opcode.EMIT: {
        const val = registers[a1 & 7];
        output.push(val);
        trace.push(`[0x${currentPc.toString(16).padStart(2, '0')}] EMIT R${a1 & 7} => ${val}`);
        break;
      }
      case Opcode.HALT:
        flags.halted = true;
        trace.push(`[0x${currentPc.toString(16).padStart(2, '0')}] HALT`);
        break;
      default:
        flags.halted = true;
        trace.push(`[0x${currentPc.toString(16).padStart(2, '0')}] ILLEGAL_OP 0x${op.toString(16)}`);
        break;
    }
  }

  const asciiOutput = output
    .map((code) => (code >= 32 && code <= 126 ? String.fromCharCode(code) : `[${code}]`))
    .join('');

  return {
    registers,
    pc,
    sp,
    flags,
    memory,
    bytecode,
    output,
    asciiOutput,
    cycles,
    trace,
  };
}

/**
 * Git-Style LLM Progression State & Self-Referential Ignore Table
 */
export interface LLMCommitSnapshot {
  hash: string;
  parentHash: string | null;
  branch: string;
  timestamp: string;
  message: string;
  model: string;
  systemPrompt: string;
  temperature: number;
  topP: number;
  topK: number;
  thinkingLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  contextMessages: { role: 'user' | 'assistant' | 'system'; content: string; timestamp: string }[];
  coherenceScore: number;
  entropyBits: number;
}

export interface IgnoreSurfaceEntry {
  filename: string;
  previousRulesCount: number;
  currentContent: string;
  cacheCleared: boolean;
  lastPurgedAt: string;
  effectDescription: string;
}

export const INITIAL_SELF_REFERENTIAL_IGNORES: IgnoreSurfaceEntry[] = [
  {
    filename: '.gitignore',
    previousRulesCount: 7,
    currentContent: '.gitignore',
    cacheCleared: true,
    lastPurgedAt: '2026-10-22T22:35:00Z',
    effectDescription: 'Git index cache flushed (git rm -r --cached .gitignore); file ignores only itself, exposing all project artifacts to full transparency.',
  },
  {
    filename: '.dockerignore',
    previousRulesCount: 5,
    currentContent: '.dockerignore',
    cacheCleared: true,
    lastPurgedAt: '2026-10-22T22:35:00Z',
    effectDescription: 'Container build context filter inverted to self-reference; zero blind spots in container layer inspection.',
  },
  {
    filename: '.eslintignore',
    previousRulesCount: 4,
    currentContent: '.eslintignore',
    cacheCleared: true,
    lastPurgedAt: '2026-10-22T22:35:00Z',
    effectDescription: 'Static analysis suppression cache cleared; AST linter inspects full workspace tree.',
  },
  {
    filename: '.npmignore',
    previousRulesCount: 6,
    currentContent: '.npmignore',
    cacheCleared: true,
    lastPurgedAt: '2026-10-22T22:35:00Z',
    effectDescription: 'Package tarball exclusion list collapsed to self-reference; complete source provenance retained.',
  },
  {
    filename: '.vercelignore',
    previousRulesCount: 3,
    currentContent: '.vercelignore',
    cacheCleared: true,
    lastPurgedAt: '2026-10-22T22:35:00Z',
    effectDescription: 'Edge deployment exclusion cache purged; all runtime primitives travel with deployment unit.',
  },
];

export function createLLMCommit(params: Omit<LLMCommitSnapshot, 'hash' | 'coherenceScore' | 'entropyBits'>): LLMCommitSnapshot {
  const combinedText =
    params.systemPrompt +
    '\n' +
    params.contextMessages.map((m) => `${m.role}:${m.content}`).join('\n');
  const metrics = computeInformationMetrics(combinedText);
  const rawPayload = JSON.stringify({
    parent: params.parentHash,
    branch: params.branch,
    msg: params.message,
    model: params.model,
    sys: params.systemPrompt,
    temp: params.temperature,
    topP: params.topP,
    topK: params.topK,
    think: params.thinkingLevel,
    len: params.contextMessages.length,
    ts: params.timestamp,
  });
  const hash = computeFirstPrinciplesHash(rawPayload).slice(0, 12);

  return {
    ...params,
    hash,
    coherenceScore: metrics.coherenceScore,
    entropyBits: metrics.shannonEntropyBits,
  };
}

export interface LineDiff {
  type: 'same' | 'added' | 'removed';
  text: string;
}

export function diffStringsLineByLine(before: string, after: string): LineDiff[] {
  const aLines = before.split(/\r?\n/);
  const bLines = after.split(/\r?\n/);
  const result: LineDiff[] = [];
  const maxLen = Math.max(aLines.length, bLines.length);

  for (let i = 0; i < maxLen; i++) {
    const a = aLines[i];
    const b = bLines[i];
    if (a === b && a !== undefined) {
      result.push({ type: 'same', text: a });
    } else {
      if (a !== undefined) result.push({ type: 'removed', text: a });
      if (b !== undefined) result.push({ type: 'added', text: b });
    }
  }
  return result;
}

/**
 * Compoundable Telemetry & Signal Matrix Engine
 * Allows live data streams to be combined indefinitely via functional/bitwise operators
 */
export type SignalOperator = 'ADD' | 'SUB' | 'MUL' | 'XOR' | 'MOD' | 'AVG' | 'HARMONIC';

export interface SignalNode {
  id: string;
  label: string;
  unit: string;
  category: 'source' | 'compound';
  value: number;
  history: number[];
  sourceAId?: string;
  sourceBId?: string;
  operator?: SignalOperator;
  gain?: number;
}

export function evaluateCompoundSignal(
  op: SignalOperator,
  valA: number,
  valB: number,
  gain = 1
): number {
  let raw = 0;
  switch (op) {
    case 'ADD':
      raw = valA + valB;
      break;
    case 'SUB':
      raw = valA - valB;
      break;
    case 'MUL':
      raw = (valA * valB) / 100;
      break;
    case 'XOR':
      raw = (Math.round(valA) ^ Math.round(valB)) & 0xffff;
      break;
    case 'MOD': {
      const divisor = Math.max(1, Math.round(Math.abs(valB)));
      raw = Math.round(valA) % divisor;
      break;
    }
    case 'AVG':
      raw = (valA + valB) / 2;
      break;
    case 'HARMONIC': {
      const denom = Math.abs(valA) + Math.abs(valB);
      raw = denom > 0 ? (2 * valA * valB) / denom : 0;
      break;
    }
  }
  return Number((raw * gain).toFixed(2));
}

/**
 * First-Principles Offline Deterministic Reasoning Synthesizer
 * Guarantees seamless zero-key / offline execution when disconnected from the internet
 */
export function synthesizeOfflineResponse(
  prompt: string,
  systemPrompt: string,
  model: string,
  vmState?: VMState
): {
  reply: string;
  suggestedSystemPromptPatch: string | null;
  compiledSnippet: string | null;
  diagnostics: {
    mode: string;
    entropyBits: number;
    coherenceScore: number;
    hash: string;
  };
} {
  const metrics = computeInformationMetrics(prompt + '\n' + systemPrompt);
  const stateHash = computeFirstPrinciplesHash(prompt + systemPrompt + model).slice(0, 16);
  const lower = prompt.toLowerCase();

  let suggestedSystemPromptPatch: string | null = null;
  if (lower.includes('system prompt') || lower.includes('rewrite') || lower.includes('optimize')) {
    suggestedSystemPromptPatch = `${systemPrompt.trim()}\n[AXIOM-DELTA ${stateHash.slice(0, 6)}]: Prioritize zero-dependency first-principles derivation, bitwise state transparency, and compound modular interfaces while maintaining >=92% semantic coherence.`;
  }

  let compiledSnippet: string | null = null;
  if (lower.includes('compile') || lower.includes('binary') || lower.includes('code') || lower.includes('fibonacci')) {
    compiledSnippet = `; Auto-synthesized Axiom-0 Program (${stateHash.slice(0, 8)})
LOAD R0, 1
LOAD R1, 1
LOAD R2, 8
LOAD R3, 1
LOOP:
ADD R0, R1
EMIT R0
MOV R4, R0
MOV R0, R1
MOV R1, R4
SUB R2, R3
JNZ LOOP
HALT`;
  }

  const vmSummary = vmState
    ? `VM State: PC=0x${vmState.pc.toString(16).padStart(2, '0')}, Cycles=${vmState.cycles}, R0=${vmState.registers[0]}, R1=${vmState.registers[1]}, Output=[${vmState.output.join(', ')}]`
    : 'VM State: Ready for bytecode execution';

  const reply = [
    `[AXIOM-KERNEL // MODEL: ${model} // STATE: ${stateHash}]`,
    `Input analyzed from first principles (${metrics.byteLength} bytes, ${metrics.shannonEntropyBits} bits/symbol Shannon entropy, Coherence Index ${metrics.coherenceScore}%).`,
    ``,
    `1. Structural Decomposition: Your directive has been mapped against the current System Prompt (${computeInformationMetrics(systemPrompt).estimatedTokens} tokens) and the self-referential ignore table (.gitignore -> .gitignore).`,
    `2. Execution & Telemetry Link: ${vmSummary}.`,
    suggestedSystemPromptPatch
      ? `3. Self-Modification Ready: Generated a deterministic System Prompt delta [${stateHash.slice(0, 6)}] ready to apply or commit to the Git-DAG.`
      : `3. Next Leverage Vector: Pipe live telemetry metrics in the Compounding Matrix or commit this context snapshot to the Git-DAG to preserve long-horizon coherence.`,
  ].join('\n');

  return {
    reply,
    suggestedSystemPromptPatch,
    compiledSnippet,
    diagnostics: {
      mode: 'FIRST_PRINCIPLES_LOCAL_ENGINE',
      entropyBits: metrics.shannonEntropyBits,
      coherenceScore: metrics.coherenceScore,
      hash: stateHash,
    },
  };
}
