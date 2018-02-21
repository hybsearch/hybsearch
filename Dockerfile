FROM docker.io/node:9-stretch

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        clustalo \
        mrbayes \
        python \
    && rm -rf /var/lib/apt/lists/*

ADD . /hybsearch
WORKDIR /hybsearch
