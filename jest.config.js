module.exports = {
  preset: 'ts-jest',
  collectCoverageFrom: ['src/**/*.ts'],
  testEnvironment: 'jsdom',
  testPathIgnorePatterns: ['packages'],
  setupFiles: ['<rootDir>/spec/.setup.ts'],
  globals: {
    'ts-jest': {
      diagnostics: false,
      packageJson: 'package.json',
    },
  },
}
