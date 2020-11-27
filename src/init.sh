#!/usr/bin/env bash

echo "Once upon a time..."

agents=$(fc-agent list "$@")
IFS=',' read -r -a agents_list <<< "$agents"
for agent in "${agents_list[@]}"; do
  echo "fc-agent scrape -a ${agent}"
  sleep 10
done

wait

echo "The End."
