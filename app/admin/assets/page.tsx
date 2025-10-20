'use client'

import { useEffect, useState } from 'react'
import {
  ArrowUpTrayIcon,
  LinkIcon,
  PencilSquareIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'

type Asset = { id: string; kind: 'DECK' | 'WHEEL' | 'GRIPTAPE'; uid: string; url: string }

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
 const [kind, setKind] = useState<'DECK' | 'WHEEL' | 'GRIPTAPE'>('DECK')
  const [uid, setUid] = useState('')
  const [url, setUrl] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [editing, setEditing] = useState<Asset | null>(null)
  const [loading, setLoading] = useState(false)

  async function refresh() {
    const res = await fetch('/api/assets', { cache: 'no-store' })
    const data = await res.json()
    setAssets(data.assets)
  }

  useEffect(() => {
    refresh()
  }, [])

  async function submitJson(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch('/api/assets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind, uid, url }),
    })
    if (res.ok) {
      setUid('')
      setUrl('')
      refresh()
    }
  }

  async function submitFile(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return
    const fd = new FormData()
    fd.append('kind', kind)
    fd.append('uid', uid)
    fd.append('file', file)
    const res = await fetch('/api/assets', { method: 'POST', body: fd })
    if (res.ok) {
      setUid('')
      setFile(null)
        ; (e.target as HTMLFormElement).reset()
      refresh()
    }
  }

  async function handleEdit(asset: Asset) {
    setEditing(asset)
  }

  async function handleSaveEdit() {
    if (!editing) return
    setLoading(true)
    const res = await fetch(`/api/assets/${editing.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kind: editing.kind,
        uid: editing.uid,
        url: editing.url,
      }),
    })
    setLoading(false)
    if (res.ok) {
      setEditing(null)
      refresh()
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this asset?')) return
    const res = await fetch(`/api/assets/${id}`, { method: 'DELETE' })
    if (res.ok) refresh()
  }

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

      {/* --- Upload Forms --- */}
      <section className="grid md:grid-cols-2 gap-8 mb-12">
                <form
          onSubmit={submitFile}
          className="bg-white border border-gray-200 rounded-xl p-6 space-y-4"
        >
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            <ArrowUpTrayIcon className="h-5 w-5 mr-2 text-gray-400" />
            Upload File
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1">
              <FormField label="Kind">
                <select
                  value={kind}
                  onChange={(e) => setKind(e.target.value as any)}
                  className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-black focus:border-black"
                >
                  <option>DECK</option>
                  <option>WHEEL</option>
                   <option>GRIPTAPE</option>
                </select>
              </FormField>
            </div>
            <div className="col-span-2">
              <FormField label="Unique ID (uid)">
                <input
                  value={uid}
                  onChange={(e) => setUid(e.target.value)}
                  placeholder="e.g., wheel-03"
                  className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-black focus:border-black"
                />
              </FormField>
            </div>
          </div>
          <FormField label="File">
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
            />
          </FormField>
          <button className="w-full px-5 py-3 rounded-lg bg-white text-black hover:bg-gray-200 border border-gray-200 transition-colors">
            Upload
          </button>
        </form>

        <form
          onSubmit={submitJson}
          className="bg-white border border-gray-200 rounded-xl p-6 space-y-4"
        >
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            <LinkIcon className="h-5 w-5 mr-2 text-gray-400" />
            URL
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1">
              <FormField label="Kind">
                <select
                  value={kind}
                  onChange={(e) => setKind(e.target.value as any)}
                  className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-black focus:border-black"
                >
                  <option>DECK</option>
                  <option>WHEEL</option>
                  <option>GRIPTAPE</option>
                </select>
              </FormField>
            </div>
            <div className="col-span-2">
              <FormField label="Unique ID (uid)">
                <input
                  value={uid}
                  onChange={(e) => setUid(e.target.value)}
                  placeholder="e.g., deck-01"
                  className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-black focus:border-black"
                />
              </FormField>
            </div>
          </div>
          <FormField label="Asset URL">
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://......"
              className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-black focus:border-black"
            />
          </FormField>
           <button className="w-full px-5 py-3 rounded-lg bg-white text-black hover:bg-gray-200 border border-gray-200 transition-colors">
            Save URL
          </button>
        </form>
      </section>

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
                  onClick={() => handleEdit(a)}
                  className="p-1 bg-white rounded-full shadow hover:bg-gray-100"
                >
                  <PencilSquareIcon className="h-5 w-5 text-gray-600" />
                </button>
                <button
                  onClick={() => handleDelete(a.id)}
                  className="p-1 bg-white rounded-full shadow hover:bg-gray-100"
                >
                  <TrashIcon className="h-5 w-5 text-red-500" />
                </button>
              </div>
              <div className="w-full h-40 bg-gray-100 flex items-center justify-center">
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
                <p className="font-semibold text-gray-900 mt-2 truncate">
                  {a.uid}
                </p>
                <p className="text-xs mt-1 break-all text-gray-500 truncate">
                  {a.url}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {editing && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/25">
          <div className="bg-white p-6 rounded-xl w-full max-w-md space-y-4">
            <h3 className="text-lg font-semibold">Edit Asset</h3>
            <FormField label="Unique ID (uid)">
              <input
                value={editing.uid}
                onChange={(e) =>
                  setEditing({ ...editing, uid: e.target.value })
                }
                className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-black focus:border-black"
              />
            </FormField>
            <FormField label="URL">
              <input
                value={editing.url}
                onChange={(e) =>
                  setEditing({ ...editing, url: e.target.value })
                }
                className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-black focus:border-black"
              />
            </FormField>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditing(null)}
                className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={loading}
                className="px-4 py-2 rounded-lg bg-black text-white hover:bg-gray-800 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
