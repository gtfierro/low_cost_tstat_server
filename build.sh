#!/bin/bash
set -ex
go build
docker build -t gtfierro/low_cost_tstat_server .
docker push gtfierro/low_cost_tstat_server
