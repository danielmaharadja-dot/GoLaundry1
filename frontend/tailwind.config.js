/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        teal: {
          950: "#0A3D3D",
          900: "#0F6E6E",
          700: "#178080",
          500: "#2FA6A0",
          100: "#EAF6F4",
        },
        ink: "#16303A",
        coral: {
          600: "#E85A3B",
          500: "#FF6B4A",
          100: "#FFE7DE",
        },
        amber: {
          500: "#F5A623",
          100: "#FDF1DC",
        },
      },
      fontFamily: {
        display: ["Sora", "system-ui", "sans-serif"],
        body: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};
