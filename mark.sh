#!/usr/bin/env bash

SCRIPT_DIR="$( cd "$( echo "${BASH_SOURCE[0]%/*}" )"; pwd )"

node $SCRIPT_DIR/mark.js "$@"
