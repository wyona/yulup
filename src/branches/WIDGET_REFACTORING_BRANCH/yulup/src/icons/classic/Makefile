png := $(patsubst %.png,build/%.png,$(wildcard *.png))
dir := ../../chrome/skin/icons/themes/Classic
css := theme.classic.css

all: $(png)

build/%.png: %.png
	@printf "\nBuilding icon $@\n"

deploy-theme: remove-theme $(png)
	@printf "\nDeplyoing theme in $(dir)\n"
	mkdir $(dir)
	cp $(css) ../../chrome/skin/
	cp yulup-*.png $(dir)

remove-theme:
	@printf "\nRemoving theme from $(dir)\n"
	-rm ../../chrome/skin/$(css)
	-rm -r $(dir)

clean:
	-rm build/*.png

.PHONY: all deploy-theme remove-theme clean
