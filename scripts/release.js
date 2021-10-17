// @ts-check
const exec = require('@cush/exec').sync
const fs = require('fs')

// Update changelogs and bump versions
run(`pnpm changeset`)
run(`pnpm changeset version`)

const packages = ['.'].concat(
  fs
    .readdirSync('./packages')
    .filter(name => name[0] !== '.')
    .map(name => 'packages/' + name)
)

const versions = packages.map(dir => {
  const pkg = JSON.parse(fs.readFileSync(dir + '/package.json', 'utf8'))
  return pkg.name + '@' + pkg.version
})

// Commit and tag
run(`git add -A`)
run(`git commit -m "chore: release" -m "${versions.join('\n')}"`)
versions.forEach(version => run(`git tag ${version}`))

// Push and publish
run(`git push`)
run(`git push --tags`)
run(`pnpm m publish`)

function run(cmd) {
  exec(cmd, { stdio: 'inherit' })
}
