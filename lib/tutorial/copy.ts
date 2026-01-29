import type { TutorialStep } from "./constants";

export type TutorialCopyBlock = {
  heading: string;
  subheading?: string;
  finalCta?: string;
  slides?: Array<{ quote: string; source: string, body?: string }>;
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
        quote: "In the time before time, the Great Spirit descended from the heavens.",
        source: "Bionicle: Mask of Light",
        body: "BIONICLE launched in 2001, saving the LEGO Group from financial ruin.", 
      },
      {
        quote: "May the heart of Metru Nui live forever, for this is the island of Mata Nui, named in honor of the Great Spirit.",
        source: "Turaga Vakama, BIONICLE 2: Legends of Metru Nui",
        body: "The story told of an island, with dense jungles, vast deserts, towering mountains and scattered villages.",
      },
      {
        quote: "Six heroes must rise to face the darkness. They are the Toa.",
        source: "LEGO.com promotional copy (2001)",
        body: "Elemental warriors called Toa washed onto the shore, sent to protect the island.<br>Their instincts drove them to seek powerful masks called Kanohi.",
      },
    ],
  },

  INTRO_MASKS_PURPOSE: {
    heading: "More than armor",
    subheading: "Kanohi: the keys to power",
    finalCta: "Continue to learn how masks work in this game",
    slides: [
      {
        quote: "Each of us will tell a tale of the Toa's search for the Kanohi Nuva. At the end of our storytelling, we will make our decision.",
        source: "Turaga Vakama, BIONICLE Chronicles #4: Tales of the Masks",
        body: "Each Kanohi is an artifact, defined by the quest required to obtain it. It holds a purpose, identity, and path through the dark.",
      },
      {
        quote: "Ah, the Mask of Time. You are a great mask-maker. You could have many destinies.",
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
        quote: "A Turaga carries wisdom, not strength.",
        source: "BIONICLE 4: Tales of the Masks",
        body: "<p style='margin-bottom: 8px;'>You may equip a mask in each of two slots: <b>Toa</b> and <b>Turaga</b>.</p>The Toa slot will grant 100% of the mask's buff. The Turaga slot will only grant half of the masks power.",
      },
      {
        quote: "Now it's time for you to make new legends. For that is the way of the Bionicle.",
        source: "Turaga Vakama, BIONICLE 3: Web of Shadows",
      },
    ],
  },
};
