<?xml version="1.0" encoding="UTF-8"?>

<!--
# ***** BEGIN LICENSE BLOCK *****
# Copyright 2006 Wyona AG Zurich
#
# This file is part of Yulup.
#
# Yulup is free software; you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation; either version 2 of the License, or
# (at your option) any later version.
#
# Yulup is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with Yulup; if not, write to the Free Software
# Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
#
# ***** END LICENSE BLOCK *****
-->

<xsl:stylesheet version="1.0"
                xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

  <xsl:output method="xml" encoding="UTF-8"/>

  <xsl:param name="default-namespace"/>
  <xsl:param name="default-prefix"/>

  <xsl:template match="*">

    <xsl:variable name="locationpath">
      <xsl:for-each select="ancestor-or-self::*">
        <xsl:variable name="qname">
          <xsl:choose>
            <xsl:when test="$default-prefix and namespace-uri() = $default-namespace and not(contains(name(), ':'))">
              <xsl:value-of select="concat($default-prefix, ':', name())"/>
            </xsl:when>
            <xsl:otherwise>
              <xsl:value-of select="name()"/>
            </xsl:otherwise>
          </xsl:choose>
        </xsl:variable>
        <xsl:value-of select="concat('/', $qname)"/>
        <xsl:variable name="name" select="name()"/>
        <xsl:variable name="count" select="count(preceding-sibling::*[name() = $name])"/>
        <xsl:if test="$count > 0">
          <xsl:value-of select="concat('[', $count + 1, ']')"/>
        </xsl:if>
      </xsl:for-each>
   </xsl:variable>

    <xsl:copy>
      <xsl:for-each select="@*">
        <xsl:copy/>
      </xsl:for-each>
      <xsl:attribute name="_yulup-location-path"><xsl:value-of select="$locationpath"/></xsl:attribute>
      <xsl:apply-templates/>
    </xsl:copy>
  </xsl:template>

</xsl:stylesheet>
