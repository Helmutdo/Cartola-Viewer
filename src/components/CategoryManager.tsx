import { useRef, useState } from 'react'
import { useCartola } from '../store/useCartola'
import type { CategoryDefinition, CategoryTree, SubCategoryDefinition } from '../types'
import { effectiveCategory } from '../types'

// ─── Paleta de 8 colores para nuevas categorías ──────────────────────────────

const PALETTE = [
  '#f97316', '#10b981', '#3b82f6', '#ec4899',
  '#8b5cf6', '#ef4444', '#f59e0b', '#06b6d4',
]

// ─── Iconos ──────────────────────────────────────────────────────────────────

const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
    <path d="M13.488 2.513a1.75 1.75 0 0 0-2.475 0L2.75 10.776a.75.75 0 0 0-.197.37l-.5 2.5a.75.75 0 0 0 .883.882l2.5-.5a.75.75 0 0 0 .37-.196l8.263-8.263a1.75 1.75 0 0 0 0-2.475Z" />
  </svg>
)

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
    <path fillRule="evenodd" d="M5 3.25V4H2.75a.75.75 0 0 0 0 1.5h.3l.815 8.15A1.5 1.5 0 0 0 5.357 15h5.285a1.5 1.5 0 0 0 1.493-1.35l.815-8.15h.3a.75.75 0 0 0 0-1.5H11v-.75A2.25 2.25 0 0 0 8.75 1h-1.5A2.25 2.25 0 0 0 5 3.25Zm2.25-.75a.75.75 0 0 0-.75.75V4h3v-.75a.75.75 0 0 0-.75-.75h-1.5ZM6.05 6a.75.75 0 0 1 .787.713l.275 5.5a.75.75 0 0 1-1.498.075l-.275-5.5A.75.75 0 0 1 6.05 6Zm3.9 0a.75.75 0 0 1 .712.787l-.275 5.5a.75.75 0 0 1-1.498-.075l.275-5.5a.75.75 0 0 1 .786-.711Z" clipRule="evenodd" />
  </svg>
)

// ─── Color picker con swatches ───────────────────────────────────────────────

function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1">
      {PALETTE.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className="h-5 w-5 rounded-full border-2 transition-transform hover:scale-110"
          style={{
            background: c,
            borderColor: value === c ? '#fff' : 'transparent',
          }}
          aria-label={c}
        />
      ))}
    </div>
  )
}

// ─── Validación del árbol importado ──────────────────────────────────────────

function isValidTree(data: unknown): data is CategoryTree {
  if (!Array.isArray(data)) return false
  return data.every(
    (item) =>
      item !== null &&
      typeof item === 'object' &&
      typeof (item as CategoryDefinition).id === 'string' &&
      typeof (item as CategoryDefinition).name === 'string' &&
      typeof (item as CategoryDefinition).color === 'string' &&
      Array.isArray((item as CategoryDefinition).subcategories) &&
      (item as CategoryDefinition).subcategories.every(
        (s: unknown) =>
          s !== null &&
          typeof s === 'object' &&
          typeof (s as SubCategoryDefinition).id === 'string' &&
          typeof (s as SubCategoryDefinition).name === 'string',
      ),
  )
}

// ─── Componente principal ────────────────────────────────────────────────────

export function CategoryManager() {
  const categoryTree = useCartola((s) => s.categoryTree)
  const months = useCartola((s) => s.months)
  const setCategoryTree = useCartola((s) => s.setCategoryTree)
  const renameMainCategory = useCartola((s) => s.renameMainCategory)
  const renameSubcategory = useCartola((s) => s.renameSubcategory)
  const removeSubcategories = useCartola((s) => s.removeSubcategories)

  // Categoría seleccionada en columna izquierda
  const [selectedId, setSelectedId] = useState<string | null>(() => categoryTree[0]?.id ?? null)

  // Edición inline de categoría principal
  const [editCatId, setEditCatId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')

  // Agregar nueva categoría
  const [addingCat, setAddingCat] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [newCatColor, setNewCatColor] = useState(PALETTE[0])

  // Edición inline de subcategoría
  const [editSubId, setEditSubId] = useState<string | null>(null)
  const [editSubName, setEditSubName] = useState('')

  // Agregar nueva subcategoría
  const [addingSub, setAddingSub] = useState(false)
  const [newSubName, setNewSubName] = useState('')

  // Drag & drop — categorías
  const [dragCatIdx, setDragCatIdx] = useState<number | null>(null)
  const [dragOverCatIdx, setDragOverCatIdx] = useState<number | null>(null)

  // Drag & drop — subcategorías
  const [dragSubIdx, setDragSubIdx] = useState<number | null>(null)
  const [dragOverSubIdx, setDragOverSubIdx] = useState<number | null>(null)

  // Import ref
  const importRef = useRef<HTMLInputElement>(null)

  const selectedCat = categoryTree.find((c) => c.id === selectedId) ?? null

  // Cuenta transacciones afectadas por subcategorías dadas
  function countForSubs(subNames: string[]): number {
    const names = new Set(subNames)
    let n = 0
    for (const m of months) {
      for (const t of m.transactions) {
        if (names.has(effectiveCategory(t))) n++
      }
    }
    return n
  }

  // ── Cat CRUD ───────────────────────────────────────────────────────────────

  function startEditCat(cat: CategoryDefinition) {
    setEditCatId(cat.id)
    setEditName(cat.name)
    setEditColor(cat.color)
  }

  function saveCat() {
    const name = editName.trim()
    if (!name) return
    const oldCat = categoryTree.find((c) => c.id === editCatId)
    if (!oldCat) return
    if (name !== oldCat.name) renameMainCategory(oldCat.name, name)
    const tree = categoryTree.map((c) =>
      c.id === editCatId ? { ...c, name, color: editColor } : c,
    )
    setCategoryTree(tree)
    setEditCatId(null)
  }

  function cancelEditCat() {
    setEditCatId(null)
  }

  function deleteCat(cat: CategoryDefinition) {
    const subNames = cat.subcategories.map((s) => s.name)
    const count = countForSubs(subNames)
    const suffix =
      count > 0
        ? ` Las ${count} transacciones categorizadas aquí pasarán a Sin categorizar.`
        : ''
    if (!confirm(`¿Eliminar "${cat.name}"?${suffix}`)) return
    removeSubcategories(subNames)
    const tree = categoryTree.filter((c) => c.id !== cat.id)
    setCategoryTree(tree)
    if (selectedId === cat.id) setSelectedId(tree[0]?.id ?? null)
  }

  function confirmAddCat() {
    const name = newCatName.trim()
    if (!name) return
    const newCat: CategoryDefinition = {
      id: crypto.randomUUID(),
      name,
      color: newCatColor,
      subcategories: [],
    }
    // Insertar antes de 'Sin categorizar'
    const sinIdx = categoryTree.findIndex((c) => c.name === 'Sin categorizar')
    const base = [...categoryTree]
    if (sinIdx >= 0) {
      base.splice(sinIdx, 0, newCat)
    } else {
      base.push(newCat)
    }
    setCategoryTree(base)
    setSelectedId(newCat.id)
    setAddingCat(false)
    setNewCatName('')
    const nonSpecial = base.filter((c) => c.name !== 'Sin categorizar')
    setNewCatColor(PALETTE[nonSpecial.length % PALETTE.length])
  }

  // ── Sub CRUD ───────────────────────────────────────────────────────────────

  function startEditSub(sub: SubCategoryDefinition) {
    setEditSubId(sub.id)
    setEditSubName(sub.name)
  }

  function saveSub() {
    const name = editSubName.trim()
    if (!name || !selectedCat) return
    const oldSub = selectedCat.subcategories.find((s) => s.id === editSubId)
    if (!oldSub) return
    if (name !== oldSub.name) renameSubcategory(oldSub.name, name)
    const tree = categoryTree.map((c) =>
      c.id === selectedCat.id
        ? { ...c, subcategories: c.subcategories.map((s) => (s.id === editSubId ? { ...s, name } : s)) }
        : c,
    )
    setCategoryTree(tree)
    setEditSubId(null)
  }

  function cancelEditSub() {
    setEditSubId(null)
  }

  function deleteSub(sub: SubCategoryDefinition) {
    if (!selectedCat || selectedCat.subcategories.length <= 1) return
    const count = countForSubs([sub.name])
    const suffix = count > 0 ? ` Las ${count} transacciones pasarán a Sin categorizar.` : ''
    if (!confirm(`¿Eliminar "${sub.name}"?${suffix}`)) return
    removeSubcategories([sub.name])
    const tree = categoryTree.map((c) =>
      c.id === selectedCat.id
        ? { ...c, subcategories: c.subcategories.filter((s) => s.id !== sub.id) }
        : c,
    )
    setCategoryTree(tree)
  }

  function confirmAddSub() {
    const name = newSubName.trim()
    if (!name || !selectedCat) return
    const newSub: SubCategoryDefinition = { id: crypto.randomUUID(), name }
    const tree = categoryTree.map((c) =>
      c.id === selectedCat.id ? { ...c, subcategories: [...c.subcategories, newSub] } : c,
    )
    setCategoryTree(tree)
    setAddingSub(false)
    setNewSubName('')
  }

  // ── Drag & drop ────────────────────────────────────────────────────────────

  function handleCatDrop(targetIdx: number) {
    if (dragCatIdx === null || dragCatIdx === targetIdx) {
      setDragCatIdx(null)
      setDragOverCatIdx(null)
      return
    }
    const tree = [...categoryTree]
    const [item] = tree.splice(dragCatIdx, 1)
    tree.splice(targetIdx, 0, item)
    setCategoryTree(tree)
    setDragCatIdx(null)
    setDragOverCatIdx(null)
  }

  function handleSubDrop(targetIdx: number) {
    if (dragSubIdx === null || dragSubIdx === targetIdx || !selectedCat) {
      setDragSubIdx(null)
      setDragOverSubIdx(null)
      return
    }
    const subs = [...selectedCat.subcategories]
    const [item] = subs.splice(dragSubIdx, 1)
    subs.splice(targetIdx, 0, item)
    const tree = categoryTree.map((c) =>
      c.id === selectedCat.id ? { ...c, subcategories: subs } : c,
    )
    setCategoryTree(tree)
    setDragSubIdx(null)
    setDragOverSubIdx(null)
  }

  // ── Export / Import ────────────────────────────────────────────────────────

  function exportTree() {
    const blob = new Blob([JSON.stringify(categoryTree, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'cartola_categories.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string)
        if (!isValidTree(parsed)) {
          alert('El archivo no tiene el formato correcto.')
          return
        }
        if (confirm('Esto reemplazará tus categorías actuales. ¿Continuar?')) {
          setCategoryTree(parsed)
          setSelectedId((parsed as CategoryTree)[0]?.id ?? null)
        }
      } catch {
        alert('Error al leer el archivo.')
      }
      e.target.value = ''
    }
    reader.readAsText(file)
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const isProtected = (name: string) => name === 'Sin categorizar'

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
      <h3 className="mb-4 text-sm font-semibold text-slate-300">Gestionar categorías</h3>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* ── Columna izquierda: categorías principales ── */}
        <div className="rounded-lg border border-slate-800 bg-slate-800/30 p-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
            Categorías principales
          </p>

          <ul className="space-y-0.5">
            {categoryTree.map((cat, idx) => {
              const isSelected = cat.id === selectedId
              const isEditing = cat.id === editCatId
              const isDragOver = dragOverCatIdx === idx

              return (
                <li
                  key={cat.id}
                  draggable
                  onDragStart={() => setDragCatIdx(idx)}
                  onDragOver={(e) => {
                    e.preventDefault()
                    setDragOverCatIdx(idx)
                  }}
                  onDrop={() => handleCatDrop(idx)}
                  onDragEnd={() => {
                    setDragCatIdx(null)
                    setDragOverCatIdx(null)
                  }}
                  className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors ${
                    isDragOver ? 'bg-slate-700/60' : ''
                  } ${isSelected && !isEditing ? 'bg-slate-700 text-slate-100' : 'text-slate-300'}`}
                >
                  {/* Drag handle */}
                  <span className="shrink-0 cursor-grab select-none text-slate-600">⠿</span>

                  {isEditing ? (
                    /* ── Edit mode ── */
                    <div className="flex flex-1 flex-col gap-2">
                      <input
                        autoFocus
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveCat()
                          if (e.key === 'Escape') cancelEditCat()
                        }}
                        className="w-full rounded border border-slate-600 bg-slate-900 px-2 py-0.5 text-sm text-slate-100 outline-none"
                      />
                      <ColorPicker value={editColor} onChange={setEditColor} />
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={saveCat}
                          className="rounded bg-teal-700 px-2 py-0.5 text-xs text-teal-200 hover:bg-teal-600"
                        >
                          ✓ Guardar
                        </button>
                        <button
                          type="button"
                          onClick={cancelEditCat}
                          className="rounded px-2 py-0.5 text-xs text-slate-500 hover:text-slate-300"
                        >
                          ✗ Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* ── View mode ── */
                    <>
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ background: cat.color }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedId(cat.id)
                          setEditSubId(null)
                          setAddingSub(false)
                        }}
                        className="flex-1 text-left"
                      >
                        {cat.name}
                        <span className="ml-1.5 text-xs text-slate-500">
                          ({cat.subcategories.length})
                        </span>
                      </button>
                      {!isProtected(cat.name) && (
                        <div className="flex shrink-0 gap-1">
                          <button
                            type="button"
                            onClick={() => startEditCat(cat)}
                            className="text-slate-600 hover:text-slate-300"
                            aria-label="Editar categoría"
                          >
                            <EditIcon />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteCat(cat)}
                            className="text-slate-600 hover:text-red-400"
                            aria-label="Eliminar categoría"
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </li>
              )
            })}
          </ul>

          {/* Nueva categoría */}
          {addingCat ? (
            <div className="mt-2 flex flex-col gap-2 rounded-lg border border-slate-700 bg-slate-800/50 p-2">
              <input
                autoFocus
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') confirmAddCat()
                  if (e.key === 'Escape') setAddingCat(false)
                }}
                placeholder="Nombre de categoría"
                className="rounded border border-slate-600 bg-slate-900 px-2 py-1 text-sm text-slate-100 outline-none"
              />
              <ColorPicker value={newCatColor} onChange={setNewCatColor} />
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={confirmAddCat}
                  className="rounded bg-teal-700 px-2 py-0.5 text-xs text-teal-200 hover:bg-teal-600"
                >
                  ✓ Guardar
                </button>
                <button
                  type="button"
                  onClick={() => setAddingCat(false)}
                  className="rounded px-2 py-0.5 text-xs text-slate-500 hover:text-slate-300"
                >
                  ✗ Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                const nonSpecial = categoryTree.filter((c) => !isProtected(c.name))
                setNewCatColor(PALETTE[nonSpecial.length % PALETTE.length])
                setAddingCat(true)
                setNewCatName('')
              }}
              className="mt-2 w-full rounded-lg border border-dashed border-slate-700 py-1.5 text-xs text-slate-500 hover:border-slate-500 hover:text-slate-400"
            >
              + Nueva categoría
            </button>
          )}
        </div>

        {/* ── Columna derecha: subcategorías ── */}
        <div className="rounded-lg border border-slate-800 bg-slate-800/30 p-3">
          {selectedCat ? (
            <>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                Subcategorías de{' '}
                <span style={{ color: selectedCat.color }}>{selectedCat.name}</span>
              </p>

              <ul className="space-y-0.5">
                {selectedCat.subcategories.map((sub, idx) => {
                  const isEditing = sub.id === editSubId
                  const canDelete = selectedCat.subcategories.length > 1
                  const isDragOver = dragOverSubIdx === idx
                  const isProtectedCat = isProtected(selectedCat.name)

                  return (
                    <li
                      key={sub.id}
                      draggable={!isProtectedCat}
                      onDragStart={() => !isProtectedCat && setDragSubIdx(idx)}
                      onDragOver={(e) => {
                        if (!isProtectedCat) {
                          e.preventDefault()
                          setDragOverSubIdx(idx)
                        }
                      }}
                      onDrop={() => !isProtectedCat && handleSubDrop(idx)}
                      onDragEnd={() => {
                        setDragSubIdx(null)
                        setDragOverSubIdx(null)
                      }}
                      className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-300 transition-colors hover:bg-slate-800 ${
                        isDragOver ? 'bg-slate-700/60' : ''
                      }`}
                    >
                      {!isProtectedCat && (
                        <span className="shrink-0 cursor-grab select-none text-slate-600">⠿</span>
                      )}

                      {isEditing ? (
                        <div className="flex flex-1 items-center gap-1">
                          <input
                            autoFocus
                            value={editSubName}
                            onChange={(e) => setEditSubName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveSub()
                              if (e.key === 'Escape') cancelEditSub()
                            }}
                            className="flex-1 rounded border border-slate-600 bg-slate-900 px-2 py-0.5 text-sm text-slate-100 outline-none"
                          />
                          <button
                            type="button"
                            onClick={saveSub}
                            className="rounded bg-teal-700 px-2 py-0.5 text-xs text-teal-200 hover:bg-teal-600"
                          >
                            ✓
                          </button>
                          <button
                            type="button"
                            onClick={cancelEditSub}
                            className="rounded px-2 py-0.5 text-xs text-slate-500 hover:text-slate-300"
                          >
                            ✗
                          </button>
                        </div>
                      ) : (
                        <>
                          <span className="flex-1">{sub.name}</span>
                          {!isProtectedCat && (
                            <div className="flex shrink-0 gap-1">
                              <button
                                type="button"
                                onClick={() => startEditSub(sub)}
                                className="text-slate-600 hover:text-slate-300"
                                aria-label="Editar subcategoría"
                              >
                                <EditIcon />
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteSub(sub)}
                                disabled={!canDelete}
                                title={!canDelete ? 'Debe haber al menos una subcategoría' : undefined}
                                className="text-slate-600 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-30"
                                aria-label="Eliminar subcategoría"
                              >
                                <TrashIcon />
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </li>
                  )
                })}
              </ul>

              {/* Nueva subcategoría */}
              {!isProtected(selectedCat.name) && (
                addingSub ? (
                  <div className="mt-2 flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800/50 p-2">
                    <input
                      autoFocus
                      value={newSubName}
                      onChange={(e) => setNewSubName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') confirmAddSub()
                        if (e.key === 'Escape') setAddingSub(false)
                      }}
                      placeholder="Nombre de subcategoría"
                      className="flex-1 rounded border border-slate-600 bg-slate-900 px-2 py-1 text-sm text-slate-100 outline-none"
                    />
                    <button
                      type="button"
                      onClick={confirmAddSub}
                      className="rounded bg-teal-700 px-2 py-0.5 text-xs text-teal-200 hover:bg-teal-600"
                    >
                      ✓
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddingSub(false)}
                      className="rounded px-2 py-0.5 text-xs text-slate-500 hover:text-slate-300"
                    >
                      ✗
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => { setAddingSub(true); setNewSubName('') }}
                    className="mt-2 w-full rounded-lg border border-dashed border-slate-700 py-1.5 text-xs text-slate-500 hover:border-slate-500 hover:text-slate-400"
                  >
                    + Nueva subcategoría
                  </button>
                )
              )}
            </>
          ) : (
            <p className="text-sm text-slate-500">Selecciona una categoría</p>
          )}
        </div>
      </div>

      {/* ── Footer: exportar / importar ── */}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={exportTree}
          className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700 hover:text-slate-100"
        >
          Exportar categorías
        </button>
        <button
          type="button"
          onClick={() => importRef.current?.click()}
          className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700 hover:text-slate-100"
        >
          Importar categorías
        </button>
        <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
      </div>
    </div>
  )
}
