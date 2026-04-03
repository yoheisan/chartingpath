/**
 * Shared streaming utilities for Copilot edge functions.
 * Provides progressive SSE streaming with status events during tool rounds
 * and token-by-token streaming for the final response.
 */

export interface StreamWriter {
  sendStatus(text: string): void;
  sendToken(text: string): void;
  sendMeta(meta: Record<string, any>): void;
  sendDone(): void;
  sendError(text: string): void;
  close(): void;
}

export function createSSEStream(): { readable: ReadableStream; writer: StreamWriter } {
  const encoder = new TextEncoder();
  let controller: ReadableStreamDefaultController | null = null;

  const readable = new ReadableStream({
    start(ctrl) {
      controller = ctrl;
    },
    cancel() {
      controller = null;
    },
  });

  const send = (payload: string) => {
    try {
      controller?.enqueue(encoder.encode(`data: ${payload}\n\n`));
    } catch {
      // Stream already closed
    }
  };

  const writer: StreamWriter = {
    sendStatus(text: string) {
      send(JSON.stringify({ type: "status", text }));
    },
    sendToken(text: string) {
      send(JSON.stringify({ type: "token", text }));
    },
    sendDone() {
      send(JSON.stringify({ type: "done" }));
    },
    sendError(text: string) {
      send(JSON.stringify({ type: "error", text }));
    },
    close() {
      try {
        controller?.close();
      } catch {
        // Already closed
      }
      controller = null;
    },
  };

  return { readable, writer };
}

const STATUS_MESSAGES = [
  "Searching patterns…",
  "Analysing your results…",
  "Checking market data…",
  "Refining the answer…",
  "Almost done…",
];

export function getStatusMessage(round: number): string {
  return STATUS_MESSAGES[Math.min(round - 1, STATUS_MESSAGES.length - 1)];
}

/**
 * Stream the final Gemini response token-by-token via the OpenAI-compatible
 * streaming endpoint. Sends each token chunk as a `token` SSE event.
 */
export async function streamFinalResponse(
  apiUrl: string,
  headers: Record<string, string>,
  body: Record<string, unknown>,
  writer: StreamWriter
): Promise<string> {
  // Switch to streaming mode for the final response
  const streamBody = { ...body, stream: true };

  const resp = await fetch(apiUrl, {
    method: "POST",
    headers,
    body: JSON.stringify(streamBody),
  });

  if (!resp.ok) {
    const errText = await resp.text().catch(() => "");
    throw new Error(`AI gateway error: ${resp.status} ${errText}`);
  }

  if (!resp.body) {
    throw new Error("No response body from AI gateway");
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let fullContent = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    let newlineIdx: number;
    while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
      let line = buffer.slice(0, newlineIdx);
      buffer = buffer.slice(newlineIdx + 1);

      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line.startsWith(":") || line.trim() === "") continue;
      if (!line.startsWith("data: ")) continue;

      const jsonStr = line.slice(6).trim();
      if (jsonStr === "[DONE]") {
        return fullContent;
      }

      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) {
          fullContent += content;
          writer.sendToken(content);
        }
      } catch {
        // Incomplete JSON — put it back
        buffer = line + "\n" + buffer;
        break;
      }
    }
  }

  // Flush remaining buffer
  if (buffer.trim()) {
    for (let raw of buffer.split("\n")) {
      if (!raw) continue;
      if (raw.endsWith("\r")) raw = raw.slice(0, -1);
      if (raw.startsWith(":") || raw.trim() === "") continue;
      if (!raw.startsWith("data: ")) continue;
      const jsonStr = raw.slice(6).trim();
      if (jsonStr === "[DONE]") continue;
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) {
          fullContent += content;
          writer.sendToken(content);
        }
      } catch {
        // ignore
      }
    }
  }

  return fullContent;
}

export const STREAM_CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache",
  Connection: "keep-alive",
};

/** Hard timeout (ms) for the entire streaming response */
export const HARD_TIMEOUT_MS = 60_000;
