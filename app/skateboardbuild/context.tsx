'use client'
import React, { createContext, useContext, useMemo, useState } from 'react'

export type ColorPick = { color: string }
export type Deck = { uid: string; texture: string }
export type Wheel = { uid: string; texture: string }
export type Griptape = { uid: string; texture: string }

// ✅ เพิ่ม type ที่ page.tsx ใช้
export type Truck = ColorPick
export type Bolt = ColorPick

export type ControlsState = {
  selectedDeck?: Deck
  selectedWheel?: Wheel
  selectedGriptape?: Griptape
  selectedTruck?: ColorPick
  selectedBolt?: ColorPick

  setDeck: (d: Deck) => void
  setWheel: (w: Wheel) => void
  setGriptape: (g: Griptape) => void
  setTruck: (c: ColorPick) => void
  setBolt: (c: ColorPick) => void
}

const Ctx = createContext<ControlsState | null>(null)

// ✅ ปรับ Provider ให้รองรับ default props
export function CustomizerControlsProvider({
  children,
  defaultDeck,
  defaultWheel,
  defaultGriptape,
  defaultTruck,
  defaultBolt,
}: {
  children: React.ReactNode
  defaultDeck?: Deck
  defaultWheel?: Wheel
  defaultGriptape?: Griptape
  defaultTruck?: Truck
  defaultBolt?: Bolt
}) {
  // ตั้งค่าเริ่มต้นจาก props (มี fallback สี)
  const [selectedDeck, setDeck] = useState<Deck | undefined>(defaultDeck)
  const [selectedWheel, setWheel] = useState<Wheel | undefined>(defaultWheel)
  const [selectedGriptape, setGriptape] = useState<Griptape | undefined>(defaultGriptape)
  const [selectedTruck, setTruck] = useState<ColorPick | undefined>(
    defaultTruck ?? { color: '#6F6E6A' }
  )
  const [selectedBolt, setBolt] = useState<ColorPick | undefined>(
    defaultBolt ?? { color: '#6F6E6A' }
  )

  const value = useMemo(
    () => ({
      selectedDeck,
      selectedWheel,
      selectedGriptape,
      selectedTruck,
      selectedBolt,
      setDeck,
      setWheel,
      setGriptape,
      setTruck,
      setBolt,
    }),
    [selectedDeck, selectedWheel, selectedGriptape, selectedTruck, selectedBolt]
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useCustomizerControls = () => {
  const v = useContext(Ctx)
  if (!v) throw new Error('useCustomizerControls must be used within provider')
  return v
}
