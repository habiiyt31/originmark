import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        mono: ["var(--font-mono)"],
      },
      colors: {
        ink: {
          DEFAULT: "#0D0D0D",
          50: "#F5F4F0", 100: "#E8E6DF", 200: "#C9C5B8",
          300: "#A8A294", 400: "#6E6860", 500: "#3D3830",
          600: "#252118", 700: "#1A1710", 800: "#100E08", 900: "#0D0D0D",
        },
        amber: { DEFAULT: "#C8912A", light: "#E8B84B", pale: "#F5E4B8" },
        sage:  { DEFAULT: "#4A5E52", light: "#6B8074", pale: "#C8D5CE" },
        cream: "#F7F3EC",
        rust:  "#9B3A2A",
      },
      animation: {
        "fade-up": "fadeUp 0.6s ease forwards",
        "fade-in": "fadeIn 0.4s ease forwards",
      },
      keyframes: {
        fadeUp: { from: { opacity: "0", transform: "translateY(20px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        fadeIn: { from: { opacity: "0" }, to: { opacity: "1" } },
      },
    },
  },
  plugins: [],
};
export default config;
