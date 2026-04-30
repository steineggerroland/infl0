export default {
  default: {
    paths: ['features/**/*.feature'],
    import: ['features/**/*.js'],
    format: ['progress'],
    publishQuiet: true,
    parallel: 1,
  },
}
