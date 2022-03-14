# Check for executables dependency
EXECUTABLES = docker
K := $(foreach exec,$(EXECUTABLES),\
        $(if $(shell which $(exec)),some string,$(error "No $(exec) in PATH")))

# The plantuml docker image miy4/plantuml offers a january 2021 version of plantuml that
# is too old to support multi-line participant definition. We thus use the more recent
# following image
PLANTUML=docker run --rm -v ${shell pwd}:/work -w /work -t dstockhammer/plantuml 

.SUFFIXES: .puml .svg

TARGETS= \
  client-imuv_server-client_download-trough-proxy.svg     \
  client-imuv_server-websocket-handshake-trough-proxy.svg

all: $(TARGETS) 

.puml.svg:
	$(PLANTUML) -Tsvg $*.puml

clean:
	rm -f $(TARGETS) 
