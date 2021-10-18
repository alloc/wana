pnpm standard-version                           \
  --path ./                                     \
  --releaseCommitMessageFormat '{{currentTag}}' \
  --tag-prefix $PNPM_PACKAGE_NAME@              \
  --scripts.postbump 'pnpm build'