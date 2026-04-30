/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        blue: {
          DEFAULT: "#1A6FC4",
          mid: "#2582DB",
          light: "#4FA3F0",
          pale: "#EAF4FF"
        },
        gold: {
          DEFAULT: "#C8922A",
          light: "#E8B84B",
          pale: "#FEF8EC"
        },
        green: { DEFAULT: "#1B7A45", light: "#22A05A" },
        red: { DEFAULT: "#CE1126" },
        bg: { DEFAULT: "#F4F7FB", "2": "#EBF1F9" },
        dark: { DEFAULT: "#0E1B2E", "2": "#1C2E46" },
        border: { DEFAULT: "#D6E4F2" },
        text: { DEFAULT: "#1A2B40", mid: "#4A6080", muted: "#8AA0B8" }
      }
    }
  },
  plugins: []
};
