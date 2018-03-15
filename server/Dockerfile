FROM docker.io/node:8-stretch

# enable non-free repos, needed for seq-gen
RUN sed -i 's|deb http://deb.debian.org/debian stretch main|deb http://http.us.debian.org/debian stretch main non-free|' /etc/apt/sources.list

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        clustalo \
        mrbayes \
        seq-gen \
        python \
        python-pip \
        python-setuptools \
    && rm -rf /var/lib/apt/lists/*

ADD . /hybsearch
WORKDIR /hybsearch

RUN pip install -r requirements.txt

RUN npm i --production

ENTRYPOINT npm run server -- 8080
