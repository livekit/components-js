'use client';

import React, {
  createContext,
  useContext,
  useId,
  type ComponentProps,
  type ReactNode,
} from 'react';
import { CheckIcon, MinusIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

/**
 * Props for the AgentCard component.
 */
export interface AgentCardProps extends ComponentProps<'div'> {
  /**
   * A short label above the card's content, such as "Your order". It also names the card for
   * screen readers.
   */
  label?: ReactNode;
}

/**
 * A labeled container for something the agent shows in the conversation, such as an order, a
 * booking, or a form it's filling in.
 *
 * @extends ComponentProps<'div'>
 *
 * @example
 * ```tsx
 * <AgentCard label="Your order">
 *   <AgentCardRows>
 *     <AgentCardRow count={2} label="Margherita" value="$24.00" />
 *     <AgentCardTotal label="Total" value="$24.00" />
 *   </AgentCardRows>
 * </AgentCard>
 * ```
 */
export function AgentCard({ label, className, children, ...props }: AgentCardProps) {
  const labelId = useId();
  return (
    <div
      data-slot="agent-card"
      role={label ? 'group' : undefined}
      aria-labelledby={label ? labelId : undefined}
      className={cn(
        'bg-card text-card-foreground flex w-full flex-col gap-2.5 rounded-xl border px-4 pt-3.5 pb-4',
        className,
      )}
      {...props}
    >
      {label && <AgentCardLabel id={labelId}>{label}</AgentCardLabel>}
      {children}
    </div>
  );
}

/**
 * The small uppercase label at the top of an `AgentCard`. `AgentCard`'s `label` renders one; use
 * this directly to place it yourself.
 *
 * @extends ComponentProps<'p'>
 */
export function AgentCardLabel({ className, ...props }: ComponentProps<'p'>) {
  return (
    <p
      data-slot="agent-card-label"
      className={cn(
        'text-muted-foreground m-0 font-mono text-[10px] leading-3.5 tracking-widest uppercase',
        className,
      )}
      {...props}
    />
  );
}

/**
 * Props for the AgentCardDetail component.
 */
export interface AgentCardDetailProps extends ComponentProps<'p'> {
  /** An icon before the text. It's decorative, so give it `aria-hidden`. */
  icon?: ReactNode;
}

/**
 * A quiet line with an optional icon, such as "Delivering to 300 De Haro St".
 *
 * @extends ComponentProps<'p'>
 */
export function AgentCardDetail({ icon, className, children, ...props }: AgentCardDetailProps) {
  return (
    <p
      data-slot="agent-card-detail"
      className={cn(
        'text-muted-foreground m-0 flex items-center gap-1.5 text-xs [&>svg]:size-3.5 [&>svg]:shrink-0',
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </p>
  );
}

/**
 * Text `AgentCardRows` announces to screen readers for a row's mark. Pass any of these to its
 * `labels` to reword or translate them.
 */
export interface AgentCardRowsLabels {
  /** Read before a row marked `check`. */
  done: string;
  /** Read before a row marked `pending`. */
  pending: string;
}

export const defaultAgentCardRowsLabels: AgentCardRowsLabels = {
  done: 'Done',
  pending: 'Pending',
};

const AgentCardRowsLabelsContext = createContext(defaultAgentCardRowsLabels);

/**
 * Props for the AgentCardRows component.
 */
export interface AgentCardRowsProps extends ComponentProps<'dl'> {
  /** Text announced for the rows' marks. */
  labels?: Partial<AgentCardRowsLabels>;
}

/**
 * Label and value rows, such as an order's items or a form's fields. Holds `AgentCardRow`s and an
 * optional `AgentCardTotal`.
 *
 * @extends ComponentProps<'dl'>
 */
export function AgentCardRows({ labels, className, ...props }: AgentCardRowsProps) {
  const done = labels?.done ?? defaultAgentCardRowsLabels.done;
  const pending = labels?.pending ?? defaultAgentCardRowsLabels.pending;
  return (
    <AgentCardRowsLabelsContext.Provider value={{ done, pending }}>
      <dl data-slot="agent-card-rows" className={cn('m-0 flex flex-col', className)} {...props} />
    </AgentCardRowsLabelsContext.Provider>
  );
}

/**
 * Props for the AgentCardRow component.
 */
export interface AgentCardRowProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** What the row is, such as an item or a field name. */
  label: ReactNode;
  /** The row's value, such as a price or the answer to a field. */
  value?: ReactNode;
  /**
   * A mark before the label: `check` for done, such as an answered field, or `pending` for not
   * yet.
   */
  mark?: 'check' | 'pending';
  /** A quantity before the label, such as an order line's count. */
  count?: number;
  /** Highlights the row the conversation is on, such as the field the agent is asking about. */
  current?: boolean;
  /** Dims the row, such as an item that was removed. */
  muted?: boolean;
  /** Something inline after the label, such as a status badge. */
  badge?: ReactNode;
}

/**
 * One label and value row inside `AgentCardRows`.
 *
 * @extends ComponentProps<'div'>
 */
export function AgentCardRow({
  label,
  value,
  mark,
  count,
  current = false,
  muted = false,
  badge,
  className,
  ...props
}: AgentCardRowProps) {
  const labels = useContext(AgentCardRowsLabelsContext);
  return (
    <div
      data-slot="agent-card-row"
      data-current={current || undefined}
      aria-current={current || undefined}
      className={cn(
        'relative -mx-2 flex items-center justify-between gap-3 px-2 py-2 text-sm not-first:border-t',
        current &&
          'bg-accent before:bg-primary before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:rounded-full',
        className,
      )}
      {...props}
    >
      <dt
        className={cn(
          'flex min-w-0 items-center gap-1.5',
          muted ? 'text-muted-foreground' : 'text-foreground',
        )}
      >
        {mark === 'check' && (
          <>
            <CheckIcon aria-hidden="true" className="text-primary size-4 shrink-0" />
            <span className="sr-only">{labels.done}: </span>
          </>
        )}
        {mark === 'pending' && (
          <>
            <MinusIcon aria-hidden="true" className="text-muted-foreground size-4 shrink-0" />
            <span className="sr-only">{labels.pending}: </span>
          </>
        )}
        {count !== undefined && (
          <>
            <span className="text-muted-foreground shrink-0 tabular-nums">{count}</span>
            <span aria-hidden="true" className="text-muted-foreground mr-0.5 shrink-0">
              ×
            </span>
          </>
        )}
        {label}
        {badge}
      </dt>
      <dd className="text-muted-foreground m-0 whitespace-nowrap tabular-nums">{value}</dd>
    </div>
  );
}

/**
 * Props for the AgentCardTotal component.
 */
export interface AgentCardTotalProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** What the total is, such as "Total" or "Estimate". */
  label: ReactNode;
  /** The total's value. */
  value: ReactNode;
}

/**
 * The last row of `AgentCardRows`, set a little apart: a total, subtotal, or estimate.
 *
 * @extends ComponentProps<'div'>
 */
export function AgentCardTotal({ label, value, className, ...props }: AgentCardTotalProps) {
  return (
    <div
      data-slot="agent-card-total"
      className={cn(
        'relative -mx-2 mt-1 flex items-baseline justify-between gap-3 px-2 py-1.5 text-sm font-medium not-first:border-t',
        className,
      )}
      {...props}
    >
      <dt className="text-foreground">{label}</dt>
      <dd className="text-foreground m-0 whitespace-nowrap tabular-nums">{value}</dd>
    </div>
  );
}
