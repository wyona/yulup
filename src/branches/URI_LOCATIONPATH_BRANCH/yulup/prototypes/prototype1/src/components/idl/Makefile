file := $(patsubst %.idl,%.xpt,$(wildcard *.idl))

all: $(file)

%.xpt : %.idl
	@printf "\nBuild XPT file $@\n"
	../../../../../../mozilla/gecko-sdk/powerpc+Darwin/sdk/bin/xpidl -m typelib -w -v -I ../../../../../../mozilla/gecko-sdk/powerpc+Darwin/sdk/idl -e $@ $<
	mv *.xpt ../
