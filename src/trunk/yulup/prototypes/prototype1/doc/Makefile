file := $(patsubst %.xml,%.xhtml,$(wildcard *.xml))

all: convert-dia $(file) deploy

%.xhtml : %.xml
	@printf "\nBuild XHTML output $@\n"
	xsltproc --xinclude --stringparam html.stylesheet *.css --stringparam current.docid "$*" -o $@ $<

convert-dia:
	-$(MAKE) -C figures

deploy:
	cp ./*.xhtml ../../../../../../website/documentation/user-manual/
	cp ./*.css ../../../../../../website/documentation/user-manual/

.PHONY: convert-dia deploy
