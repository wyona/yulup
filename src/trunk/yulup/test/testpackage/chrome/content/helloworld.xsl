<?xml version="1.0" encoding="UTF-8"?>

<xsl:stylesheet version="1.0"
                xml:space="preserve"
                xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
                xmlns="http://www.w3.org/1999/xhtml">

  <xsl:template match="/">
<html>
  <body>
    <p>
Hello <xsl:apply-templates/>
    </p>
  </body>
</html>
  </xsl:template>

</xsl:stylesheet>
