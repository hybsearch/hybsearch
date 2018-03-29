# Install Mr. Bayes
FROM docker.io/debian:stretch-slim AS mrbayes

RUN apt-get update \
    && apt-get install -qy --no-install-recommends \
       mrbayes \
    && apt-get clean autoclean \
    && rm -rfv /var/lib/{apt,dpkg,cache,log}/


# Install Clustal-Omega
FROM docker.io/debian:stretch-slim AS clustalo

RUN apt-get update \
    && apt-get install -qy --no-install-recommends \
       clustalo \
    && apt-get clean autoclean \
    && rm -rfv /var/lib/{apt,dpkg,cache,log}/


# Install seq-gen
FROM docker.io/debian:stretch-slim AS seq-gen

RUN sed -i 's|deb http://deb.debian.org/debian stretch main|deb http://http.us.debian.org/debian stretch main non-free|' /etc/apt/sources.list

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        clustalo \
        mrbayes \
        seq-gen \
        python \
        python-dev \
        python-pip \
        python-setuptools \
    && apt-get clean autoclean \
    && rm -rfv /var/lib/{apt,dpkg,cache,log}/


# Install python shit
FROM docker.io/hybsearch/docker-base:v1.2 AS python

RUN apt-get update \
    && apt-get install -qy --no-install-recommends \
       python \
       python-dev \
       python-pip \
       python-setuptools \
    && apt-get clean autoclean \
    && rm -rfv /var/lib/{apt,dpkg,cache,log}/

ADD requirements.txt /requirements.txt
RUN pip install -r requirements.txt


# Build the main app
FROM docker.io/amd64/node:8-stretch

COPY --from=seq-gen /etc/apt/sources.list /etc/apt/sources.list
COPY --from=docker.io/hybsearch/docker-base:v1.2 /etc/dpkg/dpkg.cfg.d/docker /etc/dpkg/dpkg.cfg.d/docker

ENV DOCKER=1

RUN mkdir /hybsearch

ADD ["package.json", "package-lock.json", "/hybsearch/"]
WORKDIR /hybsearch

RUN npm install

ADD . /hybsearch

CMD npm start -- 8080
