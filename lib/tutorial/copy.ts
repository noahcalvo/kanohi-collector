import type { TutorialStep } from "./constants";

export type TutorialCopyBlock = {
  heading: string;
  subheading?: string;
  finalCta?: string;
  slides?: Array<{
    quote: string;
    source: string;
    body?: string;
    imagesrc?: string;
    imageDescription?: string;
  }>;
};

export const TUTORIAL_COPY: Record<
  Extract<
    TutorialStep,
    "INTRO_BIONICLE" | "INTRO_MASKS_PURPOSE" | "INTRO_GAME_USAGE"
  >,
  TutorialCopyBlock
> = {
  INTRO_BIONICLE: {
    heading: "Welcome to Mata Nui",
    subheading: "BIONICLE: origins, in brief",
    finalCta: "Click to learn about the powers of the Kanohi",
    slides: [
      {
        quote:
          "In the time before time, the Great Spirit descended from the heavens.",
        source: "Bionicle: Mask of Light",
        body: "BIONICLE launched in 2001, saving the LEGO Group from financial ruin.",
      },
      {
        quote:
          "May the heart of Metru Nui live forever, for this is the island of Mata Nui, named in honor of the Great Spirit.",
        source: "Turaga Vakama, BIONICLE 2: Legends of Metru Nui",
        body: "The story told of an island paradise.",
      },
      {
        quote: "I am Wenua, Turaga of this village. Welcome, Toa Onua.",
        source: "Turaga Wenua, BIONICLE Chronicles #1: Tale of the Toa",
        body: "Elemental warriors called Toa washed onto the shore, sent to protect the island from evil.<br>Turaga, the elders of the island clans knew destiny of their arrival.",
      },
    ],
  },

  INTRO_MASKS_PURPOSE: {
    heading: "More than armor",
    subheading: "Kanohi: the keys to power",
    finalCta: "Continue to learn how masks work in this game",
    slides: [
      {
        quote:
          "Each of us will tell a tale of the Toa's search for the Kanohi Nuva.",
        source: "Turaga Vakama, BIONICLE Chronicles #4: Tales of the Masks",
        body: "Masks known as Kanohi are artifacts, defined by the quests required to obtain them. In Kanohi Collector, your goal is just that: collect kanohi",
        imagesrc: "masks/1.png",
        imageDescription:
          "<h2>Kanohi Hau</h2><p>The Great Mask of Shielding, when equipped allows for larger storage of unopened mask packs</p>",
      },
      {
        quote: "A Turaga carries wisdom, not strength.",
        source: "BIONICLE 4: Tales of the Masks",
        body: "<p style='margin-bottom: 8px;'>You have two slots to equip masks from your collection</p><div syle='display:flex'><div><b>Toa</b><p>Grants 100% of the mask's buff</p></div><div><b>Turaga</b><p>Grants only half of the masks original buff</p></div>",
      },

      {
        quote:
          "Ah, the Mask of Time. You are a great mask-maker. You could have many destinies.",
        source: "Makuta, BIONICLE 2: Legends of Metru Nui",
        body: "Some masks were crafted by matoran, while others were found hidden on the island.<br>The Great Masks were said to be gifts from the Great Spirit himself.",
      },
      {
        quote: "Each set sold separately.",
        source: "Bionicle ad (early 2000s)",
        body: "The six Toa each sought a Great Mask aligned to their elemental power: Fire, Water, Air, Earth, Stone, and Ice.<br>Each of them was capable of wielding any mask, adopting the powers they granted.",
      },
    ],
  },

  INTRO_GAME_USAGE: {
    heading: "How masks work here",
    subheading: "Clear rules. Real strategy.",
    finalCta: "Start your journey into Mata Nui",
    slides: [
      {
        quote: "A Toa’s power comes from their Kanohi.",
        source: "LEGO promotional lore text",
        body: "In this game, masks are equipped to shape your pack-opening power. <br>Masks can reduce pack cooldowns, improve rarity odds, and unlock inspection.<br>They can also increase chances of new colors, and even boost your friends’ openings.",
      },
      {
        quote:
          "Now it's time for you to make new legends. For that is the way of the Bionicle.",
        source: "Turaga Vakama, BIONICLE 3: Web of Shadows",
      },
    ],
  },
};
