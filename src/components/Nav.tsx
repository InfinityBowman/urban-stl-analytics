import { Link } from '@tanstack/react-router'

export function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-card/85 backdrop-blur-lg">
      <div className="flex h-10 items-center px-4">
        <Link
          to="/"
          className="group flex items-center gap-2 text-sm font-bold tracking-tight"
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-[10px] font-black text-primary-foreground shadow-sm">
            STL
          </div>
          <span className="text-foreground transition-colors group-hover:text-primary">
            Urban Analytics
          </span>
        </Link>
      </div>
    </header>
  )
}
