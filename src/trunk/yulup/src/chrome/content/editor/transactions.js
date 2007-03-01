/*
 * ***** BEGIN LICENSE BLOCK *****
 * Copyright 2007 Wyona AG Zurich
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

/**
 * YulupEditorChangeAttributeNSTransaction constructor. Instantiates a
 * new object of type YulupEditorChangeAttributeNSTransaction.
 *
 * Implements nsITransaction.
 *
 * @constructor
 * @param  {nsIDOMDocument} aDocument   the document owning the element
 * @param  {nsIDOMElement}  aElement    the element to operate on
 * @param  {String}         aNamespace  the attribute's namespace, or null if the default namespace should be used
 * @param  {String}         aAttrName   the attribute's local name
 * @param  {String}         aAttrValue  the value to set or null, if the attribute should be removed
 * @param  {Boolean}        aRemoveAttr true if the attribute should be removed, false otherwise
 * @return {YulupEditorChangeAttributeNSTransaction}
 */
function YulupEditorChangeAttributeNSTransaction(aDocument, aElement, aNamespace, aAttrName, aAttrValue, aRemoveAttr) {
    /* DEBUG */ YulupDebug.ASSERT(aDocument   != null);
    /* DEBUG */ YulupDebug.ASSERT(aElement    != null);
    /* DEBUG */ YulupDebug.ASSERT(aAttrName   != null);
    /* DEBUG */ YulupDebug.ASSERT(aRemoveAttr == false ? aAttrValue  != null : true);
    /* DEBUG */ YulupDebug.ASSERT(aRemoveAttr != null);

    dump("Yulup:transactions.js:YulupEditorChangeAttributeNSTransaction() invoked\n");

    this.__document   = aDocument;
    this.__element    = aElement;
    this.__namespace  = aNamespace;
    this.__attrName   = aAttrName;
    this.__attrValue  = aAttrValue;
    this.__removeAttr = aRemoveAttr;
}

YulupEditorChangeAttributeNSTransaction.prototype = {
    __document  : null,
    __namespace : null,
    __element   : null,
    __attrName  : null,
    __attrValue : null,
    __removeAttr: null,
    __undoPrefix: null,
    __undoValue : null,
    __wasSet    : false,

    doTransaction: function () {
        var attributeNode = null;

        dump("Yulup:transactions.js:YulupEditorChangeAttributeNSTransaction.doTransaction() invoked\n");

        attributeNode = this.__element.getAttributeNodeNS(this.__namespace, this.__attrName);

        if (attributeNode) {
            // record current state for undo
            this.__undoPrefix = attributeNode.prefix;
            this.__undoValue  = attributeNode.value;
            this.__wasSet     = true;
        }

        if (this.__removeAttr) {
            // remove the attribute
            this.__element.removeAttributeNS(this.__namespace, this.__attrName);
        } else {
            if (this.__wasSet) {
                // set new value (does not change the prefix)
                attributeNode.value = this.__attrValue;
            } else {
                // create new attribute
                this.__element.setAttributeNS(this.__namespace, this.__attrName, this.__attrValue);
            }
        }
    },

    undoTransaction: function () {
        var qualifiedAttrName = null;

        dump("Yulup:transactions.js:YulupEditorChangeAttributeNSTransaction.undoTransaction() invoked\n");

        if (this.__wasSet) {
            // set the undo value
            qualifiedAttrName = (this.__undoPrefix ? this.__undoPrefix + ":" : "") + this.__attrName;

            this.__element.setAttributeNS(this.__namespace, qualifiedAttrName, this.__undoValue);
        } else {
            // remove the attribute
            this.__element.removeAttributeNS(this.__namespace, this.__attrName);
        }
    },

    redoTransaction: function () {
        var attributeNode = null;

        dump("Yulup:transactions.js:YulupEditorChangeAttributeNSTransaction.redoTransaction() invoked\n");

        attributeNode = this.__element.getAttributeNodeNS(this.__namespace, this.__attrName);

        if (this.__removeAttr) {
            // remove the attribute
            this.__element.removeAttributeNS(this.__namespace, this.__attrName);
        } else {
            if (this.__wasSet) {
                // set new value
                attributeNode.value = this.__attrValue;
            } else {
                // create new attribute
                this.__element.setAttributeNS(this.__namespace, this.__attrName, this.__attrValue);
            }
        }
    },

    merge: function (aTransaction) {
        dump("Yulup:transactions.js:YulupEditorChangeAttributeNSTransaction.merge() invoked\n");

        return false;
    }
};
