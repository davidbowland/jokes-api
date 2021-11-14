#!/usr/bin/env bash

# Stop immediately on error
set -e

if [[ -z "$1" ]]; then
  $(./scripts/assumeDeveloperRole.sh)
fi

# Remember the base directory
BASE_DIR=$PWD
# Ensure output directory exists
mkdir -p ./build/zips/

# Build zip files
for dir in ./build/src/**/
do
  # Extract the folder name
  zipName=${dir%*/} # Remove the trailing /
  zipName=${zipName##*/} # Remove everything up to the /

  # Copy node_modules into each directory
  cp -R node_modules $dir

  # Zip the directory contents
  cd $dir
  zip -r $BASE_DIR/build/zips/${zipName}.zip .
done

# Upload zips to S3
aws s3 cp $BASE_DIR/build/zips/* s3://jokes-lambda-source/jokes-handler/
