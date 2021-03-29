module.exports = {
  collectCoverageFrom: ['src/**/*.ts'],
  testEnvironment: 'jsdom',
  testPathIgnorePatterns: ['packages'],
  setupFiles: ['<rootDir>/spec/.setup.ts'],
  moduleNameMapper: {
    '^wana$': '<rootDir>/src/index.ts',
  },
  transform: {
    '\\.tsx?$': ['esbuild-jest'],
  },
}
