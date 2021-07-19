#!/usr/bin/env bash

env-cmd -f .env.secrets \
  fc-agent "$@"
