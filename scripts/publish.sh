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

# Fail the release during verifyConditions (before any tag/commit is pushed)
# if the npm token cannot actually publish this package. The @semantic-release/npm
# plugin only runs `npm whoami`, which passes for a valid-but-unauthorised token and
# lets the run proceed to a doomed publish step that leaves a half-released state.
verify_npm() {
  local registry="https://registry.npmjs.org/"

  if [ -z "${NPM_TOKEN:-}" ]; then
    echo "NPM_TOKEN is unset - cannot verify npm publish rights"
    exit 1
  fi

  local pkg
  pkg="$(node -p "require('./package.json').name")"

  # Isolated npmrc so the check does not depend on plugin/setup ordering
  local rc
  rc="$(mktemp)"
  printf '//registry.npmjs.org/:_authToken=%s\n' "$NPM_TOKEN" > "$rc"

  local who
  if ! who="$(npm whoami --userconfig "$rc" --registry "$registry" 2>/dev/null)"; then
    rm -f "$rc"
    echo "npm token is invalid or expired (whoami failed) - aborting release"
    exit 1
  fi
  echo "npm authenticated as: $who"

  local collaborators
  if ! collaborators="$(npm access list collaborators "$pkg" --userconfig "$rc" --registry "$registry" --json 2>/dev/null)"; then
    rm -f "$rc"
    echo "could not read collaborators for '$pkg' with the configured npm token - aborting release"
    exit 1
  fi
  rm -f "$rc"

  # Flat JSON map of { "<user>": "<read|write|read-write>" }. The write permission is
  # reported as "write" (registry / npm 10) or "read-write" (npm 11+); both grant publish,
  # while read-only "read" must be rejected. (npm usernames are restricted to [a-z0-9_-],
  # so interpolating $who into the pattern is safe.) Note: this confirms the token's
  # identity (whoami) is a write collaborator; it does not detect a 2FA/OTP requirement.
  if ! printf '%s' "$collaborators" | tr -d ' \n' | grep -Eq "\"${who}\":\"(read-)?write\""; then
    echo "npm user '$who' lacks write access on '$pkg' - aborting release"
    echo "collaborators: $collaborators"
    exit 1
  fi
  echo "npm publish rights OK: $who can publish $pkg"
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

  # Abort early if the npm token cannot publish this package
  verify_npm

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