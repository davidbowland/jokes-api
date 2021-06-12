if [[ -z "$1" ]]; then
  ./scripts/assumeDeveloperRole.sh
fi

# Ensure output directory exists
mkdir -p ./build/zips/

for dir in ./build/src/functions/**/
do
  # Extract the folder name
  zipName=${dir%*/} # Remove the trailing /
  zipName=${zipName##*/} # Remove everything up to the /

  zip -j ./build/zips/${zipName}.zip ${dir}*
done

aws s3 cp ./build/zips/* s3://dbowland-lambda-source/