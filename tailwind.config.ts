import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      keyframes: {
        "chest-shake": {
          "0%, 100%": { transform: "translateX(0) rotate(0deg)" },
          "10%": { transform: "translateX(-2px) rotate(-1deg)" },
          "20%": { transform: "translateX(3px) rotate(1deg)" },
          "30%": { transform: "translateX(-4px) rotate(-1.5deg)" },
          "40%": { transform: "translateX(4px) rotate(1.5deg)" },
          "50%": { transform: "translateX(-3px) rotate(-1deg)" },
          "60%": { transform: "translateX(3px) rotate(1deg)" },
          "70%": { transform: "translateX(-2px) rotate(-0.5deg)" },
          "80%": { transform: "translateX(2px) rotate(0.5deg)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "chest-shake": "chest-shake 650ms ease-in-out 2",
      },
      fontFamily: {
        "voya-nui": ["var(--font-voya-nui)"],
      },
    },
  },
  plugins: [],
};

export default config;
