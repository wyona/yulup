png := $(patsubst %.png,build/%.png,$(wildcard *.png))

all: $(png)

build/%.png: %.png
	@printf "\nBuilding icon $@\n"

deploy-yulup: $(png)
	mkdir ../../chrome/skin/icons/classic
	cp toolbox.css ../../chrome/skin/icons/classic/
	cp yulup-*.png ../../chrome/skin/icons/classic/

clean:
	-rm build/*.png

.PHONY: clean
