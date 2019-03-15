FROM docker.io/amd64/node:8-stretch AS hyb-node

RUN curl -sS http://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add -
RUN echo "deb http://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list
RUN apt-get update \
    && apt-get install -qy --no-install-recommends yarn jq \
    && apt-get clean autoclean \
    && rm -rfv /var/lib/apt/ \
               /var/lib/cache/ \
               /var/lib/log/

WORKDIR /app

ADD ["package.json", "yarn.lock", "./"]

# yarn --production _should_ ignore devDependencies, but it doesn't, so we'll just remove them instead
RUN jq -r '.devDependencies|keys|.[]' < ./package.json | xargs yarn remove
RUN yarn --production --frozen-lockfile

ADD ["./server/ui", "./server/ui"]
RUN yarn build

# shrink the _final_ image so we can just copy node_modules across
RUN yarn remove parcel-bundler

FROM docker.io/hybsearch/jml:stretch AS hyb-jml

FROM hybsearch/docker-base:v1.4 AS hyb-beast

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

FROM docker.io/hybsearch/docker-base:v1.4

# The lovely docker community is smart enough to put everything in
# /usr/local.  We just need to copy (the entire dir) over.
#
# NOTE This could probably get tuned up to be more dynamic...
COPY --from=hyb-node ["/usr/local/", "/usr/local/"]
COPY --from=hyb-node ["/opt/", "/opt/"]

COPY --from=hyb-beast ["/beast/beast/bin/beast", "/usr/local/bin/"]
COPY --from=hyb-beast ["/beast/beast/lib/beast.jar", "/usr/local/lib/"]
COPY --from=hyb-beast ["/beast/beast/lib/launcher.jar", "/usr/local/lib/"]

COPY --from=hyb-jml ["/usr/local/bin/jml", "/usr/local/bin/"]

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
RUN mkdir /hybsearch/data
WORKDIR /hybsearch

ADD ["requirements.txt", "./"]
RUN pip install --no-cache-dir -r requirements.txt

COPY --from=hyb-node ["/app/", "./"]

ADD ["./server", "./server"]

CMD npm run server -- 8080
