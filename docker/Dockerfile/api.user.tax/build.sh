#!/usr/bin/env bash

DIR=$(dirname $(realpath "$0"))
cd $DIR
set -ex

img=usertax/api
tag=$(date +%Y-%m-%d)
docker build -t $img:$tag -t $img:latest  .
