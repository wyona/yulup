#!/bin/sh

echo "Stripping file " $1

sed -e 's/\/\* DEBUG \*\/ .*//g' $1 > $1.stripped
mv $1.stripped $1
