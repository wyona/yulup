/*
 * ***** BEGIN LICENSE BLOCK *****
 * Copyright 2006 Wyona AG Zurich
 *
 * This file is part of Yulup.
 *
 * Yulup is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Yulup is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Yulup; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
 *
 * ***** END LICENSE BLOCK *****
 */

/**
 * @author Andreas Wuest
 * @author Gregor Imboden
 *
 * This module contains the code to parse documents
 * based on the WebDAV specification (see
 * http://www.webdav.org/specs/rfc2518.html).
 */

/**
 * WebDAVParser10 constructor. Instantiates a new object of
 * type WebDAVParser10.
 *
 * @constructor
 * @param  {nsIDOMXMLDocument} aDocument the WebDAV document to parse
 * @param  {nsIURI}            aBaseURI  the URI of the WebDAV document
 * @return {WebDAVParser10}
 */
function WebDAVParser10(aDocument, aBaseURI) {
    /* DEBUG */ dump("Yulup:webdavparser10.js:WebDAVParser10(\"" + aDocument + "\", \"" + aBaseURI + "\") invoked\n");

    /* DEBUG */ YulupDebug.ASSERT(aDocument != null);
    /* DEBUG */ YulupDebug.ASSERT(aBaseURI  != null);

    this.documentDOM = aDocument;
    this.baseURI     = aBaseURI;
    this.ioService   = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);
}

WebDAVParser10.prototype = {
    documentDOM: null,
    baseURI    : null,
    ioService  : null,

    /**
     * Resolve prefixes used in XPath expressions to
     * namespaces.
     *
     * @param  {String} aPrefix a namespace prefix
     * @return {String} the namespace associated with the passed in prefix
     */
    nsResolver: function (aPrefix) {
        var namespace = null;

        /* DEBUG */ dump("Yulup:webdavparser10.js:WebDAVParser10.nsResolver(\"" + aPrefix + "\") invoked\n");

        var namespace = {
            "D": "DAV:"
        };

        return namespace[aPrefix] || null;
    },


    /**
     * Parse WebDAV response.
     *
     * @return {WebDAV10Response} returns the internalised representation of a WebDAV response
     */
    parse: function() {
        var sitetree     = null;
        var elemNode     = null;
        var elemIterator = null;
        var resource     = 0;

        /* DEBUG */ dump("Yulup:webdavparser10.js:WebDAVParser10.parse() invoked\n");

        webDAVResponse = new WebDAV10Response();

        if (elemNodeIterator = this.documentDOM.evaluate("D:multistatus/D:response", this.documentDOM, this.nsResolver, XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null)) {
            /* DEBUG */ dump("Yulup:webdavparser10.js:WebDAVParser10.parse: found one or multiple response elements\n");

            while (elemNode = elemNodeIterator.iterateNext()) {
                webDAVResponse.resources[resource++] = this.__parseResponseElement(this.documentDOM, elemNode);
            }
        }

        return webDAVResponse;
    },

    __parseResponseElement: function(aDocument, aNode) {
        var uri = null;

        return {
            href: ((uri = aDocument.evaluate("D:href/text()", aNode, this.nsResolver, XPathResult.STRING_TYPE, null).stringValue) != null ? this.ioService.newURI(uri, null, this.baseURI) : null),
            properties: this.__parsePropertiesElement(aDocument, aNode)
        };
    },

    __parsePropertiesElement: function(aDocument, aNode) {

        return {
            displayname: aDocument.evaluate("D:propstat/D:prop/D:displayname/text()", aNode, this.nsResolver, XPathResult.STRING_TYPE, null).stringValue,
            lastmodified: aDocument.evaluate("D:propstat/D:prop/D:lastmodified/text()", aNode,  this.nsResolver, XPathResult.STRING_TYPE, null).stringValue,
            contenttype: aDocument.evaluate("D:propstat/D:prop/D:contenttype/text()", aNode, this.nsResolver, XPathResult.STRING_TYPE, null).stringValue,
            resourcetype: this.__parseResourceTypeElement(aDocument, aNode)
        };
    },

    __parseResourceTypeElement: function(aDocument, aNode) {
        var collection = null;

        if (collection = aDocument.evaluate("D:propstat/D:prop/D:resourcetype/D:collection", aNode, this.nsResolver, XPathResult.UNORDERER_NODE_ITERATOR_TYPE, null).iterateNext()) {
            // it's a collection
            return "collection";
        } else {
            return "resource";
        }
    }
};


/**
 * WebDAV10Response constructor. Instantiates a new
 * object of type WebDAV10Response.
 *
 * @constructor
 * @return {WebDAV10Response} a new WebDAV10Response object
 */
function WebDAV10Response() {
    /* DEBUG */ dump("Yulup:webdavparser10.js:WebDAV10Response() invoked\n");

    this.resources = new Array();
}

WebDAV10Response.prototype = {
    resources: null
};
