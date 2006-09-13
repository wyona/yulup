png := $(patsubst %.dia,%.png,$(wildcard *.dia))
idl := $(patsubst %.dia,%.idl,$(wildcard uml_*.dia))

all: clean-idl $(png) $(idl)

%.png : %.dia
	@printf "\nConvert dia file $< to PNG $@\n"
	dia -t png $<

%.idl: %.dia
	@printf "\nConvert dia file $< to IDL files\n"
	dia2code -t idl -d idl/ $<

clean-idl:
	@printf "\nRemove old idl files in `pwd`/idl\n"
	-rm idl/*.idl

.PHONY: clean-idl
