<?xml version="1.0"?>

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
                xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
                xmlns:dtd="http://yulup.wyona.org/1.0"
                xmlns="http://yulup.wyona.org/1.0">

  <xsl:param name="language" select="en"/>

  <xsl:output method="text" encoding="UTF-8"/>

  <xsl:template match="dtd:entity">
    <xsl:text>&#60;&#33;ENTITY </xsl:text>
    <xsl:value-of select="@id"/>
    <xsl:text> </xsl:text>
    <xsl:choose>
        <xsl:when test="dtd:name[@xml:lang = $language]">
            <xsl:text>"</xsl:text>
            <xsl:value-of select="dtd:name[@xml:lang = $language]/text()"/>
            <xsl:text>"&#62;</xsl:text>
        </xsl:when>
        <xsl:otherwise>
            <xsl:text>"</xsl:text>
            <xsl:value-of select="dtd:name/text()"/>
            <xsl:text>"&#62;</xsl:text>
        </xsl:otherwise>
    </xsl:choose>
    <xsl:text>&#10;</xsl:text>
  </xsl:template>

  <xsl:template match="@*|text()"/>

</xsl:stylesheet>
