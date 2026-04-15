import { cn } from '../../utils/helpers'

// ── Button ────────────────────────────────────────────────────────────────────
export function Button({ variant = 'primary', className, children, ...props }) {
  const base = 'inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border-0 font-sans'
  const variants = {
    primary: 'bg-maroon text-cream shadow-lg shadow-maroon/30 hover:bg-maroon-dark hover:-translate-y-0.5 hover:shadow-xl hover:shadow-maroon/40',
    secondary: 'bg-white text-maroon border-2 border-taupe hover:border-maroon hover:bg-cream-dark',
    ghost: 'bg-transparent text-charcoal-light hover:bg-cream-dark border border-taupe',
    danger: 'bg-white text-red-600 border-2 border-taupe hover:border-red-500 hover:bg-red-50',
    gold: 'bg-gold text-charcoal hover:bg-gold-light hover:-translate-y-0.5',
  }
  return (
    <button className={cn(base, variants[variant], className)} {...props}>
      {children}
    </button>
  )
}

// ── Badge ─────────────────────────────────────────────────────────────────────
export function Badge({ children, variant = 'default', className }) {
  const variants = {
    default: 'bg-cream-dark text-maroon border border-taupe',
    pending: 'bg-amber-50 text-amber-700 border border-amber-200',
    completed: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    gold: 'bg-gold text-maroon',
  }
  return (
    <span className={cn('inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold', variants[variant], className)}>
      {children}
    </span>
  )
}

// ── Spinner ───────────────────────────────────────────────────────────────────
export function Spinner({ size = 'md', className }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' }
  return (
    <div className={cn('border-2 border-taupe border-t-maroon rounded-full animate-spin', sizes[size], className)} />
  )
}

// ── StatBox ───────────────────────────────────────────────────────────────────
export function StatBox({ icon, iconStyle, value, label }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-taupe-light bg-white p-4 transition-all duration-300 group hover:-translate-y-1 hover:shadow-xl hover:shadow-maroon/8 sm:p-6 lg:p-7">
      <div className="absolute top-0 left-0 w-full h-1 bg-gold scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
      <div className="flex justify-between items-center mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cream-dark text-lg text-maroon sm:h-11 sm:w-11 lg:h-12 lg:w-12 lg:text-xl" style={iconStyle}>
          <i className={`fas ${icon}`} />
        </div>
      </div>
      <div className="mb-1 font-serif text-3xl font-bold text-maroon sm:text-4xl">{value}</div>
      <div className="text-charcoal-light text-sm opacity-80">{label}</div>
    </div>
  )
}

// ── Modal ─────────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, maxWidth = 'max-w-xl' }) {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 bg-charcoal/70 backdrop-blur-sm z-50 flex items-center justify-center p-8"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className={cn('bg-white rounded-3xl w-full max-h-[90vh] overflow-y-auto p-10 relative border-2 border-taupe-light animate-slide-in', maxWidth)}>
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-9 h-9 rounded-full bg-cream border border-taupe flex items-center justify-center text-charcoal hover:bg-maroon hover:text-cream transition-all duration-300 hover:rotate-90"
        >
          <i className="fas fa-times text-sm" />
        </button>
        {title && <h2 className="font-serif text-3xl text-maroon mb-6">{title}</h2>}
        {children}
      </div>
    </div>
  )
}

// ── FormField ─────────────────────────────────────────────────────────────────
export function FormField({ label, required, children, className }) {
  return (
    <div className={cn('mb-6', className)}>
      <label className="block mb-2 font-semibold text-charcoal text-sm">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
    </div>
  )
}

const inputBase = 'w-full px-4 py-3.5 bg-cream border-2 border-taupe-light rounded-xl text-charcoal font-sans text-base transition-all duration-200 focus:outline-none focus:border-gold focus:bg-white'

export function Input({ className, ...props }) {
  return <input className={cn(inputBase, className)} {...props} />
}

export function Textarea({ className, ...props }) {
  return <textarea className={cn(inputBase, 'min-h-[120px] resize-y', className)} {...props} />
}

export function Select({ className, children, ...props }) {
  return (
    <select className={cn(inputBase, className)} {...props}>
      {children}
    </select>
  )
}

// ── Empty State ───────────────────────────────────────────────────────────────
export function EmptyState({ icon = 'fa-inbox', message = 'Nothing here yet' }) {
  return (
    <div className="text-center py-12 text-charcoal-light">
      <i className={`fas ${icon} text-5xl mb-4 text-taupe block`} />
      <p className="text-sm">{message}</p>
    </div>
  )
}

// ── Loading Page ──────────────────────────────────────────────────────────────
export function LoadingPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-cream">
      <div className="text-center">
        <Spinner size="lg" className="mx-auto mb-4" />
        <p className="text-charcoal-light text-sm">Loading...</p>
      </div>
    </div>
  )
}
