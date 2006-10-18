png := $(patsubst %.png,build/%.png,$(wildcard *.png))

all: $(png)

build/%.png: %.png
	@printf "\nBuilding icon $@\n"
	convert $< $@.1.png
	convert $< -modulate  50 $@.2.png
	composite -blend 0x50 null: $< -matte $@.3.png
	convert $@.1.png $@.2.png $@.3.png -append $@
	rm $@.1.png $@.2.png $@.3.png

deploy-theme: $(png)
	mkdir ../../chrome/skin/icons/industrial
	cp theme.industrial.css ../../chrome/skin/
	cp build/yulup-*.png ../../chrome/skin/icons/industrial

remove-theme:
	-rm ../../chrome/skin/theme.industrial.css
	-rm -r ../../chrome/skin/icons/industrial

clean:
	-rm build/*.png

.PHONY: clean
