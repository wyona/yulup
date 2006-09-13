VERSION      := $(shell grep -e '<em:version>.*</em:version>' install.rdf | sed -e 's/^[ \t]*<em:version>\(.*\)<\/em:version>[ \t]*$$/\1/')
BASENAME     := yulup-prototype-1
FILENAME     := $(BASENAME)-$(VERSION).xpi
DOWNLOAD_DIR := ../../../../../../website/download/

pkg-deploy: pkg
	# copy package and update.rdf to download directory
	cd ../pkg/ && cp $(FILENAME) $(DOWNLOAD_DIR)
	cd ../pkg/ && mv update.rdf $(DOWNLOAD_DIR)

pkg: pkg-clean
	@printf "Package version is $(VERSION). Constructed package filename is $(FILENAME).\n"
	# copy hierarchy to pkg/tmp
	mkdir ../pkg/tmp
	cp -r ./chrome ../pkg/tmp/
	cp ./install.rdf ../pkg/tmp/
	cp ./install.js ../pkg/tmp/
	cp ./chrome.manifest ../pkg/tmp/
	# remove svn directories
	cd ../pkg/tmp/ && find . -depth -name '.svn' -exec rm -rf {} \;
	# remove /* DEBUG */ lines
	cd ../pkg/tmp/chrome/ && find . -name '*.js' -exec ../../stripdebug.sh {} \;
	# zip up the package
	cd ../pkg/tmp/ && zip -r $(FILENAME) .
	cd ../pkg/tmp/ && cp $(FILENAME) ../
	# remove tmp files
	cd ../pkg/ && rm -rf tmp
	# update update.rdf
	cd ../pkg/ && sed -e 's/@VERSION@/$(VERSION)/g' update.rdf.template | cat > update.rdf

pkg-clean:
	# clean pkg directory
	-cd ../pkg/ && rm -rf tmp
	-cd ../pkg/ && rm update.rdf

.PHONY: pkg pkg-deploy pkg-clean
