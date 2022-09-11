#!/usr/bin/env bash

DIR=$(dirname $(realpath "$0"))
cd $DIR
set -ex

bun run cep -- -c sdk-js.coffee
deno run -A sdk-js.js
