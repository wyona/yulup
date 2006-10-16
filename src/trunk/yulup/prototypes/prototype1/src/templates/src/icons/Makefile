png := $(patsubst %.png,build/%.png,$(wildcard *.png))

all: clean $(png)

build/%.png: %.png
	@printf "\nBuilding icon $@\n"
	convert $< $@.1.png
	convert $< -modulate  60 $@.2.png
	convert $< -modulate 170 $@.3.png
	convert $@.1.png $@.2.png $@.3.png -append $@
	rm $@.1.png $@.2.png $@.3.png

clean:
	-rm build/*.png

.PHONY: clean
