import { getVoiceById } from '../layers/CommunityVoiceLayer'
import { cn } from '@/lib/utils'

const sourceIcons: Record<string, string> = {
  survey: '📋',
  social: '💬',
  forum: '💭',
  meeting: '🏛️',
}

const topicLabels: Record<string, string> = {
  safety: 'Safety',
  infrastructure: 'Infrastructure',
  transit: 'Transit',
  food: 'Food Access',
  housing: 'Housing',
  parks: 'Parks & Recreation',
}

const sentimentColors: Record<string, string> = {
  positive: 'text-emerald-600 dark:text-emerald-400',
  neutral: 'text-muted-foreground',
  negative: 'text-red-600 dark:text-red-400',
}

const sentimentBg: Record<string, string> = {
  positive: 'bg-emerald-500/15',
  neutral: 'bg-muted',
  negative: 'bg-red-500/15',
}

const sentimentLabels: Record<string, string> = {
  positive: 'Positive',
  neutral: 'Neutral',
  negative: 'Concern',
}

export function CommunityVoiceDetail({ id }: { id: string }) {
  const voice = getVoiceById(id)

  if (!voice) {
    return (
      <div className="text-xs text-muted-foreground">
        Community voice not found
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 text-xs">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <span className="text-lg">{sourceIcons[voice.source] || '💬'}</span>
        <div>
          <div className="text-sm font-bold">{voice.neighborhood}</div>
          <span className="rounded-full bg-pink-500/15 px-2 py-0.5 text-[0.6rem] font-semibold text-pink-600 dark:text-pink-400">
            {topicLabels[voice.topic] || voice.topic}
          </span>
        </div>
      </div>

      {/* Quote */}
      <div className="rounded-lg bg-muted/60 p-3">
        <blockquote className="border-l-2 border-primary/40 pl-3 italic leading-relaxed text-foreground/90">
          &ldquo;{voice.quote}&rdquo;
        </blockquote>
        <div className="mt-2 text-[0.65rem] text-muted-foreground">
          — {voice.author}
        </div>
      </div>

      {/* Sentiment + date */}
      <div className="flex items-center justify-between rounded-lg bg-muted/60 px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-[0.6rem] font-bold',
              sentimentBg[voice.sentiment],
              sentimentColors[voice.sentiment],
            )}
          >
            {sentimentLabels[voice.sentiment]}
          </span>
        </div>
        <div className="text-[0.6rem] text-muted-foreground">
          {new Date(voice.date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </div>
      </div>

      {/* Source */}
      <div className="flex items-center justify-between rounded-lg bg-muted/60 px-3 py-2">
        <span className="text-[0.6rem] font-semibold uppercase tracking-wider text-muted-foreground">
          Source
        </span>
        <span className="text-[0.65rem] font-medium">
          {voice.source.charAt(0).toUpperCase() + voice.source.slice(1)}
        </span>
      </div>
    </div>
  )
}
