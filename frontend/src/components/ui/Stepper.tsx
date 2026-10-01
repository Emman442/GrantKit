import React, { useEffect, useState } from 'react';
import { formatElapsed } from '../../utils/format';
import { Check, Loader2 } from 'lucide-react';

interface StepperProps {
  currentStep: 1 | 2 | 3 | 4;
  isEvaluating: boolean;
  error?: string;
  className?: string;
}

const STEPS = [
  { step: 1, label: 'Transaction sent', desc: 'Broadcasted to GenLayer studionet' },
  { step: 2, label: 'Validators fetching links', desc: 'Verifying HTTPS code repositories' },
  { step: 3, label: 'Consensus on score', desc: 'GenVM committee nodes executing LLM' },
  { step: 4, label: 'Result', desc: 'Contract state updated and escrow checked' },
] as const;

export const Stepper: React.FC<StepperProps> = ({
  currentStep,
  isEvaluating,
  error,
  className = '',
}) => {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    let interval: any;
    if (isEvaluating) {
      interval = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isEvaluating]);

  return (
    <div
      className={`rounded-[8px] border border-[var(--border-app)] bg-[var(--bg-surface)] p-5 ${className}`}
    >
      <div className="flex items-center justify-between pb-4 border-b border-[var(--border-app)] mb-4">
        <div>
          <span className="text-xs font-semibold text-[var(--text-app)]">
            On-Chain LLM Consensus Evaluation
          </span>
          <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
            Validators fetch referenced code links and score compliance against active criteria.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-[var(--text-faint)]">Elapsed:</span>
          <span className="font-mono text-xs tabular-nums px-2 py-0.5 rounded-[4px] bg-[var(--bg-surface-raised)] border border-[var(--border-app)] text-[var(--text-app)] font-medium">
            {formatElapsed(seconds)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 relative">
        {STEPS.map((s, idx) => {
          const isDone = currentStep > s.step;
          const isCurrent = currentStep === s.step;
          const isFailed = isCurrent && Boolean(error);

          let stepBoxBorder = 'border-[var(--border-app)]';
          let stepBg = 'bg-[var(--bg-surface-raised)]';
          let textColor = 'text-[var(--text-muted)]';
          let stepNum = (
            <span className="font-mono text-xs tabular-nums text-[var(--text-faint)]">
              0{s.step}
            </span>
          );

          if (isDone) {
            stepBoxBorder = 'border-[var(--border-app)]';
            stepBg = 'bg-[var(--bg-surface-raised)]';
            textColor = 'text-[var(--text-app)]';
            stepNum = (
              <span className="w-4 h-4 rounded-full bg-[var(--color-success)] text-white flex items-center justify-center">
                <Check size={10} strokeWidth={2.5} />
              </span>
            );
          } else if (isCurrent) {
            if (isFailed) {
              stepBoxBorder = 'border-[#D2554D]';
              stepBg = 'bg-[var(--bg-surface-raised)]';
              textColor = 'text-[#D2554D]';
              stepNum = (
                <span className="w-4 h-4 rounded-full bg-[#D2554D] text-white flex items-center justify-center font-mono text-[10px]">
                  !
                </span>
              );
            } else {
              stepBoxBorder = 'border-[#3B6CFF]';
              stepBg = 'bg-[var(--bg-surface-raised)]';
              textColor = 'text-[var(--text-app)]';
              stepNum = (
                <Loader2
                  size={14}
                  strokeWidth={2}
                  className="text-[#3B6CFF] animate-spin shrink-0"
                />
              );
            }
          }

          return (
            <div
              key={s.step}
              className={`p-3 rounded-[6px] border ${stepBoxBorder} ${stepBg} transition-colors duration-120 flex flex-col justify-between`}
            >
              <div className="flex items-center justify-between mb-1.5">
                {stepNum}
                {isCurrent && !isFailed && isEvaluating && (
                  <span className="text-[10px] text-[#3B6CFF] font-medium uppercase tracking-wider">
                    Running
                  </span>
                )}
              </div>
              <div>
                <div className={`text-xs font-semibold ${textColor}`}>{s.label}</div>
                <div className="text-[11px] text-[var(--text-faint)] leading-snug mt-0.5">
                  {s.desc}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
