<?xml version="1.0"?>



<xsl:stylesheet version="1.0"

  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"

  xmlns:xhtml="http://www.w3.org/1999/xhtml"

>



<!-- IMPORTANT: Needs to correspond to the mime-type which is sent by the server! -->

<xsl:output method="xhtml" encoding="UTF-8"/>

<!--

<xsl:output method="html"/>

-->



<xsl:param name="yanel.path.name" select="'NAME_IS_NULL'"/>

<xsl:param name="yanel.path" select="'PATH_IS_NULL'"/>

<xsl:param name="yanel.back2context" select="'BACK2CONTEXT_IS_NULL'"/>

<xsl:param name="yarep.back2realm" select="'BACK2REALM_IS_NULL'"/>



<xsl:variable name="name-without-suffix" select="substring-before($yanel.path.name, '.')"/>



<xsl:template match="/">

<html xmlns="http://www.w3.org/1999/xhtml">



<xsl:comment>

WARNING: This file has been generated automatically. All changes will be lost.

         Please edit only "*.xhtml" files and re-generate the "*.html" pages by

         using global.xsl

</xsl:comment>



<head>

  <link rel="neutron-introspection" type="application/neutron+xml" href="introspection-{$name-without-suffix}.xml"/>

  <link rel="stylesheet" href="{$yarep.back2realm}css/common.css" title="Standard Style"/>

<!--
  <link rel="alternate" type="application/atom+xml" href="{$yarep.back2realm}news-entries/?yanel.resource.viewid=atom" title="Yulup News"/>
-->

<xsl:comment>Name: <xsl:value-of select="$yanel.path.name"/> (without suffix: <xsl:value-of select="$name-without-suffix"/>), Path: <xsl:value-of select="$yanel.path"/>, Back 2 Realm: <xsl:value-of select="$yarep.back2realm"/>, Back 2 Context: <xsl:value-of select="$yanel.back2context"/></xsl:comment>



  <!-- TODO: Copy the whole head, but enhance the title with '- Yulup' ... -->

  <xsl:copy-of select="/xhtml:html/xhtml:head/*"/>

<!--

  <title><xsl:value-of select="/xhtml:html/xhtml:head/xhtml:title"/> - Yulup</title>

-->

  <meta content="application/xhtml+xml; charset=UTF-8" http-equiv="Content-Type"/>

  <meta name="generator" content="Wyona Yanel"/>

  <link href="{$yarep.back2realm}images/favicon.png" rel="icon" type="image/png"/>

</head>



<body style="margin: 0px; padding: 0px;">

<div id="gradient">

  <a href="{$yarep.back2realm}index.html"><img style="margin: 10px;" src="{$yarep.back2realm}images/whale-logo.gif" alt="Yulup Logo" border="0"/></a>

</div>



<table border="0" style="margin: 10px;">

<tr>

<td valign="top">

<b>All You Need</b><br/>

<a href="{$yarep.back2realm}en/about.html">About</a><br/>
<a href="{$yarep.back2realm}download/index.html">Download</a><br/>
<a href="{$yarep.back2realm}screenshots.html">Screenshots</a><br/>
<a href="{$yarep.back2realm}faq.html">FAQ</a><br/>
<a href="{$yarep.back2realm}license.html">License</a><br/>
<a href="http://demo.yulup.org">Demo</a><br/>
<a href="{$yarep.back2realm}news.html">News</a>



<br/><br/>

<b>Community/Developers</b><br/>

<a href="{$yarep.back2realm}developers.html">Get/Install the Source</a><br/>
<a href="{$yarep.back2realm}mailing-lists.html">Mailing Lists</a><br/>
<a href="http://bugzilla.wyona.com/cgi-bin/bugzilla/buglist.cgi?short_desc_type=allwordssubstr&amp;short_desc=&amp;product=Yulup&amp;long_desc_type=allwordssubstr&amp;long_desc=&amp;bug_file_loc_type=allwordssubstr&amp;bug_file_loc=&amp;bug_status=NEW&amp;bug_status=ASSIGNED&amp;bug_status=REOPENED&amp;emailassigned_to1=1&amp;emailtype1=substring&amp;email1=&amp;emailassigned_to2=1&amp;emailreporter2=1&amp;emailcc2=1&amp;emailtype2=substring&amp;email2=&amp;bugidtype=include&amp;bug_id=&amp;votes=&amp;changedin=&amp;chfieldfrom=&amp;chfieldto=Now&amp;chfieldvalue=&amp;cmdtype=doit&amp;namedcmd=Mobi&amp;newqueryname=&amp;order=Reuse+same+sort+as+last+time&amp;field0-0-0=noop&amp;type0-0-0=noop&amp;value0-0-0=">Task/Bug Tracker</a><br/>
<a href="{$yarep.back2realm}en/roadmap/index.html">Roadmap</a><br/>
<a href="{$yarep.back2realm}en/documentation.html">Documentation</a><br/>
<a href="{$yarep.back2realm}wiki/">Wiki</a><br/>
<a href="{$yarep.back2realm}acknowledgements.html">Acknowledgements</a><br/>

</td>



<td valign="top">&#160;&#160;</td>



<td valign="top">

  <xsl:copy-of select="/xhtml:html/xhtml:body/*"/>

</td>

</tr>

</table>



<table width="100%">

<tr>

<td>

<p>

<!-- TODO: Add margin left and right instead non-breaking spaces ... -->

&#160;&#160;&#160;<span id="footer-copyright">Copyright &#169; 2009 <a href="http://www.wyona.com">Wyona</a>. All rights reserved.</span>

</p>

</td>

<td colspan="1" align="right">

<p>

<span id="footer-page-info"><a href="?yanel.resource.meta">Page Info</a></span>&#160;&#160;&#160;

</p>

</td>

</tr>

</table>



</body>

</html>

</xsl:template>

</xsl:stylesheet>

