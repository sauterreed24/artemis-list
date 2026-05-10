export function digitsOnly(value: string): string {
  return value.replace(/\D/g, '')
}

/** Display US-style when 10 digits (or 11 starting with 1). */
export function formatPhoneDisplay(digits: string): string {
  const d = digitsOnly(digits)
  let core = d
  if (core.length === 11 && core.startsWith('1')) {
    core = core.slice(1)
  }
  if (core.length !== 10) {
    return digits.trim() || ''
  }
  const a = core.slice(0, 3)
  const b = core.slice(3, 6)
  const c = core.slice(6)
  return `(${a}) ${b}-${c}`
}

export function telHref(digits: string): string | null {
  const d = digitsOnly(digits)
  if (!d) return null
  if (d.length === 10) return `tel:+1${d}`
  if (d.length === 11 && d.startsWith('1')) return `tel:+${d}`
  return `tel:${d}`
}
