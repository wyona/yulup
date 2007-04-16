png := $(patsubst %.png,build/%.png,$(wildcard *.png))
dir := ../../chrome/skin/icons/themes/Tango
css := theme.tango.css

all: $(png)

build/%.png: %.png
	@printf "\nBuilding icon $@\n"
	convert $< $@.1.png
	convert $< -modulate 50 $@.2.png
	composite -blend 0x50 null: $< -matte $@.3.png
	convert $@.1.png $@.2.png $@.3.png -append $@
	rm $@.1.png $@.2.png $@.3.png

deploy-theme: remove-theme $(png)
	@printf "\nDeplyoing theme in $(dir)\n"
	mkdir $(dir)
	cp $(css) ../../chrome/skin/
	cp build/yulup-*.png $(dir)

remove-theme:
	@printf "\nRemoving theme from $(dir)\n"
	-rm ../../chrome/skin/$(css)
	-rm -r $(dir)

clean:
	-rm build/*.png

.PHONY: all deploy-theme remove-theme clean
