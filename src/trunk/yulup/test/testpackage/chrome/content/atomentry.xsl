<?xml version="1.0" encoding="UTF-8"?>

<xsl:stylesheet version="1.0"
                exclude-result-prefixes="atom"
                xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
                xmlns:xhtml="http://www.w3.org/1999/xhtml"
                xmlns:atom="http://www.w3.org/2005/Atom">
  <xsl:output method="xml"
              omit-xml-declaration="no"
              indent="yes"/>

  <xsl:template match="atom:entry">
    <!--<xsl:processing-instruction name="xml-stylesheet">href="chrome://yulup/skin/atomfeedinformation.css" type="text/css"</xsl:processing-instruction>-->

    <xhtml:div id="atomEntry">
      <xsl:apply-templates select="atom:title"/>

      <xsl:apply-templates select="atom:rights"/>

      <xsl:apply-templates select="atom:id"/>

      <xsl:if test="count(atom:author) &gt; 0">
          <xsl:for-each select="atom:author">
            <xsl:apply-templates select="."/>
          </xsl:for-each>
      </xsl:if>

      <xsl:if test="count(atom:contributor) &gt; 0">
          <xsl:for-each select="atom:contributor">
            <xsl:apply-templates select="."/>
          </xsl:for-each>
      </xsl:if>

      <xsl:if test="count(atom:category) &gt; 0">
        <xhtml:div>
          <xhtml:span class="atom-value">
            <xsl:for-each select="atom:category">
              <xsl:value-of select="@term"/>
              <xsl:if test="not(position()=last())">, </xsl:if>
            </xsl:for-each>
          </xhtml:span>
        </xhtml:div>
      </xsl:if>

      <xsl:apply-templates select="atom:updated"/>

      <xsl:apply-templates select="atom:published"/>

      <xsl:apply-templates select="atom:summary"/>

      <xsl:apply-templates select="atom:content"/>
    </xhtml:div>
  </xsl:template>

  <xsl:template match="atom:author|atom:contributor">
    <xhtml:div class="atomPersonConstruct">
      <xsl:apply-templates select="atom:name"/>
      <xsl:apply-templates select="atom:email"/>
      <xsl:apply-templates select="atom:uri"/>
    </xhtml:div>
  </xsl:template>

  <xsl:template match="atom:content">
    <xhtml:div class="atomContent">
      <xsl:copy-of select="*"/>
    </xhtml:div>
  </xsl:template>

  <xsl:template match="atom:id">
    <xhtml:div class="atomId">
      <xsl:value-of select="."/>
    </xhtml:div>
  </xsl:template>

  <xsl:template match="atom:published">
    <xhtml:div class="atomDate">
      <xsl:value-of select="."/>
    </xhtml:div>
  </xsl:template>

  <xsl:template match="atom:rights">
    <xhtml:div class="atomRights">
      <xsl:value-of select="."/>
    </xhtml:div>
  </xsl:template>

  <xsl:template match="atom:summary">
    <xhtml:div class="atomSummary">
      <xsl:copy-of select="*"/>
    </xhtml:div>
  </xsl:template>

  <xsl:template match="atom:title">
    <xhtml:div class="atomTitle">
      <xsl:value-of select="."/>
    </xhtml:div>
  </xsl:template>

  <xsl:template match="atom:updated">
    <xhtml:div class="atomDate">
      <xsl:value-of select="."/>
    </xhtml:div>
  </xsl:template>

  <xsl:template match="atom:name">
    <xhtml:span class="atomName">
      <xsl:value-of select="text()"/>
    </xhtml:span>
  </xsl:template>

  <xsl:template match="atom:email">
    <xhtml:span class="atomEmail">
      <xhtml:a>
        <xsl:attribute name="href">mailto:<xsl:value-of select="text()"/></xsl:attribute>
        <xsl:value-of select="text()"/>
      </xhtml:a>
    </xhtml:span>
  </xsl:template>

  <xsl:template match="atom:uri">
    <xhtml:span class="atomUri">
      <xhtml:a>
        <xsl:attribute name="href">
          <xsl:value-of select="text()"/>
        </xsl:attribute>
        <xsl:value-of select="text()"/>
      </xhtml:a>
    </xhtml:span>
  </xsl:template>
</xsl:stylesheet>
