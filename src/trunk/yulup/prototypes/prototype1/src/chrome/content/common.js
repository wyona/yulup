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
    // /* DEBUG */ dump("Yulup:common.js:YulupEditorException(" + aMessage + ") invoked\n");
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
