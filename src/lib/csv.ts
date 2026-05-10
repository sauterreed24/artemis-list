import Papa from 'papaparse'

const US_DATE = /^\d{1,2}\/\d{1,2}\/\d{4}$/

export interface ParseResult {
  rows: string[][]
  errors: string[]
}

export function parseCsvText(text: string): ParseResult {
  const errors: string[] = []
  const parsed = Papa.parse<string[]>(text, {
    header: false,
    skipEmptyLines: 'greedy',
    transform: (v) => (typeof v === 'string' ? v : String(v)),
  })
  if (parsed.errors?.length) {
    for (const e of parsed.errors) {
      errors.push(e.message ?? 'Parse error')
    }
  }
  const rows = (parsed.data as string[][]).filter((r) => r.some((c) => String(c).trim() !== ''))
  return { rows, errors }
}

export function maxColumnCount(rows: string[][]): number {
  return rows.reduce((m, r) => Math.max(m, r.length), 0)
}

export function padRow(row: string[], len: number): string[] {
  const out = row.slice()
  while (out.length < len) out.push('')
  return out
}

/** Heuristic for Apollo-style exports: first column is usually M/D/YYYY. */
export function firstCellLooksLikeUsDate(value: string): boolean {
  return US_DATE.test(value.trim())
}

export function analyzeRow(
  row: string[],
  columnCount: number,
  strictDateColumn: boolean,
): { needsReview: boolean; warnings: string[] } {
  const warnings: string[] = []
  let needsReview = false
  if (row.length < columnCount) {
    warnings.push(`Only ${row.length} columns (expected ${columnCount})`)
    needsReview = true
  }
  const col0 = row[0]?.trim() ?? ''
  if (strictDateColumn && col0 && !firstCellLooksLikeUsDate(col0)) {
    needsReview = true
    warnings.push('First column is not a date — row may be misaligned')
  }
  return { needsReview, warnings }
}
