<?xml version="1.0"?>

<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:xhtml="http://www.w3.org/1999/xhtml"
  xmlns:hp="http://ulysses.wyona.org/homepage/1.0"
>

<xsl:output doctype-system="http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd" doctype-public="-//W3C//DTD XHTML 1.0 Strict//EN"/>

<xsl:param name="yanel.path.name" select="'NAME_IS_NULL'"/>
<xsl:param name="yanel.path" select="'PATH_IS_NULL'"/>
<xsl:param name="yanel.back2context" select="'BACK2CONTEXT_IS_NULL'"/>
<xsl:param name="yarep.back2realm" select="'BACK2REALM_IS_NULL'"/>

<xsl:variable name="name-without-suffix" select="substring-before($yanel.path.name, '.')"/>

<xsl:template match="/">
<html xmlns="http://www.w3.org/1999/xhtml">

<head>
  <xsl:comment>Back2Realm: <xsl:value-of select="$yarep.back2realm"/></xsl:comment>
  <meta http-equiv="Content-Type" content="application/xhtml+xml; charset=UTF-8"/>
  <title><xsl:value-of select="/hp:homepage/hp:title"/></title>
  <link rel="neutron-introspection" type="application/neutron+xml" href="introspection-index.xml"/>
  <link rel="stylesheet" href="{$yarep.back2realm}css/common.css" title="Standard Style"/>
  <link rel="alternate" type="application/atom+xml" href="{$yarep.back2realm}news-entries-atom.xml" title="Yulup News"/>
  <meta name="generator" content="Wyona Yanel"/>
  <!-- See http://en.wikipedia.org/wiki/Favicon -->
  <link href="{$yarep.back2realm}images/favicon.png" rel="icon" type="image/png"/>
</head>



<body style="background-color: rgb(255, 255, 255); margin: 0px; padding: 0px;">

<div id="gradient">
  <!-- http://css.maxdesign.com.au/floatutorial/ -->
  <div id="header">
   <div style="/*border-style: solid; border-color: black;*/ background-image: url('{$yarep.back2realm}images/tab-3758a0.gif'); width: 136px; height: 38px; float: right; text-align: right;"><br/><a href="developers.html">Community</a>&#160;&#160;</div>
   <div style="/*border-style: solid; border-color: black;*/ background-image: url('{$yarep.back2realm}images/tab-006ab3.gif'); width: 136px; height: 38px; float: right; text-align: right;"><br/><a href="download/index.html">Download</a>&#160;&#160;</div>
   <div style="/*border-style: solid; border-color: black;*/ background-image: url('{$yarep.back2realm}images/tab-0086cb.gif'); width: 136px; height: 38px; float: right; text-align: right;"><br/><a href="en/about.html">About</a>&#160;&#160;</div>
   <div style="/*border-style: solid; border-color: black;*/ background-image: url('{$yarep.back2realm}images/tab-04addd.gif'); width: 136px; height: 38px; float: right; text-align: right;"><br/><a href="{/hp:homepage/hp:tabs/hp:demo/@href}"><xsl:value-of select="/hp:homepage/hp:tabs/hp:demo/@name"/></a>&#160;&#160;</div>
   <div style="/*border-style: solid; border-color:green;*/ background-image: url('{$yarep.back2realm}images/tab-68c7e9.gif'); width: 136px; height: 38px; float: right; text-align: right;"><br/><a href="{/hp:homepage/hp:tabs/hp:help/@href}"><xsl:value-of select="/hp:homepage/hp:tabs/hp:help/@name"/></a>&#160;&#160;</div>
  </div>

  <img alt="Yulup Logo" src="{$yarep.back2realm}images/whale-logo.gif" style="margin: 10px;"/>
</div>

<div style="margin: 0px 50px 0px 70px; padding: 0px;/*border-style: solid;*/ border-color: green;">
<p id="claim">
<xsl:value-of select="/hp:homepage/hp:claim"/>
</p>
<p>
<table width="185" height="185" background="{$yarep.back2realm}images/download-star.gif">
<tbody><tr>

<td>

<div id="download">
<a href="{/hp:homepage/hp:download-link/@href}">

<span id="download-download"><xsl:value-of select="/hp:homepage/hp:download-download"/></span><br/>

<span id="download-yulup"><xsl:value-of select="/hp:homepage/hp:download-yulup"/></span>&#160;<span id="download-version"><xsl:value-of select="/hp:homepage/hp:download-version"/></span><br/>

<span id="download-firefox"><xsl:value-of select="/hp:homepage/hp:download-firefox"/></span><br/>

<span id="download-size">(<xsl:value-of select="/hp:homepage/hp:download-size"/>)</span>

</a>

</div>

</td>

</tr>

</tbody></table>
</p>

<xsl:copy-of select="/hp:homepage/xhtml:html/*"/>

<p>
<span id="footer-copyright">Copyright &#169; 2006 <a href="http://www.wyona.com">Wyona</a>. All rights reserved.</span>
</p>
</div>

</body>
</html>
</xsl:template>
</xsl:stylesheet>
