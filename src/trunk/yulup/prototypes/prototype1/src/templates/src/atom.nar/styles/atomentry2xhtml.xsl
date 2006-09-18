<?xml version="1.0" encoding="UTF-8"?>

<xsl:stylesheet version="1.0"
                exclude-result-prefixes="atom"
                xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
                xmlns="http://www.w3.org/1999/xhtml"
                xmlns:atom="http://www.w3.org/2005/Atom">
  <xsl:output method="xml"
              omit-xml-declaration="no"
              media-type="application/xhtml+xml"
              doctype-public="-//W3C//DTD XHTML 1.0 Transitional//EN"
              doctype-system="http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"/>

  <xsl:template match="atom:entry">
    <html>
      <head>
        <style type="text/css">
          * {
            font-family: sans-serif;
          }

          .atomPersonConstruct {
            display: block;
            border: 1px solid grey;
            margin: 2px 0px 2px 0px;
            padding: 2px 0px 2px 0px;
          }

          .atomContent {
            display: block;
            border: 1px solid grey;
            margin: 2px 0px 2px 0px;
            padding: 2px 0px 2px 0px;
          }

          .atomId {
            display: block;
            margin: 2px 0px 2px 0px;
            padding: 2px 0px 2px 0px;
          }

          .atomDate {
            display: block;
            margin: 2px 0px 2px 0px;
            padding: 2px 0px 2px 0px;
          }

          .atomRights {
            display: block;
            margin: 2px 0px 2px 0px;
            padding: 2px 0px 2px 0px;
          }

          .atomSummary {
            display: block;
            border: 1px solid grey;
            margin: 2px 0px 2px 0px;
            padding: 2px 0px 2px 0px;
          }

          .atomTitle {
            font-size: x-large;
            font-weight: bolder;
            margin: 2px 0px 2px 0px;
            padding: 2px 0px 2px 0px;
          }

          .atomName {
            display: block;
          }

          .atomEmail {
            display: block;
          }

          .atomUri {
            display: block;
          }
        </style>
      </head>
      <body>
        <!--<xsl:processing-instruction name="xml-stylesheet">href="chrome://yulup/skin/atomfeedinformation.css" type="text/css"</xsl:processing-instruction>-->

        <div id="atomEntry">
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
            <div>
              <span class="atom-value">
                <xsl:for-each select="atom:category">
                  <xsl:value-of select="@term"/>
                  <xsl:if test="not(position()=last())">, </xsl:if>
                </xsl:for-each>
              </span>
            </div>
          </xsl:if>

          <xsl:apply-templates select="atom:updated"/>

          <xsl:apply-templates select="atom:published"/>

          <xsl:apply-templates select="atom:summary"/>

          <xsl:apply-templates select="atom:content"/>
        </div>
      </body>
    </html>
  </xsl:template>

  <xsl:template match="atom:author|atom:contributor">
    <div class="atomPersonConstruct">
      <xsl:apply-templates select="atom:name"/>
      <xsl:apply-templates select="atom:email"/>
      <xsl:apply-templates select="atom:uri"/>
    </div>
  </xsl:template>

  <xsl:template match="atom:content">
    <div class="atomContent">
      <xsl:copy-of select="*"/>
    </div>
  </xsl:template>

  <xsl:template match="atom:id">
    <div class="atomId">
      <xsl:value-of select="."/>
    </div>
  </xsl:template>

  <xsl:template match="atom:published">
    <div class="atomDate">
      <xsl:value-of select="."/>
    </div>
  </xsl:template>

  <xsl:template match="atom:rights">
    <div class="atomRights">
      <xsl:value-of select="."/>
    </div>
  </xsl:template>

  <xsl:template match="atom:summary">
    <div class="atomSummary">
      <xsl:copy-of select="*"/>
    </div>
  </xsl:template>

  <xsl:template match="atom:title">
    <div class="atomTitle">
      <xsl:value-of select="."/>
    </div>
  </xsl:template>

  <xsl:template match="atom:updated">
    <div class="atomDate">
      <xsl:value-of select="."/>
    </div>
  </xsl:template>

  <xsl:template match="atom:name">
    <span class="atomName">
      <xsl:value-of select="text()"/>
    </span>
  </xsl:template>

  <xsl:template match="atom:email">
    <span class="atomEmail">
      <a>
        <xsl:attribute name="href">mailto:<xsl:value-of select="text()"/></xsl:attribute>
        <xsl:value-of select="text()"/>
      </a>
    </span>
  </xsl:template>

  <xsl:template match="atom:uri">
    <span class="atomUri">
      <a>
        <xsl:attribute name="href">
          <xsl:value-of select="text()"/>
        </xsl:attribute>
        <xsl:value-of select="text()"/>
      </a>
    </span>
  </xsl:template>
</xsl:stylesheet>
