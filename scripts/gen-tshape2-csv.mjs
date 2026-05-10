import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

const HEADER = 'company,first_name,last_name,phone,email,city,state,green_flags,dm_target,notes,source_url'
const samplePath = path.join(root, 'samples', 'tshape2-prospects-southwest.csv')
const publicPath = path.join(root, 'public', 'seeds', 'tshape2-prospects-southwest.csv')

const source = fs.readFileSync(samplePath, 'utf8').replace(/\r\n/g, '\n')
const [header] = source.split('\n')

if (header !== HEADER) {
  throw new Error(`Unexpected prospect CSV header: ${header}`)
}

fs.mkdirSync(path.dirname(publicPath), { recursive: true })
fs.writeFileSync(publicPath, source.endsWith('\n') ? source : `${source}\n`, 'utf8')

const rowCount = source.trimEnd().split('\n').length - 1
console.log(`Synced ${rowCount} T-Shape 2 prospect rows to ${publicPath}`)
