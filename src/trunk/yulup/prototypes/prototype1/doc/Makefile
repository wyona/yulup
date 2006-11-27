file := $(patsubst %.xml,%.xhtml,$(wildcard *.xml))

all: convert-dia $(file) deploy

%.xhtml : %.xml
	@printf "\nBuild XHTML output $@\n"
	xsltproc --xinclude --stringparam current.docid "$*" -o $@ $<

convert-dia:
	-$(MAKE) -C figures

deploy:
	cp ./*.xhtml ../../../../../../website/documentation/user-manual/

.PHONY: convert-dia deploy
