<?xml version="1.0"?>

<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:atom="http://www.w3.org/2005/Atom"
>

<!--
<xsl:template match="/">
<xsl:apply-templates/>
</xsl:template>
-->

<xsl:template match="/atom:feed/atom:link[@rel='self']">
<atom:link rel="self" href="http://www.yulup.org/news-entries-atom.xml"/>
</xsl:template>

<xsl:template match="@*|node()" priority="-1">
  <xsl:copy>
    <xsl:apply-templates select="@*|node()"/>
  </xsl:copy>
</xsl:template>

</xsl:stylesheet>
