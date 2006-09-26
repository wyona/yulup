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
 * @param  {nsIURI}           aURI           the URI of the document to load into the new editor
 * @param  {String}           aContentType   the content type of the document
 * @param  {Array}            aSchemas       the schmes
 * @param  {Array}            aStyles        the stylesheets
 * @param  {Object}           aStyleTemplate the style templates
 * @param  {Array}            aWidgets       the widgets
 * @param  {String}           aTemplate      a template action parameter string
 * @return {EditorParameters}
 */
function EditorParameters(aURI, aContentType, aSchemas, aStyles, aStyleTemplate, aWidgets) {
    /* DEBUG */ YulupDebug.ASSERT(aURI         != null && aURI.spec != null);
    /* DEBUG */ YulupDebug.ASSERT(aContentType != null);

    this.uri           = aURI;
    this.contentType   = aContentType;
    this.schemas       = aSchemas;
    this.styles        = aStyles;
    this.styleTemplate = aStyleTemplate;
    this.widgets       = aWidgets;
}

EditorParameters.prototype = {
    type         : "EditorParameters",
    uri          : null,
    contentType  : null,
    schemas      : null,
    styles       : null,
    styleTemplate: null,
    widgets      : null,

    mergeIntrospectionParams: function (aIntrospectionObject) {
        /* DEBUG */ dump("Yulup:editorparams.js:EditorParameters.mergeIntrospectionParams() invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aIntrospectionObject != null);

        // check if content types are compatible
        if (aIntrospectionObject && aIntrospectionObject.fragments[0] && (this.contentType == aIntrospectionObject.fragments[0].mimeType)) {
            if (aIntrospectionObject.fragments[0].schemas) {
                this.__mergeSchemas(aIntrospectionObject.fragments[0].schemas);
            }
            if (aIntrospectionObject.fragments[0].styles) {
                this.__mergeStyles(aIntrospectionObject.fragments[0].styles);
            }
            if (aIntrospectionObject.fragments[0].styleTemplate) {
                this.__mergeStyleTemplate(aIntrospectionObject.fragments[0].styleTemplate);
            }
            if (aIntrospectionObject.fragments[0].widgets) {
                this.__mergeWidgets(aIntrospectionObject.fragments[0].widgets);
            }
        }
    },

    __mergeSchemas: function (aSchemas) {
        /* DEBUG */ dump("Yulup:editorparams.js:EditorParameters.__mergeSchemas() invoked\n");

        if (!this.schemas) {
            this.schemas = aSchemas;
        } else {
            for (var i = 0; i < aSchemas.length; i++) {
                this.schemas.push(aSchemas[i]);
            }
        }
    },

    __mergeStyles: function(aStyles) {
        /* DEBUG */ dump("Yulup:editorparams.js:EditorParameters.__mergeStyles() invoked\n");

        if (!this.styles) {
            this.styles = aStyles;
        } else {
            for (var i = 0; i < aStyles.length; i++) {
                this.styles.push(aStyles[i]);
            }
        }
    },

    __mergeStyleTemplate: function(aStyleTemplate) {
        /* DEBUG */ dump("Yulup:editorparams.js:EditorParameters.__mergeStyleTemplate() invoked\n");

        if (!this.styleTemplate) {
            this.styleTemplate = aStyleTemplate;
        }
    },

    __mergeWidgets: function(aWidgets) {
        /* DEBUG */ dump("Yulup:editorparams.js:EditorParameters.__mergeWidgets() invoked\n");

        if (!this.widgets) {
            this.widgets = aWidgets;
        } else {
            for (var i = 0; i < aWidgets.length; i++) {
                this.widgets.push(aWidgets[i]);
            }
        }
    }
};


/**
 * NeutronEditorParameters constructor. Instantiates a new object of
 * type NeutronEditorParameters.
 *
 * @constructor
 * @param  {nsIURI}                  aURI                 the URI of the document to load into the new editor
 * @param  {Introspection}           aIntrospectionObject the introspection object associated with the document to load
 * @param  {Integer}                 aFragment            the fragment identifier of the document to load
 * @param  {String}                  aLoadStyle           the Neutron load style, either "open" or "checkout"
 * @return {NeutronEditorParameters}
 */
function NeutronEditorParameters(aURI, aIntrospectionObject, aFragment, aLoadStyle) {
    /* DEBUG */ YulupDebug.ASSERT(aURI                 != null && aURI.spec != null);
    /* DEBUG */ YulupDebug.ASSERT(aIntrospectionObject != null);
    /* DEBUG */ YulupDebug.ASSERT(aFragment            != null);
    /* DEBUG */ YulupDebug.ASSERT(aLoadStyle           != null);

    EditorParameters.call(this, aURI, aIntrospectionObject.queryFragmentMIMEType(aFragment), aIntrospectionObject.queryFragmentSchemas(aFragment), aIntrospectionObject.queryFragmentStyles(aFragment), aIntrospectionObject.queryFragmentStyleTemplate(aFragment), aIntrospectionObject.queryFragmentWidgets(aFragment));

    this.openURI        = aIntrospectionObject.queryFragmentOpenURI(aFragment);
    this.openMethod     = aIntrospectionObject.queryFragmentOpenMethod(aFragment);
    this.saveURI        = aIntrospectionObject.queryFragmentSaveURI(aFragment);
    this.saveMethod     = aIntrospectionObject.queryFragmentSaveMethod(aFragment);
    this.checkoutURI    = aIntrospectionObject.queryFragmentCheckoutURI(aFragment);
    this.checkoutMethod = aIntrospectionObject.queryFragmentCheckoutMethod(aFragment);
    this.checkinURI     = aIntrospectionObject.queryFragmentCheckinURI(aFragment);
    this.checkinMethod  = aIntrospectionObject.queryFragmentCheckinMethod(aFragment);
    this.screenName     = aIntrospectionObject.queryFragmentName(aFragment);
    this.loadStyle      = aLoadStyle;
    this.navigation     = aIntrospectionObject.queryNavigation();
}

NeutronEditorParameters.prototype = {
    __proto__: EditorParameters.prototype,

    type          : "NeutronEditorParameters",
    openURI       : null,
    openMethod    : null,
    saveURI       : null,
    saveMethod    : null,
    checkoutURI   : null,
    checkoutMethod: null,
    checkinURI    : null,
    checkinMethod : null,
    screenName    : null,
    loadStyle     : null,

    /**
     * Substitute the editor parameters by the parameters
     * contained in the given Neutron introspection object.
     *
     * Note that this method is intended for updating the
     * editor parameters after a NAR load. The NAR must
     * contain exactly one fragment (everything else would not
     * make sense).
     *
     * @param  {Introspection} aIntrospectionObject a Neutron introspection object
     * @return {Undefined} does not have a return value
     */
    substituteIntrospectionParams: function (aIntrospectionObject) {
        /* DEBUG */ dump("Yulup:editorparams.js:NeutronEditorParameters.substituteIntrospectionParams() invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aIntrospectionObject != null);

        this.openURI        = aIntrospectionObject.queryFragmentOpenURI(0);
        this.openMethod     = aIntrospectionObject.queryFragmentOpenMethod(0);
        this.saveURI        = aIntrospectionObject.queryFragmentSaveURI(0);
        this.saveMethod     = aIntrospectionObject.queryFragmentSaveMethod(0);
        this.checkoutURI    = aIntrospectionObject.queryFragmentCheckoutURI(0);
        this.checkoutMethod = aIntrospectionObject.queryFragmentCheckoutMethod(0);
        this.checkinURI     = aIntrospectionObject.queryFragmentCheckinURI(0);
        this.checkinMethod  = aIntrospectionObject.queryFragmentCheckinMethod(0);
        this.screenName     = aIntrospectionObject.queryFragmentName(0);
        this.schemas        = aIntrospectionObject.queryFragmentSchemas(0);
        this.styles         = aIntrospectionObject.queryFragmentStyles(0);
        this.styleTemplate  = aIntrospectionObject.queryFragmentStyleTemplate(0);
        this.widgets        = aIntrospectionObject.queryFragmentWidgets(0);
        this.contentType    = aIntrospectionObject.queryFragmentMIMEType(0);
    },

    mergeIntrospectionParams: function (aIntrospectionObject) {
        /* DEBUG */ dump("Yulup:editorparams.js:NeutronEditorParameters.mergeIntrospectionParams() invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aIntrospectionObject != null);

        EditorParameters.prototype.mergeIntrospectionParams.call(this, aIntrospectionObject);
    }
};


/**
 * AtomEditorParameters constructor. Instantiates a new object of
 * type AtomEditorParameters.
 *
 * @constructor
 * @param  {nsIURI}               aURI            the URI of the document to load into the new editor
 * @param  {nsIURI}               aFeedURI        the feed URI the document belongs to
 * @param  {String}               aContentType    the content type of the document
 * @param  {String}               aTemplate       a template action parameter string
 * @return {AtomEditorParameters}
 */
function AtomEditorParameters(aURI, aFeedURI, aContentType) {
    /* DEBUG */ YulupDebug.ASSERT(aURI            != null && aURI.spec != null);
    /* DEBUG */ YulupDebug.ASSERT(aContentType    != null);

    EditorParameters.call(this, aURI, aContentType, null, null, null, null);

    this.feedURI        = aFeedURI;
}

AtomEditorParameters.prototype = {
    __proto__: EditorParameters.prototype,

    type          : "AtomEditorParameters",

    mergeIntrospectionParams: function (aIntrospectionObject) {
        /* DEBUG */ dump("Yulup:editorparams.js:AtomEditorParameters.mergeIntrospectionParams() invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aIntrospectionObject != null);

        EditorParameters.prototype.mergeIntrospectionParams.call(this, aIntrospectionObject);
    }
};
