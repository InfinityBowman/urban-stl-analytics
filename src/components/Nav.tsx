import { Link } from '@tanstack/react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { SparklesIcon } from '@hugeicons/core-free-icons'
import { commandBarEvents } from '@/lib/ai/command-bar-events'

export function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-card/85 backdrop-blur-lg">
      <div className="grid h-10 grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 max-md:flex">
        <Link
          to="/"
          className="group flex shrink-0 items-center gap-2 text-sm font-bold tracking-tight"
        >
          <img
            src="/urbanslu/logo.svg"
            alt="STL Urban Analytics"
            className="h-9 w-auto"
          />
        </Link>

        {/* AI bar — centered on desktop, compact pill on mobile */}
        <button
          onClick={() => commandBarEvents.emit()}
          className="hidden w-64 items-center justify-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/15 md:flex"
        >
          <HugeiconsIcon icon={SparklesIcon} size={14} strokeWidth={2} />
          <span>Ask AI</span>
          <kbd
            className="rounded border border-primary/20 bg-primary/10 px-1 py-px text-[0.55rem] leading-none text-primary/70"
            suppressHydrationWarning
          >
            {typeof navigator !== 'undefined' &&
            /Mac|iPhone/.test(navigator.userAgent)
              ? '\u2318K'
              : 'Ctrl+K'}
          </kbd>
        </button>
        <button
          onClick={() => commandBarEvents.emit()}
          className="ml-auto flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[0.7rem] font-semibold text-primary transition-colors active:scale-95 md:hidden"
        >
          <HugeiconsIcon icon={SparklesIcon} size={13} strokeWidth={2.5} />
          AI
        </button>

        <nav className="flex shrink-0 items-center justify-end gap-1">
          <Link
            to="/explore"
            className="rounded-md px-2.5 py-1 text-[0.8rem] font-medium text-muted-foreground transition-colors hover:text-foreground"
            activeProps={{ className: 'text-foreground' }}
          >
            Explorer
          </Link>
          <Link
            to="/about"
            className="rounded-md px-2.5 py-1 text-[0.8rem] font-medium text-muted-foreground transition-colors hover:text-foreground"
            activeProps={{ className: 'text-foreground' }}
          >
            About
          </Link>
        </nav>
      </div>
    </header>
  )
}
