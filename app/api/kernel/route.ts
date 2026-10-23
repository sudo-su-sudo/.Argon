import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';
import {
  computeFirstPrinciplesHash,
  computeInformationMetrics,
  synthesizeOfflineResponse,
  INITIAL_SELF_REFERENTIAL_IGNORES,
} from '@/lib/axiom-core';
import fs from 'node:fs';
import path from 'node:path';

function getServerTelemetry() {
  const mem = process.memoryUsage();
  let gitignoreActual = '.gitignore';
  try {
    gitignoreActual = fs.readFileSync(path.join(process.cwd(), '.gitignore'), 'utf8').trim();
  } catch {
    gitignoreActual = '.gitignore';
  }
  return {
    pid: process.pid,
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    uptimeSeconds: Math.round(process.uptime()),
    rssMB: Number((mem.rss / (1024 * 1024)).toFixed(2)),
    heapUsedMB: Number((mem.heapUsed / (1024 * 1024)).toFixed(2)),
    heapTotalMB: Number((mem.heapTotal / (1024 * 1024)).toFixed(2)),
    gitignoreRawState: gitignoreActual,
    ignoreSurfaces: INITIAL_SELF_REFERENTIAL_IGNORES,
    timestamp: new Date().toISOString(),
  };
}

export async function GET() {
  return NextResponse.json({
    status: 'NOMINAL',
    telemetry: getServerTelemetry(),
  });
}

export async function POST(req: NextRequest) {
  const startMs = Date.now();
  try {
    const body = await req.json();
    const {
      prompt = '',
      systemPrompt = '',
      model = 'gemini-3.8-flash',
      temperature = 0.7,
      topP = 0.95,
      topK = 64,
      thinkingLevel = 'HIGH',
      seed = 42,
      history = [],
    } = body;

    const telemetry = getServerTelemetry();
    const offlineSynthesis = synthesizeOfflineResponse(prompt, systemPrompt, model);

    // If explicitly using local binary/symbolic kernel or no API key in environment
    if (model === 'axiom-0-local-binary' || !process.env.GEMINI_API_KEY) {
      return NextResponse.json({
        reply: offlineSynthesis.reply,
        suggestedSystemPromptPatch: offlineSynthesis.suggestedSystemPromptPatch,
        compiledSnippet: offlineSynthesis.compiledSnippet,
        diagnostics: {
          ...offlineSynthesis.diagnostics,
          latencyMs: Date.now() - startMs,
          executedModel: 'axiom-0-local-binary',
          serverTelemetry: telemetry,
        },
      });
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const mappedThinking =
      thinkingLevel === 'LOW'
        ? ThinkingLevel.LOW
        : thinkingLevel === 'MEDIUM'
        ? ThinkingLevel.MEDIUM
        : ThinkingLevel.HIGH;

    const historyText = Array.isArray(history)
      ? history
          .slice(-8)
          .map((m: { role: string; content: string }) => `${m.role.toUpperCase()}: ${m.content}`)
          .join('\n\n')
      : '';

    const fullPrompt = historyText
      ? `CONTEXT HISTORY:\n${historyText}\n\nCURRENT DIRECTIVE:\n${prompt}`
      : prompt;

    let executedModel = model;
    let replyText = '';

    try {
      const response = await ai.models.generateContent({
        model: executedModel,
        contents: fullPrompt,
        config: {
          systemInstruction: systemPrompt,
          temperature: Number(temperature),
          topP: Number(topP),
          topK: Number(topK),
          seed: Number(seed),
          thinkingConfig: { thinkingLevel: mappedThinking },
        },
      });
      replyText = response.text || offlineSynthesis.reply;
    } catch {
      // Seamless fallback to free-tier flash model or local first-principles synthesizer
      try {
        executedModel = 'gemini-3.8-flash';
        const fallbackRes = await ai.models.generateContent({
          model: executedModel,
          contents: fullPrompt,
          config: {
            systemInstruction: systemPrompt,
            temperature: Number(temperature),
            topP: Number(topP),
            topK: Number(topK),
          },
        });
        replyText = fallbackRes.text || offlineSynthesis.reply;
      } catch {
        executedModel = 'axiom-0-local-binary (fallback)';
        replyText = offlineSynthesis.reply;
      }
    }

    const metrics = computeInformationMetrics(replyText);
    const stateHash = computeFirstPrinciplesHash(replyText + systemPrompt).slice(0, 16);

    return NextResponse.json({
      reply: replyText,
      suggestedSystemPromptPatch: offlineSynthesis.suggestedSystemPromptPatch,
      compiledSnippet: offlineSynthesis.compiledSnippet,
      diagnostics: {
        mode: 'SERVER_GEMINI_KERNEL',
        executedModel,
        latencyMs: Date.now() - startMs,
        entropyBits: metrics.shannonEntropyBits,
        coherenceScore: metrics.coherenceScore,
        estimatedTokens: metrics.estimatedTokens,
        hash: stateHash,
        serverTelemetry: telemetry,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown kernel exception';
    const fallback = synthesizeOfflineResponse('Recovery diagnostic', '', 'axiom-0-local-binary');
    return NextResponse.json({
      reply: fallback.reply,
      diagnostics: {
        mode: 'RECOVERY_FALLBACK',
        error: message,
        latencyMs: Date.now() - startMs,
        serverTelemetry: getServerTelemetry(),
      },
    });
  }
}
