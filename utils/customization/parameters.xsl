<?xml version="1.0" encoding="UTF-8"?>

<xsl:stylesheet version="1.0"
				xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
				xmlns="http://www.w3.org/1999/xhtml">

<xsl:output method="xml"
			encoding="UTF-8"
			indent="yes"
			doctype-public="-//W3C//DTD XHTML 1.1//EN"
			doctype-system="http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd"/>

<!-- enable XHTML Srict compatibility -->
<xsl:param name="css.decoration">0</xsl:param>
<xsl:param name="html.longdesc">0</xsl:param>
<xsl:param name="ulink.target"></xsl:param>
<xsl:param name="use.viewport">0</xsl:param>

<!-- set the toc nesting level (default is 2) -->
<xsl:param name="toc.section.depth">7</xsl:param>

<!-- activate section numbering in all document types (default is 0) -->
<xsl:param name="section.autolabel">1</xsl:param>

<!-- activate numbering of bibliographic references -->
<xsl:param name="bibliography.numbered" select="1"/>

<xsl:param name="callout.graphics">0</xsl:param>

</xsl:stylesheet>
