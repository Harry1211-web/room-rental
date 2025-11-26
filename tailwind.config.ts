import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      keyframes: {
        "slide-in-from-bottom": {
          "0%": { transform: "translateY(100%)" },
          "100%": { transform: "translateY(0)" },
        },
        "slide-out-to-bottom": {
          "0%": { transform: "translateY(0)" },
          "100%": { transform: "translateY(100%)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "fade-out": {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" },
        },

        // Animation của bạn (không xóa)
        fadeIn: {
          "0%": { opacity: 0, transform: "translateY(10px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        "slide-in-from-right": {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
        "slide-out-to-right": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(100%)" },
        },
      },

      animation: {
        "slide-in-from-bottom": "slide-in-from-bottom 0.3s ease-out",
        "slide-out-to-bottom": "slide-out-to-bottom 0.3s ease-in",
        "slide-in-from-right": "slide-in-from-right 0.3s ease-out forwards",
        "slide-out-to-right": "slide-out-to-right 0.25s ease-in forwards",
        "fade-in": "fade-in 0.3s ease-out",
        "fade-out": "fade-out 0.3s ease-in",

        // animation cũ của bạn
        fadeIn: "fadeIn 0.5s ease forwards",
      },
    },
  },

  plugins: [
    require("tailwindcss-animate"), // ⚡ cần plugin này
  ],
};

export default config;
