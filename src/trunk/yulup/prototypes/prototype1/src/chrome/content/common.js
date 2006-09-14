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
 */

const YULUP_EXTENSION_ID = "yulup-prototype-1@wyona.com";

/**
 * YulupException constructor. Instantiates a new object of
 * type YulupException.
 *
 * @constructor
 * @param  {String}         aMessage a descriptive error message
 * @return {YulupException}
 */
function YulupException(aMessage) {
    // /* DEBUG */ dump("Yulup:common.js:YulupException(" + aMessage + ") invoked\n");
    this.message = aMessage;
    this.name    = "YulupException";
}

YulupException.prototype.__proto__  = Error.prototype;


/**
 * YulupEditorException constructor. Instantiates a new object of
 * type YulupEditorException.
 *
 * @constructor
 * @param  {String}               aMessage a descriptive error message
 * @return {YulupEditorException}
 */
function YulupEditorException(aMessage) {
    ///* DEBUG */ dump("Yulup:common.js:YulupEditorException(" + aMessage + ") invoked\n");
    this.message = aMessage;
    this.name    = "YulupEditorException";
}

YulupEditorException.prototype.__proto__  = YulupException.prototype;


function Barrier(aNoOfThreads, aCallback, aContext) {
    /* DEBUG */ dump("Yulup:common.js:Barrier() invoked\n");

    this.noOfThreads = aNoOfThreads;
    this.callback    = aCallback;
    this.context     = aContext;
}

Barrier.prototype = {
    noOfThreads: null,
    callback   : null,

    arrive: function () {
        /* DEBUG */ dump("Yulup:common.js:Barrier.arrive() invoked\n");

        /* DEBUG */ YulupDebug.ASSERT((this.noOfThreads - 1) >= 0);

        // warning: decrementing and testing is by NO MEANS guarded!
        if (--this.noOfThreads == 0) {
            /* DEBUG */ dump("Yulup:common.js:Barrier.arrive: calling callback\n");
            this.callback(this.context);
        }
    }
}


var YulupDebug = {
    /**
     * Dumps an exception to stdout, printing its message
     * as well as a stacktrace if available.
     *
     * @param  {String}    aLocation  location identifier from where this method was called
     * @param  {Error}     aException the exception to print
     * @return {Undefined} does not have a return value
     */
    dumpExceptionToConsole: function (aLocation, aException) {
        dump("EXCEPTION: " + aLocation + ": " + aException + "\n");
        if (aException)
            dump("STACKTRACE:" + (aException.stack ? "\n" + aException.stack : " not available") + "\n");
    },

    /**
     * Prints a string to stdout if the passed assertion failed.
     *
     * @param  {Boolean}   aAssertion            the assertion to test
     * @param  {String}    aLocation             where the assertion is stated [optional]
     * @param  {String}    aAssertionDescription a textual description of the assertion [optional]
     * @return {Undefined} does not have a return value
     */
    ASSERT: function (aAssertion, aLocation, aAssertionDescription) {
        if (!aAssertion)
            if (aLocation && aAssertionDescription) {
                dump("################## ASSERTION " + aAssertionDescription + " failed at " + aLocation + " (file: " + Components.stack.caller.filename + ", line: " + Components.stack.caller.lineNumber + ", caller: " +  Components.stack.caller.name + ")! ##################\n");
            } else {
                dump("################## ASSERTION failed at file: " + Components.stack.caller.filename + ", line: " + Components.stack.caller.lineNumber + ", caller: " +  Components.stack.caller.name + "! ##################\n");
            }
    }
};


var DOMSerialiser = {
    /**
     * Serialises to stdout the tree rooted at the passed node.
     *
     * @param  {nsIDOMNode} aNode the root of the tree to serialise
     * @return {Undefined}  does not have a return value
     */
    serialiseDOMTree: function (aNode) {
        var child = null;

        DOMSerialiser.emitNodeStart(aNode);

        for (child = aNode.firstChild; child != null; child = child.nextSibling) {
            DOMSerialiser.serialiseDOMTree(child);
        }

        DOMSerialiser.emitNodeEnd(aNode);
    },

    /**
     * Emits a textual representation of the passed DOM node.
     *
     * This method should be called before the subtree of the
     * node is visited.
     *
     * @param  {nsIDOMNode} aNode the node to serialise
     * @return {Undefined}  does not have a return value
     */
    emitNodeStart: function (aNode) {
        switch (aNode.nodeType) {
            case 1:
                dump("<" + aNode.nodeName);

                if (aNode.hasAttributes()) {
                    // emit the attributes
                    for (var i = 0; i < aNode.attributes.length; i++) {
                        dump(" " + aNode.attributes.item(i).nodeName + "=\"" + aNode.attributes.item(i).nodeValue + "\"");
                    }
                }

                if (aNode.hasChildNodes()) {
                    dump(">");
                } else {
                    dump("/>");
                }
                break;
            case 3:
                dump(aNode.nodeValue);
                break;
            case 7:
                dump("<?" + aNode.target + " " + aNode.data + "?>");
                break;
            case 8:
                dump("<!--" + aNode.nodeValue + "-->");
                break;
            case 9:
                // the document itself; nothing to emit here
                break;
            case 10:
                // TODO: emit notations (see http://www.w3.org/TR/DOM-Level-2-Core/core.html#ID-412266927)
                dump("<!DOCTYPE " + aNode.name + (aNode.publicId ? " PUBLIC \"" + aNode.publicId + "\" " : " ")  + "\"" + aNode.systemId + "\">\n");
                break;
            default:
               dump("UNKNOWN node \"" + aNode.nodeName + "\" of node type \"" + aNode.nodeType + "\" encountered\n");
        }
    },

    /**
     * Emits a textual representation of the passed DOM node.
     *
     * This method should be called after the subtree of the
     * node was visited.
     *
     * @param  {nsIDOMNode} aNode the node to serialise
     * @return {Undefined}  does not have a return value
     */
    emitNodeEnd: function (aNode) {
        switch (aNode.nodeType) {
            case 1:
                if (aNode.hasChildNodes()) {
                    dump("</" + aNode.nodeName + ">");
                }
                break;
            default:
        }
    }
};

/**
  * Check the well-formedness of a given document.
  *
  * @param {String}  aDocument the document to check
  * @return {String} a message containing the result of the check, or null if check successful
  */
function checkWellFormedness(aDocument) {
    var domParser              = null;
    var domDocument            = null;
    var rootElement            = null;
    var xmlSerialiser          = null;
    var sourceTextElement      = null;
    var parseErrorString       = null;
    var sourceTextString       = null;
    var parseErrorStringRegExp = null;
    var errorLine              = null;
    var errorColumn            = null;

    /* DEBUG */ dump("Yulup:editor.js:Editor.checkWellFormedness() invoked\n");

    domParser   = new DOMParser();
    domDocument = domParser.parseFromString(aDocument, "text/xml");

    rootElement = domDocument.documentElement;
    if ((rootElement.tagName == "parserError") ||
        (rootElement.namespaceURI == "http://www.mozilla.org/newlayout/xml/parsererror.xml")) {
        xmlSerialiser = Components.classes["@mozilla.org/xmlextras/xmlserializer;1"].getService(Components.interfaces.nsIDOMSerializer);

        /* DEBUG */ dump("Yulup:editor.js:Editor.checkWellFormedness: well-formedness error:\n" + xmlSerialiser.serializeToString(rootElement) + "\n");

        // get parser error string
        parseErrorString = "";

        for (var child = rootElement.firstChild; child != null; child = child.nextSibling) {
            if (child.nodeType == Components.interfaces.nsIDOMNode.TEXT_NODE) {
                parseErrorString += child.nodeValue;
            } else if (child.nodeType == Components.interfaces.nsIDOMNode.ELEMENT_NODE && child.tagName == "sourcetext") {
                sourceTextElement = child;
            }
        }

        // extract line number
        parseErrorStringRegExp = new RegExp("[\\d]+[,]");
        parseErrorArray        = parseErrorStringRegExp.exec(parseErrorString);
        errorLine              = parseErrorArray[0].substring(0, parseErrorArray[0].length-1);

        // extract column
        parseErrorStringRegExp = new RegExp("[\\d]+[:]");
        parseErrorArray        = parseErrorStringRegExp.exec(parseErrorString);
        errorColumn            = parseErrorArray[0].substring(0, parseErrorArray[0].length-1);

        // get source text
        sourceTextString = "";

        if (sourceTextElement) {
            for (var child = sourceTextElement.firstChild; child != null; child = child.nextSibling) {
                if (child.nodeType == Components.interfaces.nsIDOMNode.TEXT_NODE) {
                    sourceTextString += child.nodeValue;
                }
            }
        }

        /* DEBUG */ dump("Yulup:editor.js:Editor.checkWellFormedness: well-formedness error, line number = " + errorLine + ", column = " + errorColumn + ", source text = " + sourceTextString + "\n");

        return { line: errorLine, column: errorColumn, sourceText: sourceTextString };
    } else {
        return null;
    }
}


/**
  * Instatiates a new object of the type configurableNsResolver
  *
  * @param  {nsIXMLDocument} aDocument the xml document where namespaces and prefixes are read from
  * @return {Undefined}                does not have a return value
  */
function configurableNsResolver(aDocument) {
    var sorceElements = null;
    var prefix        = null;
    var initialized   = false;

    /* DEBUG */ dump("Ulysses:widget.js:WidgetHandler.configurableNsResolver() invoked\n");

    this.namespaces = new Array();

    sourceElements = aDocument.getElementsByTagName("*");

    for (var i=0; i < sourceElements.length; i++) {
        if (aDocument.documentElement.isDefaultNamespace(sourceElements.item(i).namespaceURI)) {
            /* DEBUG */ dump("Ulysses:common.js:configurableNsResolver() default namespace: " + sourceElements.item(i).namespaceURI + "\n");
        } else if ((prefix = sourceElements.item(i).prefix) != null) {
            if (!this.namespaces[prefix]) {
                this.namespaces[prefix] = sourceElements.item(i).namespaceURI;

                /* DEBUG */ dump("Ulysses:common.js:configurableNsResolver(): added namespace prefix " + prefix + " with URI " + this.namespaces[prefix] + "\n");
            }
        }
    }
}

configurableNsResolver.prototype = {
    namespaces: null,

    lookupNamespaceURI: function(aPrefix) {
        return this.namespaces[aPrefix] || null;
    }
};
