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

echo -n "* Enter access token (default: assets/credentials.txt) > "
read -r token

sleep "$DELAY"

case $component in
1)
  echo -n "* Enter json file name (Webhooks) (default: assets/webhooks.json) > "
  read -r file
  ;;
2)
  echo -n "* Enter json file name (Trigger Actions) (default: assets/trigger-actions.json) > "
  read -r file
  ;;
3)
  echo -n "* Enter json file name (Custom Fields) (default: assets/custom-fields.json) > "
  read -r file

  node "./handlers/custom-fields.js" "$token" "$file"
  ;;
4)
  echo -n "* Enter json file name (VPF Forms) (default: assets/vpf-forms.json) > "
  read -r file
  ;;
*)
  echo "Invalid entry."
  ;;
esac