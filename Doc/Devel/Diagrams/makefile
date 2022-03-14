# Check for executables dependency
EXECUTABLES = docker
K := $(foreach exec,$(EXECUTABLES),\
        $(if $(shell which $(exec)),some string,$(error "No $(exec) in PATH")))

PLANTUML=docker run --rm -v ${shell pwd}:/work -w /work -t miy4/plantuml

.SUFFIXES: .puml .svg

TARGETS= \
  client-imuv_server-websocket-handshake-trough-proxy.svg

all: $(TARGETS) 

.puml.svg:
	$(PLANTUML) -Tsvg $*.puml -output ./

clean:
	rm -f $(TARGETS) 
