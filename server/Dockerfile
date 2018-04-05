FROM docker.io/amd64/node:8-stretch AS hyb-node

FROM docker.io/hybsearch/docker-base:v1.2

# The lovely docker community is smart enough to put everything in
# /usr/local.  We just need to copy (the entire dir) over.
#
# NOTE This could probably get tuned up to be more dynamic...
COPY --from=hyb-node ["/usr/local/", "/usr/local/"]

RUN sed -i 's|deb http://deb.debian.org/debian stretch main|deb http://http.us.debian.org/debian stretch main non-free|' /etc/apt/sources.list

RUN apt-get update \
    && apt-get install -qy --no-install-recommends \
       clustalo \
       mrbayes \
       python \
       python-dev \
       python-pip \
       python-setuptools \
       seq-gen \
    && apt-get clean autoclean \
    && rm -rfv /var/lib/{apt,dpkg,cache,log}/

ENV DOCKER=1

RUN mkdir /hybsearch
WORKDIR /hybsearch

ADD ["requirements.txt", "./"]
RUN pip install --upgrade pip && pip install -r requirements.txt

ADD ["package.json", "package-lock.json", "./"]
RUN npm install

ADD . /hybsearch

CMD npm start -- 8080
