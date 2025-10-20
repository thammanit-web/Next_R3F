"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { InteractiveSkateboard } from "./SkateScene";
import { DeckScene } from "./DeckScene";

gsap.registerPlugin(useGSAP);

export default function SkateHome() {
  const titleRef = useRef<HTMLHeadingElement>(null);

  return (
    <div className="w-full max-w-5xl grid gap-4">

      <InteractiveSkateboard
        deckTextureURL="/skateboard/Deck.webp"
        wheelTextureURL="/skateboard/NDC INDUSTRIAL.png"
        truckColor="#FF2700"
        boltColor="#FF2700"
      />
      <p className="text-sm text-gray-500">
      </p>
    </div>
  );
}
