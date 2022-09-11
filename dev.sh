#!/usr/bin/env bash
set -e
DIR=$( dirname $(realpath "$0") )

cd $DIR

if [ ! -n "$1" ] ;then
exe=index
else
exe=${@:1}
fi


exec watchexec --shell=none \
  -w ./src \
  --exts coffee,js,mjs,json,wasm,txt,yaml \
  -r \
  -- sh -c "./build.sh && exec deno run --unstable -A lib/$exe.js"
