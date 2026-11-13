#!/bin/sh
# PostToolUse hook: keep the search index fresh after a Markdown edit.
command -v brain >/dev/null || exit 0
cat | grep -q '"file_path": *"[^"]*\.md"' || exit 0
brain index >/dev/null 2>&1
exit 0
