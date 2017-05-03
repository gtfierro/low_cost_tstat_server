FROM ubuntu:xenial
MAINTAINER Gabe Fierro <gtfierro@eecs.berkeley.edu>

ADD low_cost_tstat_server /bin/

ENTRYPOINT [ "/bin/low_cost_tstat_server" ]
