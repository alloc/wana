module.exports = {
  preset: 'ts-jest',
  collectCoverageFrom: ['src/**/*.ts'],
  testEnvironment: 'jsdom',
  setupFiles: ['<rootDir>/spec/.setup.ts'],
  globals: {
    'ts-jest': {
      diagnostics: false,
    },
  },
}
