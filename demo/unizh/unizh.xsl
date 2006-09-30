<?xml version="1.0" encoding="UTF-8"?>

<!-- $Id: xhtml-standard.xsl,v 1.11 2005/01/17 09:15:14 thomas Exp $ -->

<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns="http://www.w3.org/1999/xhtml" xmlns:lenya="http://apache.org/cocoon/lenya/page-envelope/1.0" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:unizh="http://unizh.ch/doctypes/elements/1.0" xmlns:uz="http://unizh.ch" xmlns:i18n="http://apache.org/cocoon/i18n/2.1" xmlns:index="http://apache.org/cocoon/lenya/documentindex/1.0" xmlns:level="http://apache.org/cocoon/lenya/documentlevel/1.0" xmlns:ci="http://apache.org/cocoon/include/1.0" version="1.0">
  <xsl:param name="root"/>
  <xslt:param xmlns:xslt="http://www.w3.org/1999/XSL/Transform" xmlns:xi="http://www.w3.org/2001/XInclude" name="contextprefix">/lenya</xslt:param>
  <xslt:param xmlns:xslt="http://www.w3.org/1999/XSL/Transform" xmlns:xi="http://www.w3.org/2001/XInclude" name="area">authoring</xslt:param>
  <xslt:param xmlns:xslt="http://www.w3.org/1999/XSL/Transform" xmlns:xi="http://www.w3.org/2001/XInclude" name="rendertype"></xslt:param>
  <xslt:param xmlns:xslt="http://www.w3.org/1999/XSL/Transform" xmlns:xi="http://www.w3.org/2001/XInclude" name="defaultlanguage">de</xslt:param>
  <xslt:param xmlns:xslt="http://www.w3.org/1999/XSL/Transform" xmlns:xi="http://www.w3.org/2001/XInclude" name="language">de</xslt:param>

  <xslt:param xmlns:xslt="http://www.w3.org/1999/XSL/Transform" xmlns:xi="http://www.w3.org/2001/XInclude" name="nodeid">xhtml</xslt:param>
  <xslt:param xmlns:xslt="http://www.w3.org/1999/XSL/Transform" xmlns:xi="http://www.w3.org/2001/XInclude" name="fontsize">; </xslt:param>
  <xslt:param xmlns:xslt="http://www.w3.org/1999/XSL/Transform" xmlns:xi="http://www.w3.org/2001/XInclude" name="querystring"></xslt:param>
  <xslt:param xmlns:xslt="http://www.w3.org/1999/XSL/Transform" xmlns:xi="http://www.w3.org/2001/XInclude" name="creationdate">Wed Oct 19 14:50:12 CEST 2005</xslt:param>

  <xsl:variable xmlns:xi="http://www.w3.org/2001/XInclude" xmlns:xslt="http://www.w3.org/1999/XSL/Transform" name="languagesuffix">
    <xsl:if test="$defaultlanguage != $language">.<xsl:value-of select="$language"/></xsl:if>
  </xsl:variable>

  <xsl:variable name="documentlanguagesuffix">
    <xsl:if test="$defaultlanguage != $language">_<xsl:value-of select="$language"/></xsl:if>
  </xsl:variable>

  <xsl:variable name="imageprefix" select="concat($contextprefix, '/unizh/authoring/images')"/>

  <xsl:variable name="localsharedresources" select="concat(substring-before($root, $area), 'authoring')"/>

  <xsl:variable name="content" select="/document/content/*"/>

  <xsl:variable name="document-element-name">
    <xsl:choose>
      <xsl:when test="name($content) = local-name($content)">
        <xsl:value-of select="concat('xhtml:', name($content))"/>
      </xsl:when>
      <xsl:otherwise>
        <xsl:value-of select="name($content)"/>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:variable>

  <xsl:template xmlns:xi="http://www.w3.org/2001/XInclude" xmlns:xslt="http://www.w3.org/1999/XSL/Transform" name="html-head">
    <head>
      <title>UZH - <xsl:value-of select="/document/content/*/unizh:header/unizh:heading"/> - <xsl:value-of select="*/lenya:meta/dc:title"/></title>
      <link rel="neutron-introspection" type="application/neutron+xml" href="unizh-introspection.xml"/>
      <meta content="text/html; charset=iso-8859-1" http-equiv="Content-Type"/>
      <link type="text/css" rel="stylesheet" href="resources/main.css"/>
      <script src="http://demo.yulup.org/unizh/resources/uni.js" type="text/javascript"/>
      <script src="http://demo.yulup.org/unizh/resources/elml.js" type="text/javascript"/>
      <xsl:if test="$document-element-name = 'unizh:news'">
        <link href="{$nodeid}.rss.xml" rel="alternate" title="{/document/content/unizh:news/lenya:meta/dc:title}" type="application/rss+xml"/> 
      </xsl:if>
    </head>
  </xsl:template>

  <xsl:template xmlns:xi="http://www.w3.org/2001/XInclude" xmlns:xslt="http://www.w3.org/1999/XSL/Transform" name="header">
    <div id="headerarea">
      <div style="float:right;width:195px;">
        <div class="imgunilogo">
          <a href="http://www.unizh.ch">
            <img alt="unizh logo" height="45" src="resources/logo_{$language}.gif" width="180"/>
          </a>
        </div>

        <div class="imginstitute">
          <img alt="institute's picture" height="45" src="resources/key-visual.jpg" width="180"/>
        </div>
      </div>
      <div id="headertitelpos">
        <xsl:apply-templates select="/document/xhtml:div[@id = 'servicenav']"/>
        <xsl:choose>
          <xsl:when test="$document-element-name = 'unizh:homepage' or $document-element-name = 'unizh:homepage4cols'">
            <div bxe_xpath="/{$document-element-name}/unizh:header/unizh:superscription">

              <h2>
                <xsl:value-of select="/document/content/*/unizh:header/unizh:superscription"/>
                
              </h2>
            </div>
            <h1>
              <span bxe_xpath="/{$document-element-name}/unizh:header/unizh:heading">
                <a href="{/document/xhtml:div[@id = 'servicenav']/xhtml:div[@id = 'home']/@href}">
                  <xsl:value-of select="/document/content/*/unizh:header/unizh:heading"/>
                </a>

              </span>
            </h1>
          </xsl:when>
          <xsl:otherwise>
            <h2>
              <xsl:value-of select="/document/content/*/unizh:header/unizh:superscription"/>
            </h2>
            <h1>
              <a href="{/document/xhtml:div[@id = 'servicenav']/xhtml:div[@id = 'home']/@href}">

                <xsl:value-of select="/document/content/*/unizh:header/unizh:heading"/>
              </a>
            </h1>
          </xsl:otherwise> 
        </xsl:choose>
      </div>
    </div>
    <div class="floatclear"/>
    <!-- tabs -->

    <xsl:choose>
      <xsl:when test="/document/xhtml:div[@id = 'tabs']">
        <xsl:apply-templates select="/document/xhtml:div[@id = 'tabs']"/>
      </xsl:when>
      <xsl:otherwise>
        <div id="primarnav"> </div>
      </xsl:otherwise>
    </xsl:choose>

    <div class="floatclear"/>
    <div class="endheaderline">
      <img alt="separation line" height="1" src="resources/1.gif" width="1"/>
    </div>
  </xsl:template>
  <xsl:template xmlns:xi="http://www.w3.org/2001/XInclude" xmlns:xslt="http://www.w3.org/1999/XSL/Transform" name="footer">
    <div class="footermargintop"/>
    <div class="topnav"><a href="#top">top</a></div>

    <div class="solidline"><img alt="separation line" height="1" src="resources/1.gif" width="1"/></div>
    <div id="footer">(C) 2005 Universitat Zurich | <a href="{/document/xhtml:div[@id = 'footnav']/xhtml:div[@id = 'impressum']/@href}"><xsl:value-of select="/document/xhtml:div[@id = 'footnav']/xhtml:div[@id = 'impressum']"/></a></div>
  </xsl:template>
  <xslt:param xmlns:xslt="http://www.w3.org/1999/XSL/Transform" xmlns:xi="http://www.w3.org/2001/XInclude" name="publicationid">unitemplate</xslt:param><xsl:template match="xhtml:div[@id = 'orthonav']">
    <xsl:if test="*">
      <div id="orthonav">
        <span class="spacer"> </span>

        <xsl:variable name="itemNr" select="count(*)"/>
        <xsl:for-each select="*">
          <xsl:choose>
            <xsl:when test="@href">
              <a href="{@href}"> <xsl:value-of select="."/> </a>
            </xsl:when>
            <xsl:otherwise>
              <xsl:choose>

                <xsl:when test="@current = 'true'">
                  <a class="active" href="#"><xsl:value-of select="."/></a>
                </xsl:when>
                <xsl:otherwise>
                  <a class="inactive"> <xsl:value-of select="."/> </a>
                </xsl:otherwise>
              </xsl:choose>
            </xsl:otherwise>

          </xsl:choose>
          <xsl:if test="position() != $itemNr">  </xsl:if>
        </xsl:for-each>
      </div>
    </xsl:if>
  </xsl:template><xsl:template match="xhtml:div[@id = 'servicenav']">
    <div id="servicenavpos">
      <xsl:for-each select="xhtml:div[@id != 'search']">

        <xsl:if test="@id = 'home'">
          <a accesskey="0" href="{@href}"><xsl:value-of select="."/></a> &#9;
        </xsl:if>
        <xsl:if test="@id = 'contact'">
          <a accesskey="3" href="{@href}"><xsl:value-of select="."/></a> &#9;
        </xsl:if>
        <xsl:if test="@id = 'sitemap'">
          <a accesskey="4" href="{@href}"><xsl:value-of select="."/></a> &#9;

        </xsl:if>
        |
      </xsl:for-each>
      
      <xsl:choose>
        <xsl:when test="$publicationid = 'id'">      
          <label for="formsearch">Suchen:</label>  
          <form accept-charset="UTF-8" action="http://www.id.unizh.ch/search/search.jsp" id="formsearch" method="get">
            <div class="serviceform">
              <input accesskey="5" name="query" type="text"/>
            </div>

            <div class="serviceform">
              <a href="javascript:document.forms['formsearch'].submit();">go!</a>
            </div>
          </form>
        </xsl:when>
        <xsl:otherwise>
          <label for="formsearch"><xsl:value-of select="xhtml:div[@id='search']"/>:</label>
          <form action="{xhtml:div[@id = 'search']/@href}" id="formsearch" method="get">

            <div class="serviceform">
              <input accesskey="5" name="queryString" type="text"/>
            </div>
            <div class="serviceform">
              <a href="javascript:document.forms['formsearch'].submit();">go!</a>
            </div>
          </form>
        </xsl:otherwise>

      </xsl:choose>
    </div>
  </xsl:template><xsl:template match="xhtml:div[@id = 'toolnav']">
    <div id="toolnav">
      <div class="icontextpos">
        <div id="icontext"> </div>
      </div>
      <xsl:for-each select="xhtml:div[@class='language']">

        <a href="{@href}"><xsl:value-of select="translate(., 'abcdefghijklmnopqrstuvwxyz', 'ABCDEFGHIJKLMNOPQRSTUVWXYZ')"/></a> |
      </xsl:for-each>
      <a href="#" onClick="window.open('{xhtml:div[@id = 'print']/@href}', '', 'width=700,height=700,menubar=yes,scrollbars')" onmouseout="changeIcontext('')" onmouseover="changeIcontext('{xhtml:div[@id = 'print']}')"><img alt="{xhtml:div[@id = 'print']}" height="10" src="resources/icon_print.gif" width="10"/></a> |
      <a onmouseout="changeIcontext('')" onmouseover="changeIcontext('{xhtml:div[@id = 'fontsize']}')">
        <xsl:attribute name="id">switchFontSize</xsl:attribute>
        <img alt="{xhtml:div[@id = 'fontsize']}" height="9" src="resources/icon_bigfont.gif" width="18"/></a> |
      <a href="{xhtml:div[@id = 'simpleview']/@href}" onmouseout="changeIcontext('')" onmouseover="changeIcontext('{xhtml:div[@id = 'simpleview']}')"><img alt="{xhtml:div[@id = 'simpleview']}" height="9" src="resources/icon_pda.gif" width="18"/></a>
    </div>

    <div class="floatclear"/>
  </xsl:template><xsl:template match="xhtml:div[@id = 'menu']">
    <xsl:variable name="descendants" select="descendant::xhtml:div[descendant-or-self::xhtml:div[@current = 'true']]"/>
    <xsl:variable name="current" select="descendant::xhtml:div[@current = 'true']"/>
    <xsl:variable name="level" select="count($descendants)"/>

    <div id="secnav">
      &#9;  <xsl:if test="not(../xhtml:div[@id = 'tabs'])">
        &#9;    <a accesskey="1" name="navigation"/>

        &#9;  </xsl:if>
      <xsl:apply-templates select="xhtml:div[@class = 'home']"/>
      <xsl:if test="$level &gt; 3">
        <a href="{$descendants[$level - 3]/@href}">[...] <xsl:value-of select="$descendants[$level - 3]/text()"/></a>
      </xsl:if>
      <div class="solidline">
        <img alt="separation line" height="1" src="resources/1.gif" width="1"/>
      </div>

      <ul>
        <xsl:choose>
          <xsl:when test="$level &gt; 3">
            <xsl:apply-templates select="$descendants[$level - 2]"/>
          </xsl:when>
          <xsl:otherwise>
            <xsl:apply-templates select="xhtml:div[not(@class = 'home')]"/>
          </xsl:otherwise>
        </xsl:choose>

      </ul>
    </div>
  </xsl:template><xsl:template match="xhtml:div[ancestor::xhtml:div[@id = 'menu']]">
    <li>
      <a href="{@href}">
        <xsl:if test="@current = 'true'">
          <xsl:attribute name="class">activ</xsl:attribute>
        </xsl:if>

        <xsl:value-of select="text()"/>
      </a>
      <xsl:if test="xhtml:div">
        <ul>
          <xsl:apply-templates select="xhtml:div"/>
        </ul>
      </xsl:if>
      <xsl:if test="parent::xhtml:div[@id = 'menu']">
        <div class="dotline">

          <img alt="separation line" height="1" src="resources/1.gif" width="1"/>
        </div>
      </xsl:if>
    </li>
  </xsl:template><xsl:template match="xhtml:div[parent::xhtml:div[@id = 'menu'] and @class = 'home']">
    <div class="navup">
      <a href="{@href}"><xsl:value-of select="."/></a>
    </div>
  </xsl:template><xsl:template match="xhtml:div[@id = 'tabs']">

    <div id="primarnav">
      <a name="navigation"/> 
      <xsl:for-each select="xhtml:div">
        <a href="{@href}">
          <xsl:if test="@current = 'true'">
            <xsl:attribute name="class">activ</xsl:attribute>
          </xsl:if>
          <xsl:value-of select="text()"/>
        </a>

        <xsl:if test="position() &lt; last()">
          <div class="linkseparator">|</div>
        </xsl:if>
      </xsl:for-each>
    </div>
  </xsl:template><xsl:template match="xhtml:div[@id = 'breadcrumb']">
    <div id="breadcrumbnav">
      <a href="{@root}"><xsl:value-of select="@label"/></a>

      <xsl:for-each select="xhtml:div">
        &gt; <a href="{@href}"><xsl:value-of select="."/></a>
      </xsl:for-each>
    </div>
  </xsl:template><xsl:template match="xhtml:div[@id = 'simplenav']">
    <div id="primarnav">
      &#9;<a name="navigation"/>
      <xsl:for-each select="xhtml:div">
        <a href="{@href}"><xsl:value-of select="@label"/></a>

        <xsl:if test="@id = 'up'"><br/></xsl:if>
        <xsl:if test="not(@id = 'up') and position() &lt; last()">
          <div class="linkseparator">|</div>
        </xsl:if>
      </xsl:for-each>
    </div>
  </xsl:template>
  <xsl:param xmlns:xi="http://www.w3.org/2001/XInclude" xmlns:xslt="http://www.w3.org/1999/XSL/Transform" name="root"/><xslt:param xmlns:xslt="http://www.w3.org/1999/XSL/Transform" xmlns:xi="http://www.w3.org/2001/XInclude" name="documentid">/xhtml</xslt:param><xslt:param xmlns:xslt="http://www.w3.org/1999/XSL/Transform" xmlns:xi="http://www.w3.org/2001/XInclude" name="contextprefix">/lenya</xslt:param><xslt:param xmlns:xslt="http://www.w3.org/1999/XSL/Transform" xmlns:xi="http://www.w3.org/2001/XInclude" name="rendertype"></xslt:param><xsl:template match="lenya:asset-dot[@class='image']">

    <a href="{@href}"> 
      <img alt="Insert Identity" src="resources/uploadimage.gif"/>  
    </a> 
  </xsl:template><xsl:template match="lenya:asset-dot[@class='floatImage']">
    <a href="{@href}">
      float
    </a> 
  </xsl:template><xsl:template match="lenya:asset-dot[@class='delete']">
    <a href="{@href}">
      <img alt="Insert Identity" src="resources/delete.gif"/>
    </a> 
  </xsl:template><xsl:template match="lenya:asset-dot[@class='asset']">

    <a href="{@href}">
      <img alt="Insert Asset" src="resources/uploadasset.gif"/>
    </a>  
  </xsl:template><xsl:template match="dc:title">
    <h1>
      <xsl:if test="$rendertype = 'edit'">
        <xsl:attribute name="bxe_xpath">/xhtml:<xsl:value-of select="$document-element-name"/>/lenya:meta/dc:title</xsl:attribute>
      </xsl:if>

      <xsl:apply-templates/>
    </h1>
  </xsl:template><xsl:template match="xhtml:iframe">
    <xsl:copy>
      <xsl:choose>
        <xsl:when test="$querystring">
          <xsl:choose>
            <xsl:when test="contains(@src,'?')">
              <xsl:attribute name="src"><xsl:value-of select="@src"/>&amp;<xsl:value-of select="$querystring"/></xsl:attribute>

            </xsl:when>
            <xsl:otherwise>
              <xsl:attribute name="src"><xsl:value-of select="@src"/>?<xsl:value-of select="$querystring"/></xsl:attribute>
            </xsl:otherwise>
          </xsl:choose>
        </xsl:when>
        <xsl:otherwise>
          <xsl:attribute name="src"><xsl:value-of select="@src"/></xsl:attribute>

        </xsl:otherwise>
      </xsl:choose>
      <xsl:apply-templates select="@*[name() != 'src']"/>
      <xsl:apply-templates/>
    </xsl:copy> 
  </xsl:template><xsl:template match="unizh:sitemap">
    <xsl:variable name="sitemap-nodes" select="count(descendant::unizh:node)"/>
    <xsl:variable name="center" select="descendant::unizh:node[round($sitemap-nodes div 2)]"/>
    <div class="content1">

      <xsl:apply-templates select="unizh:node[not(preceding-sibling::unizh:node[descendant-or-self::unizh:node = $center])]"/>
    </div>
    <div class="content2"> 
      <xsl:apply-templates select="unizh:node[preceding-sibling::unizh:node[descendant-or-self::unizh:node = $center]]"/>
    </div>
  </xsl:template><xsl:template match="unizh:node[parent::unizh:sitemap]">
    <div class="navtitel">
      <a href="{$contextprefix}{@href}"><xsl:value-of select="unizh:title"/></a>
    </div>

    <div class="solidline">
      <img alt="separation line" height="1" src="resources/1.gif" width="1"/>
    </div>
    <ul class="sitemap">
      <xsl:apply-templates mode="firstlevel" select="unizh:node"/>
      
    </ul>
    <div> </div>
  </xsl:template><xsl:template match="unizh:node" mode="firstlevel">

    <li>
      <a href="{$contextprefix}{@href}"><xsl:value-of select="unizh:title"/></a>
      <xsl:if test="unizh:node">
        <ul>
          <xsl:apply-templates select="unizh:node"/>
        </ul>
      </xsl:if>
    </li>
    <div class="dotline">

      <img alt="separation line" height="1" src="resources/1.gif" width="1"/>
    </div>
  </xsl:template><xsl:template match="unizh:node">
    <li>
      <a href="{$contextprefix}{@href}"><xsl:value-of select="unizh:title"/></a>
      <xsl:if test="unizh:node">
        <ul>
          <xsl:apply-templates select="unizh:node"/>
        </ul>

      </xsl:if>
    </li>
  </xsl:template><xsl:template match="xhtml:p[parent::xhtml:body and $rendertype = 'imageupload']">

    <xsl:choose>
      <xsl:when test="xhtml:object[@float = 'true']">
        <div class="upload_block">
          <xsl:copy>
            <xsl:apply-templates select="@*|*[not(self::lenya:asset-dot)]|text()"/>

          </xsl:copy>
          <xsl:if test="lenya:asset-dot">
            <br class="floatclear"/>
            <hr/>
            <xsl:apply-templates select="lenya:asset-dot"/>
            <br/>
            <br/>
          </xsl:if>
        </div>

      </xsl:when>

      <xsl:when test="preceding-sibling::*[1]/@float = 'true'">
        <div class="upload_block">
          <xsl:apply-templates mode="preprocess" select="preceding-sibling::*[1]"/>
          <xsl:copy>
            <xsl:apply-templates select="@*|*[not(self::lenya:asset-dot)]|text()"/>
          </xsl:copy>
          <xsl:if test="lenya:asset-dot">

            <br class="floatclear"/>
            <hr/>
            <xsl:apply-templates select="lenya:asset-dot"/>
            <br/>
            <br/>
          </xsl:if>
        </div>
      </xsl:when>

      <xsl:otherwise>
        <div class="upload_block">
          <xsl:copy>
            <xsl:apply-templates select="@*|*[not(self::lenya:asset-dot)]|text()"/>
          </xsl:copy>
          <xsl:if test="lenya:asset-dot">
            <br class="floatclear"/>
            <hr/>
            <xsl:apply-templates select="lenya:asset-dot"/>

            <br/>
            <br/>
          </xsl:if>
        </div>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template><xsl:template match="xhtml:p[parent::unizh:lead and $rendertype = 'imageupload']">
    <xsl:copy>
      <xsl:apply-templates select="*[not(self::lenya:asset-dot)]|text()"/>

      <br/>
      <xsl:apply-templates select="lenya:asset-dot"/>
    </xsl:copy>
  </xsl:template><xsl:template match="lenya:asset[$rendertype = 'imageupload']">
    <a class="download" href="{lenya:asset-dot/@href}">
      <xsl:value-of select="text()"/>
    </a>
    <br/>
  </xsl:template><xsl:template match="lenya:asset[parent::xhtml:body and $rendertype = 'imageupload']">

    <a class="download" href="{lenya:asset-dot[1]/@href}">
      <xsl:value-of select="text()"/>
    </a>
    <br/>
    <xsl:if test="lenya:asset-dot[2]">
      <hr/>
      <xsl:apply-templates select="lenya:asset-dot[2]"/>
      <br/>
      <br/>

    </xsl:if>
  </xsl:template><xsl:template match="xhtml:a[@href != '']">
    <a href="{@href}">
      <xsl:attribute name="class">
        <xsl:choose>
          <xsl:when test="starts-with(@href, 'http://') and not(contains(@href, '.unizh.ch'))">
            <xsl:text>extern</xsl:text>
          </xsl:when>

          <xsl:otherwise>
            <xsl:text>arrow</xsl:text>
          </xsl:otherwise>
        </xsl:choose>
      </xsl:attribute>
      <xsl:copy-of select="@target"/>
      <xsl:apply-templates/>
    </a>

  </xsl:template><xsl:template match="xhtml:a[ancestor::unizh:teaser and parent::xhtml:p]">
    <a href="{@href}">
      <xsl:copy-of select="@target"/>
      <xsl:value-of select="text()"/>
      
    </a>
  </xsl:template><xsl:template match="xhtml:a[normalize-space(.) = '' and @name != '']">
    <a class="namedanchor" name="{@name}"/>
  </xsl:template><xsl:template match="xhtml:a[(@name != '') and (not(@href) or (@href = ''))]">
    <xsl:copy>

      <xsl:attribute name="class">
        <xsl:text>namedanchor</xsl:text>
      </xsl:attribute>
      <xsl:apply-templates select="@*|node()"/>
    </xsl:copy>
  </xsl:template><xsl:template match="unizh:attention">
    <span class="attention">
      <xsl:apply-templates/>

    </span>
  </xsl:template><xsl:template match="unizh:related-content">
    <xsl:apply-templates/>
  </xsl:template><xsl:template match="unizh:teaser">
    <div class="relatedboxborder">
      <div class="relatedboxcont">
        <xsl:if test="xhtml:object">
          <xsl:apply-templates select="xhtml:object"/>
          <br/>

        </xsl:if>
        <b><xsl:value-of select="unizh:title"/></b><br/>
        <xsl:apply-templates select="xhtml:p"/>
        <xsl:for-each select="lenya:asset">
          <xsl:apply-templates select="."/>
        </xsl:for-each>
        <xsl:for-each select="xhtml:a">
          <a href="{@href}">
            <xsl:attribute name="class">

              <xsl:choose>
                <xsl:when test="starts-with(@href, 'http://') and not(contains(@href, '.unizh.ch'))">
                  <xsl:text>extern</xsl:text>
                </xsl:when>
                <xsl:otherwise>
                  <xsl:text>arrow</xsl:text>
                </xsl:otherwise>
              </xsl:choose>

            </xsl:attribute>
            <xsl:copy-of select="@target"/>
            <xsl:apply-templates/>
          </a>
          <br/>
        </xsl:for-each> 
        <xsl:apply-templates select="lenya:asset-dot"/>
        <xsl:apply-templates select="unizh:title/lenya:asset-dot"/>
      </div> 
    </div>

  </xsl:template><xsl:template match="unizh:teaser[parent::unizh:column]">
    <xsl:choose>
      <xsl:when test="preceding-sibling::* or ../../unizh:lead/xhtml:object or ../../unizh:lead/xhtml:p/descendant-or-self::*[text()]">
        <div class="solidlinemitmargin">
          <img alt="separation line" height="1" src="resources/1.gif" width="1"/>
        </div>
      </xsl:when>
      <xsl:otherwise>
        <div class="solidline">

          <img alt="separation line" height="1" src="resources/1.gif" width="1"/>
        </div>
      </xsl:otherwise>
    </xsl:choose>
    <div class="kleintitel">
      <xsl:value-of select="unizh:title"/>
    </div>
    <xsl:choose>
      <xsl:when test="xhtml:object">

        <xsl:apply-templates select="xhtml:object"/>
      </xsl:when>
      <xsl:otherwise>
        <div class="dotline"><img alt="separation line" height="1" src="resources/1.gif" width="1"/></div>
      </xsl:otherwise>
    </xsl:choose>
    <xsl:apply-templates select="xhtml:p"/>
    <xsl:for-each select="lenya:asset">
      <xsl:apply-templates select="."/>

    </xsl:for-each>
    <xsl:for-each select="xhtml:a">
      <a class="arrow" href="{@href}"><xsl:value-of select="."/></a><br/>
    </xsl:for-each>
    <xsl:apply-templates select="lenya:asset-dot"/>
    <xsl:apply-templates select="unizh:title/lenya:asset-dot"/> 
    <div class="dotlinemitmargin"><img alt="separation line" height="1" src="resources/1.gif" width="1"/></div>
  </xsl:template><xsl:template match="unizh:links[unizh:title/@href != '']">
    <xsl:choose>

      <xsl:when test="preceding-sibling::* or ../../unizh:lead/xhtml:object or ../../unizh:lead/xhtml:p/descendant-or-self::*[text()]">
        <div class="solidlinemitmargin">
          <img alt="separation line" height="1" src="resources/1.gif" width="1"/>
        </div>
      </xsl:when>
      <xsl:otherwise>
        <div class="solidline">
          <img alt="separation line" height="1" src="resources/1.gif" width="1"/>
        </div>

      </xsl:otherwise>
    </xsl:choose>
    <div class="kleintitel">
      <a href="{unizh:title/@href}"><xsl:value-of select="unizh:title"/></a>
    </div>
    <xsl:apply-templates select="unizh:title/lenya:asset-dot"/>
    <xsl:choose>
      <xsl:when test="xhtml:object">
        <xsl:apply-templates select="xhtml:object"/>

      </xsl:when>
      <xsl:otherwise>
        <div class="dotline"><img alt="separation line" height="1" src="resources/1.gif" width="1"/></div>
      </xsl:otherwise>
    </xsl:choose>
    <ul class="linknav">
      <xsl:for-each select="xhtml:a">
        <li>
          <a href="{@href}">

            <xsl:value-of select="."/>
          </a>
          <div class="dotline">
            <img alt="separation line" height="1" src="resources/1.gif" width="1"/>
          </div>
        </li>
      </xsl:for-each>
    </ul>
  </xsl:template><xsl:template match="unizh:links">

    <xsl:choose>
      <xsl:when test="preceding-sibling::* or ../../unizh:lead/xhtml:object or ../../unizh:lead/xhtml:p/descendant-or-self::*[text()]">
        <div class="solidlinemitmargin">
          <img alt="separation line" height="1" src="resources/1.gif" width="1"/>
        </div>
      </xsl:when>
      <xsl:otherwise>
        <div class="solidline">
          <img alt="separation line" height="1" src="resources/1.gif" width="1"/>

        </div>
      </xsl:otherwise>
    </xsl:choose>
    <div class="kleintitel">
      <xsl:value-of select="unizh:title"/>
    </div>
    <xsl:apply-templates select="unizh:title/lenya:asset-dot"/>
    <xsl:choose>
      <xsl:when test="xhtml:object">

        <xsl:apply-templates select="xhtml:object"/>
      </xsl:when>
      <xsl:otherwise>
        <div class="dotline"><img alt="separation line" height="1" src="resources/1.gif" width="1"/></div>
      </xsl:otherwise>
    </xsl:choose>
    <ul class="linknav">
      <xsl:for-each select="xhtml:a">
        <li>

          <a href="{@href}">
            <xsl:value-of select="."/>
          </a>
          <div class="dotline">
            <img alt="separation line" height="1" src="resources/1.gif" width="1"/>
          </div>
        </li>
      </xsl:for-each>
    </ul>

  </xsl:template><xsl:template match="unizh:contcol1[parent::unizh:homepage or parent::unizh:homepage4cols]">
    <div bxe_xpath="/{$document-element-name}/unizh:contcol1" class="contcol1">
      <xsl:apply-templates/>
    </div>
  </xsl:template><xsl:template match="unizh:quicklinks">
    <div class="quicklinks" id="quicklink">
      <div class="solidline">
        <img alt="separation line" height="1" src="resources/1.gif" width="1"/>
      </div>

      <p class="titel"><xsl:value-of select="@label"/></p>
      <div class="dotlinelead">
        <img alt="separation line" height="1" src="resources/1.gif" width="1"/>
      </div>
      <xsl:for-each select="unizh:quicklink">
        <xsl:apply-templates select="xhtml:p"/>
        <ul>
          <xsl:for-each select="xhtml:a">
            <li>

              <a href="{@href}"><xsl:value-of select="."/></a>
            </li>
          </xsl:for-each>
        </ul>
        <div class="dotline"><img alt="separation line" height="1" src="resources/1.gif" width="1"/></div>
      </xsl:for-each>
    </div>
  </xsl:template><xsl:template match="xhtml:body//xhtml:h2">
    <h2>

      <xsl:if test="@class">
        <xsl:copy-of select="@class"/>
      </xsl:if>
      <xsl:apply-templates/>
      <xsl:choose>
        <xsl:when test="xhtml:a">
          <a class="namedanchor" name="{xhtml:a/@name}"/>
        </xsl:when>
        <xsl:otherwise>

          <a class="namedanchor" name="{position()}"/>
        </xsl:otherwise>
      </xsl:choose>
    </h2>
  </xsl:template><xsl:template name="substring-after-last">
    <xsl:param name="input"/>
    <xsl:param name="substr"/>
    <xsl:variable name="temp" select="substring-after($input, $substr)"/>
    <xsl:choose>

      <xsl:when test="$substr and contains($temp, $substr)">
        <xsl:call-template name="substring-after-last">
          <xsl:with-param name="input" select="$temp"/>
          <xsl:with-param name="substr" select="$substr"/>
        </xsl:call-template>
      </xsl:when>
      <xsl:otherwise>
        <xsl:value-of select="$temp"/>
      </xsl:otherwise>

    </xsl:choose>
  </xsl:template><xsl:template match="lenya:asset">
    <xsl:variable name="extent">
      <xsl:value-of select="dc:metadata/dc:extent"/>
    </xsl:variable>
    <xsl:variable name="suffix">
      <xsl:call-template name="substring-after-last">
        <xsl:with-param name="input" select="@src"/>
        <xsl:with-param name="substr">.</xsl:with-param>

      </xsl:call-template>
    </xsl:variable>
    <xsl:choose>
      <xsl:when test="$suffix = 'swf'">
        <xsl:variable name="width">
          <xsl:choose>
            <xsl:when test="@size != ''"><xsl:value-of select="substring-before(@size, 'x')"/></xsl:when>
            <xsl:otherwise>500</xsl:otherwise>

          </xsl:choose> 
        </xsl:variable>
        <xsl:variable name="height">
          <xsl:choose>
            <xsl:when test="@size != ''"><xsl:value-of select="substring-after(@size, 'x')"/></xsl:when>
            <xsl:otherwise>400</xsl:otherwise>
          </xsl:choose>
        </xsl:variable>
        <object height="{$height}" width="{$width}">

          <param name="movie" value="{$nodeid}/{@src}"/><embed height="{$height}" pluginspage="http://www.macromedia.com/shockwave/download/index.cgi?P1_Prod_Version=ShockwaveFlash" src="resources/{@src}" type="application/x-shockwave-flash" width="{$width}"/>
        </object>
      </xsl:when>
      <xsl:otherwise>
        <div class="asset">
          <xsl:text> </xsl:text>
          <a class="download" href="{$nodeid}/{@src}">
            <xsl:value-of select="text()"/>

          </a>
          (<xsl:value-of select="format-number($extent div 1024, '#.#')"/>KB, <img alt="{text()}" src="resources/{$suffix}.gif" title="{text()}"/>)
        </div>
        <xsl:if test="parent::xhtml:body and not(following-sibling::*[1][name() = 'lenya:asset'])">
          <br/>
        </xsl:if>
      </xsl:otherwise>
    </xsl:choose>

  </xsl:template><xsl:template match="unizh:toc">
    <p>
      <xsl:for-each select="../*">
        <xsl:if test="self::xhtml:h2">
          <a class="arrow" href="#{position()}"><xsl:value-of select="."/></a><br/>
        </xsl:if>
      </xsl:for-each>
    </p>
  </xsl:template><xsl:template match="unizh:toplink">

    <div class="topnav"><a href="#top">top</a></div>  
  </xsl:template><xsl:template match="xhtml:h2[ancestor::index:child]" mode="anchor"/><xsl:template match="unizh:children[descendant::unizh:newsitem | descendant::unizh:person]">
    <xsl:apply-templates select="index:child"/>
  </xsl:template><xsl:template match="unizh:level">
    <xsl:apply-templates select="level:node"/>
  </xsl:template><xsl:template match="level:node">
    <a class="arrow" href="{$contextprefix}{@href}"><xsl:value-of select="descendant::dc:title"/></a><br/>
  </xsl:template><xsl:template match="xhtml:div[@id='link-to-parent']">
    <p>

      <xhtml:a class="back" href="{@href}"><xsl:value-of select="."/></xhtml:a>
    </p>
  </xsl:template><xsl:template match="unizh:children[ancestor::unizh:news]">
    <xsl:if test="preceding-sibling::xhtml:object">
      <br class="floatclear"/>
    </xsl:if>
    <xsl:choose>
      <xsl:when test="index:child">
        <xsl:for-each select="index:child">

          <xsl:variable name="creationdate" select="*/*/lenya:meta/dcterms:created"/>
          <div class="solidline"><img alt="separation line" height="1" src="resources/1.gif" width="1"/></div>
          &#9;  <h2><xsl:value-of select="*/*/lenya:meta/dc:title"/> 
            <span class="lead">
              <xsl:choose>
                <xsl:when test="string-length($creationdate) &lt; '25'">
                  <i18n:date pattern="EEE, d. MMM yyyy HH:mm" src-locale="en" src-pattern="d. MMM yyyy HH:mm" value="{$creationdate}"/>
                </xsl:when>
                <xsl:otherwise>

                  <i18n:date pattern="EEE, d. MMM yyyy HH:mm" src-locale="en" src-pattern="EEE MMM d HH:mm:ss zzz yyyy" value="{$creationdate}"/>
                </xsl:otherwise>
              </xsl:choose>
            </span>
          </h2>
          <p>
            <xsl:apply-templates select="*/*/unizh:short/xhtml:object"/>
            <xsl:apply-templates select="*/*/unizh:short/xhtml:p"/>
            <xsl:choose>

              <xsl:when test="*/*/xhtml:body/xhtml:p != ' '">
                <a class="arrow" href="{$contextprefix}{@href}">Weiter</a>
              </xsl:when>
              <xsl:otherwise>
                <a class="arrow" href="{*/*/unizh:short/xhtml:a/@href}">
                  <xsl:value-of select="*/*/unizh:short/xhtml:a"/>
                </a>
                <xsl:if test="$area = 'authoring'">

                  |  <a class="arrow" href="{$contextprefix}{@href}">Edit View...</a>
                </xsl:if>
              </xsl:otherwise>
            </xsl:choose>
            <br/>
          </p>
        </xsl:for-each>
      </xsl:when>

      <xsl:otherwise>
        - Noch kein Eintrag erfasst - <br/> 
      </xsl:otherwise>
    </xsl:choose>
    <br/>
  </xsl:template><xsl:template match="xhtml:p[parent::unizh:short]">
    <xsl:apply-templates/>
  </xsl:template><xsl:template match="xhtml:p[parent::xhtml:body and ($rendertype != 'imageupload')]">
    <xsl:choose>

      <xsl:when test="xhtml:object[@float = 'true']">
        <div class="img_block">
          <xsl:copy>
            <xsl:apply-templates/>
          </xsl:copy>
          <br class="floatclear"/>
        </div>
      </xsl:when>

      <xsl:when test="preceding-sibling::*[1]/@float = 'true'">
        <div class="img_block">
          <xsl:apply-templates mode="preprocess" select="preceding-sibling::*[1]"/>
          <xsl:copy>
            <xsl:apply-templates/>
          </xsl:copy>
          <br class="floatclear"/>
        </div>
      </xsl:when>

      <xsl:otherwise>
        <xsl:copy>
          <xsl:apply-templates/>
        </xsl:copy>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template><xsl:template match="unizh:children[ancestor::unizh:team]">
    <xsl:choose>

      <xsl:when test="index:child">
        <xsl:for-each select="index:child">
          <div class="teamBlock">
            <div class="teamImg">
              <xsl:apply-templates select="*/unizh:person/xhtml:object"/>
            </div>
            <div class="teamText">
              <p>
                <b>

                  <xsl:if test="*/unizh:person/unizh:academictitle != ''">
                    <xsl:value-of select="*/unizh:person/unizh:academictitle"/> 
                  </xsl:if>
                  <xsl:value-of select="*/unizh:person/unizh:firstname"/> 
                  <xsl:value-of select="*/unizh:person/unizh:lastname"/> 
                </b>
                <br/>
                <xsl:value-of select="*/unizh:person/unizh:position"/><br/>
                Mail: <xsl:value-of select="*/unizh:person/unizh:email"/><br/>
                <a href="{$contextprefix}{@href}">Mehr...</a>

              </p>
            </div>
            <div class="floatleftclear"/>
          </div>
          <div class="solidline">
            <img alt="separation line" height="1" src="resources/1.gif" width="1"/>
          </div>
        </xsl:for-each>
      </xsl:when>

      <xsl:otherwise>
        <p> <br/> - Noch kein Eintrag erfasst - </p>
      </xsl:otherwise>
    </xsl:choose>
    <br/>
  </xsl:template><xsl:template match="unizh:children">
    <xsl:apply-templates select="index:child"/>

  </xsl:template><xsl:template match="index:child[descendant::unizh:newsitem]">
    <h3>
      <xsl:apply-templates select="descendant::lenya:meta/dc:title"/>
    </h3>
    <br/>
    <xsl:apply-templates mode="collection" select="descendant::unizh:lead"/>
    <a href="{$contextprefix}{@href}">Mehr...</a>
  </xsl:template><xsl:template match="unizh:lead[parent::xhtml:body]">

    <xsl:choose>
      <xsl:when test="xhtml:object or (xhtml:p/descendant-or-self::*[text()])">
        <div bxe_xpath="/{$document-element-name}/xhtml:body/unizh:lead" class="leadblock">
          <xsl:apply-templates/>
        </div>
      </xsl:when>
      <xsl:otherwise/>
    </xsl:choose>
  </xsl:template><xsl:template match="unizh:lead">

    <xsl:apply-templates/>
  </xsl:template><xsl:template match="index:child">
    <p>
      <xsl:apply-templates mode="index" select="descendant::lenya:meta/dc:title">
        <xsl:with-param name="href">
          <xsl:value-of select="@href"/>
        </xsl:with-param>
      </xsl:apply-templates>
      <xsl:if test="../@abstracts = 'true'">

        <br/>
        <xsl:apply-templates mode="index" select="descendant::lenya:meta/dc:description"/>
      </xsl:if>
    </p>
  </xsl:template><xsl:template match="dc:title" mode="index">
    <xsl:param name="href"/>
    <a class="arrow" href="{$contextprefix}{$href}">
      <xsl:value-of select="."/>
    </a>

  </xsl:template><xsl:template match="dc:description" mode="index">
    <xsl:value-of select="."/>
  </xsl:template><xsl:template match="dc:description" mode="collection">
    <xsl:value-of select="."/>
  </xsl:template><xsl:template match="xhtml:table[@class = 'ornate']">
    <xsl:variable name="cols">
      <xsl:value-of select="count(xhtml:tr[1]/xhtml:td [not(@colspan)]) + count(xhtml:tr[1]/xhtml:th [not(@colspan)]) + sum (xhtml:tr[1]/xhtml:td/@colspan) + sum (xhtml:tr[1]/xhtml:th/@colspan)"/>
    </xsl:variable>
    <div class="solidlinetable">

      <img alt="separation line" height="1" src="resources/1.gif" width="1"/>
    </div> 
    <xsl:if test="xhtml:caption">
      <div class="tabletitel">
        <xsl:value-of select="xhtml:caption"/>
      </div>
      <div class="dotline"><img alt="separation line" height="1" src="resources/1.gif" width="1"/></div>
    </xsl:if>
    <xsl:copy>

      <xsl:attribute name="width">100%</xsl:attribute>
      <xsl:for-each select="xhtml:tr">
        <tr>
          <xsl:apply-templates select="xhtml:td | xhtml:th"/>
        </tr>
        <tr>
          <td align="left" colspan="{$cols}">
            <div class="dotline">

              <img alt="separation line" height="1" src="resources/1.gif" width="1"/>
            </div>
          </td>
        </tr>
      </xsl:for-each>
    </xsl:copy>
  </xsl:template><xsl:template match="xhtml:table[@class = 'grid']">
    <xsl:copy>
      <xsl:copy-of select="@class"/>

      <xsl:attribute name="width">100%</xsl:attribute>
      <xsl:apply-templates/>
    </xsl:copy>
  </xsl:template><xsl:template match="xhtml:table[@class = 'striped']">
    <xsl:copy>
      <xsl:copy-of select="@class"/>
      <xsl:attribute name="width">100%</xsl:attribute>
      <xsl:for-each select="xhtml:tr">

        <xsl:variable name="eins"><xsl:value-of select="position()"/></xsl:variable>
        <xsl:copy>
          <xsl:if test="($eins div 2) = round($eins div 2)">
            <xsl:attribute name="class">strip</xsl:attribute>
          </xsl:if>
          <xsl:apply-templates/>
        </xsl:copy>
      </xsl:for-each>

    </xsl:copy>
  </xsl:template><xsl:template match="xhtml:textarea">
    <xsl:copy>
      <xsl:apply-templates select="@*|node()"/> 
    </xsl:copy>
  </xsl:template> 
  <xslt:param xmlns:xslt="http://www.w3.org/1999/XSL/Transform" xmlns:xi="http://www.w3.org/2001/XInclude" name="documentid">/xhtml</xslt:param><xslt:param xmlns:xslt="http://www.w3.org/1999/XSL/Transform" xmlns:xi="http://www.w3.org/2001/XInclude" name="nodeid">xhtml</xslt:param><xslt:param xmlns:xslt="http://www.w3.org/1999/XSL/Transform" xmlns:xi="http://www.w3.org/2001/XInclude" name="contextprefix">/lenya</xslt:param><xslt:param xmlns:xslt="http://www.w3.org/1999/XSL/Transform" xmlns:xi="http://www.w3.org/2001/XInclude" name="rendertype"></xslt:param><xsl:template name="width-attribute">
    <xsl:choose>

      <xsl:when test="@popup = 'true'">
        <xsl:choose>
          <xsl:when test="@width &gt; 0">
            <xsl:value-of select="@width"/>
          </xsl:when>
          <xsl:otherwise>
            <xsl:text>204</xsl:text>
          </xsl:otherwise>

        </xsl:choose>
      </xsl:when>
      <xsl:when test="not(@width) or (@width = '')">
        <xsl:text>204</xsl:text>
      </xsl:when>
      <xsl:when test="(@float = 'true') and not(@align = 'right')">
        <xsl:text>204</xsl:text>
      </xsl:when>

      <xsl:when test="/document/content/xhtml:html/@unizh:columns = 1">
        <xsl:choose>
          <xsl:when test="@width &gt; 800">
            <xsl:text>800</xsl:text>
          </xsl:when>
          <xsl:otherwise>
            <xsl:value-of select="@width"/>
          </xsl:otherwise>

        </xsl:choose>
      </xsl:when>
      <xsl:when test="/document/content/xhtml:html/@unizh:columns = 2"> 
        <xsl:choose>
          <xsl:when test="@width &gt; 615">
            <xsl:text>615</xsl:text>
          </xsl:when>
          <xsl:otherwise>
            <xsl:value-of select="@width"/>

          </xsl:otherwise>
        </xsl:choose>
      </xsl:when>
      <xsl:when test="@width &gt; 415">
        <xsl:text>415</xsl:text>
      </xsl:when>
      <xsl:otherwise>
        <xsl:value-of select="@width"/>

      </xsl:otherwise>
    </xsl:choose>
  </xsl:template><xsl:template match="xhtml:object" mode="preprocess">
    <xsl:choose>
      <xsl:when test="xhtml:div[@class = 'caption'] or (@popup = 'true')">
        <xsl:apply-templates mode="withCaption" select="."/>
      </xsl:when>
      <xsl:otherwise>
        <xsl:apply-templates mode="plain" select="."/>

      </xsl:otherwise>
    </xsl:choose>
  </xsl:template><xsl:template match="xhtml:object" mode="plain">

    <div>
      <xsl:attribute name="class">
        <xsl:choose>
          <xsl:when test="(@float = 'true') and (@align = 'right')">
            <xsl:text>imgTextflussLeft</xsl:text>

          </xsl:when>
          <xsl:when test="@float = 'true'">
            <xsl:text>imgTextfluss</xsl:text>
          </xsl:when>
          <xsl:otherwise/>
        </xsl:choose>
      </xsl:attribute>

      <xsl:call-template name="object">

        <xsl:with-param name="width">
          <xsl:call-template name="width-attribute"/>
        </xsl:with-param>
      </xsl:call-template>

    </div>
  </xsl:template><xsl:template match="xhtml:object" mode="withCaption">
    <xsl:variable name="width">
      <xsl:call-template name="width-attribute"/>

    </xsl:variable>
    
    
    <table border="0" cellpadding="0" cellspacing="0" width="{$width}">
      <xsl:attribute name="class">
        <xsl:choose>
          <xsl:when test="(@float = 'true') and (@align = 'right')">
            <xsl:text>imgRightMitLegende</xsl:text>
          </xsl:when>
          <xsl:when test="@float = 'true'">

            <xsl:text>imgTextfluss</xsl:text>
          </xsl:when>
          <xsl:otherwise>
            <xsl:text>imgMitLegende</xsl:text>
          </xsl:otherwise>
        </xsl:choose>
      </xsl:attribute>
      
      <tr>

        <td class="flexibleimage">
          <xsl:call-template name="object">
            <xsl:with-param name="width">
              <xsl:value-of select="$width"/>
            </xsl:with-param>
          </xsl:call-template>
        </td>
      </tr>
      <tr>

        <td>
          <div class="legende">
            <xsl:value-of select="xhtml:div[@class = 'caption']"/>
            <xsl:if test="@popup = 'true'">
              <a href="#" onClick="window.open('{$nodeid}/{@data}', 'Image', 'width={dc:metadata/lenya:meta/lenya:width},height={dc:metadata/lenya:meta/lenya:height}')">(+)</a>
            </xsl:if>
          </div>
        </td>

      </tr>
    </table>

  </xsl:template><xsl:template match="xhtml:object[ancestor::xhtml:table]">
    <xsl:choose>
      <xsl:when test="xhtml:div[@class = 'caption']"> 
        <table border="0" cellpadding="0" cellspacing="0" class="imgMitLegende" width="100">
          <tr>
            <td class="flexibleimage">
              <xsl:choose>

                <xsl:when test="@width != ''">
                  <xsl:call-template name="object">
                    <xsl:with-param name="width" select="@width"/>
                  </xsl:call-template>
                </xsl:when>
                <xsl:otherwise>
                  <xsl:call-template name="object">
                    <xsl:with-param name="width">100</xsl:with-param>

                  </xsl:call-template>
                </xsl:otherwise>
              </xsl:choose>
            </td>
          </tr>
          <tr>
            <td>
              <div class="legende">
                <xsl:apply-templates select="xhtml:div[@class = 'caption']"/>

              </div>
            </td>
          </tr>
        </table>
      </xsl:when>
      <xsl:otherwise>
        <xsl:choose>
          <xsl:when test="@width != ''">
            <xsl:call-template name="object">

              <xsl:with-param name="width" select="@width"/>
            </xsl:call-template>
          </xsl:when>
          <xsl:otherwise>
            <xsl:call-template name="object">
              <xsl:with-param name="width">100</xsl:with-param>
            </xsl:call-template>
          </xsl:otherwise>

        </xsl:choose>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template><xsl:template match="xhtml:object[parent::unizh:contcol1]">
    <xsl:call-template name="object">
      <xsl:with-param name="width">160</xsl:with-param>
    </xsl:call-template>
  </xsl:template><xsl:template match="xhtml:object[parent::unizh:teaser and ancestor::unizh:related-content]">

    <xsl:call-template name="object">
      <xsl:with-param name="width">160</xsl:with-param>
    </xsl:call-template>
  </xsl:template><xsl:template match="xhtml:object[parent::unizh:teaser and ancestor::unizh:column]">
    <xsl:variable name="src" select="concat($nodeid, '/', @data)"/>
    <xsl:variable name="alt">
      <xsl:choose>
        <xsl:when test="@title != ''">

          <xsl:value-of select="@title"/>
        </xsl:when>
        <xsl:otherwise>
          <xsl:value-of select="dc:metadata/dc:title"/>
        </xsl:otherwise>
      </xsl:choose>
    </xsl:variable>

    <div class="teaser64long">

      <img alt="{$alt}" class="teaser64long" height="64" src="resources/" width="198"/>
    </div>
  </xsl:template><xsl:template match="xhtml:object[parent::unizh:links]">
    <xsl:variable name="src" select="concat($nodeid, '/', @data)"/>
    <xsl:variable name="alt">
      <xsl:choose>
        <xsl:when test="@title != ''">
          <xsl:value-of select="@title"/>
        </xsl:when>

        <xsl:otherwise>
          <xsl:value-of select="dc:metadata/dc:title"/>
        </xsl:otherwise>
      </xsl:choose>
    </xsl:variable>

    <div class="teaser64long">
      <img alt="{$alt}" class="teaser64long" height="64" src="resources/" width="198"/>
    </div>

  </xsl:template><xsl:template match="xhtml:object[parent::unizh:lead]">
    <xsl:variable name="src" select="concat($nodeid, '/', @data)"/>
    <xsl:variable name="alt">
      <xsl:choose>
        <xsl:when test="@title != ''">
          <xsl:value-of select="@title"/>
        </xsl:when>
        <xsl:otherwise>
          <xsl:value-of select="dc:metadata/dc:title"/>

        </xsl:otherwise>
      </xsl:choose>
    </xsl:variable>

    <xsl:choose>
      <xsl:when test="not(following-sibling::xhtml:p) or not(following-sibling::xhtml:p/descendant-or-self::*[text()])">
        <img alt="{$alt}" class="leadimg_mittopmargin" src="resources/" width="413"/>
      </xsl:when>
      <xsl:otherwise>

        <img alt="{$alt}" class="leadimg_mittopmargin" src="resources/" width="198"/>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template><xsl:template match="xhtml:object[ancestor::unizh:news and not(parent::unizh:teaser)]">
    <div class="imgTextfluss">
      <xsl:call-template name="object">
        <xsl:with-param name="width">204</xsl:with-param>
      </xsl:call-template>

    </div>
  </xsl:template><xsl:template match="xhtml:object[parent::unizh:short]">
    <div class="imgTextfluss">
      <xsl:choose>
        &#9;<xsl:when test="ancestor::index:child">
          &#9;  <xsl:call-template name="object">
            &#9;    <xsl:with-param name="src" select="concat($contextprefix, substring-before(../../../../@href, '.html'), '/', @data)"/>
            &#9;    <xsl:with-param name="width">100</xsl:with-param>
            &#9;  </xsl:call-template>

          &#9;</xsl:when>
        &#9;<xsl:otherwise>
          &#9;  <xsl:call-template name="object">
            &#9;    <xsl:with-param name="width">100</xsl:with-param>
            &#9;  </xsl:call-template>
          &#9;</xsl:otherwise>
      </xsl:choose>
    </div>
  </xsl:template><xsl:template match="xhtml:object[parent::unizh:person]">
    <xsl:choose>

      <xsl:when test="not(@data)">
        <xsl:call-template name="object">
          <xsl:with-param name="src" select="concat($imageprefix, '/default_head.gif')"/>
        </xsl:call-template>
      </xsl:when>
      <xsl:otherwise>
        <xsl:choose>
          <xsl:when test="ancestor::index:child">
            <xsl:choose>

              <xsl:when test="contains(../../../@href, '_')">
                <xsl:call-template name="object">
                  <xsl:with-param name="src" select="concat($contextprefix, substring-before(../../../@href, '_'), '/', @data)"/>
                  <xsl:with-param name="width">100</xsl:with-param>
                </xsl:call-template>
              </xsl:when>
              <xsl:otherwise>
                <xsl:call-template name="object">

                  <xsl:with-param name="src" select="concat($contextprefix, substring-before(../../../@href, '.html'), '/', @data)"/>
                  <xsl:with-param name="width">100</xsl:with-param>
                </xsl:call-template>
              </xsl:otherwise>
            </xsl:choose>
          </xsl:when>
          <xsl:otherwise>
            <xsl:call-template name="object">

              <xsl:with-param name="width">100</xsl:with-param>
            </xsl:call-template>
          </xsl:otherwise>
        </xsl:choose>
      </xsl:otherwise>
    </xsl:choose> 
  </xsl:template><xsl:template match="xhtml:object[ancestor::xhtml:body and not(parent::unizh:links) and not(parent::unizh:lead) and not(ancestor::xhtml:table) and not(parent::unizh:person)]">
    <xsl:choose>
      <xsl:when test="not(@float = 'true') or not(parent::xhtml:body)">

        <xsl:apply-templates mode="preprocess" select="."/>
      </xsl:when>
      <xsl:when test="name(following-sibling::*[1]) = 'p' or name(following-sibling::*[1]) = 'xhtml:p'"/>
      <xsl:otherwise>
        <xsl:apply-templates mode="preprocess" select="."/>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template><xsl:template name="object">

    <xsl:param name="width"/>
    <xsl:param name="height"/>
    <xsl:param name="src" select="concat($nodeid, '/', @data)"/>
    <xsl:param name="href" select="@href"/>
    <xsl:variable name="alt">
      <xsl:choose>
        <xsl:when test="@title != ''">
          <xsl:value-of select="@title"/>
        </xsl:when>

        <xsl:otherwise>
          <xsl:value-of select="dc:metadata/dc:title"/>
        </xsl:otherwise>
      </xsl:choose>
    </xsl:variable>

    <xsl:choose>
      <xsl:when test="$rendertype = 'imageupload'">
        <a href="{lenya:asset-dot/@href}">

          <img alt="{$alt}" src="resources/">
            <xsl:if test="$width">
              <xsl:attribute name="width">
                <xsl:value-of select="$width"/>
              </xsl:attribute>
            </xsl:if>
            <xsl:if test="$height">
              <xsl:attribute name="height">
                <xsl:value-of select="$height"/>

              </xsl:attribute>
            </xsl:if>
          </img>
        </a>
      </xsl:when>
      <xsl:when test="$href != ''">
        <a href="{$href}">
          <img alt="{$alt}" src="resources/">
            <xsl:if test="$width">

              <xsl:attribute name="width">
                <xsl:value-of select="$width"/>
              </xsl:attribute>
            </xsl:if>
            <xsl:if test="$height">
              <xsl:attribute name="height">
                <xsl:value-of select="$height"/>
              </xsl:attribute>
            </xsl:if>

          </img>
        </a>
      </xsl:when>
      <xsl:otherwise>
        <img alt="{$alt}" src="resources/">
          <xsl:if test="$width">
            <xsl:attribute name="width">
              <xsl:value-of select="$width"/>
            </xsl:attribute>

          </xsl:if>
          <xsl:if test="$height">
            <xsl:attribute name="height">
              <xsl:value-of select="$height"/>
            </xsl:attribute>
          </xsl:if>
          <xsl:if test="$width = 415">
            <xsl:attribute name="class">fullimg</xsl:attribute>

          </xsl:if>
        </img>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template> 


  <xsl:template match="document">
    <xsl:apply-templates select="content"/>
  </xsl:template>


  <xsl:template match="content"> 
    <html>
      <xsl:call-template name="html-head"/>
      <body>
        <div class="bodywidth">
          <a accesskey="1" title="Zur Navigation springen" href="#navigation"/>
          <a accesskey="2" title="Zum Inhalt springen" href="#content"/>
          <a name="top"/>
          <xsl:apply-templates select="/document/xhtml:div[@id = 'breadcrumb']"/>

          <xsl:call-template name="header"/>
          <xsl:apply-templates select="/document/xhtml:div[@id = 'toolnav']"/>
          <xsl:choose>
            <xsl:when test="$document-element-name='xhtml:html'">
              <xsl:choose>
                <xsl:when test="xhtml:html[@unizh:columns = '1']">
                  <xsl:call-template name="one-column"/>
                </xsl:when>
                <xsl:when test="xhtml:html[@unizh:columns = '2']">

                  <xsl:call-template name="two-columns"/>
                </xsl:when>
                <xsl:otherwise>
                  <xsl:call-template name="three-columns"/>
                </xsl:otherwise>
              </xsl:choose>
            </xsl:when>
            <xsl:when test="$document-element-name = 'unizh:overview'">
              <xsl:call-template name="overview"/>

            </xsl:when> 
            <xsl:when test="$document-element-name = 'unizh:homepage'">
              <xsl:call-template name="homepage"/>
            </xsl:when>
            <xsl:when test="$document-element-name = 'unizh:homepage4cols'">
              <xsl:call-template name="homepage4columns"/>
            </xsl:when>
            <xsl:when test="$document-element-name = 'unizh:news'">
              <xsl:call-template name="three-columns"/>

            </xsl:when>
            <xsl:when test="$document-element-name = 'unizh:newsitem'">
              <xsl:call-template name="newsitem"/>
            </xsl:when> 
            <xsl:when test="$document-element-name = 'unizh:team'">
              <xsl:call-template name="three-columns"/>
            </xsl:when>
            <xsl:when test="$document-element-name = 'unizh:person'">
              <xsl:call-template name="person"/>

            </xsl:when>
            <xsl:when test="$document-element-name = 'unizh:list'">
              <xsl:call-template name="three-columns"/>
            </xsl:when>
            <xsl:when test="$document-element-name = 'unizh:redirect'">
              <xsl:call-template name="redirect"/>
            </xsl:when>
            <xsl:otherwise>
            </xsl:otherwise>

          </xsl:choose>
        </div>
      </body>
    </html>
  </xsl:template>


  <xsl:template name="one-column">
    <xsl:apply-templates select="/document/xhtml:div[@id = 'orthonav']"/>
    <div class="contentarea1col">

      <h1>
        <a accesskey="2" name="content" class="namedanchor"/>
        <div bxe_xpath="/{document-element-}/lenya:meta/dc:title">
          <xsl:value-of select="/document/content/*/lenya:meta/dc:title"/>
        </div>
      </h1>
      <div bxe_xpath="/{$document-element-name}/xhtml:body">
        <xsl:apply-templates select="*/xhtml:body/*"/>
      </div>

    </div>
  </xsl:template>


  <xsl:template name="two-columns">
    <div id="col1">
      <xsl:apply-templates select="/document/xhtml:div[@id = 'menu']"/>
    </div>
    <div class="contcol2">
      <xsl:apply-templates select="/document/xhtml:div[@id = 'orthonav']"/>

      <a accesskey="2" name="content" class="namedanchor"/>
      <div class="content">
        <h1>
          <div bxe_xpath="/{$document-element-name}/lenya:meta/dc:title">
            <xsl:value-of select="/document/content/*/lenya:meta/dc:title"/>
          </div>
        </h1>
        <div bxe_xpath="/{$document-element-name}/xhtml:body">
          <xsl:apply-templates select="*/xhtml:body/*"/>

          <br/>
        </div>
      </div>
      <xsl:call-template name="footer"/>
    </div>
  </xsl:template>


  <xsl:template name="three-columns">
    <div id="col1">

      <xsl:apply-templates select="/document/xhtml:div[@id = 'menu']"/>
      
    </div>
    <div class="contcol2">
      <div class="relatedbox" bxe_xpath="/{$document-element-name}/unizh:related-content">
        <xsl:apply-templates select="*/unizh:related-content"/>
      </div>
      <xsl:apply-templates select="/document/xhtml:div[@id = 'orthonav']"/>
      <a accesskey="2" name="content" class="namedanchor"/>
      <div class="contentarea">

        <div class="content">
          <h1>
            <div bxe_xpath="/{$document-element-name}/lenya:meta/dc:title">
              <xsl:value-of select="/document/content/*/lenya:meta/dc:title"/>
            </div>
          </h1>
          <div bxe_xpath="/{$document-element-name}/xhtml:body">
            <xsl:apply-templates select="*/xhtml:body/*"/>
          </div>

        </div>
        <xsl:call-template name="footer"/>
      </div>
    </div>
  </xsl:template>


  <xsl:template name="overview">
    <div id="col1">
      <xsl:apply-templates select="/document/xhtml:div[@id = 'menu']"/>

    </div>
    <div class="contcol2">
      <div class="relatedbox" bxe_xpath="/{$document-element-name}/unizh:related-content">
        <xsl:apply-templates select="*/unizh:related-content"/>
      </div>
      <xsl:apply-templates select="/document/xhtml:div[@id = 'orthonav']"/>
      <div class="contentarea">
        <div class="content">
          <a name="content"/>

          <h1>
            <div bxe_xpath="/{$document-element-name}/lenya:meta/dc:title">
              <xsl:value-of select="/document/content/*/lenya:meta/dc:title"/>
            </div>
          </h1>
          <xsl:apply-templates select="*/xhtml:body/*"/>
        </div>
        <xsl:call-template name="footer"/>
      </div>

    </div>
  </xsl:template>


  <xsl:template name="homepage">
    <div id="col1">
      <xsl:apply-templates select="/document/xhtml:div[@id = 'menu']"/>
      <xsl:apply-templates select="*/unizh:contcol1"/>
    </div>
    <div class="contcol2">

      <div class="relatedbox" bxe_xpath="/{$document-element-name}/unizh:related-content">
        <xsl:apply-templates select="*/unizh:related-content"/>
      </div>
      <xsl:apply-templates select="/document/xhtml:div[@id = 'orthonav']"/>
      <div class="contentarea">
        <a accesskey="2" name="content" class="namedanchor"/>
        <div class="content">
          <h1>
            <div bxe_xpath="/{$document-element-name}/lenya:meta/dc:title">

              <xsl:value-of select="/document/content/*/lenya:meta/dc:title"/>
            </div>
          </h1>
          <div bxe_xpath="/{$document-element-name}/xhtml:body">
            <xsl:apply-templates select="*/xhtml:body/*"/>
          </div>
        </div>
        <xsl:call-template name="footer"/>
      </div>

    </div>
  </xsl:template>

  
  <xsl:template name="homepage4columns">
    <div id="col1">
      <xsl:apply-templates select="/document/xhtml:div[@id = 'menu']"/>
      <xsl:apply-templates select="*/unizh:contcol1"/>
    </div>
    <div class="contcol2">

      <div class="relatedbox" bxe_xpath="/{$document-element-name}/unizh:related-content">
        <xsl:apply-templates select="*/unizh:related-content"/>
      </div>
      <xsl:apply-templates select="/document/xhtml:div[@id = 'orthonav']"/>
      <div class="contentarea">
        <a accesskey="2" name="content" class="namedanchor"/>
        <div class="content">
          <xsl:apply-templates select="*/xhtml:body/*"/>
        </div>

        <xsl:call-template name="footer"/>
      </div>
    </div>
  </xsl:template>


  <xsl:template name="newsitem">
    <div id="col1">
      <xsl:apply-templates select="/document/xhtml:div[@id = 'menu']"/>
    </div>

    <div class="contcol2">
      <div class="relatedbox" bxe_xpath="/{$document-element-name}/unizh:related-content">
        <xsl:apply-templates select="*/unizh:related-content"/>
      </div>
      <div class="contentarea">
        <a accesskey="2" name="content" class="namedanchor"/>
        <div class="content">
          <p class="lead">
            <!-- FIXME: just a temporary solution because different time stamps exist for newsitem documents -->

            <xsl:choose>
              <xsl:when test="string-length($creationdate) &lt; '25'">
                <i18n:date pattern="EEE, d. MMM yyyy HH:mm" src-locale="en" src-pattern="d. MMM yyyy HH:mm" value="{$creationdate}"/> 
              </xsl:when>
              <xsl:otherwise>
                <i18n:date pattern="EEE, d. MMM yyyy HH:mm" src-locale="en" src-pattern="EEE MMM d HH:mm:ss zzz yyyy" value="{$creationdate}"/>
              </xsl:otherwise>
            </xsl:choose>
          </p>

          <h2>
            <div bxe_xpath="/{$document-element-name}/lenya:meta/dc:title">
              <xsl:value-of select="/document/content/*/lenya:meta/dc:title"/>
            </div>
          </h2>
          <h3><xsl:value-of select="unizh:newsitem/lenya:meta/dc:creator"/></h3>
          <p> </p>
          <xsl:if test="$area = 'authoring'">

            <div class="editview" bxe_xpath="/unizh:newsitem/unizh:short" id="short">
              <xsl:apply-templates select="unizh:newsitem/unizh:short/*"/>
            </div>
            <br class="floatclear"/>
          </xsl:if>
          <div bxe_xpath="/{$document-element-name}/xhtml:body">
            <xsl:apply-templates select="*/xhtml:body/*"/>
            <p> </p>

            <xsl:apply-templates select="/document/xhtml:div[@id = 'link-to-parent']"/>
            <div class="solidline"><img src="resources/1.gif" alt="separation line" width="1" height="1"/></div>
            <xsl:apply-templates select="*/unizh:level"/>
          </div>
        </div>
        <xsl:call-template name="footer"/>
      </div>
    </div>
  </xsl:template>


  <xsl:template name="person">
    <div id="col1">
      <xsl:apply-templates select="/document/xhtml:div[@id = 'menu']"/>
    </div>
    <div class="contcol2">
      <!-- <div class="relatedbox">
           <div bxe_xpath="/{$document-element-name}/unizh:related-content">
             <xsl:apply-templates select="*/unizh:related-content"/>
           </div>
        </div> -->
      <div class="contentarea">
        <a accesskey="2" name="content" class="namedanchor"/>

        <div class="content">
          <p>
            <xsl:apply-templates select="/document/xhtml:div[@id = 'link-to-parent']"/>
          </p>
          <div class="solidline">
            <img src="resources/1.gif" alt="separation line" width="1" height="1"/>
          </div>
          <div class="teamBlock">
            <div class="teamImg">

              <xsl:apply-templates select="unizh:person/xhtml:object"/>
            </div>
            <div class="teamText">
              <p>
                <b>
                  <span bxe_xpath="/{$document-element-name}/unizh:academictitle">
                    <xsl:if test="unizh:person/unizh:academictitle !=''">
                      <xsl:value-of select="unizh:person/unizh:academictitle"/> 
                    </xsl:if>

                  </span>
                  <span bxe_xpath="/{$document-element-name}/unizh:firstname">
                    <xsl:value-of select="unizh:person/unizh:firstname"/> 
                  </span>
                  <span bxe_xpath="/{$document-element-name}/unizh:lastname">
                    <xsl:value-of select="unizh:person/unizh:lastname"/>
                  </span>
                </b>
                <br/>

                <span bxe_xpath="/{$document-element-name}/unizh:position">
                  <xsl:value-of select="unizh:person/unizh:position"/>
                </span>
                <br/>
                Tel.: 
                <span bxe_xpath="/{$document-element-name}/unizh:phone">
                  <xsl:value-of select="unizh:person/unizh:phone"/>
                </span>
                <br/>

                Mail: 
                <span bxe_xpath="/{$document-element-name}/unizh:email">
                  <xsl:value-of select="unizh:person/unizh:email"/>
                </span>
              </p>
            </div>
            <div class="floatleftclear"/>
          </div>
          <div class="solidline">

            <img src="resources/1.gif" alt="separation line" width="1" height="1"/>
          </div>
          <div bxe_xpath="/{$document-element-name}/unizh:description">
            <xsl:apply-templates select="unizh:person/unizh:description"/>
          </div>
        </div>
        <xsl:call-template name="footer"/>
      </div>
    </div>

  </xsl:template>

  <xsl:template match="unizh:description[parent::unizh:person]">
    <xsl:apply-templates/>
  </xsl:template>


  <xsl:template name="redirect">
    <div id="col1">
      <xsl:apply-templates select="/document/xhtml:div[@id = 'menu']"/>

    </div>
    <div class="contcol2">
      <div class="contentarea">
        <div class="content">
          <h1>
            <div bxe_xpath="/{$document-element-name}/lenya:meta/dc:title">
              <xsl:value-of select="/document/content/*/lenya:meta/dc:title"/>
            </div>
          </h1>

          <xsl:apply-templates select="*/xhtml:body/*"/>
        </div>
        <xsl:call-template name="footer"/>
      </div>
    </div>
  </xsl:template>



  <xsl:template match="unizh:column[1]">

    <div class="content1" bxe_xpath="/{$document-element-name}/xhtml:body/unizh:column[1]">
      <xsl:apply-templates/>
    </div>
  </xsl:template>


  <xsl:template match="unizh:column[2]">
    <div class="content2" bxe_xpath="/{$document-element-name}/xhtml:body/unizh:column[2]">
      <xsl:apply-templates/>
    </div>

  </xsl:template>


  <xsl:template match="@*|node()" priority="-1">
    <xsl:copy>
      <xsl:apply-templates select="@*|node()"/>
    </xsl:copy>
  </xsl:template> 
  
</xsl:stylesheet>
