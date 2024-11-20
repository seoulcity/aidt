/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        'scrollbar': 'rgba(156, 163, 175, 0.5)'
      }
    }
  },
  plugins: []
};