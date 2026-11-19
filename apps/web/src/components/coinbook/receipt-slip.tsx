import { Fragment } from 'react';
import { cn } from '@/lib/cn';
import { LunasStamp } from './lunas-stamp';

export interface SlipLine {
  label: string;
  value: string;
  muted?: boolean;
}

export interface ReceiptSlipProps {
  title: string;
  date: string;
  heading?: string;
  groups: SlipLine[][];
  total: string;
  note?: string;
  highlighted?: boolean;
  paid?: boolean;
  animateStamp?: boolean;
  className?: string;
}

export function ReceiptSlip({
  title,
  date,
  heading,
  groups,
  total,
  note,
  highlighted = false,
  paid = false,
  animateStamp = false,
  className,
}: ReceiptSlipProps) {
  return (
    <div className={cn('slip', highlighted && 'me', className)}>
      <div className="rc">
        <div className="t">{title}</div>
        <div className="dt">{date}</div>
        <hr className="rl" />
        {heading ? <div className="who">{heading}</div> : null}
        {groups.map((group, i) => (
          <Fragment key={i}>
            {i > 0 ? <hr className="rl" /> : null}
            {group.map((line, j) => (
              <div key={`${j}-${line.label}`} className={cn('ln', line.muted && 'mu')}>
                <span>{line.label}</span>
                <span>{line.value}</span>
              </div>
            ))}
          </Fragment>
        ))}
        <hr className="rl" />
        <div className="ln tot">
          <span>Total</span>
          <span>{total}</span>
        </div>
        {note ? <div className="note">{note}</div> : null}
      </div>
      {paid ? <LunasStamp animate={animateStamp} className="slip-stamp" /> : null}
    </div>
  );
}
