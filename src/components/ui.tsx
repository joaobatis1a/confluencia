import type { ButtonHTMLAttributes, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

type ButtonVariant = 'primary' | 'secondary'

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  const base =
    'inline-flex items-center justify-center rounded-[var(--radius-field)] px-5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
  const variants: Record<ButtonVariant, string> = {
    primary: 'bg-amarelo-500 text-grafite-900 hover:bg-amarelo-300',
    secondary: 'border border-grafite-300 text-grafite-900 hover:bg-grafite-100',
  }
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />
}

export function TextField({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-[var(--radius-field)] border border-grafite-300 bg-white px-3.5 py-2.5 text-sm text-grafite-900 placeholder:text-grafite-500 focus:outline-none focus:border-amarelo-500 focus:ring-2 focus:ring-amarelo-100 ${className}`}
      {...props}
    />
  )
}

export function TextArea({ className = '', ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`w-full rounded-[var(--radius-field)] border border-grafite-300 bg-white px-3.5 py-2.5 text-sm text-grafite-900 placeholder:text-grafite-500 focus:outline-none focus:border-amarelo-500 focus:ring-2 focus:ring-amarelo-100 ${className}`}
      {...props}
    />
  )
}

export function Select({ className = '', children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`w-full rounded-[var(--radius-field)] border border-grafite-300 bg-white px-3.5 py-2.5 text-sm text-grafite-900 focus:outline-none focus:border-amarelo-500 focus:ring-2 focus:ring-amarelo-100 ${className}`}
      {...props}
    >
      {children}
    </select>
  )
}

export function Card({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={`rounded-[var(--radius-card)] border border-grafite-200 bg-white p-4 ${className}`}>
      {children}
    </div>
  )
}

export function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-sm font-medium text-grafite-900 mb-1.5">{children}</label>
}

export function FormError({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-status-vermelho-500 mt-2">{children}</p>
}
