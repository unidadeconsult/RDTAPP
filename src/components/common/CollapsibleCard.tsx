"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { getCollapsedCards, setCollapsedCard } from "@/lib/storage/preferences";

export function CollapsibleCard({
  id,
  title,
  subtitle,
  icon,
  children,
  defaultCollapsed = false,
}: {
  id: string;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  children: ReactNode;
  defaultCollapsed?: boolean;
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  useEffect(() => {
    const stored = getCollapsedCards()[id];
    if (stored !== undefined) setCollapsed(stored);
  }, [id]);

  const toggle = () => {
    setCollapsed((prev) => {
      const next = !prev;
      setCollapsedCard(id, next);
      return next;
    });
  };

  return (
    <section className="rounded-2xl border border-border bg-bg-card shadow-card dark:border-white/10 dark:bg-white/5">
      <button
        type="button"
        onClick={toggle}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
        aria-expanded={!collapsed}
      >
        <div className="flex items-center gap-2">
          {icon}
          <div>
            <h3 className="font-heading text-base font-semibold text-text-primary dark:text-white">
              {title}
            </h3>
            {subtitle && (
              <p className="text-sm text-text-secondary dark:text-white/60">{subtitle}</p>
            )}
          </div>
        </div>
        <ChevronDown
          size={18}
          className={`shrink-0 text-text-secondary transition-transform ${collapsed ? "" : "rotate-180"}`}
        />
      </button>
      {!collapsed && <div className="px-5 pb-5">{children}</div>}
    </section>
  );
}
