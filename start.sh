#!/usr/bin/bash
NUM_INSTANCES=1
for i in $(seq 1 $NUM_INSTANCES)
do
	start node src/main.js $i &
done