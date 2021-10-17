import { transformSync } from '@babel/core'
import fs from 'fs'
import path from 'path'
import withAutoPlugin from '../src/plugin'

const fixture = fs.readFileSync(path.resolve(__dirname, 'fixture.tsx'), 'utf8')
forEachExec(fixture, /\n\/\/ ✂︎ ([^\n]+)\n/g, match => {
  const name = match[1]
  const code =
    `import { withAuto } from 'wana'\n` +
    fixture.slice(
      match.index + match[0].length,
      fixture.indexOf('\n// ✂︎', match.index + 1)
    )

  test(name, () => {
    const result = transformSync(code, {
      plugins: [
        // '@babel/plugin-syntax-jsx',
        ['@babel/plugin-syntax-typescript', { isTSX: true }],
        withAutoPlugin,
      ],
    })
    expect(result.code).toMatchSnapshot()
  })
})

function forEachExec(
  str: string,
  re: RegExp,
  each: (m: RegExpExecArray) => void,
  m?: RegExpExecArray | null
) {
  while ((m = re.exec(str))) each(m)
}
