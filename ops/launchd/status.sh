#!/bin/bash
UID_NOW=$(id -u)
for label in com.brain.daily com.brain.pull com.brain.serve com.brain.tunnel; do
  if launchctl print "gui/$UID_NOW/$label" >/dev/null 2>&1; then
    printf '%-18s loaded\n' "$label"
  else
    printf '%-18s not loaded\n' "$label"
  fi
done
echo
printf 'serve: '
curl -s --max-time 3 127.0.0.1:8787/api/health || printf 'no answer'
echo
