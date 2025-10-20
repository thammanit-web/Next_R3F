
import Link from "next/link";
import React from "react";

import { CustomizerControlsProvider, Wheel, Deck, Metal } from "./context";
import Preview from "./Preview";
import Controls from "./Controls";
import Loading from "./Loading";

type SearchParams = {
  wheel?: string;
  deck?: string;
  truck?: string;
  bolt?: string;
};

// ---- Local data replacing Prismic content ----
const wheels: Wheel[] = [
  { uid: "wheel-1", texture: "/skateboard/SkateWheel1.png" },
  { uid: "wheel-2", texture: "/skateboard/SkateWheel2.png" },
  { uid: "wheel-3", texture: "/skateboard/SkateWheel3.png" },
];

const decks: Deck[] = [
  { uid: "deck-1", texture: "/skateboard/Deck.webp" },
  { uid: "deck-2", texture: "/skateboard/Deck2.webp" },
];

const metals: Metal[] = [
  { uid: "metal-silver", color: "#6F6E6A" },
  { uid: "metal-black", color: "#222222" },
  { uid: "metal-white", color: "#F5F5F5" },
];

export default function Page(props: { searchParams?: SearchParams }) {
  const searchParams = props.searchParams ?? {};

  const defaultWheel =
    wheels.find((wheel) => wheel.uid === searchParams.wheel) ?? wheels[0];
  const defaultDeck =
    decks.find((deck) => deck.uid === searchParams.deck) ?? decks[0];
  const defaultTruck =
    metals.find((metal) => metal.uid === searchParams.truck) ?? metals[0];
  const defaultBolt =
    metals.find((metal) => metal.uid === searchParams.bolt) ?? metals[0];

  const wheelTextureURLs = wheels.map((w) => w.texture);
  const deckTextureURLs = decks.map((d) => d.texture);

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <CustomizerControlsProvider
        defaultWheel={defaultWheel}
        defaultDeck={defaultDeck}
        defaultTruck={defaultTruck}
        defaultBolt={defaultBolt}
      >
        <div className="relative aspect-square shrink-0 bg-[#3a414a] lg:aspect-auto lg:grow">
          <div className="absolute inset-0">
            <Preview
              deckTextureURLs={deckTextureURLs}
              wheelTextureURLs={wheelTextureURLs}
            />
          </div>

          <Link href="/" className="absolute left-6 top-6">
            test
          </Link>
        </div>
        <div className="grow bg-texture bg-zinc-900 text-white ~p-4/6 lg:w-96 lg:shrink-0 lg:grow-0">
          <h1 className="mb-6 mt-0">
            Build your board
          </h1>
          <Controls wheels={wheels} decks={decks} metals={metals} className="mb-6" />
          <a href="">
            Add to cart
          </a>
        </div>
      </CustomizerControlsProvider>
      <Loading />
    </div>
  );
}
