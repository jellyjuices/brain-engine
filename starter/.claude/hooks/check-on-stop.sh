#!/bin/sh
command -v brain >/dev/null || exit 0
input=$(cat)
echo "$input" | grep -q '"stop_hook_active": *true' && exit 0
out=$(brain check 2>&1) && exit 0
echo "brain check failed. Fix these, then finish:" >&2
echo "$out" >&2
exit 2
