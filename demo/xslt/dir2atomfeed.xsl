<?xml version="1.0"?>

<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:dir="http://apache.org/cocoon/directory/2.0"
  xmlns:yanel="http://www.wyona.org/yanel/resource/directory/1.0"
  xmlns="http://www.w3.org/2005/Atom"
>

<xsl:output method="xml"/>

<xsl:template match="/">
<!-- TODO: Also add realm-prefix -->
<feed xml:base="http://yulup.wyona.org{/dir:directory/@dir:path}">

  <title>Yulup Demo</title>
  <link rel="self" href="{/dir:directory/@yanel:path}"/>
<!--
<xsl:comment>
  <link rel="self" href="news-feed.xml"/>
</xsl:comment>
-->
  <updated>2003-12-13T18:30:02Z</updated>
  <author><name>Yulup</name></author>
  <id>urn:uuid:<xsl:value-of select="/dir:directory/@dir:name"/></id>

<xsl:apply-templates select="/dir:directory/*"/>

</feed>
</xsl:template>


<xsl:template match="dir:directory">
<xsl:comment>
Do NOT show collections: <xsl:value-of select="@name"/>, <xsl:value-of select="@path"/>
</xsl:comment>
</xsl:template>

<xsl:template match="dir:file">
<entry>
  <title><xsl:value-of select="@name"/></title>
  <id>urn:uuid:<xsl:value-of select="@name"/></id>
  <link href="{@name}" rel="edit"/>
  <updated>200<xsl:value-of select="position()"/>-01-13T18:30:02Z</updated>
<!--
  <updated><xsl:value-of select="@last-modified"/></updated>
-->
  <link href="{@name}" rel="alternate"/>
  <summary><xsl:value-of select="@name"/></summary>
</entry>
<!--
<link href="{@name}" rel="edit" title="{@name}"/>
-->
<xsl:comment>
<xsl:value-of select="@path"/>
</xsl:comment>
</xsl:template>

</xsl:stylesheet>
