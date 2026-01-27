import type { TutorialStep } from "./constants";

export type TutorialCopyBlock = {
  heading: string;
  subheading?: string;
  finalCta?: string;
  quotes?: Array<{ text: string; source: string }>;
  body: string[];
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
    quotes: [
      {
        text: "In the time before time, the Great Spirit descended from the heavens.",
        source: "Bionicle: Mask of Light",
      },
      {
        text: "Six heroes must rise to face the darkness.",
        source: "Bionicle: Mask of Light",
      },
      {
        text: "They are the Toa.",
        source: "LEGO.com promotional copy (2001)",
      },
    ],
    body: [
      "BIONICLE launched in 2001, saving the LEGO Group from financial ruin.",
      "It told of elemental warriors called Toa, sent to protect an island called Mata Nui.",
      "On this island, masks became artifacts of purpose. They were worn by heroes, and coveted by their enemies.",
      "Collect these masks, and you will begin to feel the power they hold.",
    ],
  },

  INTRO_MASKS_PURPOSE: {
    heading: "Masks are more than armor.",
    subheading: "Kanohi: the keys to power",
    quotes: [
      {
        text: "The Kanohi masks are the keys to our power.",
        source: "Bionicle Adventures #1: Mystery of Metru Nui",
      },
      {
        text: "Each mask grants a different ability.",
        source: "LEGO.com Kanohi mask guide (early 2000s)",
      },
      {
        text: "Without our masks, we are weakened.",
        source: "Bionicle: Legends of Metru Nui",
      },
    ],
    body: [
      "Each Kanohi is an artifact with a purpose, an identity, a path through the dark.",
      "The six Toa carried six Great Masks—each aligned to an archetype of heroism.",
      "And when the mask is worn, the wearer becomes what the mask demands.",
    ],
  },

  INTRO_GAME_USAGE: {
    heading: "How masks work here",
    subheading: "Clear rules. Real strategy.",
    quotes: [
      {
        text: "A Toa’s power comes from their Kanohi.",
        source: "LEGO promotional lore text",
      },
      {
        text: "A Turaga carries wisdom, not strength.",
        source: "Bionicle Adventures #4: Tale of the Toa",
      },
    ],
    body: [
      "In this game, masks are equipped to shape your pack-opening power.",
      "<p style='margin-bottom: 8px;'>You may equip a mask in each of two slots: <b>Toa</b> and <b>Turaga</b>.</p>The Toa slot will grant 100% of the mask's buff. The Turaga slot will only grant half of the masks power.",
      "Masks can reduce pack cooldowns, improve rarity odds, and unlock inspection.",
      "They can also increase chances of new colors, and even boost your friends’ openings.",
      "The goal is simple: collect, optimize, and flex.",
    ],
  },
};
