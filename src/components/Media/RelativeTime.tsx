'use client'

import { formatRelativeTime } from '@/lib/format'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

export interface RelativeTimeProps {
  timestamp: Date | string
  className?: string
}

export function RelativeTime({ timestamp, className }: RelativeTimeProps) {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp
  const relativeStr = formatRelativeTime(date)
  const fullDate = date.toISOString()

  return (
    <div className="twp">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <time dateTime={fullDate} className={cn('twp:cursor-default', className)}>
              {relativeStr}
            </time>
          </TooltipTrigger>
          <TooltipContent>
            <p>{date.toLocaleString()}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}
