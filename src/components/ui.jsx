/** Small shared UI primitives: cards, buttons, badges, skeletons, empty states. */

export function Card({ className = '', children }) {
  return (
    <div
      className={`rounded-2xl border border-slate-200/70 bg-white shadow-sm shadow-slate-200/50 ${className}`}
    >
      {children}
    </div>
  )
}

export function Button({ variant = 'primary', className = '', children, ...props }) {
  const variants = {
    primary:
      'bg-brand-700 text-white hover:bg-brand-800 disabled:bg-slate-300 disabled:text-slate-500',
    secondary:
      'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 disabled:text-slate-400',
    ghost: 'text-slate-600 hover:bg-slate-100 disabled:text-slate-400',
    danger: 'bg-white text-red-600 border border-red-200 hover:bg-red-50',
  }
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export function Badge({ tone = 'slate', children }) {
  const tones = {
    slate: 'bg-slate-100 text-slate-600',
    brand: 'bg-brand-100 text-brand-800',
    green: 'bg-emerald-100 text-emerald-700',
    amber: 'bg-amber-100 text-amber-700',
  }
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${tones[tone]}`}
    >
      {children}
    </span>
  )
}

export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-lg bg-slate-200/80 ${className}`} />
}

export function EmptyState({ icon = '◎', title, body, action }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-400">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      {body && <p className="mt-1 max-w-sm text-sm text-slate-500">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function StepDots({ count, current }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className={`h-1.5 rounded-full transition-all ${
            i === current ? 'w-6 bg-brand-600' : 'w-1.5 bg-slate-300'
          }`}
        />
      ))}
    </div>
  )
}
