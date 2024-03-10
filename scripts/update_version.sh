#!/bin/bash

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

NEW_VERSION="$1"

jq --arg new_version "$NEW_VERSION" '.version = $new_version' "$SCRIPT_DIR/../package.json" > temp.json && mv temp.json "$SCRIPT_DIR/../package.json"

jq --arg new_version "$NEW_VERSION" '.version = $new_version' "$SCRIPT_DIR/../client/package.json" > temp.json && mv temp.json "$SCRIPT_DIR/../client/package.json"

jq --arg new_version "$NEW_VERSION" '.version = $new_version' "$SCRIPT_DIR/../server/package.json" > temp.json && mv temp.json "$SCRIPT_DIR/../server/package.json"

cd ..

npm install

echo "Version updated to $NEW_VERSION in package.json, client/package.json, and server/package.json"
