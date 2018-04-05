FROM docker.io/amd64/node:8-stretch AS hyb-node

FROM hybsearch/docker-base:v1.2 AS hyb-beast

RUN mkdir -p /usr/share/man/man1/

RUN apt-get update \
    && apt-get install -qy --no-install-recommends \
       curl \
    && apt-get clean autoclean \
    && rm -rfv /var/lib/apt/ \
               /var/lib/cache/ \
               /var/lib/log/

WORKDIR /beast
RUN curl -L 'https://github.com/CompEvol/beast2/releases/download/v2.4.8/BEAST.v2.4.8.Linux.tgz' | gunzip - | tar -x

FROM docker.io/hybsearch/docker-base:v1.2

# The lovely docker community is smart enough to put everything in
# /usr/local.  We just need to copy (the entire dir) over.
#
# NOTE This could probably get tuned up to be more dynamic...
COPY --from=hyb-node ["/usr/local/", "/usr/local/"]

COPY --from=hyb-beast ["/beast/beast/bin/beast", "/usr/local/bin/"]
COPY --from=hyb-beast ["/beast/beast/lib/beast.jar", "/usr/local/lib/"]
COPY --from=hyb-beast ["/beast/beast/lib/launcher.jar", "/usr/local/lib/"]

RUN sed -i 's|deb http://deb.debian.org/debian stretch main|deb http://http.us.debian.org/debian stretch main non-free|' /etc/apt/sources.list

# fixes issue with installing openjdk-8-jdk-headless
RUN mkdir -p /usr/share/man/man1/

RUN apt-get update \
    && apt-get install -qy --no-install-recommends \
       clustalo \
       mrbayes \
       python \
       python-dev \
       python-pip \
       python-setuptools \
       seq-gen \
       openjdk-8-jdk-headless \
    && apt-get clean autoclean \
    && rm -rfv /var/lib/apt/ \
               /var/lib/cache/ \
               /var/lib/log/

ENV DOCKER=1

RUN mkdir /hybsearch
WORKDIR /hybsearch

ADD ["requirements.txt", "./"]
RUN pip install --upgrade pip && pip install -r requirements.txt

ADD ["package.json", "package-lock.json", "./"]
RUN npm install

ADD . /hybsearch

CMD npm start -- 8080
