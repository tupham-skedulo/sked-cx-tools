#!/bin/bash

DELAY=1

clear
cat <<EOF
* Choose components to deploy:
1. Webhooks
2. Trigger actions
3. Custom fields
4. VFP forms
5. All components
EOF

echo -n "Enter selection [0-5] > "
read -r component
case $component in
1)
  echo "Webhooks"
  ;;
2)
  echo "Trigger actions"
  ;;
3)
  echo "Custom fields"
  ;;
4)
  echo "VFP forms"
  ;;
5)
  echo "All components"
  ;;
*)
  echo "Invalid entry."
  ;;
esac

sleep "$DELAY"

echo -n "* Input access token (default: deploy/credentials.json) > "
read -r token
