module.exports = {
  plugins: [require('@tailwindcss/typography'), require('daisyui')],
  content: [
    './pages/**/*.{vue,js,ts}',
    './components/**/*.{vue,js,ts}',
    './layouts/**/*.{vue,js,ts}',
    './content/**/*.{vue,js,ts,json,md}',
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
      },
      screens: {
        smh: { raw: '(min-height: 500px)' },
        mdh: { raw: '(min-height: 640px)' },
        lgh: { raw: '(min-height: 8000px)' },
        xlh: { raw: '(min-height: 10240px)' },
        '2xlh': { raw: '(min-height: 1600px)' }
      }
    }
  }
}
