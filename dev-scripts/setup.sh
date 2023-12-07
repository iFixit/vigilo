#!/bin/bash

set -ex

root_dir=$(git rev-parse --show-toplevel)

config_templates_dir="$root_dir/config-templates"
config_dir="$root_dir/src/config"

cp $config_templates_dir/.env.template $root_dir/.env

cp $config_templates_dir/lh-config.template.js $config_dir/lh-config.js
cp $config_templates_dir/urls.template.json $config_dir/urls.json

pnpm install