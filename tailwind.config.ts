import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          ice: "#F6F9FC",
          blue: "#EEF5FB",
          steel: "#E7EEF5",
          card: "#FFFFFF",
        },
        blue: {
          DEFAULT: "#1479D1",
          strong: "#075FAE",
          dark: "#123A5A",
          soft: "#DCEEFF",
        },
        green: {
          DEFAULT: "#21B66F",
          dark: "#168552",
          soft: "#E3F7ED",
        },
        amber: "#F2B84B",
        red: "#E55D5D",
        purple: "#8067D8",
        text: {
          primary: "#193247",
          secondary: "#64788A",
        },
        border: {
          DEFAULT: "#DDE8F1",
        },
      },
      fontFamily: {
        heading: ["Sora", "Manrope", "system-ui", "sans-serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
      },
      boxShadow: {
        card: "0 2px 10px 0 rgba(18, 58, 90, 0.06)",
        cardHover: "0 6px 20px 0 rgba(18, 58, 90, 0.10)",
      },
    },
  },
  plugins: [],
};

export default config;
