FROM docker.io/node:9-stretch

# enable non-free repos, needed for seq-gen
RUN sed -i 's|deb http://deb.debian.org/debian stretch main|deb http://http.us.debian.org/debian stretch main non-free|' /etc/apt/sources.list

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        clustalo \
        mrbayes \
        seq-gen \
        python \
    && rm -rf /var/lib/apt/lists/*

ADD . /hybsearch
WORKDIR /hybsearch

ENTRYPOINT ./scripts/server.js 8080
