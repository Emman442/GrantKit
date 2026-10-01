import React from "react";

export type GrantStatus =
  | "approved"
  | "completed"
  | "cancelled"
  | "rejected"
  | string;

interface BadgeProps {
  status?: GrantStatus;
  label?: string;
  variant?: "success" | "warning" | "danger" | "neutral" | "accent";
  className?: string;
}

const STATUS_STYLE: Record<
  string,
  { color: string; label: string }
> = {
  approved: { color: "#2FA36B", label: "Approved" },
  completed: { color: "#3B6CFF", label: "Completed" },
  cancelled: { color: "#C9932B", label: "Cancelled" },
  rejected: { color: "#D2554D", label: "Rejected" },
};

const VARIANT_COLOR: Record<NonNullable<BadgeProps["variant"]>, string> = {
  success: "#2FA36B",
  warning: "#C9932B",
  danger: "#D2554D",
  accent: "#3B6CFF",
  neutral: "#8B8B94",
};

export const Badge: React.FC<BadgeProps> = ({
  status,
  label,
  variant,
  className = "",
}) => {
  let dotColor = "#8B8B94";
  let text = label || "";

  if (status !== undefined && status !== "") {
    const key = String(status).toLowerCase();
    const mapped = STATUS_STYLE[key];
    if (mapped) {
      dotColor = mapped.color;
      text = text || mapped.label;
    } else {
      text = text || String(status);
    }
  } else if (variant) {
    dotColor = VARIANT_COLOR[variant] ?? VARIANT_COLOR.neutral;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[6px] bg-[var(--bg-surface-raised)] border border-[var(--border-app)] text-xs text-[var(--text-app)] font-medium ${className}`}
    >
      <span
        className="w-[6px] h-[6px] rounded-full shrink-0"
        style={{ backgroundColor: dotColor }}
      />
      <span>{text}</span>
    </span>
  );
};