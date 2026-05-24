export default {
  default: {
    paths: ['features/**/*.feature'],
    import: ['features/**/*.js'],
    format: ['progress'],
    tags: 'not @pending',
    publishQuiet: true,
    parallel: 1,
  },
}
