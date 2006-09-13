file := $(patsubst %.xml,%.xhtml,$(wildcard *.xml))
file += $(patsubst %.xml,%.db,$(wildcard *.xml))

olinkdb = ../../../utils/customization/olinkdb.xml

all: convert-dia $(file)

%.xhtml : %.xml
	@printf "\nBuild XHTML output $@\n"
	xsltproc --xinclude --stringparam current.docid "$*" --stringparam target.database.document "$(olinkdb)" -o $@ $<

%.db : %.xml
	@printf "\nBuild olink database $@\n"
	xsltproc --stringparam collect.xref.targets "only" --stringparam olink.base.uri "$*.xhtml" --stringparam targets.filename "$*.db" $<

convert-dia:
	-$(MAKE) -C figures

.PHONY: convert-dia
