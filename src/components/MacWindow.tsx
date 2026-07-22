"use client";
import { ReactNode } from "react";

export default function MacWindow({
  title,
  children,
  size = "lg",
  className = "",
  contentClassName = "",
  footer,
}: {
  title?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg";
  className?: string;
  contentClassName?: string;
  footer?: ReactNode;
}) {
  return (
    <div
      className={`relative rounded-2xl shadow-window overflow-hidden ring-1 bg-white text-ink-900 ring-black/10 dark:bg-ink-900 dark:text-zinc-200 dark:ring-black/40 ${className}`}
    >
      {/* title bar */}
      <div className="relative h-10 flex items-center px-4 border-b border-black/5 dark:border-white/5 bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-ink-800 dark:to-ink-900">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#FF5F56] ring-1 ring-black/20" />
          <span className="w-3 h-3 rounded-full bg-[#FFBD2E] ring-1 ring-black/20" />
          <span className="w-3 h-3 rounded-full bg-[#27C93F] ring-1 ring-black/20" />
        </div>
        {title && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-sm text-ink-900/60 dark:text-zinc-400">{title}</span>
          </div>
        )}
      </div>
      <div className={`${contentClassName}`}>{children}</div>
      {footer && (
        <div className="border-t border-black/5 dark:border-white/5 bg-white/80 dark:bg-ink-900/80 backdrop-blur px-5 py-3 flex items-center justify-between">
          {footer}
        </div>
      )}
    </div>
  );
}
