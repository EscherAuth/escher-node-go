.PHONY: clean build start

SRCDIR:=escher-impl
BUILDDIR:=build

PLATFORM_NAME := $(shell uname)
ifeq ($(PLATFORM_NAME),Darwin)
	OUTPUT_FILE := escher.dylib
else
	OUTPUT_FILE := escher.so
endif

clean:
	rm -rf $(BUILDDIR)

build: clean
	cd $(SRCDIR) && $ go build -buildmode=c-shared -o ../$(BUILDDIR)/$(OUTPUT_FILE) .

$(BUILDDIR)/$(OUTPUT_FILE):
	cd $(SRCDIR) && $ go build -buildmode=c-shared -o ../$(BUILDDIR)/$(OUTPUT_FILE) .

start: $(BUILDDIR)/$(OUTPUT_FILE)
	node app.js
