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

  <!--
  Mozilla does not support the indent attribute,
  the pretty-print combo strip-space and indent="yes"
  does not work (as with xsltproc) ;(

  <xsl:strip-space elements="*"/>
  <xsl:output method="xml" version="1.0" encoding="UTF-8" indent="yes"/>
  -->

  <xsl:output method="xml" version="1.0" encoding="UTF-8"/>

  <xsl:template match="*">
    <xsl:copy>
      <xsl:copy-of select="@*"/>
      <xsl:apply-templates/>
    </xsl:copy>
  </xsl:template>

</xsl:stylesheet>
