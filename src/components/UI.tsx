import React from 'react'

// ----- Card -----
export function Card({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`rounded-3xl overflow-hidden bg-card ring-1 ring-border shadow-xl shadow-black/30 ${className}`}>
      {children}
    </div>
  )
}

// ----- CardHeader (now with `right` slot) -----
export function CardHeader({
  icon,
  title,
  subtitle,
  right,
  className = '',
}: {
  icon?: React.ReactNode
  title: string
  subtitle?: string
  right?: React.ReactNode
  className?: string
}) {
  return (
    <div className={`px-4 py-3 flex items-center justify-between gap-3 border-b border-border bg-card ${className}`}>
      <div className="flex items-center gap-3 min-w-0">
        {icon ? (
          <div className="p-2 rounded-2xl bg-surface ring-1 ring-border shrink-0">{icon}</div>
        ) : null}
        <div className="min-w-0">
          <div className="font-semibold truncate">{title}</div>
          {subtitle && <div className="text-xs text-muted truncate">{subtitle}</div>}
        </div>
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  )
}

// ----- Stat -----
export function Stat({
  title,
  value,
  icon,
  accent,
  valueClassName = '',
  className = '',
}: {
  title: string
  value: string | number
  icon?: React.ReactNode
  accent?: boolean
  valueClassName?: string
  className?: string
}) {
  return (
    <div
      className={`rounded-2xl ring-1 ring-border ${
        accent ? 'bg-gradient-to-br from-[color:var(--accent-900)]/30 to-[color:var(--accent-800)]/10' : 'bg-surface'
      } p-3 flex items-center justify-between ${className}`}
    >
      <div>
        <div className="text-xs text-muted">{title}</div>
        <div className={`text-lg font-semibold ${valueClassName}`}>{value}</div>
      </div>
      {icon ? (
        <div className="p-2 rounded-xl bg-card ring-1 ring-border">
          {icon}
        </div>
      ) : null}
    </div>
  )
}

// ----- EmptyState -----
export function EmptyState({
  icon,
  title,
  subtitle,
  className = '',
}: {
  icon?: React.ReactNode
  title: string
  subtitle?: string
  className?: string
}) {
  return (
    <div className={`text-center py-6 ${className}`}>
      <div className="mx-auto w-10 h-10 grid place-items-center rounded-2xl bg-surface ring-1 ring-border mb-2">
        {icon}
      </div>
      <div className="text-sm font-medium">{title}</div>
      {subtitle && <div className="text-xs text-muted">{subtitle}</div>}
    </div>
  )
}
