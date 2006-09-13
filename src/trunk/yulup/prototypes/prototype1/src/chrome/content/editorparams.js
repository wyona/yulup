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
 * EditorParameters constructor. Instantiates a new object of
 * type EditorParameters.
 *
 * @constructor
 * @param  {nsIURI}           aURI      the URI of the document to load into the new editor
 * @param  {String}           aTemplate a template action parameter string
 * @return {EditorParameters}
 */
function EditorParameters(aURI, aTemplate) {
    this.uri      = aURI;
    this.template = (aTemplate ? aTemplate : "");
}

EditorParameters.prototpye = {
    type    : "EditorParameters",
    uri     : null,
    template: null
};


/**
 * NeutronEditorParameters constructor. Instantiates a new object of
 * type NeutronEditorParameters.
 *
 * @constructor
 * @param  {nsIURI}                  aURI                 the URI of the document to load into the new editor
 * @param  {String}                  aTemplate            a template action parameter string
 * @param  {Introspection}           aIntrospectionObject the introspection object associated with the document to load
 * @param  {Integer}                 aFragment            the fragment identifier of the document to load
 * @param  {String}                  aLoadStyle           the Neutron load style, either "open" or "checkout"
 * @return {NeutronEditorParameters}
 */
function NeutronEditorParameters(aURI, aTemplate, aIntrospectionObject, aFragment, aLoadStyle) {
    EditorParameters.call(this, aURI, aTemplate);

    this.introspection = aIntrospectionObject;
    this.fragment      = aFragment;
    this.loadStyle     = aLoadStyle;
}

NeutronEditorParameters.prototype = {
    __proto__: EditorParameters.prototype,

    type         : "NeutronEditorParameters",
    introspection: null,
    fragment     : null,
    loadStyle    : null
};


/**
 * AtomEditorParameters constructor. Instantiates a new object of
 * type AtomEditorParameters.
 *
 * @constructor
 * @param  {nsIURI}               aURI            the URI of the document to load into the new editor
 * @param  {String}               aTemplate       a template action parameter string
 * @param  {String}               aCreationStatus specifies if the document has to be "create"ed first or simply "edit"
 * @return {AtomEditorParameters}
 */
function AtomEditorParameters(aURI, aTemplate, aCreationStatus) {
    EditorParameters.call(this, aURI, aTemplate);

    this.creationStatus = aCreationStatus;
}

AtomEditorParameters.prototype = {
    __proto__: EditorParameters.prototype,

    type          : "AtomEditorParameters",
    creationStatus: null
};
