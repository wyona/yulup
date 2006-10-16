png := $(patsubst %.png,build/%.png,$(wildcard *.png))

all: $(png)

build/%.png: %.png
	@printf "\nBuilding icon $@\n"

deploy-yulup: $(png)
	cp yulup-*.png ../../chrome/skin/icons/

clean:
	-rm build/*.png

.PHONY: clean
