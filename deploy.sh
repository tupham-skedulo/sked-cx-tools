#!/bin/bash

DELAY=1
while true; do
  clear
  cat << EOF
* Choose deploy mode:
1. Deploy from git to org
2. Deploy from org to org
0. Quit
EOF

  read -p "Enter selection [0-2] > "
  case "$REPLY" in
  0)
    break
    ;;
  1)
    ./scripts/deploy-git-to-org.sh
    ;;
  2)
    ./scripts/deploy-org-to-org.sh
    ;;
  *)
    echo "Invalid entry."
    ;;
  esac
  sleep "$DELAY"
done
echo "See you later!"
