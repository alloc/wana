module.exports = {
  collectCoverageFrom: ['src/**/*.ts'],
  testEnvironment: 'node',
  transform: {
    '\\.tsx?$': ['esbuild-jest'],
  },
}
