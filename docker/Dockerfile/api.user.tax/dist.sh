#!/usr/bin/env bash

DIR=$(dirname $(realpath "$0"))
cd $DIR
set -ex

docker pull denoland/deno:bin
docker pull alpine:latest
docker pull gcr.io/distroless/cc:nonroot

. ./build.sh
docker push -a $img
