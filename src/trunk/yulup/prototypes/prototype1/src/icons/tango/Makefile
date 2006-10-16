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

deploy-yulup: $(png)
	cp build/yulup-*.png ../../chrome/skin/icons/

clean:
	-rm build/*.png

.PHONY: clean
