set -e

if [[ `git status --porcelain` ]]; then
  echo "Please commit changes first"
  exit 1
fi

pnpm m exec pretty-quick
git add -u
git commit --amend --no-edit