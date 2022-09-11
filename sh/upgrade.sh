#!/usr/bin/env bash

DIR=$(dirname $(realpath "$0"))
cd $DIR/../src
set -ex

if ! [ -x "$(command -v udd)" ]; then
deno install -A -f -n udd https://deno.land/x/udd/main.ts
fi

udd mod.coffee

