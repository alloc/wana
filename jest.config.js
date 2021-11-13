module.exports = {
  collectCoverageFrom: ['src/**/*.ts'],
  testEnvironment: 'jsdom',
  testPathIgnorePatterns: ['packages'],
  setupFiles: ['<rootDir>/spec/.setup.ts'],
  transform: {
    '\\.tsx?$': ['esbuild-jest'],
  },
}
