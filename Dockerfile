FROM stoplight/spectral
WORKDIR /snyk/rules
COPY . /snyk/rules
ENTRYPOINT [ "spectral" ]
