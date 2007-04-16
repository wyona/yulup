<?xml version="1.0" encoding="UTF-8"?>

<xsl:stylesheet version="1.0"
                exclude-result-prefixes="atom"
                xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
                xmlns:xhtml="http://www.w3.org/1999/xhtml"
                xmlns:atom="http://www.w3.org/2005/Atom"
                xmlns:xul="http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul">
  <xsl:output method="xml"
              indent="yes"/>

  <xsl:template match="atom:feed">
    <xul:page id="uiAtomSidebarFeedInformationPage"
              orient="vertical"
              align="stretch"
              style="overflow: auto;">

      <xsl:apply-templates select="atom:title"/>

      <xsl:apply-templates select="atom:subtitle"/>

      <xsl:apply-templates select="atom:rights"/>

      <xsl:if test="count(atom:author) &gt; 0">
        <xul:groupbox orient="vertical">
          <xul:caption label="Authors"/>
          <xsl:for-each select="atom:author">
            <xsl:apply-templates select="."/>
            <xsl:if test="not(position()=last())">
              <xul:separator class="atom-person-separator"/>
            </xsl:if>
          </xsl:for-each>
        </xul:groupbox>
      </xsl:if>

      <xsl:if test="count(atom:contributor) &gt; 0">
        <xul:groupbox orient="vertical">
          <xul:caption label="Contributors"/>
          <xsl:for-each select="atom:contributor">
            <xsl:apply-templates select="."/>
            <xsl:if test="not(position()=last())">
              <xul:separator class="atom-person-separator"/>
            </xsl:if>
          </xsl:for-each>
        </xul:groupbox>
      </xsl:if>

      <xsl:apply-templates select="atom:generator"/>

      <xsl:if test="count(atom:category) &gt; 0">
        <xul:hbox>
          <xul:label class="atom-label" value="Categories:"/>
          <xul:description class="atom-value">
            <xsl:for-each select="atom:category">
              <xsl:value-of select="@label"/>
              <xsl:if test="not(position()=last())">, </xsl:if>
            </xsl:for-each>
          </xul:description>
        </xul:hbox>
      </xsl:if>

      <xsl:apply-templates select="atom:updated"/>
    </xul:page>
  </xsl:template>

  <xsl:template match="atom:title">
    <xul:description class="atom-feed-title">
      <xsl:value-of select="."/>
    </xul:description>
  </xsl:template>

  <xsl:template match="atom:subtitle">
    <xul:description class="atom-feed-subtitle">
      <xsl:value-of select="."/>
    </xul:description>
  </xsl:template>

  <xsl:template match="atom:rights">
    <xul:description class="atom-feed-rights">
      <xsl:value-of select="."/>
    </xul:description>
  </xsl:template>

  <xsl:template match="atom:author|atom:contributor">
    <xul:vbox>
      <xsl:apply-templates select="atom:name"/>
      <xsl:apply-templates select="atom:email"/>
      <xsl:apply-templates select="atom:uri"/>
    </xul:vbox>
  </xsl:template>

  <xsl:template match="atom:name">
    <xul:description class="atom-person-name">
      <xsl:value-of select="text()"/>
    </xul:description>
  </xsl:template>

  <xsl:template match="atom:email">
    <xul:description class="atom-person-email">
      <xhtml:a>
        <xsl:attribute name="href">mailto:<xsl:value-of select="text()"/></xsl:attribute>
        <xsl:value-of select="text()"/>
      </xhtml:a>
    </xul:description>
  </xsl:template>

  <xsl:template match="atom:uri">
    <xul:description class="atom-person-uri">
      <xhtml:a>
        <xsl:attribute name="href">
          <xsl:value-of select="text()"/>
        </xsl:attribute>
        <xsl:value-of select="text()"/>
      </xhtml:a>
    </xul:description>
  </xsl:template>

  <xsl:template match="atom:generator">
    <xul:hbox>
      <xul:label class="atom-label" value="Generator:"/>
      <xul:description class="atom-value">
        <xsl:value-of select="."/>
      </xul:description>
    </xul:hbox>
  </xsl:template>

  <xsl:template match="atom:updated">
    <xul:hbox>
      <xul:label class="atom-label" value="Updated:"/>
      <xul:description class="atom-value">
        <xsl:value-of select="."/>
      </xul:description>
    </xul:hbox>
  </xsl:template>
</xsl:stylesheet>
