import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}"
  ],
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
        green: {
          DEFAULT: "#1B7A45",
          light: "#22A05A"
        },
        red: { DEFAULT: "#CE1126" },
        bg: { DEFAULT: "#F4F7FB", "2": "#EBF1F9" },
        dark: { DEFAULT: "#0E1B2E", "2": "#1C2E46" },
        border: { DEFAULT: "#D6E4F2" },
        text: {
          DEFAULT: "#1A2B40",
          mid: "#4A6080",
          muted: "#8AA0B8"
        }
      },
      fontFamily: {
        serif: ["Cormorant Garamond", "serif"],
        sans: ["Plus Jakarta Sans", "sans-serif"]
      },
      borderRadius: {
        card: "20px",
        btn: "14px"
      },
      boxShadow: {
        card: "0 2px 16px rgba(26,111,196,0.09)",
        "card-lg": "0 8px 40px rgba(26,111,196,0.14)"
      },
      keyframes: {
        floatCircle: {
          "0%, 100%": { transform: "translateY(0) scale(1)" },
          "50%": { transform: "translateY(-20px) scale(1.04)" }
        },
        slideInCard: {
          from: { transform: "translateY(30px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" }
        },
        pulseAlert: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(200,146,42,0.4)", transform: "scale(1)" },
          "50%": { boxShadow: "0 0 0 8px rgba(200,146,42,0)", transform: "scale(1.01)" }
        },
        pulseDot: {
          "0%, 100%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(1.3)", opacity: "0.7" }
        }
      },
      animation: {
        floatCircle: "floatCircle 8s ease-in-out infinite",
        slideInCard: "slideInCard 0.6s cubic-bezier(0.22,1,0.36,1) both",
        pulseAlert: "pulseAlert 2s ease-in-out infinite",
        pulseDot: "pulseDot 1.2s ease-in-out infinite"
      }
    }
  },
  plugins: []
};

export default config;
