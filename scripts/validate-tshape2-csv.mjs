import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Papa from 'papaparse'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

const fields = [
  'company',
  'first_name',
  'last_name',
  'phone',
  'email',
  'city',
  'state',
  'green_flags',
  'dm_target',
  'notes',
  'source_url',
]

const samplePath = path.join(root, 'samples', 'tshape2-prospects-southwest.csv')
const publicPath = path.join(root, 'public', 'seeds', 'tshape2-prospects-southwest.csv')

function fail(message) {
  throw new Error(message)
}

function normalizePhone(phone) {
  return String(phone ?? '').replace(/\D/g, '')
}

function readCsv(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8')
  const parsed = Papa.parse(raw, {
    header: true,
    skipEmptyLines: true,
  })
  if (parsed.errors.length) {
    fail(`${path.relative(root, filePath)} parse error: ${parsed.errors[0].message}`)
  }
  return { raw, rows: parsed.data, meta: parsed.meta }
}

const sample = readCsv(samplePath)
const mirror = fs.readFileSync(publicPath, 'utf8')

if (sample.raw.replace(/\r\n/g, '\n') !== mirror.replace(/\r\n/g, '\n')) {
  fail('Sample CSV and public seed CSV are out of sync. Run npm run prospects:sync.')
}

if (sample.meta.fields?.join(',') !== fields.join(',')) {
  fail(`Unexpected header order: ${sample.meta.fields?.join(',')}`)
}

if (sample.rows.length !== 150) {
  fail(`Expected 150 prospect rows but found ${sample.rows.length}`)
}

const validStates = new Set(['AZ', 'CO', 'NM'])
const validFlags = new Set([
  'GLP1',
  'BODY',
  'CELLULITE',
  'SKIN_TIGHTENING',
  'COOLSCULPTING',
  'EMSCULPT',
  'MORPHEUS8',
  'MEDICAL_OVERSIGHT',
  'REVIEWS',
  'MULTI_LOCATION',
  'GROWTH',
])
const phoneOwners = new Map()
const locationOwners = new Map()
const counts = new Map()

for (const [idx, row] of sample.rows.entries()) {
  const line = idx + 2
  for (const required of ['company', 'phone', 'city', 'state', 'green_flags', 'dm_target', 'notes', 'source_url']) {
    if (!String(row[required] ?? '').trim()) {
      fail(`Line ${line} is missing ${required}`)
    }
  }

  if (!validStates.has(row.state)) {
    fail(`Line ${line} has unsupported state: ${row.state}`)
  }

  for (const flag of String(row.green_flags).split(/[|;]/).map((v) => v.trim()).filter(Boolean)) {
    if (!validFlags.has(flag)) {
      fail(`Line ${line} has unsupported green flag: ${flag}`)
    }
  }

  const digits = normalizePhone(row.phone)
  if (digits.length !== 10) {
    fail(`Line ${line} has invalid phone: ${row.phone}`)
  }

  const phoneOwner = phoneOwners.get(digits)
  if (phoneOwner) {
    fail(`Line ${line} duplicates phone ${row.phone} already used by line ${phoneOwner.line} (${phoneOwner.company})`)
  }
  phoneOwners.set(digits, { line, company: row.company })

  const locKey = [row.company, row.city, row.state].map((v) => String(v).trim().toLowerCase()).join('|')
  const locOwner = locationOwners.get(locKey)
  if (locOwner) {
    fail(`Line ${line} duplicates company/location already used by line ${locOwner.line}`)
  }
  locationOwners.set(locKey, { line })

  if (!/^https?:\/\//.test(row.source_url)) {
    fail(`Line ${line} source_url is not HTTP(S): ${row.source_url}`)
  }

  counts.set(row.state, (counts.get(row.state) ?? 0) + 1)
}

const summary = [...counts.entries()].sort().map(([state, count]) => `${state}:${count}`).join(' ')
console.log(`Validated ${sample.rows.length} T-Shape 2 prospects (${summary})`)
