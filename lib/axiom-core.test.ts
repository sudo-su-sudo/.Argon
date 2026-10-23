import test from 'node:test';
import assert from 'node:assert/strict';
import {
  compileAxiomSource,
  executeAxiomBytecode,
  computeFirstPrinciplesHash,
  computeInformationMetrics,
  createLLMCommit,
  evaluateCompoundSignal,
  diffStringsLineByLine,
  INITIAL_SELF_REFERENTIAL_IGNORES,
} from './axiom-core';

test('First-principles 256-bit hash is deterministic and produces 64 hex chars', () => {
  const h1 = computeFirstPrinciplesHash('axiom-zero-kernel');
  const h2 = computeFirstPrinciplesHash('axiom-zero-kernel');
  const h3 = computeFirstPrinciplesHash('axiom-zero-kernel-modified');
  assert.equal(h1.length, 64);
  assert.equal(h1, h2);
  assert.notEqual(h1, h3);
});

test('Axiom-0 compiler assembles source into 3-byte binary instructions and executes on VM', () => {
  const src = `
    ; Compute (10 + 25) * 2 and emit result
    LOAD R0, 10
    LOAD R1, 25
    ADD R0, R1
    LOAD R2, 2
    MUL R0, R2
    STORE R0, [0x10]
    FETCH R3, [0x10]
    EMIT R3
    HALT
  `;
  const compiled = compileAxiomSource(src);
  assert.equal(compiled.errors.length, 0);
  assert.equal(compiled.bytecode.length, 9 * 3);

  const vm = executeAxiomBytecode(compiled.bytecode);
  assert.equal(vm.flags.halted, true);
  assert.equal(vm.registers[0], 70);
  assert.equal(vm.registers[3], 70);
  assert.equal(vm.memory[0x10], 70);
  assert.deepEqual(vm.output, [70]);
  assert.equal(vm.asciiOutput, 'F'); // ASCII 70 = 'F'
});

test('Axiom-0 VM handles loops and conditional jumps (JNZ)', () => {
  const src = `
    LOAD R0, 0
    LOAD R1, 5
    LOAD R2, 1
    LOOP:
    ADD R0, R1
    SUB R1, R2
    JNZ LOOP
    EMIT R0
    HALT
  `;
  const compiled = compileAxiomSource(src);
  assert.equal(compiled.errors.length, 0);
  const vm = executeAxiomBytecode(compiled.bytecode);
  // 5 + 4 + 3 + 2 + 1 = 15
  assert.equal(vm.registers[0], 15);
  assert.deepEqual(vm.output, [15]);
});

test('Git-DAG commit creation and line-by-line diff work deterministically', () => {
  const commit = createLLMCommit({
    parentHash: null,
    branch: 'main',
    timestamp: '2026-10-22T22:35:00Z',
    message: 'Initial kernel bootstrap',
    model: 'gemini-3.8-flash',
    systemPrompt: 'First principles reasoning.',
    temperature: 0.7,
    topP: 0.95,
    topK: 64,
    thinkingLevel: 'HIGH',
    contextMessages: [{ role: 'user', content: 'Hello kernel', timestamp: '2026-10-22T22:35:00Z' }],
  });
  assert.equal(commit.hash.length, 12);
  assert.ok(commit.coherenceScore > 0);
  assert.ok(commit.entropyBits > 0);

  const diffs = diffStringsLineByLine('line1\nline2', 'line1\nline3');
  assert.equal(diffs[0].type, 'same');
  assert.equal(diffs[1].type, 'removed');
  assert.equal(diffs[2].type, 'added');
});

test('Compound signal operators combine live telemetry streams accurately', () => {
  assert.equal(evaluateCompoundSignal('ADD', 40, 22, 1), 62);
  assert.equal(evaluateCompoundSignal('XOR', 0b1010, 0b1100, 1), 0b0110);
  assert.equal(evaluateCompoundSignal('MOD', 27, 5, 1), 2);
  assert.equal(INITIAL_SELF_REFERENTIAL_IGNORES[0].currentContent, '.gitignore');
});

test('Information metrics compute Shannon entropy and token estimates', () => {
  const m = computeInformationMetrics('First principles reasoning maximizes leverage and optionality.');
  assert.ok(m.shannonEntropyBits > 3 && m.shannonEntropyBits < 6);
  assert.ok(m.estimatedTokens > 5);
});
