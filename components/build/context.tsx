"use client";

import { createContext, ReactNode, useContext, useMemo, useState } from "react";

// ---- Local types replacing Prismic types ----
export type Wheel = { uid: string; texture: string };
export type Deck = { uid: string; texture: string };
export type Metal = { uid: string; color: string };

type CustomizerControlsContext = {
  selectedWheel?: Wheel;
  setWheel: (wheel: Wheel) => void;
  selectedDeck?: Deck;
  setDeck: (deck: Deck) => void;
  selectedTruck?: Metal;
  setTruck: (trucks: Metal) => void;
  selectedBolt?: Metal;
  setBolt: (bolts: Metal) => void;
};

const defaultContext: CustomizerControlsContext = {
  setWheel: () => {},
  setDeck: () => {},
  setTruck: () => {},
  setBolt: () => {},
};

const CustomizerControlsContext = createContext(defaultContext);

type CustomizerControlsProviderProps = {
  defaultWheel?: Wheel;
  defaultDeck?: Deck;
  defaultTruck?: Metal;
  defaultBolt?: Metal;
  children?: ReactNode;
};

export function CustomizerControlsProvider({
  defaultWheel,
  defaultDeck,
  defaultTruck,
  defaultBolt,
  children,
}: CustomizerControlsProviderProps) {
  const [selectedWheel, setWheel] = useState(defaultWheel);
  const [selectedDeck, setDeck] = useState(defaultDeck);
  const [selectedTruck, setTruck] = useState(defaultTruck);
  const [selectedBolt, setBolt] = useState(defaultBolt);

  const value = useMemo(() => {
    return {
      selectedWheel,
      setWheel,
      selectedDeck,
      setDeck,
      selectedTruck,
      setTruck,
      selectedBolt,
      setBolt,
    };
  }, [selectedWheel, selectedDeck, selectedTruck, selectedBolt]);

  return (
    <CustomizerControlsContext.Provider value={value}>
      {children}
    </CustomizerControlsContext.Provider>
  );
}

export function useCustomizerControls() {
  return useContext(CustomizerControlsContext);
}
