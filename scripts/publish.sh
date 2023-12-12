#!/bin/bash

set -e
set -o pipefail

# Redirect stderr to stdout for all commands in this script
exec 2>&1

# Read command line flags
while [[ $# -gt 0 ]]; do
    key="$1"
    case $key in
        --action)
        ACTION="$2"
        shift # past argument
        shift # past value
        ;;
        --version)
        VERSION="$2"
        shift # past argument
        shift # past value
        ;;
        --channel)
        CHANNEL="$2"
        shift # past argument
        shift # past value
        ;;
        --assets)
        ASSETS="$2"
        shift # past argument
        shift # past value
        ;;
        --project)
        PROJECT="$2"
        shift # past argument
        shift # past value
        ;;
        --base-path)
        BASE_PATH="$2"
        shift # past argument
        shift # past value
        ;;
        *)    # Unknown option
        echo "Unknown option: $1"
        exit 1
        ;;
    esac
done

# Functions for different actions
publish() {
  echo "Publishing artefacts to $BASE_PATH $PROJECT $VERSION $CHANNEL $ASSETS"

  # Target directory
  target_dir=".s3"

  # Ensure target directory exists
  mkdir -p "$target_dir"

  # Split variable by comma and iterate
  IFS=',' read -ra ADDR <<< "$ASSETS"
  for path in "${ADDR[@]}"; do
    # Check if the path exists before copying
    if [[ -e $path ]]; then
      cp -r "$path"/* "$target_dir/"
    else
      echo "Warning: Path $path does not exist!"
    fi
  done

  aws s3 sync $target_dir $BASE_PATH/$PROJECT/$CHANNEL/ --profile s3-publish --delete --metadata "surrogate-key=$PROJECT-$CHANNEL,version=$VERSION" --cache-control "max-age=0"
  aws s3 sync $target_dir $BASE_PATH/$PROJECT/$VERSION/ --profile s3-publish --metadata "surrogate-key=$PROJECT,version=$VERSION" --cache-control "public, max-age=31536000"

  curl --fail-with-body -X POST -H "Fastly-Key: $FASTLY_KEY" "https://api.fastly.com/service/$FASTLY_SERVICE/purge/$PROJECT-$CHANNEL"
}

verify() {
  variables=("FASTLY_KEY" "FASTLY_SERVICE" "AWS_CONFIG_FILE" "BASE_PATH" "PROJECT")

  for var_name in "${variables[@]}"; do
    # Using indirect reference to check the value of the variable by its name
    if [ -z "${!var_name+x}" ]; then
      echo "$var_name is unset"
      exit 1
    fi
  done

  if ! command -v aws &> /dev/null; then
    echo "Error: aws CLI is not installed."
    exit 1
  fi

  echo "validate" | aws s3 cp - "$BASE_PATH/$PROJECT/.validate" --profile s3-publish --metadata "surrogate-key=test" --cache-control "max-age=0"
  aws s3 rm "$BASE_PATH/$PROJECT/.validate" --profile s3-publish

  curl --fail-with-body -X POST -H "Fastly-Key: $FASTLY_KEY" "https://api.fastly.com/service/$FASTLY_SERVICE/purge/test"
}

# Call the function based on action value
case $ACTION in
    "publish")
    publish
    ;;
    "verify")
    verify
    ;;
    # ... Add more cases as needed ...
    *)
    echo "Unknown action: $ACTION"
    exit 1
    ;;
esac

exit 0

# bash scripts/publish.sh --action publish --version 1.0 --channel beta --assets some_asset --basePath /path/to/base