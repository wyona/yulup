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

/*
 * @author Andreas Wuest
 * Original developer of the of atom parser
 *
 * @author Florian Fricker
 * Modified the atom parser to handle Annotations
 *
 * This module contains the code to parse Annotation entries
 * based on the Annotation specification (see
 * http://www.w3.org/2001/Annotea/User/Protocol.html).
 */

/*
 * AnnotationParser10 constructor. Instantiates a new object of
 * type AnnotationParser10.
 *
 * @constructor
 * @param  {nsIDOMXMLDocument} aDocument the WebDAV document to parse
 * @param  {nsIURI}            aBaseURI  the URI of the WebDAV document
 * @return {WebDAVParser10}
 */
function AnnotationParser10(aDocument, aBaseURI) {
    /* DEBUG */ dump("Yulup:annotationparser10.js:AnnotationParser10(\"" + aDocument + "\", \"" + aBaseURI + "\") invoked\n");

    /* DEBUG */ YulupDebug.ASSERT(aDocument != null);
    /* DEBUG */ YulupDebug.ASSERT(aBaseURI  != null);

    // Initialize the attributes
    this.documentDOM = aDocument;
    this.baseURI     = aBaseURI;
    this.ioService   = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);
}

AnnotationParser10.prototype = {
    documentDOM: null,
    baseURI    : null,
    ioService  : null,

    /*
     * Resolve prefixes used in XPath expressions to
     * namespaces.
     *
     * @param  {String} aPrefix a namespace prefix
     * @return {String} the namespace associated with the passed in prefix
     */
    nsResolver: function (aPrefix) {
        var namespace = null;

        /* DEBUG */ dump("Yulup:annotationparser10.js:AnnotationParser10.nsResolver(\"" + aPrefix + "\") invoked\n");

        // Initialize the namespaces which are used for the Annotation protocol
        var namespace = {
            "r": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
            "a": "http://www.w3.org/2000/10/annotation-ns#",
            "d": "http://purl.org/dc/elements/1.1/",
            "h": "http://www.w3.org/1999/xx/http#",
            "xhtml": "http://www.w3.org/1999/xhtml"
        };

        return namespace[aPrefix] || null;
    },


    /*
     * Parse Annotation metadata.
     *
     * Parse the Annotation metadata, which includes the different Annotations.
     *
     * @return {AnnotationList10} returns the internalized representation of a Annotation response
     */
    parse: function() {
        var sitetree     = null;
        var elemNode     = null;
        var elemIterator = null;
        var list     = 0;

        /* DEBUG */ dump("Yulup:annotationparser10.js:AnnotationList10.parse() invoked\n");

        // Create the AnnotationList10 object
        annotationList = new AnnotationList10();

        // Start the parse process for the first namespace floor of the annotation protocol (r:RDF/r:Description)
        if (elemNodeIterator = this.documentDOM.evaluate("r:RDF/r:Description", this.documentDOM, this.nsResolver, XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null)) {
            /* DEBUG */ dump("Yulup:annotationparser10.js:AnnotationParser10.parse: found one or multiple response elements\n");

            // Continue with the parse process until the last element is reached
            while (elemNode = elemNodeIterator.iterateNext()) {
                annotationList.description[list++] = this.__parseDescriptionElement(this.documentDOM, elemNode);
            }
        }

        return annotationList;
    },


    /*
     * ParseDecription Element
     *
     * Get and return the values of the protocol elements
     *
     * @return {AnnotationList10Properties} returns the value of the parsed elements
     */

    __parseDescriptionElement: function(aDocument, aNode) {
        var uri = null;

        // Return the value of the matched elements
        return {
            title: aDocument.evaluate("d:title/text()", aNode, this.nsResolver, XPathResult.STRING_TYPE, null).stringValue,
                uri: ((uri = aDocument.evaluate("a:body/@r:resource", aNode, this.nsResolver, XPathResult.STRING_TYPE, null).stringValue) != null ? this.ioService.newURI(uri, null, this.baseURI) : null),
                };
    },


    /*
     * Parse Annotation content.
     *
     * Parse the single Annotation to get the different values (Name, Title, and so on...).
     *
     * @return {AnnotationList10} returns the internalized representation of a Annotation response
     */
    parseContent: function() {
        var sitetree     = null;
        var elemNode     = null;
        var elemIterator = null;
        var list     = 0;

        /* DEBUG */ dump("Yulup:annotationparser10.js:AnnotationList10.parse() invoked\n");

        // Create a new AnnotationList10 object
        annotationList = new AnnotationList10();

        // Start the parse process for the first namespace floor of the annotation protocol (r:RDF/r:Description)
        if (elemNodeIterator = this.documentDOM.evaluate("r:RDF/r:Description", this.documentDOM, this.nsResolver, XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null)) {
            /* DEBUG */ dump("Yulup:annotationparser10.js:AnnotationParser10.parse: found one or multiple response elements\n");

            // Continue with the parse process until the last element is reached
            while (elemNode = elemNodeIterator.iterateNext()) {
                annotationList.description[list++] = this.__parseContentDescriptionElement(this.documentDOM, elemNode);
            }
        }

        return annotationList;
    },

    /*
     * ParseDecription Element
     *
     * Get and return the values of the protocol elements
     *
     * @return {AnnotationList10Properties} returns the value of the parsed elements
     */
    __parseContentDescriptionElement: function(aDocument, aNode) {
        var uri = null;

        return {
            // Return the value of the matched elements
            title: aDocument.evaluate("d:title/text()", aNode, this.nsResolver, XPathResult.STRING_TYPE, null).stringValue,
                name: aDocument.evaluate("d:creator/text()", aNode, this.nsResolver, XPathResult.STRING_TYPE, null).stringValue,
                date: aDocument.evaluate("a:created/text()", aNode, this.nsResolver, XPathResult.STRING_TYPE, null).stringValue,
                pointer: aDocument.evaluate("a:context/text()", aNode, this.nsResolver, XPathResult.STRING_TYPE, null).stringValue,
                body: aDocument.evaluate("a:body/r:Description/h:Body/xhtml:html/xhtml:body/text()", aNode, this.nsResolver, XPathResult.STRING_TYPE, null).stringValue,
                };
    }
};


/*
 * Creates the description property array to save the annotation objects
 */
function AnnotationList10() {
    /* DEBUG */ dump("Yulup:annotationparser10.js:AnnotationList10() invoked\n");

    this.description = new Array();
}

AnnotationList10.prototype = {
    description: null
};
