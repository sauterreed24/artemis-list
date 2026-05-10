import Papa from 'papaparse'
import type { Contact } from '../types'

export function exportContactsToCsv(contacts: Contact[]): string {
  const rows = contacts.map((c) => ({
    Name: c.fullName,
    Company: c.company,
    Mobile: c.mobile,
    WorkPhone: c.workPhone,
    Email: c.email,
    Contacted: c.contacted ? 'yes' : 'no',
    Notes: c.notes,
    NeedsReview: c.needsReview ? 'yes' : 'no',
    DuplicatePhone: c.duplicateMobile ? 'yes' : 'no',
  }))
  return '\ufeff' + Papa.unparse(rows)
}

/** Safe basename + local calendar date (no new deps). */
export function exportFilenameForList(listName: string): string {
  const safe = listName.replace(/[^\w\d-]+/g, '_').replace(/_+/g, '_').slice(0, 80)
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const base = safe || 'contacts'
  return `${base}_${y}-${m}-${day}.csv`
}

export function downloadTextFile(filename: string, text: string): void {
  const blob = new Blob([text], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
