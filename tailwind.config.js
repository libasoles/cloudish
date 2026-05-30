/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        aws: {
          compute: "#ED7100",
          storage: "#7AA116",
          database: "#C925D1",
          networking: "#8C4FFF",
          security: "#DD344C",
          analytics: "#1A4480",
          "ml-ai": "#01A88D",
          "developer-tools": "#687078",
          management: "#546E7A",
          messaging: "#E7157B",
        },
      },
    },
  },
  plugins: [],
}
