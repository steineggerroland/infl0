module.exports = {
  content: [
    './pages/**/*.{vue,js,ts}',
    './components/**/*.{vue,js,ts}',
    './layouts/**/*.{vue,js,ts}',
    './content/**/*.{vue,js,ts,json}',
    './app.vue'
  ],
  theme: {
    extend: {
      aspectRatio: {
        smartphone: '9 / 16'
      },
      opacity: {
        '69': '.69'
      },
      colors: {
        front: 'var(--color-front)',
        back: 'var(--color-back)'
      }
    }
  },
  plugins: []
}
