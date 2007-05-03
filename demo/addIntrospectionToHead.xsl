<?xml version="1.0"?>

<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns="http://www.w3.org/1999/xhtml"
  xmlns:xhtml="http://www.w3.org/1999/xhtml"
>

<xsl:output method="xml" doctype-system="http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd" doctype-public="-//W3C//DTD XHTML 1.0 Strict//EN"/> 

<xsl:param name="yanel.path.name" select="'NAME_IS_NULL'"/>
<xsl:param name="yanel.path" select="'PATH_IS_NULL'"/>
<xsl:param name="yanel.back2context" select="'BACK2CONTEXT_IS_NULL'"/>
<xsl:param name="yanel.back2realm" select="'BACK2REALM_IS_NULL'"/>

<xsl:variable name="name-without-suffix" select="substring-before($yanel.path.name, '.')"/>

<xsl:template match="/">
<html>
<head>
<!--
  <link rel="neutron-introspection" type="application/neutron+xml" href="?yanel.resource.usecase=introspection"/>
  -->
  <link rel="neutron-introspection" type="application/neutron+xml" href="introspection-{$name-without-suffix}.xml"/>
  <xsl:copy-of select="/xhtml:html/xhtml:head/*"/>
  <meta content="application/xhtml+xml; charset=UTF-8" http-equiv="Content-Type"/>
</head>
<xsl:copy-of select="/xhtml:html/xhtml:body"/>
</html>
</xsl:template>

</xsl:stylesheet>
