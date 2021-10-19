pnpm standard-version                                              \
  --path ./src                                                     \
  --releaseCommitMessageFormat "$PNPM_PACKAGE_NAME@{{currentTag}}" \
  --tag-prefix $PNPM_PACKAGE_NAME@                                 \
  --scripts.postbump 'pnpm build'