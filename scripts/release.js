// @ts-check
const fs = require('fs')
const { run, tagExists } = require('./utils')

// Update changelogs and bump versions
run(`pnpm changeset`)
run(`pnpm changeset version`)

const packages = ['.'].concat(
  fs
    .readdirSync('./packages')
    .filter(name => name[0] !== '.')
    .map(name => 'packages/' + name)
)

// Collect new tags
const names = []
const tags = []
for (const dir of packages) {
  const pkg = JSON.parse(fs.readFileSync(dir + '/package.json', 'utf8'))
  const tag = pkg.name + '@' + pkg.version
  if (!tagExists(tag)) {
    names.push(pkg.name)
    tags.push(tag)
  }
}

if (tags.length == 0) {
  process.exit()
}

// Build packages
run(`pnpm build --parallel ${names.map(name => `--filter=` + name).join(` `)}`)

const message =
  tags.length > 1 ? `"chore: release" -m "${tags.join('\n')}"` : `"${tags[0]}"`

// Commit and tag
run(`git add -A`)
run(`git commit -m ${message}`)
tags.forEach(tag => run(`git tag ${tag}`))

// Push and publish
run(`git push`)
run(`git push --tags`)
run(`pnpm m publish`)
