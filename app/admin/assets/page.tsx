'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowUpTrayIcon,
  LinkIcon,
  PencilSquareIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'

type Kind = 'DECK' | 'WHEEL' | 'GRIPTAPE'
type Asset = { id: string; kind: Kind; uid: string; url: string }

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  )
}

export default function AdminAssets() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // แยก state ของแต่ละฟอร์ม ลดการชนกัน
  const [jsonKind, setJsonKind] = useState<Kind>('DECK')
  const [jsonUid, setJsonUid] = useState('')
  const [jsonUrl, setJsonUrl] = useState('')

  const [fileKind, setFileKind] = useState<Kind>('DECK')
  const [fileUid, setFileUid] = useState('')
  const [fileObj, setFileObj] = useState<File | null>(null)

  const [editing, setEditing] = useState<Asset | null>(null)
  const [editFile, setEditFile] = useState<File | null>(null)
  const [savingEdit, setSavingEdit] = useState(false)

  const abortRef = useRef<AbortController | null>(null)

  async function refresh() {
    setError(null)
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    try {
      const res = await fetch('/api/assets', { cache: 'no-store', signal: controller.signal })
      if (!res.ok) throw new Error(`Fetch failed: ${res.status}`)
      const data = await res.json()
      if (!Array.isArray(data.assets)) throw new Error('Malformed response: assets[]')
      setAssets(data.assets)
    } catch (e: any) {
      if (e.name === 'AbortError') return
      setError(e?.message ?? 'Failed to load assets')
    }
  }

  useEffect(() => {
    refresh()
    return () => abortRef.current?.abort()
  }, [])

  // ===== JSON (URL) submit =====
  async function submitJson(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    if (!jsonUid.trim() || !jsonUrl.trim()) {
      setError('กรอก UID และ URL ให้ครบ')
      return
    }
    setBusy(true)
    try {
      const res = await fetch('/api/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: jsonKind, uid: jsonUid.trim(), url: jsonUrl.trim() }),
      })
      if (!res.ok) throw new Error(`Save URL failed: ${res.status}`)
      setJsonUid('')
      setJsonUrl('')
      await refresh()
    } catch (e: any) {
      setError(e?.message ?? 'Save URL failed')
    } finally {
      setBusy(false)
    }
  }

  // ===== File upload submit =====
  async function submitFile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    if (!fileUid.trim() || !fileObj) {
      setError('กรอก UID และแนบไฟล์ให้ครบ')
      return
    }
    setBusy(true)
    try {
      const fd = new FormData()
      fd.append('kind', fileKind)
      fd.append('uid', fileUid.trim())
      fd.append('file', fileObj)
      const res = await fetch('/api/assets', { method: 'POST', body: fd })
      if (!res.ok) throw new Error(`Upload failed: ${res.status}`)
      setFileUid('')
      setFileObj(null)
      ;(e.target as HTMLFormElement).reset()
      await refresh()
    } catch (e: any) {
      setError(e?.message ?? 'Upload failed')
    } finally {
      setBusy(false)
    }
  }

async function handleSaveEdit() {
  if (!editing) return
  if (!editing.uid.trim()) {
    setError('UID ต้องไม่ว่าง')
    return
  }
  setSavingEdit(true)
  setError(null)
  try {
    const fd = new FormData()
    fd.append('kind', editing.kind)
    fd.append('uid', editing.uid.trim())
    // ถ้า backend ของคุณรองรับ 'url' ผ่าน formData ด้วย ก็ส่งไปได้ (ไม่กระทบ)
    if (editing.url?.trim()) fd.append('url', editing.url.trim())
    if (editFile) fd.append('file', editFile)

    const res = await fetch(`/api/assets/${editing.id}`, {
      method: 'PUT',
      body: fd, // สำคัญ! อย่าตั้ง headers 'Content-Type' เอง
    })
    if (!res.ok) throw new Error(`Update failed: ${res.status}`)
    setEditing(null)
    setEditFile(null)
    await refresh()
  } catch (e: any) {
    setError(e?.message ?? 'Update failed')
  } finally {
    setSavingEdit(false)
  }
}


  async function handleDelete(id: string) {
    if (!confirm('ต้องการลบ asset นี้หรือไม่?')) return
    setError(null)
    try {
      const res = await fetch(`/api/assets/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(`Delete failed: ${res.status}`)
      await refresh()
    } catch (e: any) {
      setError(e?.message ?? 'Delete failed')
    }
  }

  const isBusy = busy || savingEdit

  return (
    <main className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto bg-white rounded-2xl shadow-sm">
      <nav className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Asset Management</h1>
        <a
          href="/admin"
          className="text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors px-4 py-2 rounded-lg"
        >
          Back to Admin
        </a>
      </nav>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 text-red-800 px-4 py-3">
          {error}
        </div>
      )}

      {/* --- Upload Forms --- */}
      <section className="grid md:grid-cols-2 gap-8 mb-12">
        {/* File upload */}
        <form onSubmit={submitFile} className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            <ArrowUpTrayIcon className="h-5 w-5 mr-2 text-gray-400" />
            Upload File
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1">
              <FormField label="Kind">
                <select
                  value={fileKind}
                  onChange={(e) => setFileKind(e.target.value as Kind)}
                  className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-black focus:border-black"
                >
                  <option value="DECK">DECK</option>
                  <option value="WHEEL">WHEEL</option>
                  <option value="GRIPTAPE">GRIPTAPE</option>
                </select>
              </FormField>
            </div>
            <div className="col-span-2">
              <FormField label="Unique ID (uid)">
                <input
                  type="text"
                  value={fileUid}
                  onChange={(e) => setFileUid(e.target.value)}
                  placeholder="e.g., wheel-03"
                  className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-black focus:border-black"
                />
              </FormField>
            </div>
          </div>
          <FormField label="File">
            <input
              type="file"
              onChange={(e) => setFileObj(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
            />
          </FormField>
          <button
            type="submit"
            disabled={isBusy}
            className="w-full px-5 py-3 rounded-lg bg-white text-black hover:bg-gray-200 border border-gray-200 transition-colors disabled:opacity-50"
          >
            {busy ? 'Uploading…' : 'Upload'}
          </button>
        </form>

        {/* URL save */}
        <form onSubmit={submitJson} className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            <LinkIcon className="h-5 w-5 mr-2 text-gray-400" />
            URL
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1">
              <FormField label="Kind">
                <select
                  value={jsonKind}
                  onChange={(e) => setJsonKind(e.target.value as Kind)}
                  className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-black focus:border-black"
                >
                  <option value="DECK">DECK</option>
                  <option value="WHEEL">WHEEL</option>
                  <option value="GRIPTAPE">GRIPTAPE</option>
                </select>
              </FormField>
            </div>
            <div className="col-span-2">
              <FormField label="Unique ID (uid)">
                <input
                  type="text"
                  value={jsonUid}
                  onChange={(e) => setJsonUid(e.target.value)}
                  placeholder="e.g., deck-01"
                  className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-black focus:border-black"
                />
              </FormField>
            </div>
          </div>
          <FormField label="Asset URL">
            <input
              type="url"
              value={jsonUrl}
              onChange={(e) => setJsonUrl(e.target.value)}
              placeholder="https://......"
              className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-black focus:border-black"
            />
          </FormField>
          <button
            type="submit"
            disabled={isBusy}
            className="w-full px-5 py-3 rounded-lg bg-white text-black hover:bg-gray-200 border border-gray-200 transition-colors disabled:opacity-50"
          >
            {busy ? 'Saving…' : 'Save URL'}
          </button>
        </form>
      </section>

      {/* List */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">All Assets</h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {assets.map((a) => (
            <div
              key={a.id}
              className="border border-gray-200 rounded-xl overflow-hidden group relative"
            >
              <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => setEditing(a)}
                  className="p-1 bg-white rounded-full shadow hover:bg-gray-100"
                >
                  <PencilSquareIcon className="h-5 w-5 text-gray-600" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(a.id)}
                  className="p-1 bg-white rounded-full shadow hover:bg-gray-100"
                  aria-label={`Delete ${a.uid}`}
                  title="Delete"
                >
                  <TrashIcon className="h-5 w-5 text-red-500" />
                </button>
              </div>
              <div className="w-full h-40 bg-gray-100 flex items-center justify-center">
                {/* ใช้ <img> เพื่อความง่าย ถ้าจะใช้ next/image ต้องกำหนด domain ใน next.config */}
                <img
                  src={a.url}
                  alt={a.uid}
                  className="max-w-full max-h-full object-contain p-2"
                />
              </div>
              <div className="p-4 bg-white">
                <span className="inline-block bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                  {a.kind}
                </span>
                <p className="font-semibold text-gray-900 mt-2 truncate">{a.uid}</p>
                <p className="text-xs mt-1 break-all text-gray-500 truncate">{a.url}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/25">
          <div className="bg-white p-6 rounded-xl w-full max-w-md space-y-4">
            <h3 className="text-lg font-semibold">Edit Asset</h3>

            <FormField label="Kind">
              <select
                value={editing.kind}
                onChange={(e) => setEditing({ ...editing, kind: e.target.value as Kind })}
                className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-black focus:border-black"
              >
                <option value="DECK">DECK</option>
                <option value="WHEEL">WHEEL</option>
                <option value="GRIPTAPE">GRIPTAPE</option>
              </select>
            </FormField>

            <FormField label="Unique ID (uid)">
              <input
                type="text"
                value={editing.uid}
                onChange={(e) => setEditing({ ...editing, uid: e.target.value })}
                className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-black focus:border-black"
              />
            </FormField>
            <FormField label="URL">
              <input
                type="url"
                value={editing.url}
                onChange={(e) => setEditing({ ...editing, url: e.target.value })}
                className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-black focus:border-black"
              />
            </FormField>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={savingEdit}
                className="px-4 py-2 rounded-lg bg-black text-white hover:bg-gray-800 disabled:opacity-50"
              >
                {savingEdit ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
