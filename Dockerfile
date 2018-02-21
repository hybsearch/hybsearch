FROM buildpack-deps:stretch-curl

# enable non-free repos, needed for seq-gen
RUN sed -i 's|deb http://deb.debian.org/debian stretch main|deb http://http.us.debian.org/debian stretch main non-free|' /etc/apt/sources.list

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        clustalo \
        mrbayes \
        seq-gen \
        python \
    && rm -rf /var/lib/apt/lists/*

# START node:8 DOCKERFILE
# gpg keys listed at https://github.com/nodejs/node#release-team
RUN set -ex \
  && for key in \
    94AE36675C464D64BAFA68DD7434390BDBE9B9C5 \
    FD3A5288F042B6850C66B31F09FE44734EB7990E \
    71DCFD284A79C3B38668286BC97EC7A07EDE3FC1 \
    DD8F2338BAE7501E3DD5AC78C273792F7D83545D \
    C4F0DFFF4E8C1A8236409D08E73BC641CC11F4C8 \
    B9AE9905FFD7803F25714661B63B535A4C206CA9 \
    56730D5401028683275BD23C23EFEFE93C4CFFFE \
    77984A986EBC2AA786BC0F66B01FBB92821C587A \
  ; do \
    gpg --keyserver pgp.mit.edu --recv-keys "$key" || \
    gpg --keyserver keyserver.pgp.com --recv-keys "$key" || \
    gpg --keyserver ha.pool.sks-keyservers.net --recv-keys "$key" ; \
  done

ENV NODE_VERSION 8.9.0

RUN ARCH='x64' && dpkgArch="$(dpkg --print-architecture)" \
  && file="node-v$NODE_VERSION-linux-$ARCH.tar.gz" \
  && curl -SLO "https://nodejs.org/dist/v$NODE_VERSION/$file" \
  && curl -SLO --compressed "https://nodejs.org/dist/v$NODE_VERSION/SHASUMS256.txt.asc" \
  && gpg --batch --decrypt --output SHASUMS256.txt SHASUMS256.txt.asc \
  && grep " $file\$" SHASUMS256.txt | sha256sum -c - \
  && tar -xzf "$file" -C /usr/local --strip-components=1 \
  && rm "$file" SHASUMS256.txt.asc SHASUMS256.txt \
  && ln -s /usr/local/bin/node /usr/local/bin/nodejs \
  && npm uninstall -g npm \
  && rm -rf /root/.npm
# END node:8 DOCKERFILE

ADD . /hybsearch
WORKDIR /hybsearch
