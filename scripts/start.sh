#!/usr/bin/env bash

NODE_ENV=development \
  env-cmd -f .env.secrets \
    fc-agent "$@"
