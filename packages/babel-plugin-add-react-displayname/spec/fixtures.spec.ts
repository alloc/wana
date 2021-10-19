const babel = require('@babel/core')
const fs = require('fs')
const path = require('path')
const assert = require('assert')

const fixturesDir = path.join(__dirname, 'fixtures')
const pluginPath = path.join(
  __dirname,
  '../../babel-plugin-add-react-displayname'
)

describe('add-react-displayname transform', () => {
  fs.readdirSync(fixturesDir).forEach(fixture => {
    const name = path.basename(fixture, path.extname(fixture))
    it('transforms ' + name, () => {
      const actual = transformFile(path.join(fixturesDir, fixture))
      expect(actual).toMatchSnapshot()
    })
  })
})

function readFile(filename) {
  let file = fs.readFileSync(filename, 'utf8').trim()
  file = file.replace(/\r\n/g, '\n')
  return file
}

function transformFile(filename) {
  return babel.transformFileSync(filename, {
    presets: ['@babel/react', '@babel/typescript'],
    plugins: [
      ['@babel/proposal-class-properties', { loose: true }],
      [pluginPath, { callees: ['withThing'] }],
    ],
  }).code
}
