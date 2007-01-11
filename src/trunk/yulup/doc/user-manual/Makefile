file := $(patsubst %.xml,%.xhtml,$(wildcard *.xml))

all: convert-dia $(file) deploy deploy-pkg

%.xhtml : %.xml
	@printf "\nBuild XHTML output $@\n"
	xsltproc --nonet --xinclude --stringparam html.stylesheet *.css --stringparam current.docid "$*" -o $@ $<

convert-dia:
	-$(MAKE) -C figures

deploy:
	cp ./*.xhtml ../../../../../../../website/documentation/user-manual/
	cp ./*.css ../../../../../../../website/documentation/user-manual/
	cp figures/* ../../../../../../../website/documentation/user-manual/figures/

deploy-pkg:
	cp ./*.xhtml ../../src/chrome/content/help/user-manual/
	cp ./*.css ../../src/chrome/content/help/user-manual/
	cp figures/* ../../src/chrome/content/help/user-manual/figures/

.PHONY: convert-dia deploy deploy-pkg
