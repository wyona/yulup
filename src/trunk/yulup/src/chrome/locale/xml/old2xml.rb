#!/usr/bin/ruby

#
# old2xml.rb
#
# Converts all *.dtd/*.properties files in the current directory
# to the new yulup xml file format
#
#

Dir.foreach(".") { |entry|
    dtdFile  = false;
    propFile = false;

    if /.*.dtd$/.match(entry) then
        dtdFile = true
    elsif /.*.properties$/.match(entry) then
        propFile = true
    end

    if propFile || dtdFile then
        puts "converting #{entry}"

        inFile = File.open(entry, "r")
        xmlFile = File.new(entry+".xml", "w+")

        printf(xmlFile, "<?xml version=\"1.0\"?>\n\n")
        printf(xmlFile, "<dtd xmlns=\"http://yulup.wyona.org/1.0\">\n\n")

        inFile.each_line { |line|
            if dtdFile
                key   = /[ ][^ ]+/.match(line).to_s.strip
                value = /".+"/.match(line).to_s[1..-2]
          elsif propFile
                key   = /.*=/.match(line).to_s[0..-2]
                value = /=.*/.match(line).to_s[1..-1]
            end
            if key && value then
                printf(xmlFile, "  <entity id=\"#{key}\">\n")
                printf(xmlFile, "    <name xml:lang=\"en\">#{value}</name>\n")
                printf(xmlFile, "  </entity>\n\n")
            end
        }

        printf(xmlFile, "</dtd>\n")

        inFile.close()
        xmlFile.close()
    end
}
