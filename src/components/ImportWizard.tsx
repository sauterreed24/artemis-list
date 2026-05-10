import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ColumnRole, LeadList, MappingConfig } from '../types'
import { maxColumnCount, parseCsvText } from '../lib/csv'
import {
  ROLE_LABELS,
  ROLE_OPTIONS,
  apolloPresetRoles,
  defaultMapping,
  guessColumnCount,
  headerRowLooksProspectingSeed,
  inferImportMapping,
  padMappingRoles,
  prospectingSeedPreset,
  rowsToContacts,
  sampleLooksApolloStyle,
} from '../lib/mapping'

type Props = {
  open: boolean
  onClose: () => void
  targetList: LeadList | null
  onApply: (
    contacts: ReturnType<typeof rowsToContacts>,
    mapping: MappingConfig,
    firstRowIsHeader: boolean,
    append: boolean,
  ) => void
}

export function ImportWizard({ open, onClose, targetList, onApply }: Props) {
  const [text, setText] = useState('')
  const [fileLabel, setFileLabel] = useState<string | null>(null)
  const [firstRowIsHeader, setFirstRowIsHeader] = useState(false)
  const [append, setAppend] = useState(false)
  const [mapping, setMapping] = useState<MappingConfig>(() => defaultMapping(15))
  const fileInputRef = useRef<HTMLInputElement>(null)

  const parsed = useMemo(() => {
    if (!text.trim()) return { rows: [] as string[][], errors: [] as string[] }
    return parseCsvText(text)
  }, [text])

  const columnCount = useMemo(
    () => Math.max(1, guessColumnCount(parsed.rows, firstRowIsHeader), maxColumnCount(parsed.rows)),
    [parsed.rows, firstRowIsHeader],
  )

  const rolesForUi = padMappingRoles(mapping.roles, columnCount)

  const resetLocalState = useCallback(() => {
    setText('')
    setFileLabel(null)
    setAppend(false)
    setFirstRowIsHeader(false)
    setMapping(defaultMapping(15))
  }, [])

  function closeWizard() {
    resetLocalState()
    onClose()
  }

  /** Sync teardown when parent closes (e.g. Escape) — defer avoids cascading-render lint noise. */
  useEffect(() => {
    if (open) return
    const id = window.setTimeout(resetLocalState, 0)
    return () => clearTimeout(id)
  }, [open, resetLocalState])

  useEffect(() => {
    if (!open || !targetList) return
    const id = window.setTimeout(() => fileInputRef.current?.focus(), 0)
    return () => clearTimeout(id)
  }, [open, targetList])

  useEffect(() => {
    if (!open || !parsed.rows.length) return
    const id = window.setTimeout(() => {
      setMapping(inferImportMapping(parsed.rows, firstRowIsHeader))
    }, 0)
    return () => clearTimeout(id)
  }, [open, parsed.rows, firstRowIsHeader])

  if (!open || !targetList) return null

  const apolloHint =
    parsed.rows.length > 0 && sampleLooksApolloStyle(parsed.rows, firstRowIsHeader)

  const prospectingHeaderHint =
    firstRowIsHeader &&
    parsed.rows.length > 0 &&
    headerRowLooksProspectingSeed(parsed.rows[0] ?? [])

  const handleFile = async (file: File) => {
    setFileLabel(file.name)
    const t = await file.text()
    setText(t)
  }

  const setRoleAt = (index: number, role: ColumnRole) => {
    setMapping((prev) => {
      const roles = padMappingRoles(prev.roles, columnCount)
      roles[index] = role
      return { columnCount, roles }
    })
  }

  const previewRows = (firstRowIsHeader ? parsed.rows.slice(1) : parsed.rows).slice(0, 5)
  const dataRowCount = firstRowIsHeader ? Math.max(0, parsed.rows.length - 1) : parsed.rows.length

  return (
    <div className="modal-backdrop" role="presentation" onClick={closeWizard}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-header">
          <h2 id="import-title">Import CSV into “{targetList.name}”</h2>
          <button type="button" className="btn btn-ghost" onClick={closeWizard}>
            Close
          </button>
        </header>

        <div className="modal-body">
          <div
            className="file-drop"
            onDragOver={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
            onDrop={(e) => {
              e.preventDefault()
              e.stopPropagation()
              const f = e.dataTransfer.files?.[0]
              if (f) void handleFile(f)
            }}
          >
            <label className="file-drop-label">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) void handleFile(f)
                }}
              />
              <span>
                Drop a CSV here or <strong>browse</strong>
                {fileLabel ? ` — ${fileLabel}` : ''}
              </span>
            </label>
          </div>

          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={firstRowIsHeader}
              onChange={(e) => setFirstRowIsHeader(e.target.checked)}
            />
            First row is header
          </label>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={append}
              onChange={(e) => setAppend(e.target.checked)}
            />
            Append to existing contacts (otherwise replace all contacts in this list)
          </label>

          {apolloHint && (
            <p className="hint">
              This file looks like an Apollo-style export (date in column A). The Apollo preset is
              suggested — adjust columns if needed.
            </p>
          )}

          {prospectingHeaderHint && (
            <p className="hint">
              Header row matches outbound prospecting columns (company + phone). Column roles were
              auto-mapped from headers — use “Apply prospecting seed preset” if your CSV uses the
              fixed seed layout without renaming columns. Context columns left as{' '}
              <strong>Extra</strong> (city, state, green flags, DM target, source URL) are appended
              to each contact’s Notes with labels on import.
            </p>
          )}

          {parsed.errors.length > 0 && (
            <ul className="warn-list">
              {parsed.errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          )}

          {parsed.rows.length > 0 && (
            <>
              <p className="import-meta">
                <strong>{dataRowCount}</strong> contacts · <strong>{columnCount}</strong> columns
              </p>
              <div className="mapper-toolbar">
                <span className="mapper-label">Column mapping</span>
                <button
                  type="button"
                  className="btn btn-small"
                  onClick={() =>
                    setMapping({
                      columnCount,
                      roles: apolloPresetRoles(columnCount),
                    })
                  }
                >
                  Apply Apollo preset
                </button>
                <button
                  type="button"
                  className="btn btn-small"
                  onClick={() =>
                    setMapping({
                      columnCount,
                      roles: prospectingSeedPreset(columnCount),
                    })
                  }
                >
                  Apply prospecting seed preset
                </button>
              </div>
              <div className="mapper-grid">
                {Array.from({ length: columnCount }, (_, i) => (
                  <label key={i} className="mapper-cell">
                    <span className="mapper-col">Col {i + 1}</span>
                    <select
                      className="select"
                      value={rolesForUi[i] ?? 'extra'}
                      onChange={(e) => setRoleAt(i, e.target.value as ColumnRole)}
                    >
                      {ROLE_OPTIONS.map((r) => (
                        <option key={r} value={r}>
                          {ROLE_LABELS[r]}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>

              <div className="preview-wrap">
                <h3>Preview (first {previewRows.length} rows)</h3>
                <div className="table-scroll">
                  <table className="preview-table">
                    <thead>
                      <tr>
                        {Array.from({ length: columnCount }, (_, i) => (
                          <th key={i}>{i + 1}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewRows.map((row, ri) => (
                        <tr key={ri}>
                          {Array.from({ length: columnCount }, (_, ci) => (
                            <td key={ci}>{row[ci] ?? ''}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

        <footer className="modal-footer">
          <button type="button" className="btn btn-ghost" onClick={closeWizard}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={parsed.rows.length === 0}
            onClick={() => {
              const count = Math.max(
                mapping.columnCount,
                columnCount,
                maxColumnCount(parsed.rows),
              )
              const roles = padMappingRoles(mapping.roles, count)
              const cfg: MappingConfig = { columnCount: count, roles }
              const contacts = rowsToContacts(parsed.rows, cfg, firstRowIsHeader)
              onApply(contacts, cfg, firstRowIsHeader, append)
              closeWizard()
            }}
          >
            Import
          </button>
        </footer>
      </div>
    </div>
  )
}
