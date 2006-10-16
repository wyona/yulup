png := $(patsubst %.png,build/%.png,$(wildcard *.png))

all: $(png)

build/%.png: %.png
	@printf "\nBuilding icon $@\n"
	convert $< $@.1.png
	convert $< -modulate  50 $@.2.png
	composite -blend 0x50 null: $< -matte $@.3.png
	convert $@.1.png $@.2.png $@.3.png -append $@
	rm $@.1.png $@.2.png $@.3.png

deploy-yulup: $(png)
	cp build/yulup-*.png ../../chrome/skin/icons/

clean:
	-rm build/*.png

.PHONY: clean
