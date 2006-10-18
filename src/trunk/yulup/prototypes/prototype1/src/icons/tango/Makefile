png := $(patsubst %.png,build/%.png,$(wildcard *.png))

all: $(png)

build/%.png: %.png
	@printf "\nBuilding icon $@\n"
	convert $< -resize 24x24 $@.1.png
	convert $< -resize 24x24 -modulate  50 $@.2.png
	convert $< -resize 24x24 -modulate 140 $@.3.png
	composite -blend 0x50 null: $@.3.png -matte $@.3.png
	convert $@.1.png $@.2.png $@.3.png -append $@
	rm $@.1.png $@.2.png $@.3.png

deploy-theme: $(png)
	mkdir ../../chrome/skin/icons/themes/Tango
	cp theme.tango.css ../../chrome/skin/
	cp build/yulup-*.png ../../chrome/skin/icons/themes/Tango/

remove-theme:
	-rm ../../chrome/skin/theme.tango.css
	-rm -r ../../chrome/skin/icons/themes/Tango

clean:
	-rm build/*.png

.PHONY: clean
