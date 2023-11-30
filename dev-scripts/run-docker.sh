#!/bin/bash

root_dir=$(git rev-parse --show-toplevel)
config_dir="$root_dir/src/config"

# Run the docker image
docker run --rm \
    -v "$config_dir/lh-config.js":/app/dist/lh-config.js \
    -v "$config_dir/urls.json":/app/dist/urls.json \
    --env-file "$root_dir/.env" \
    vigilo
