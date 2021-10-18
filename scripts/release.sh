set -e
pnpm m publish
git push --tags
git push origin next:master