file := $(patsubst %.xml,%.xhtml,$(wildcard *.xml))

all: convert-dia $(file)

%.xhtml : %.xml
	@printf "\nBuild XHTML output $@\n"
	xsltproc --xinclude --stringparam current.docid "$*" -o $@ $<

convert-dia:
	-$(MAKE) -C figures

.PHONY: convert-dia
