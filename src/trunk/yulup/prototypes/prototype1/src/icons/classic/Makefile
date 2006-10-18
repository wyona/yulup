png := $(patsubst %.png,build/%.png,$(wildcard *.png))

all: $(png)

build/%.png: %.png
	@printf "\nBuilding icon $@\n"

deploy-theme: $(png)
	mkdir ../../chrome/skin/icons/classic
	cp theme.classic.css ../../chrome/skin/
	cp yulup-*.png ../../chrome/skin/icons/classic/

remove-theme:
	-rm ../../chrome/skin/theme.classic.css
	-rm -r ../../chrome/skin/icons/classic

clean:
	-rm build/*.png

.PHONY: clean
