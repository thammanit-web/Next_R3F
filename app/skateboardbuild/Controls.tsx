
'use client'
import { useCustomizerControls, Deck, Wheel, Griptape } from './context'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from "next/navigation";


export default function Controls() {
  const { selectedDeck, selectedWheel, selectedTruck, selectedGriptape, selectedBolt, setDeck, setWheel, setGriptape, setTruck, setBolt } = useCustomizerControls()
  const [decks, setDecks] = useState<Deck[]>([])
  const [wheels, setWheels] = useState<Wheel[]>([])
  const [griptapes, setGriptapes] = useState<Griptape[]>([])

  
  const router = useRouter();
  const searchParams = useSearchParams();
  
  useEffect(() => {
    fetch('/api/assets').then(r => r.json()).then(data => {
      const assets = data.assets as any[]
      const d = assets.filter(a => a.kind === 'DECK').map(a => ({ uid: a.uid, texture: a.url }))
      const w = assets.filter(a => a.kind === 'WHEEL').map(a => ({ uid: a.uid, texture: a.url }))
      const g = assets.filter(a => a.kind === 'GRIPTAPE').map(a => ({ uid: a.uid, texture: a.url }))
      setDecks(d)
      setWheels(w)
      setGriptapes(g)
      if (!selectedDeck && d[0]) setDeck(d[0])
      if (!selectedWheel && w[0]) setWheel(w[0])
      if (!selectedGriptape && g[0]) setGriptape(g[0])
    })
  }, [])

   useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());

    if (selectedDeck?.uid) params.set("deck", selectedDeck.uid);
    if (selectedWheel?.uid) params.set("wheel", selectedWheel.uid);
    if (selectedGriptape?.uid) params.set("griptape", selectedGriptape.uid);
    if (selectedTruck?.color) params.set("truck", selectedTruck.color);
    if (selectedBolt?.color) params.set("bolt", selectedBolt.color);

    const newUrl = `?${params.toString()}`;
    router.replace(newUrl, { scroll: false });
  }, [
    selectedDeck?.uid,
    selectedWheel?.uid,
    selectedGriptape?.uid,
    selectedTruck?.color,
    selectedBolt?.color,
  ]);

  return (
    <div className="space-y-6">
      <section>
        <h3 className="text-sm font-medium text-gray-700 mb-3 uppercase tracking-wide">Griptape</h3>
        <div className="grid grid-cols-4 gap-2">
          {griptapes.map(g => (
            <button
              key={g.uid}
              onClick={() => setGriptape(g)}
              className={`group relative overflow-hidden rounded-lg border-2 transition-all duration-200 grid justify-center ${selectedGriptape?.uid === g.uid
                ? 'border-blue-600 bg-blue-50 shadow-md'
                : 'border-gray-200 bg-white hover:border-gray-400 hover:shadow-sm'
                }`}
            >
              <div className="w-20 h-20 overflow-hidden rounded-full relative">
                <div
                  className="absolute w-60 h-60 bg-gray-300"
                  style={{
                    backgroundImage: `url(${g.texture})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                />
              </div>
              {selectedGriptape?.uid === g.uid && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
              <p className='border border-gray-200 rounded-2xl mt-2'>{g.uid}</p>
            </button>
          ))}
        </div>
      </section>
      <section>
        <h3 className="text-sm font-medium text-gray-700 mb-3 uppercase tracking-wide">Deck Design</h3>
        <div className="grid grid-cols-4 gap-2">
          {decks.map(d => (
            <button
              key={d.uid}
              onClick={() => setDeck(d)}
              className={`group relative overflow-hidden rounded-lg border-2 transition-all duration-200 grid justify-center ${selectedDeck?.uid === d.uid
                ? 'border-blue-600 bg-blue-50 shadow-md'
                : 'border-gray-200 bg-white hover:border-gray-400 hover:shadow-sm'
                }`}
            >
              <div className="w-20 h-20 overflow-hidden rounded-full relative">
                <div
                  className="absolute w-60 h-60 bg-gray-300"
                  style={{
                    backgroundImage: `url(${d.texture})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    transform: ''
                  }}
                />
              </div>
              {selectedDeck?.uid === d.uid && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
              <p className='border border-gray-200 rounded-2xl mt-2'>{d.uid}</p>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-sm font-medium text-gray-700 mb-3 uppercase tracking-wide">Wheel Style</h3>
        <div className="grid grid-cols-4 gap-2">
          {wheels.map(w => (
            <button
              key={w.uid}
              onClick={() => setWheel(w)}
              className={`group relative overflow-hidden rounded-lg border-2 transition-all duration-200 flex justify-center ${selectedWheel?.uid === w.uid
                ? 'border-blue-600 bg-blue-50 shadow-md'
                : 'border-gray-200 bg-white hover:border-gray-400 hover:shadow-sm'
                }`}
            >
              <div className="w-17 h-17 overflow-hidden rounded-full relative">
                <div
                  className="absolute w-20 h-20 bg-gray-300"
                  style={{
                    backgroundImage: `url(${w.texture})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    transform: ''
                  }}
                />
              </div>

              {selectedWheel?.uid === w.uid && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-sm font-medium text-gray-700 mb-3 uppercase tracking-wide">Truck Color</h3>
        <div className="flex items-center gap-3 bg-white rounded-lg border-2 border-gray-200 p-4 hover:border-gray-300 transition-colors">
          <input
            type="color"
            value={selectedTruck?.color ?? '#6F6E6A'}
            onChange={e => setTruck({ color: e.target.value })}
            className="w-12 h-12 rounded-lg border-2 border-gray-200 cursor-pointer"
          />
          <div className="flex-1">
            <div className="text-sm font-medium text-gray-900">{selectedTruck?.color ?? '#6F6E6A'}</div>
            <div className="text-xs text-gray-500">Click to customize</div>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-sm font-medium text-gray-700 mb-3 uppercase tracking-wide">Bolt Color</h3>
        <div className="flex items-center gap-3 bg-white rounded-lg border-2 border-gray-200 p-4 hover:border-gray-300 transition-colors">
          <input
            type="color"
            value={selectedBolt?.color ?? '#6F6E6A'}
            onChange={e => setBolt({ color: e.target.value })}
            className="w-12 h-12 rounded-lg border-2 border-gray-200 cursor-pointer"
          />
          <div className="flex-1">
            <div className="text-sm font-medium text-gray-900">{selectedBolt?.color ?? '#6F6E6A'}</div>
            <div className="text-xs text-gray-500">Click to customize</div>
          </div>
        </div>
      </section>
    </div>
  )
}

