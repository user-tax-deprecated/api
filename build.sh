#!/usr/bin/env bash

DIR=$(dirname $(realpath "$0"))
cd $DIR
set -ex

rm -rf lib
bun run cep -- -c src -o lib
mkdir -p docker/api
deno bundle lib/index.js > docker/api/index.js

if ! [ -x "$(command -v rome)" ]; then
yarn global add rome@next
if [ -n "$(command -v asdf)" ]; then
asdf reshim
fi
fi

rome format --write docker/api/
#sh/sdk.sh &
