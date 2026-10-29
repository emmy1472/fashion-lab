#!/bin/bash

cd ../../packages/react
./mkdocs.sh
cd -
node scripts/prebuild.mjs
