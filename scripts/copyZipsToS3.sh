#!/bin/sh

# Stop immediately on error
set -e

if [[ -z "$1" ]]; then
  $(./scripts/assumeDeveloperRole.sh)
fi

# Ensure output directory exists
mkdir -p ./build/zips/

# Build zip files
for dir in ./build/src/**/
do
  # Extract the folder name
  zipName=${dir%*/} # Remove the trailing /
  zipName=${zipName##*/} # Remove everything up to the /

  zip -j ./build/zips/${zipName}.zip ${dir}*
done

# Upload zips to S3
aws s3 cp ./build/zips/* s3://joke-lambda-source/jokes-handler/
