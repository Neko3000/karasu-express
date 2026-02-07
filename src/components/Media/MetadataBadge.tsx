'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export interface MetadataBadgeProps {
  label: string
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error'
  className?: string
}

const variantMap: Record<
  NonNullable<MetadataBadgeProps['variant']>,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  default: 'outline',
  primary: 'default',
  secondary: 'secondary',
  success: 'default',
  warning: 'secondary',
  error: 'destructive',
}

const variantColorClasses: Record<NonNullable<MetadataBadgeProps['variant']>, string> = {
  default: '',
  primary: '',
  secondary: '',
  success: 'twp:bg-emerald-600 twp:text-white',
  warning: 'twp:bg-amber-500 twp:text-white',
  error: '',
}

export function MetadataBadge({ label, variant = 'default', className }: MetadataBadgeProps) {
  return (
    <div className="twp">
      <Badge
        variant={variantMap[variant]}
        className={cn(variantColorClasses[variant], className)}
      >
        {label}
      </Badge>
    </div>
  )
}
