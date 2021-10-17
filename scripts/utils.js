const exec = require('@cush/exec').sync

function run(cmd, opts) {
  exec(cmd, { ...opts, stdio: 'inherit' })
}

function tagExists(tag) {
  try {
    exec(`git rev-parse ${tag}`)
    return true
  } catch {}
  return false
}

module.exports = { run, tagExists }
