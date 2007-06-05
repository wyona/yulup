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
 *
 * This module contains the code to parse documents
 * based on the Neutron-Auth specification (see
 * http://www.wyona.org/osr-101/osr-101.xhtml).
 */

/**
 * NeutronAuthParser10 constructor. Instantiates a new object of
 * type NeutronAuthParser10.
 *
 * @constructor
 * @param  {nsIDOMXMLDocument}   aDocument the Neutron-Auth document to parse
 * @return {NeutronAuthParser10}
 */
function NeutronAuthParser10(aDocument) {
    /* DEBUG */ dump("Yulup:neutronauthparser10.js:NeutronAuthParser10(\"" + aDocument + "\") invoked\n");

    NeutronAuthParser.call(this);

    this.documentDOM = aDocument;
    this.ioService   = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);
}

NeutronAuthParser10.prototype = {
    __proto__: NeutronAuthParser.prototype,

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
    __nsResolver: function (aPrefix) {
        var namespace = null;

        /* DEBUG */ dump("Yulup:neutronauthparser10.js:NeutronAuthParser10.__nsResolver(\"" + aPrefix + "\") invoked\n");

        var namespace = {
            "neutronauth10" : "http://www.wyona.org/neutron/1.0"
        };

        return namespace[aPrefix] || null;
    },

    /**
     * Parse a Neutron-Auth challenge.
     *
     * @return {NeutronAuthChallenge}
     * @throws {NeutronAuthException}
     */
    parseChallenge: function () {
        var elemNode      = null;
        var nodeSet       = null;
        var exceptionType = null;
        var challenge     = null;

        /* DEBUG */ dump("Yulup:neutronauthparser10.js:NeutronAuthParser10.parseChallenge() invoked\n");

        if (elemNode = this.documentDOM.evaluate("neutronauth10:exception", this.documentDOM, this.__nsResolver, XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null).iterateNext()) {
            // response is of type exception, get exception type
            exceptionType = this.documentDOM.evaluate("attribute::type", elemNode, this.__nsResolver, XPathResult.STRING_TYPE, null).stringValue;

            if (exceptionType == "authorization" || exceptionType == "authentication") {
                challenge = new NeutronAuth10Challenge(this.documentDOM.evaluate("neutronauth10:message/text()", elemNode, this.__nsResolver, XPathResult.STRING_TYPE, null).stringValue);

                if ((elemNode = this.documentDOM.evaluate("neutronauth10:authentication", elemNode, this.__nsResolver, XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null).iterateNext()) != null) {
                    this.__parseAuthentication(this.documentDOM, elemNode, challenge);
                }
            } else {
                throw new NeutronAuthException("Yulup:neutronauthparser10.js:NeutronAuthParser10.parseChallenge: type unknown (\"" + exceptionType + "\")");
            }
        } else {
            throw new NeutronAuthException("Yulup:neutronauthparser10.js:NeutronAuthParser10.parseChallenge: wrong root element");
        }

        return challenge;
    },

    __parseAuthentication: function (aDocument, aNode, aChallenge) {
        var elemNode = null;

        aChallenge.originalUrl = aDocument.evaluate("neutronauth10:original-request/attribute::url", aNode, this.__nsResolver, XPathResult.STRING_TYPE, null).stringValue;
        aChallenge.logoutUrl   = aDocument.evaluate("neutronauth10:logout/attribute::url", aNode, this.__nsResolver, XPathResult.STRING_TYPE, null).stringValue;
        aChallenge.realm       = aDocument.evaluate("neutronauth10:logout/attribute::realm", aNode, this.__nsResolver, XPathResult.STRING_TYPE, null).stringValue;

        if ((elemNode = aDocument.evaluate("neutronauth10:login", aNode, this.__nsResolver, XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null).iterateNext()) != null) {
            aChallenge.url = aDocument.evaluate("attribute::url", elemNode, this.__nsResolver, XPathResult.STRING_TYPE, null).stringValue;

            if ((elemNode = aDocument.evaluate("neutronauth10:form", elemNode, this.__nsResolver, XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null).iterateNext()) != null) {
                aChallenge.infoMessage = aDocument.evaluate("neutronauth10:message/text()", elemNode, this.__nsResolver, XPathResult.STRING_TYPE, null).stringValue;
                nodeSet = aDocument.evaluate("neutronauth10:param", elemNode, this.__nsResolver, XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null);
                aChallenge.params = new Array();

                while ((elemNode = nodeSet.iterateNext()) != null) {
                    aChallenge.params[aDocument.evaluate("attribute::name", elemNode, this.__nsResolver, XPathResult.STRING_TYPE, null).stringValue] = aDocument.evaluate("attribute::description", elemNode, this.__nsResolver, XPathResult.STRING_TYPE, null).stringValue;
                }
            }
        }
    }
};


/**
 * NeutronAuth10Challenge constructor. Instantiates a new object
 * of type NeutronAuth10Challenge.
 *
 * @constructor
 * @param  {String}                 aMessage a descriptive message
 * @return {NeutronAuth10Challenge}
 */
function NeutronAuth10Challenge(aMessage) {
    /* DEBUG */ dump("Yulup:neutronauthparser10.js:NeutronAuth10Challenge(\"" + aMessage + "\") invoked\n");

    NeutronAuthChallenge.call(this, aMessage);
}

NeutronAuth10Challenge.prototype = {
    __proto__: NeutronAuthChallenge.prototype
};
