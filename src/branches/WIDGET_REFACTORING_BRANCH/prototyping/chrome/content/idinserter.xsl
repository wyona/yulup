<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
                xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
                xmlns="http://www.w3.org/1999/xhtml">

  <xsl:import href="helloworld.xsl"/>

  <xsl:output method="xml" encoding="UTF-8"/>

  <xsl:template match="text()|@*">
<span _yulup-id="{generate-id()}"><xsl:value-of select="."/></span>
  </xsl:template>

</xsl:stylesheet>
