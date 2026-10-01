import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  width,
  height,
}) => {
  return (
    <div
      style={{ width, height }}
      className={`bg-[var(--bg-surface-raised)] border border-[var(--border-app)] rounded-[6px] animate-skeleton ${className}`}
    />
  );
};
