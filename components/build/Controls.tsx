"use client";

import clsx from "clsx";
import { ReactNode, useEffect } from "react";
import { useCustomizerControls, Deck, Wheel, Metal } from "./context";
import { useRouter } from "next/navigation";

type Props = {
  wheels: Wheel[];
  decks: Deck[];
  metals: Metal[];
  className?: string;
};

export default function Controls({ wheels, decks, metals, className }: Props) {
  const router = useRouter();

  const {
    setBolt,
    setDeck,
    setTruck,
    setWheel,
    selectedBolt,
    selectedDeck,
    selectedTruck,
    selectedWheel,
  } = useCustomizerControls();

  useEffect(() => {
    const url = new URL(window.location.href);

    if (selectedWheel?.uid) url.searchParams.set("wheel", selectedWheel.uid);
    if (selectedDeck?.uid) url.searchParams.set("deck", selectedDeck.uid);
    if (selectedTruck?.uid) url.searchParams.set("truck", selectedTruck.uid);
    if (selectedBolt?.uid) url.searchParams.set("bolt", selectedBolt.uid);

    router.replace(url.href);
  }, [router, selectedWheel, selectedDeck, selectedTruck, selectedBolt]);

  return (
    <div className={clsx("flex flex-col gap-6", className)}>
      <Options title="Deck" selectedName={selectedDeck?.uid}>
        {decks.map((deck) => (
          <Option
            key={deck.uid}
            imageSrc={deck.texture}
            selected={deck.uid === selectedDeck?.uid}
            onClick={() => setDeck(deck)}
          >
            {deck.uid?.replace(/-/g, " ")}
          </Option>
        ))}
      </Options>
      <Options title="Wheels" selectedName={selectedWheel?.uid}>
        {wheels.map((wheel) => (
          <Option
            key={wheel.uid}
            imageSrc={wheel.texture}
            selected={wheel.uid === selectedWheel?.uid}
            onClick={() => setWheel(wheel)}
          >
            {wheel.uid?.replace(/-/g, " ")}
          </Option>
        ))}
      </Options>
      <Options title="Trucks" selectedName={selectedTruck?.uid}>
        {metals.map((metal) => (
          <Option
            key={metal.uid}
            color={metal.color}
            selected={metal.uid === selectedTruck?.uid}
            onClick={() => setTruck(metal)}
          >
            {metal.uid?.replace(/-/g, " ")}
          </Option>
        ))}
      </Options>
      <Options title="Bolts" selectedName={selectedBolt?.uid}>
        {metals.map((metal) => (
          <Option
            key={metal.uid}
            color={metal.color}
            selected={metal.uid === selectedBolt?.uid}
            onClick={() => setBolt(metal)}
          >
            {metal.uid?.replace(/-/g, " ")}
          </Option>
        ))}
      </Options>
    </div>
  );
}

type OptionsProps = {
  title?: ReactNode;
  selectedName?: string;
  children?: ReactNode;
};

function Options({ title, selectedName, children }: OptionsProps) {
  const formattedName = selectedName?.replace(/-/g, " ");

  return (
    <div>
      <div className="flex">
        <p className="ml-3 text-zinc-300">
          <span className="select-none text-zinc-500">| </span>
          {formattedName}
        </p>
      </div>
      <ul className="mb-1 flex flex-wrap gap-2">{children}</ul>
    </div>
  );
}

type OptionProps = {
  selected: boolean;
  children: ReactNode;
  onClick: () => void;
  imageSrc?: string;
  color?: string;
};

function Option({
  children,
  selected,
  imageSrc,
  color,
  onClick,
}: OptionProps) {
  return (
    <li>
      <button
        className={clsx(
          "size-10 cursor-pointer rounded-full bg-black p-0.5 outline-2 outline-white",
          selected && "outline"
        )}
        onClick={onClick}
      >
        {imageSrc ? (
          // Use a plain img; Next/Image optional if configured
          <img
            src={imageSrc}
            className="pointer-events-none h-full w-full rounded-full object-cover"
            alt={String(children)}
          />
        ) : (
          <div
            className="h-full w-full rounded-full"
            style={{ backgroundColor: color ?? undefined }}
          />
        )}

        <span className="sr-only">{children}</span>
      </button>
    </li>
  );
}
