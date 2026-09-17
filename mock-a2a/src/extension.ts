/**
 * The LiveKit Agent Session Extension for A2A.
 *
 * Spec: "LiveKit Agent Session Extension for A2A", implemented in livekit/agents#7317
 * (livekit-agents/livekit/agents/a2a/extension.py). The extension is plain A2A plus four
 * metadata keys and two data-part payloads. It adds no RPC methods and no task states.
 *
 * Activation (s3.1): the client sends the URI in the `A2A-Extensions` request header and
 * the server echoes it. The extension is active ONLY if the server echoes it, so a server
 * that does not know the extension degrades to plain A2A by doing nothing.
 */

import type { Request, Response } from 'express';

export const EXTENSION_URI = 'https://livekit.io/a2a/ext/agent-session/v1';

/** Metadata keys are the URI, a slash, then the name. Written `lk/<name>` in the spec. */
function key(name: string): string {
  return `${EXTENSION_URI}/${name}`;
}

export const KIND = key('kind');
export const VERBATIM = key('verbatim');
export const DIRECTIVE = key('directive');
export const REASON = key('reason');

export const KIND_DELEGATION = 'delegation';
export const KIND_CLOSE = 'close';
export const KIND_CHAT_CTX = 'chat_ctx';
export const KIND_CHAT_ITEM = 'chat_item';

export const ANSWER_ARTIFACT_NAME = 'answer';

export const EXTENSIONS_HEADER = 'A2A-Extensions';
export const VERSION_HEADER = 'A2A-Version';
export const PROTOCOL_VERSION = '1.0';

/** `{kind, reason}` on a COMPLETED task: what the caller does once it has delivered the answer. */
export const DirectiveKind = {
  ESCALATE: 'escalate',
  END_SESSION: 'end_session',
} as const;
export type DirectiveKind = (typeof DirectiveKind)[keyof typeof DirectiveKind];

export type Directive = { kind: DirectiveKind; reason: string };

/** The URIs a request asked for. Comma-separated; the older `X-` spelling is accepted too. */
export function requestedExtensions(req: Request): string[] {
  const raw = req.get(EXTENSIONS_HEADER) ?? req.get(`X-${EXTENSIONS_HEADER}`) ?? '';
  return raw
    .split(',')
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
}

export function isRequested(req: Request): boolean {
  return requestedExtensions(req).includes(EXTENSION_URI);
}

/**
 * Echo the activation. MUST be called before the SSE headers are flushed, or the echo
 * never reaches the client and a correct client will treat the extension as inactive.
 */
export function echoActivation(res: Response): void {
  res.setHeader(EXTENSIONS_HEADER, EXTENSION_URI);
}
