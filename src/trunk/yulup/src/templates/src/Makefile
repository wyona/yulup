nar := $(patsubst %.nar,../%.nar,$(wildcard *.nar))

all: clean $(nar)

../%.nar: %.nar
	@printf "\nBuild NAR template $@\n"
	cd $< && zip -r "../$@" . -x \*.svn\*

clean:
	rm ../*.nar

.PHONY: clean
