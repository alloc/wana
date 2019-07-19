module.exports = {
  preset: 'ts-jest',
  collectCoverageFrom: ['src/**/*.ts'],
  testEnvironment: 'jsdom',
  globals: {
    'ts-jest': {
      diagnostics: false,
    },
  },
}
