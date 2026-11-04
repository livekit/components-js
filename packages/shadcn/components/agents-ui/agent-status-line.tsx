'use client';

import React, { type ComponentProps, type ReactNode } from 'react';
import { ArrowRightIcon, CheckIcon, CircleAlertIcon, MinusIcon, XIcon } from 'lucide-react';

import { AgentCard } from '@/components/agents-ui/agent-card';
import { cn } from '@/lib/utils';

/**
 * What a status line's mark means: done, cancelled or ruled out, a warning, handed off, or nothing
 * to do.
 */
export type AgentStatusLineMark = 'check' | 'cross' | 'alert' | 'arrow' | 'dash';

/**
 * Text `AgentStatusLine` announces to screen readers for each mark when it has no `status`. Pass
 * any of these to its `labels` to reword or translate them.
 */
export type AgentStatusLineLabels = Record<AgentStatusLineMark, string>;

export const defaultAgentStatusLineLabels: AgentStatusLineLabels = {
  check: 'Done',
  cross: 'Cancelled',
  alert: 'Warning',
  arrow: 'Handed off',
  dash: 'Nothing to do',
};

const MARK_ICONS = {
  check: CheckIcon,
  cross: XIcon,
  alert: CircleAlertIcon,
  arrow: ArrowRightIcon,
  dash: MinusIcon,
} satisfies Record<AgentStatusLineMark, unknown>;

/**
 * Props for the AgentStatusLine component.
 */
export interface AgentStatusLineProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** The line's mark. `alert` shows in the destructive color. */
  mark: AgentStatusLineMark;
  /**
   * An icon in place of the mark's own, such as a bag for an order. The mark still sets its color.
   * It's decorative, so give it `aria-hidden`.
   */
  icon?: ReactNode;
  /** Highlights the mark, for the thing the agent just did. */
  active?: boolean;
  /** A short status beside the mark, such as "Verified" or "Cancelled". */
  status?: ReactNode;
  /** What the status is about, such as "Priya Shah · BlueShield HMO". */
  children?: ReactNode;
  /** A small line under the rest, such as a time or a reference number. */
  meta?: ReactNode;
  /** Text announced for the mark when there's no `status` to say it. */
  labels?: Partial<AgentStatusLineLabels>;
}

/**
 * A one-line status in a card: a mark, an optional status, what it's about, and a small line under
 * it. Use it for something the agent did, such as verifying an identity or moving a booking.
 *
 * @extends ComponentProps<'div'>
 *
 * @example
 * ```tsx
 * <AgentStatusLine mark="check" status="Verified" meta="Just now">
 *   Priya Shah · BlueShield HMO
 * </AgentStatusLine>
 * ```
 */
export function AgentStatusLine({
  mark,
  icon,
  active = false,
  status,
  children,
  meta,
  labels,
  className,
  ...props
}: AgentStatusLineProps) {
  const Icon = MARK_ICONS[mark];
  const markColor =
    mark === 'alert'
      ? 'text-destructive'
      : mark === 'check' || active
        ? 'text-primary'
        : 'text-muted-foreground';
  const markElement = (
    <span
      className={cn('flex shrink-0 [&>svg]:size-4', markColor)}
      // Without a status, the mark is the only thing that says what happened
      aria-hidden={status ? true : undefined}
    >
      {icon ?? <Icon aria-hidden="true" />}
      {!status && (
        <span className="sr-only">{labels?.[mark] ?? defaultAgentStatusLineLabels[mark]}: </span>
      )}
    </span>
  );
  const body = (children || meta) && (
    <div className={cn('flex min-w-0 flex-col gap-px', status && 'pl-6')}>
      {children && <p className="text-foreground m-0 text-sm wrap-anywhere">{children}</p>}
      {meta && <p className="text-muted-foreground m-0 text-xs wrap-anywhere">{meta}</p>}
    </div>
  );

  return (
    <AgentCard
      data-slot="agent-status-line"
      data-mark={mark}
      className={cn('gap-0.5', className)}
      {...props}
    >
      {status ? (
        <>
          <div className="flex min-w-0 items-center gap-2">
            {markElement}
            <p
              className={cn(
                'm-0 font-mono text-[10px] leading-3.5 tracking-widest uppercase',
                mark === 'alert' ? 'text-destructive' : 'text-muted-foreground',
              )}
            >
              {status}
            </p>
          </div>
          {body}
        </>
      ) : (
        <div className="flex min-w-0 items-start gap-2">
          <span className="mt-0.5 flex">{markElement}</span>
          {body}
        </div>
      )}
    </AgentCard>
  );
}

/**
 * Props for the AgentStatusChange component.
 */
export interface AgentStatusChangeProps extends Omit<ComponentProps<'span'>, 'children'> {
  /** The old value, shown struck through. */
  from: ReactNode;
  /** The new value. */
  to: ReactNode;
  /**
   * Words screen readers hear around the values, since they don't announce the strikethrough or
   * the arrow.
   * @defaultValue { from: 'from', to: 'to' }
   */
  labels?: { from?: string; to?: string };
}

/**
 * A change from one value to another, such as a rescheduled time: the old value struck through,
 * then the new one. Use it inside `AgentStatusLine`.
 *
 * @extends ComponentProps<'span'>
 *
 * @example
 * ```tsx
 * <AgentStatusLine mark="arrow" status="Rescheduled">
 *   <AgentStatusChange from="2:00 PM" to="3:30 PM" />
 * </AgentStatusLine>
 * ```
 */
export function AgentStatusChange({
  from,
  to,
  labels,
  className,
  ...props
}: AgentStatusChangeProps) {
  return (
    <span data-slot="agent-status-change" className={className} {...props}>
      <span className="sr-only">{labels?.from ?? 'from'} </span>
      <s className="text-muted-foreground">{from}</s>
      <span aria-hidden="true"> → </span>
      <span className="sr-only"> {labels?.to ?? 'to'} </span>
      <span className="whitespace-nowrap">{to}</span>
    </span>
  );
}
