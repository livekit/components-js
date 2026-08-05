'use client';

import { useEffect, useMemo, useState } from 'react';
import { type TextStreamData, useTranscriptions } from '@livekit/components-react';

import { moodColor } from '@/lib/mood-color';

/** Published per transcript segment by Expressive Mode: the segment's leading delivery tag. */
export const EXPRESSION_ATTRIBUTE = 'lk.expression';

/**
 * A normalized mood, matched from the raw delivery label.
 *
 * The raw label is **not** a fixed vocabulary. Each TTS provider speaks its own dialect: Fish Audio
 * emits single words from a closed set, Inworld emits free-form English ("soft, with genuine
 * care"), and models routinely drift outside whichever set they were given. Matching is therefore
 * best-effort. Treat `mood` as a hint for driving UI and read `label` for what the agent asked for.
 */
export type AgentMood =
  | 'excited'
  | 'happy'
  | 'playful'
  | 'curious'
  | 'surprised'
  | 'hopeful'
  | 'empathetic'
  | 'sad'
  | 'angry'
  | 'anxious'
  | 'calm';

export type MoodKeywords = Partial<Record<AgentMood, Record<string, number>>>;

/**
 * Keywords per mood, weighted. A weight of 2 marks a word that names the mood outright; 1 marks a
 * supporting descriptor that should lose to an explicit naming elsewhere in the same label. That is
 * what lets "gently curious, welcoming" resolve to `curious` rather than `empathetic`.
 *
 * The emotion words are drawn from Parrott's hierarchical classification of emotions (2001), mapped
 * onto the moods below; the weight-1 entries are delivery descriptors that providers use in place
 * of naming a feeling ("bright", "hushed", "clipped").
 *
 * Extend it through `extraKeywords` rather than editing this table, since the label space is
 * open-ended and every deployment sees a different slice of it.
 */
export const MOOD_KEYWORDS: Record<AgentMood, Record<string, number>> = {
  excited: {
    excit: 2,
    elat: 2,
    thrill: 2,
    exhilarat: 2,
    ecstat: 2,
    euphor: 2,
    zeal: 2,
    zest: 2,
    enthusias: 2,
    eager: 2,
    giddy: 2,
    hyped: 2,
    pumped: 2,
    buzzing: 2,
    jubilant: 2,
    jubilation: 2,
    exuberant: 2,
    rapture: 2,
    enthrall: 2,
    triumph: 2,
    gleeful: 2,
    glee: 2,
    punchy: 2,
    upbeat: 1,
    bright: 1,
    energetic: 1,
    energy: 1,
    lively: 1,
    animated: 1,
    vibrant: 1,
    spirited: 1,
    peppy: 1,
    snappy: 1,
    fast: 1,
    loud: 1,
  },
  happy: {
    happy: 2,
    happiness: 2,
    joy: 2,
    joviality: 2,
    jolli: 2,
    cheer: 2,
    glad: 2,
    delight: 2,
    pleas: 2,
    content: 2,
    bliss: 2,
    gaiety: 2,
    enjoy: 2,
    satisf: 2,
    relief: 2,
    relieved: 2,
    grateful: 2,
    thankful: 2,
    affection: 2,
    fond: 2,
    adore: 2,
    proud: 2,
    pride: 2,
    smil: 2,
    sunny: 2,
    merry: 2,
    amiable: 2,
    warm: 1,
    inviting: 1,
    welcom: 1,
    friendly: 1,
    kind: 1,
    pleasant: 1,
    positive: 1,
    easy: 1,
  },
  playful: {
    playful: 2,
    jok: 2,
    comedic: 2,
    comic: 2,
    sarcas: 2,
    teas: 2,
    witty: 2,
    silly: 2,
    goofy: 2,
    mischiev: 2,
    amus: 2,
    humor: 2,
    humour: 2,
    cheeky: 2,
    sassy: 2,
    ironic: 2,
    irony: 2,
    deadpan: 2,
    banter: 2,
    laugh: 2,
    giggl: 2,
    chuckl: 2,
    grin: 2,
    unimpressed: 2,
    smirk: 2,
    wry: 1,
    sly: 1,
    impish: 1,
  },
  curious: {
    curious: 2,
    curiosity: 2,
    inquisitive: 2,
    intrigu: 2,
    wonder: 2,
    quizzical: 2,
    probing: 2,
    interested: 2,
    engaged: 2,
    attentive: 2,
    suspense: 2,
    questioning: 1,
    question: 1,
    prompting: 1,
    exploring: 1,
  },
  surprised: {
    surpris: 2,
    amaz: 2,
    astonish: 2,
    astound: 2,
    awe: 2,
    shock: 2,
    startl: 2,
    incredulous: 2,
    stunned: 2,
    bewilder: 2,
    flabbergast: 2,
    disbelie: 2,
    unexpected: 2,
    dumbfound: 2,
    wow: 2,
    whoa: 2,
    gasp: 2,
  },
  hopeful: {
    hopeful: 2,
    hope: 2,
    optimis: 2,
    encourag: 2,
    uplift: 2,
    inspir: 2,
    motivat: 2,
    promising: 2,
    determined: 2,
    resolute: 2,
    forward: 2,
    buoyant: 2,
    expectant: 2,
    heartened: 2,
    confident: 2,
    assured: 2,
  },
  empathetic: {
    empath: 2,
    sympath: 2,
    compassion: 2,
    concern: 2,
    care: 2,
    tender: 2,
    consol: 2,
    sorry: 2,
    apolog: 2,
    understanding: 2,
    supportive: 2,
    comfort: 2,
    soothing: 2,
    nurtur: 2,
    patient: 2,
    earnest: 2,
    heartfelt: 2,
    sensitive: 2,
    pity: 2,
    condolence: 2,
    sentimental: 2,
    sincere: 1,
    gentle: 1,
    gently: 1,
    soft: 1,
    quiet: 1,
    hushed: 1,
    mild: 1,
    reassur: 1,
  },
  sad: {
    sad: 2,
    sorrow: 2,
    mourn: 2,
    somber: 2,
    sombre: 2,
    melanchol: 2,
    grief: 2,
    griev: 2,
    regret: 2,
    remorse: 2,
    deject: 2,
    downcast: 2,
    gloom: 2,
    glum: 2,
    forlorn: 2,
    wistful: 2,
    disappoint: 2,
    dismay: 2,
    crestfallen: 2,
    despond: 2,
    despair: 2,
    depress: 2,
    anguish: 2,
    agony: 2,
    woe: 2,
    miser: 2,
    unhappy: 2,
    tearful: 2,
    weep: 2,
    heartbroken: 2,
    heartbreak: 2,
    lonely: 2,
    loneliness: 2,
    ashamed: 2,
    shame: 2,
    guilt: 2,
    humiliat: 2,
    mortified: 2,
    longing: 2,
    homesick: 2,
    defeated: 2,
    heavy: 1,
    subdued: 1,
    flat: 1,
    weary: 1,
    resigned: 1,
    hollow: 1,
  },
  angry: {
    angry: 2,
    anger: 2,
    furious: 2,
    fury: 2,
    frustrat: 2,
    annoy: 2,
    irritat: 2,
    irate: 2,
    indignant: 2,
    outrag: 2,
    exasperat: 2,
    incensed: 2,
    livid: 2,
    wrath: 2,
    hostil: 2,
    resent: 2,
    bitter: 2,
    disgust: 2,
    revulsion: 2,
    contempt: 2,
    loathing: 2,
    scorn: 2,
    spite: 2,
    aggravat: 2,
    agitat: 2,
    grouchy: 2,
    grumpy: 2,
    seething: 2,
    fuming: 2,
    scold: 2,
    stern: 2,
    harsh: 2,
    sharp: 1,
    clipped: 1,
    terse: 1,
    cold: 1,
    biting: 1,
    curt: 1,
  },
  anxious: {
    anxious: 2,
    anxiety: 2,
    afraid: 2,
    fear: 2,
    fright: 2,
    scared: 2,
    nervous: 2,
    worri: 2,
    uneasy: 2,
    unease: 2,
    tense: 2,
    apprehensive: 2,
    panic: 2,
    alarm: 2,
    dread: 2,
    terror: 2,
    horror: 2,
    hesitant: 2,
    unsure: 2,
    uncertain: 2,
    timid: 2,
    jittery: 2,
    urgent: 2,
    stress: 2,
    distress: 2,
    insecure: 2,
    flustered: 2,
    cautious: 1,
    wary: 1,
    guarded: 1,
  },
  calm: {
    calm: 2,
    contemplative: 2,
    thoughtful: 2,
    measured: 2,
    serene: 2,
    easygoing: 2,
    neutral: 2,
    relax: 2,
    composed: 2,
    collected: 2,
    tranquil: 2,
    peaceful: 2,
    restrained: 2,
    reflective: 2,
    pensive: 2,
    matter: 2,
    plain: 2,
    professional: 2,
    formal: 2,
    informative: 2,
    factual: 2,
    deliberate: 2,
    unhurried: 2,
    placid: 2,
    slow: 2,
    steady: 1,
    grounded: 1,
    balanced: 1,
    straightforward: 1,
    even: 1,
  },
};

/**
 * Tie-break order, most specific first. Two moods scoring equally on a compound label resolve to
 * whichever appears earlier here.
 */
export const MOOD_PRIORITY: AgentMood[] = [
  'angry',
  'sad',
  'anxious',
  'surprised',
  'playful',
  'empathetic',
  'excited',
  'curious',
  'hopeful',
  'happy',
  'calm',
];

/**
 * The mood an unrecognized label falls back to. `calm` is deliberate: it is the most visually
 * recessive mood, so an unmatched label reads as "no strong signal" rather than asserting a feeling
 * the agent never expressed.
 */
export const DEFAULT_MOOD: AgentMood = 'calm';

/**
 * How many agent turns an expression survives before the mood decays back to null.
 *
 * A feeling belongs to the moment that produced it. Without this, one excited sentence would leave
 * the UI excited for the rest of the session, including through turns the agent delivered flat.
 */
export const DEFAULT_MOOD_TTL_TURNS = 2;

const EXPRESSION_SETTLE_INTERVAL_MS = 150;
const EXPRESSION_SETTLE_TICKS = 20;

function lastExpressionLabel(segments: TextStreamData[]): string | null {
  let label: string | null = null;
  for (const segment of segments) {
    const parsed = parseExpressionLabel(segment);
    if (parsed) {
      label = parsed;
    }
  }
  return label;
}

export interface MatchMoodOptions {
  /**
   * Extra keywords merged over {@link MOOD_KEYWORDS}, so you can teach the matcher the labels your
   * agent and voice actually produce without forking the table.
   */
  extraKeywords?: MoodKeywords;
  /**
   * Mood to return when no keyword matches. Defaults to {@link DEFAULT_MOOD}; pass `null` to get
   * null back and handle the miss yourself.
   */
  fallback?: AgentMood | null;
}

/**
 * Keywords match at a word start, so a stem like "cross" hits "cross" and "crossly" but not
 * "across". Matching mid-word produced false positives such as "pirate" reading as `angry`.
 */
function matchesWord(text: string, keyword: string): boolean {
  let from = 0;
  for (;;) {
    const at = text.indexOf(keyword, from);
    if (at === -1) {
      return false;
    }
    if (at === 0 || !/[a-z]/.test(text[at - 1]!)) {
      return true;
    }
    from = at + 1;
  }
}

/**
 * Match a raw delivery label to a mood.
 *
 * Matching is substring-based and deliberately lossy: the label space is open-ended, so an
 * unrecognized label resolves to `options.fallback` rather than a wrong guess.
 *
 * @example
 *
 * ```ts
 * matchMood('soft, with genuine care'); // 'empathetic'
 * matchMood('bright, upbeat energy'); // 'excited'
 * matchMood('like a pirate'); // 'calm'  (no match, fell back)
 * ```
 */
export function matchMood(label: string, options: MatchMoodOptions = {}): AgentMood | null {
  const text = label.toLowerCase();
  const fallback = options.fallback === undefined ? DEFAULT_MOOD : options.fallback;
  let best: AgentMood | null = null;
  let bestScore = 0;

  for (const mood of MOOD_PRIORITY) {
    const keywords = { ...MOOD_KEYWORDS[mood], ...options.extraKeywords?.[mood] };
    let score = 0;
    for (const [keyword, weight] of Object.entries(keywords)) {
      if (matchesWord(text, keyword)) {
        score += weight;
      }
    }
    // strictly greater, so MOOD_PRIORITY order breaks ties
    if (score > bestScore) {
      best = mood;
      bestScore = score;
    }
  }

  return best ?? fallback;
}

/** The raw delivery label on a transcript segment, or null when it carries none. */
export function parseExpressionLabel(segment: TextStreamData): string | null {
  const raw = segment.streamInfo.attributes?.[EXPRESSION_ATTRIBUTE];
  if (!raw) {
    return null;
  }

  try {
    const { value } = JSON.parse(raw) as { value?: string };
    return value?.trim() || null;
  } catch {
    return null;
  }
}

export interface UseExpressionOptions extends MatchMoodOptions {
  /**
   * Agent turns an expression survives before the mood decays to null. `0` disables decay.
   *
   * @defaultValue 2
   */
  ttlTurns?: number;
  /** Restrict to specific participants. Defaults to every participant in the room. */
  participantIdentities?: string[];
}

export interface UseExpressionReturn {
  /**
   * The normalized mood, or null when the agent hasn't expressed anything recently. Null is the
   * neutral state.
   */
  mood: AgentMood | null;
  /** The raw provider label behind {@link mood}, verbatim and free-form. */
  label: string | null;
  /**
   * {@link mood} as a color, ready for any visualizer's `color` prop. Uses the default palette;
   * call {@link moodColor} directly to blend it over your own primary.
   */
  color: `#${string}`;
}

/**
 * The agent's current emotional delivery, as published by Expressive Mode.
 *
 * Reads the transcript stream the session already subscribes to, so it adds no second text stream
 * handler. The mood decays back to null after `ttlTurns` agent turns without a new expression, so
 * a feeling doesn't outlive the moment that produced it.
 *
 * @example
 *
 * ```tsx
 * const { mood, label, color } = useExpression();
 *
 * <AgentAudioVisualizerAura color={color} />;
 * ```
 */
export function useExpression(options: UseExpressionOptions = {}): UseExpressionReturn {
  const {
    extraKeywords,
    fallback,
    ttlTurns = DEFAULT_MOOD_TTL_TURNS,
    participantIdentities,
  } = options;

  const segments = useTranscriptions({ participantIdentities });
  const [settled, setSettled] = useState<string | null>(null);

  // The expression rides the stream's *closing* trailer, which livekit-client merges into the
  // streamInfo object we already hold, by mutation and without emitting. Nothing re-renders, so
  // the mood would otherwise only surface once the next segment starts: a full turn late. Poll
  // briefly after each change, and only re-render when the label actually differs.
  useEffect(() => {
    let ticks = 0;
    const id = setInterval(() => {
      setSettled((previous) => {
        const latest = lastExpressionLabel(segments);
        return latest === previous ? previous : latest;
      });
      if (++ticks >= EXPRESSION_SETTLE_TICKS) {
        clearInterval(id);
      }
    }, EXPRESSION_SETTLE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [segments]);

  return useMemo(() => {
    let label: string | null = null;
    let speaker: string | null = null;
    let turnsSince = 0;

    for (const segment of segments) {
      const parsed = parseExpressionLabel(segment);
      if (parsed) {
        label = parsed;
        speaker = segment.participantInfo.identity;
        turnsSince = 0;
      } else if (label && segment.participantInfo.identity === speaker) {
        // only the expressing participant's own later turns age the mood
        turnsSince++;
      }
    }

    const current = ttlTurns > 0 && turnsSince >= ttlTurns ? null : label;
    const mood = current ? matchMood(current, { extraKeywords, fallback }) : null;

    return { mood, label: current, color: moodColor(mood) };
  }, [segments, settled, extraKeywords, fallback, ttlTurns]);
}
