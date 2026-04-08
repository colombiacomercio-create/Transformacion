/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        bogota: {
          primary: '#e4002b', // Rojo Bogotá
          secondary: '#ffd100', // Amarillo Bogotá
          dark: '#1a1a1a',
        }
      }
    },
  },
  plugins: [],
}
