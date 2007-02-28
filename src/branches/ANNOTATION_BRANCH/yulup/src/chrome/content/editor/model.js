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

/**
 * Model constructor. Instantiates a new object of
 * type Model.
 *
 * @constructor
 * @param  {YulupEditStateController} aStateController the editor's state machine
 * @param  {Document}                   aDocument        a document
 * @return {Model}
 */
function Model(aStateController, aDocument) {
    /* DEBUG */ dump("Yulup:model.js:Model(\"" + aStateController + "\", \"" + aDocument + "\") invoked\n");

    this.documentReference = aDocument;
    this.stateController   = aStateController;
}

Model.prototype = {
    documentReference: null,
    stateController  : null,
    domParser        : null,
    document         : null,
    documentDOM      : null,
    dirty            : false,
    preserveDirty    : false,

    /**
     * Marks the model as modified, and informs the editor's
     * state controller about this state change.
     *
     * @return {Undefined} does not have a return value
     */
    setDirty: function () {
        /* DEBUG */ dump("Yulup:model.js:setDirty() invoked\n");

        if (!this.dirty && !this.preserveDirty) {
            this.dirty = true;
            this.stateController.modelStateChanged("modified");
        }
    },

    /**
     * Marks the model as clean, and informs the editor's
     * state controller about this state change.
     *
     * This method should normally be called after the
     * document associated with this model has been saved.
     *
     * @return {Undefined} does not have a return value
     */
    unsetDirty: function () {
        /* DEBUG */ dump("Yulup:model.js:unsetDirty() invoked\n");

        if (!this.preserveDirty) {
            this.dirty = false;
            this.stateController.modelStateChanged("saved");
        }
    },

    /**
     * Tells the model to either ignore or accect setDirty()
     * and unsetDirty() calls, i.e. to either preserve the
     * current state, or modify it.
     *
     * This method should always be calles as a pair, to e.g.
     * guard the document insertion at view switch time.
     *
     * @param  {Boolean}   aPreserve if true, preserve the current state,
     *                               otherwise the model's dirty field is modified
     * @return {Undefined} does not have a return value
     */
    preserveDirty: function (aPreserve) {
        /* DEBUG */ dump("Yulup:model.js:preserveDirty() invoked\n");

        this.preserveDirty = aPreserve;
    },

    /**
     * If the document has been modified since it was saved
     * the last time, this method returns true.
     *
     * @return {Boolean} returns true if document has been modified since last save
     */
    isDirty: function () {
        /* DEBUG */ dump("Yulup:model.js:isDirty() invoked\n");

        return this.dirty;
    },

    /**
     * Returns a string representation of the document.
     *
     * Note that the returned document may not be up-to-date with
     * respect to changes in the current view. Therefore, you always
     * have to synchronise the current view first before you can
     * retrieve the last version.
     *
     * @return {String} a string representation of the current model
     */
    getDocument: function () {
        /* DEBUG */ dump("Yulup:model.js:getDocument() invoked\n");
        return this.document;
    },

    /**
     * Sets a string representation of the document of this model
     *
     * @param  {String}    aValue the document you want to set
     * @return {Undefined} does not have a return value
     */
    setDocument: function (aValue) {
        /* DEBUG */ dump("Yulup:model.js:setDocument() invoked\n");
        this.document = aValue;

        // invalidate the DOM representation
        this.documentDOM = null;
    },

    /**
     * Returns a DOM representation of the document. The DOM is
     * computed dynamically from the string representation when
     * this method is called.
     *
     * Note that the returned document may not be up-to-date with
     * respect to changes in the current view. Therefore, you always
     * have to synchronise the current view first before you can
     * retrieve the last version.
     *
     * @return {nsIDOMNode} a DOM representation of the current model
     */
    getDocumentDOM: function () {
        var domDocument   = null;
        var documentRoot  = null;
        var xmlSerialiser = null;

        /* DEBUG */ dump("Yulup:model.js:getDocumentDOM() invoked\n");

        // check if a dom representation available and return that if so.
        if (this.documentDOM != null) return this.documentDOM;

        if (!this.domParser) {
            /* Instantiate a DOM parser lazily the first time this method is
             * used. A nsIDOMParser instance can be reused as often as needed. */
            this.domParser = Components.classes["@mozilla.org/xmlextras/domparser;1"].createInstance(Components.interfaces.nsIDOMParser);
        }

        domDocument = this.domParser.parseFromString(this.document, "text/xml");

        documentRoot = domDocument.documentElement;
        if ((documentRoot.tagName == "parserError") || (documentRoot.namespaceURI == "http://www.mozilla.org/newlayout/xml/parsererror.xml")) {
            // string representation does not seem to be well-formed
            xmlSerialiser = Components.classes["@mozilla.org/xmlextras/xmlserializer;1"].getService(Components.interfaces.nsIDOMSerializer);
            dump("Yulup:model.js:getDocumentDOM: document not well formed. Parser error =\n" + xmlSerialiser.serializeToString(documentRoot) + "\n");
            throw new YulupEditorException("model.js:Model.getDocumentDOM: document not well-formed.");
        }

        this.documentDOM = domDocument;

        return this.documentDOM;
    },

    /**
     * Sets a DOM representation of the document of this model
     *
     * @param  {nsIDOMNode} aValue the document you want to set
     * @return {Undefined}  does not have a return value
     */
    setDocumentDOM: function (aValue) {
        /* DEBUG */ dump("Yulup:model.js:setDocumentDOM() invoked\n");
        this.documentDOM = aValue;
    },

    /**
     * Set up the model with a template.
     *
     * Note that if you use this method, you do not
     * have to call initDocument().
     *
     * @param  {String}    aTemplateString the template
     * @return {Undefined} does not have a return value
     */
    createFromTemplate: function (aTemplateString) {
        /* DEBUG */ dump("Yulup:model.js:createFromTemplate() invoked\n");

        // TODO: parse template into DOM, so we can setDocumentDOM()
        this.setDocument(aTemplateString);

        /* DEBUG */ dump("Yulup:model.js:createFromTemplate: dump of set document:\n" + this.document + "\n");
    },

    /**
     * Initialises the model with a document.
     *
     * Note that if you want to set up a new model
     * from a template, use createFromTemplate() instead
     * of this methid.
     *
     * @param  {String}    aDocumentData the document
     * @return {Undefined} does not have a return value
     */
    initDocument: function (aDocumentData) {
        /* DEBUG */ dump("Yulup:model.js:initDocument() invoked\n");

        this.setDocument(aDocumentData);
    }
}
