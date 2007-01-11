<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
                xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
                xmlns="http://www.w3.org/1999/xhtml">

  <xsl:output method="xml" encoding="UTF-8"/>

  <xsl:template match="text()|@*">
    <xsl:element name="span">
      <xsl:attribute name="_yulup-id">
        <xsl:value-of select="../@_yulup-id"/>
      </xsl:attribute>
      <xsl:value-of select="."/>
    </xsl:element>
  </xsl:template>

</xsl:stylesheet>
