import * as React from 'react'
import * as SliderPrimitive from '@radix-ui/react-slider'
import { cn } from '@/lib/utils'

function Slider({
  className,
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Root>) {
  return (
    <SliderPrimitive.Root
      className={cn(
        'relative flex w-full touch-none items-center select-none',
        'data-[disabled]:opacity-50',
        className,
      )}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-1 w-full grow overflow-hidden rounded-full bg-muted">
        <SliderPrimitive.Range className="absolute h-full bg-primary/50" />
      </SliderPrimitive.Track>
      {(props.defaultValue ?? props.value ?? []).map((_, i) => (
        <SliderPrimitive.Thumb
          key={i}
          className={cn(
            'block h-3.5 w-3.5 rounded-full border border-border/80 bg-background shadow-sm',
            'ring-offset-background transition-colors',
            'hover:bg-accent',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
          )}
        />
      ))}
    </SliderPrimitive.Root>
  )
}

export { Slider }
