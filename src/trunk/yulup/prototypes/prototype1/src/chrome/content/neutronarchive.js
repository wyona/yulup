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
 * @author Gregor Imboden
 *
 */

// path in the nar file to the intospection file
const NAR_INTROSPECTION_FILE = "introspection.xml";
// directory under 'TmpD' where NAR files get extracted
const NAR_TMP_DIR  = "yulup-nar";
// directory relative to the install directory where template NAR files are stored
const NAR_TEMPLATE_DIR = "templates";


/**
 * Instantiates new object of the type NeutronArchive
 *
 * @param  {nsIURI}         aLoadURI the uri where the neutron archive is located
 * @return {NeutronArchive}
 */
function NeutronArchive(aLoadURI) {

    /* DEBUG */ dump("Yulup:neutronarchive.js:NeutronArchive.NeutronArchive(" + aLoadURI.spec +") invoked\n");

    this.loadURI     = aLoadURI;
    this.archiveID   = Date.now();
}

NeutronArchive.prototype = {
    document     : null,
    introspection: null,
    widgets      : null,
    loadURI      : null,
    archiveId    : null,
    tmpArchive   : null,
    zipArchiveURI: null,

    /**
    * Load the neutron archive
    *
    * @param  {Function}  aLoadFinishedCallback the function to call when the download finished
    * @param  {Boolean}   aLocal                wheter to load a local nar file or not
    * @return {Undefined}                       does not have a return value
    */
    loadNeutronArchive: function(aLoadFinishedCallback, aLocal) {
        var tmpDir     = null;
        var archiveURI = null;

        /* DEBUG */ dump("Yulup:neutronarchive.js:NeutronArchive.loadNeutronArchive() invoked\n");

        if (aLocal) {
            // create a jar-URI object pointing to the local nar file
            this.zipArchiveURI = Components.classes["@mozilla.org/network/io-service;1"]. getService(Components.interfaces.nsIIOService).newURI("jar:" + this.loadURI.spec + "!/dummy", null, null);

            /* DEBUG */ dump("Yulup:neutronarchive.js:NeutronArchive.loadNeutronArchive(): archive URI: " + this.zipArchiveURI.spec + "\n");

            return;
        }

        // get a nsIFile pointing to the tmp directory
        tmpDir = Components.classes["@mozilla.org/file/directory_service;1"].getService(Components.interfaces.nsIProperties).get("TmpD", Components.interfaces.nsIFile);

        // create a file for the 'to be downloaded' archive
        tmpDir.append(NAR_TMP_DIR);
        tmpDir.append(this.archiveID);
        if (!tmpDir.exists()) {
            tmpDir.create(Components.interfaces.nsIFile.FILE_TYPE, 0755);
        }
        this.tmpArchive = tmpDir.clone();

        /* DEBUG */ dump("Yulup:neutronarchive.js:NeutronArchive.loadNeutronArchive: temp file: " + this.tmpArchive.path + "\n");

        archiveURI = Components.classes["@mozilla.org/network/io-service;1"]. getService(Components.interfaces.nsIIOService).newFileURI(this.tmpArchive);

        // create a jar-URI object
        this.zipArchiveURI = Components.classes["@mozilla.org/network/io-service;1"]. getService(Components.interfaces.nsIIOService).newURI("jar:" + archiveURI.spec + "!/dummy", null, null);

        /* DEBUG */ dump("Yulup:neutronarchive.js:NeutronArchive.loadNeutronArchive: archive URI: " + this.zipArchiveURI.spec + "\n");

        NetworkService.httpFetchToFile(this.loadURI.spec, this.tmpArchive, this.__requestFinishedHandler, aLoadFinishedCallback, true);
    },

    /**
     *
     * @param  {nsIFile}  aResultFile              the data returned by the request
     * @param  {Long}     aResponseStatusCode      the status code of the response
     * @param  {Function} aRequestFinishedCallback a function with the signature function(String, Exception)
     * @param  {Array}    aResponseHeaders         the response headers
     * @param  {Error}    aException               an exception, or null if everything went well
     * @return {Undefined} does not have a return value
     */
    __requestFinishedHandler: function (aResultFile, aResponseStatusCode, aRequestFinishedCallback, aResponseHeaders, aException) {
        var fileURI = null;
        var xmlDoc  = null;

        /* DEBUG */ dump("Yulup:neutronarchive.js:NeutronArchive.__requestFinishedHandler(\"" + aResultFile + "\", \"" + aResponseStatusCode + "\", \"" + aRequestFinishedCallback + "\", \"" + aResponseHeaders + "\", \"" + aException + "\") invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aResponseStatusCode              != null);
        /* DEBUG */ YulupDebug.ASSERT(aRequestFinishedCallback         != null);
        /* DEBUG */ YulupDebug.ASSERT(typeof(aRequestFinishedCallback) == "function");

        if (aResponseStatusCode == 200) {
            aRequestFinishedCallback(aResultFile, null);
        } else {
            if (aException) {
                aRequestFinishedCallback(null, aException);
            } else {
                try {
                    // get an nsIURI object for the response file
                    fileURI = Components.classes["@mozilla.org/network/io-service;1"]. getService(Components.interfaces.nsIIOService).newFileURI(aResultFile);

                    xmlDoc = new XMLDocument(fileURI);
                    xmlDoc.loadDocument();

                    // parse error message (throws an exeception)
                    Neutron.response(xmlDoc.documentData);
                } catch (exception) {
                    aRequestFinishedCallback(null, exception);
                    return;
                }
            }
        }
    },

    /**
     * Extract the zipped neutron archive into the temp directory.
     *
     * @return {Undefined} does not have a return value
     */
    extractNeutronArchive: function() {

        /* DEBUG */ dump("Yulup:neutronarchive.js:NeutronArchive.loadNeutronArchive() invoked\n");

        try {

            // load the introspection file
            this.loadIntrospectionFile();

            // rewrite introspection links
            this.rewriteIntrospectionURI();

        } catch (exception) {
            YulupDebug.dumpExceptionToConsole("Yulup:neutronarchive.js:NeutronArchive.extractNeutronArchive", exception);
            Components.utils.reportError(exception);

            throw new YulupEditorException(Editor.getStringbundleString("editorNeutronArchiveExtractionError.label"));
        }
    },

    /**
     * Load the Introspection file from the filesystem
     *
     * @return {Undefined} does not have a return value
     */
    loadIntrospectionFile: function() {
        var xmlDoc              = null;
        var neutronParser       = null;
        var introspectionZipURI = null;

        /* DEBUG */ dump("Yulup:neutronarchive.js:NeutronArchive.loadIntrospectionFile() invoked\n");

        introspectionZipURI = Components.classes["@mozilla.org/network/io-service;1"]. getService(Components.interfaces.nsIIOService).newURI(NAR_INTROSPECTION_FILE, null, this.zipArchiveURI);

        xmlDoc = new XMLDocument(introspectionZipURI);
        xmlDoc.loadDocument();

        neutronParser = new NeutronParser10(xmlDoc.getDocumentDOM(), this.zipArchiveURI);
        this.introspection = neutronParser.parseIntrospection();

        /* DEBUG */ dump("Yulup:neutronarchive.js:NeutronArchive.loadIntrospectionFile()\n" + this.introspection.toString());
    },

    /**
     * Merges this archive's introspection with the
     * introspection given in aIntrospection.
     *
     * @param  {Introspection} aIntrospection the introspection object that will be extended
     * @return {Undefined}                    does not have a return value
     */
    mergeIntrospection: function(aIntrospection) {
        var mimeType = null;

        /* DEBUG */ dump("Yulup:neutronarchive.js:NeutronArchive.mergeIntrospection() invoked\n");

        if (!this.introspection) {
            return null;
        }

        // edit section
        if (this.introspection.fragments) {
            this.__mergeEdit(aIntrospection);
        }

        // new section
        this.__mergeNew(aIntrospection);

        // navigation
        this.__mergeNavigation(aIntrospection);
    },

    __mergeEdit: function(aIntrospection) {

        /* DEBUG */ dump("Yulup:neutronarchive.js:NeutronArchive.__mergeEdit() invoked\n");

        for (var i=0; i < this.introspection.fragments.length; i++) {
            mimeType = this.introspection.fragments[i].mimeType;
            for (var j=0; j < aIntrospection.fragments.length; j++) {
                if (aIntrospection.fragments[j].mimeType == mimeType) {
                    if (this.introspection.fragments[i].schemas) {
                        this.__mergeSchemas(aIntrospection.fragments[j], this.introspection.fragments[i]);
                    }
                    if (this.introspection.fragments[i].styles) {
                        this.__mergeStyles(aIntrospection.fragments[j], this.introspection.fragments[i]);
                    }
                    if (this.introspection.fragments[i].widgets) {
                        this.__mergeWidgets(aIntrospection.fragments[j], this.introspection.fragments[i]);
                    }
                }
            }
        }
    },

    __mergeSchemas: function(aFragment, aNewFragment) {

        /* DEBUG */ dump("Yulup:neutronarchive.js:NeutronArchive.__mergeSchemas() invoked\n");

        if (!aFragment.schemas) {
            aFragment.schemas = aNewFragment.schemas;
        } else {
            for (var i=0; i < aNewFragment.schemas.length; i++) {
                aFragment.schemas[aFragment.schemas.length] = aNewFragment.schemas[i];
            }
        }
    },

    __mergeStyles: function(aFragment, aNewFragment) {

        /* DEBUG */ dump("Yulup:neutronarchive.js:NeutronArchive.__mergeStyles() invoked\n");

        if (!aFragment.styles) {
            aFragment.styles = aNewFragment.styles;
        } else {
            for (var i=0; i < aNewFragment.styles.length; i++) {
                aFragment.styles[aFragment.styles.length] = aNewFragment.stlyes[i];
            }
        }
    },

    __mergeWidgets: function(aFragment, aNewFragment) {

        /* DEBUG */ dump("Yulup:neutronarchive.js:NeutronArchive.__mergeWidgets() invoked\n");

        if (!aFragment.widgets) {
            aFragment.widgets = aNewFragment.widgets;
        } else {
            for (var i=0; i < aNewFragment.widgets.length; i++) {
                aFragment.widgets[aFragment.widgets.length] = aNewFragment.widgets[i];
            }
        }
    },

    __mergeNew: function(aIntrospection) {

        /* DEBUG */ dump("Yulup:neutronarchive.js:NeutronArchive.__mergeNew() invoked\n");

        if (!aIntrospection.newAsset) {
            aIntrospection.newAsset = this.introspection.newAsset;
        } else {
            for (var i=0; i < this.introspection.newAsset.length; i++) {
                aIntrospection.newAsset[aIntrospection.newAsset.length] = this.introspection.newAsset[i];
            }
        }
    },

    __mergeNavigation: function(aIntrospection) {

        /* DEBUG */ dump("Yulup:neutronarchive.js:NeutronArchive.__mergeNavigation() invoked\n");

        if (!aIntrospection.navigation) {
            aIntrospection.navigation = this.introspection.navigation;
        } else {
            for (var i=0; i < this.introspection.navigation.length; i++) {
                aIntrospection.navigation[aIntrospection.navigation.length] = this.introspection.navigation[i];
            }
        }
    },

    /**
     * Rewrite the save/checking links in the introspection file
     *
     * The introspection file gets parsed relative to the tmp directory,
     * the links point therefore to the files in the tmp directory, which is
     * fine for open/checkout but incorrect for save/checkin, thus the
     * save/checkin links get rewritten to point to the original server.
     *
     * @return {Undefined}         does not have a return value
     */
    rewriteIntrospectionURI: function() {
        var ioService  = null;

        /* DEBUG */ dump("Yulup:neutronarchive.js:NeutronArchive.rewriteIntrospectionURI() invoked\n");

        ioService = Components.classes["@mozilla.org/network/io-service;1"]. getService(Components.interfaces.nsIIOService);

        for (var i=0; i<this.introspection.fragments.length; i++) {

            if (this.introspection.fragments[i].checkin.uri) {
                this.introspection.fragments[i].checkin.uri = ioService.newURI(this.introspection.fragments[i].checkin.uri.path.substr(this.introspection.fragments[i].checkin.uri.path.indexOf("!") + 2), null, this.loadURI);

                /* DEBUG */ dump("Yulup:neutronarchive.js:NeutronArchive.rewriteIntrospectionURI: checkin: " + this.introspection.fragments[i].checkin.uri.spec + "\n");
            }

            if (this.introspection.fragments[i].save.uri) {
                this.introspection.fragments[i].save.uri = ioService.newURI(this.introspection.fragments[i].save.uri.path.substr(this.introspection.fragments[i].save.uri.path.indexOf("!") + 2), null, this.loadURI);

                /* DEBUG */ dump("Yulup:neutronarchive.js:NeutronArchive.rewriteIntrospectionURI: save: " + this.introspection.fragments[i].save.uri.spec + "\n");
            }
        }
    }
};

/**
  * Registry which hold mime-type to template nar file mappings.
  *
  * Mime-Types that should have some default widgets, styles, schemas,
  * navigation elements or templates should be registered in the
  * mimeTypeMap with the appropriate nar file.
  *
  */
var NeutronArchiveRegistry = {

    // registered mime-types
    mimeTypeMap: {
        "application/xhtml+xml" : "xhtml.nar",
        "application/mathml"    : "mathml.nar",
        "application/atom+xml"  : "atom.nar"
    },

    /**
     * Returns the URI of the NAR file with the matching mime-type.
     *
     * @param  {String} aMimeType the mime-type of the NAR
     * @return {nsIURI}           the URI pointing to the NAR file or null if no NAR file is registered for this mime-type
     */
    getArchiveURI: function(aMimeType) {
        var narDir           = null;
        var narFile          = null;
        var narURI           = null;
        var installDir       = null;

        /* DEBUG */ dump("Yulup:neutronarchive.js:NeutronArchiveRegistry.getArchiveURI(\"" + aMimeType + "\") invoked\n");

        narFile = NeutronArchiveRegistry.mimeTypeMap[aMimeType];

        if (!narFile) {
            /* DEBUG */ dump("Yulup:neutronarchive.js:NeutronArchiveRegistry.getArchiveURI: no template NAR for this mime-type\n");
            return null;
        }

        // get the extension installation directory
        installDir = Components.classes["@mozilla.org/extensions/manager;1"]. getService(Components.interfaces.nsIExtensionManager).getInstallLocation(YULUP_EXTENSION_ID).getItemLocation(YULUP_EXTENSION_ID);

        installDir.append(NAR_TEMPLATE_DIR);
        installDir.append(narFile);

        // create a nsIFileURI pointing to the template NAR file
        narURI = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService).newFileURI(installDir);

        /* DEBUG */ dump("Yulup:neutronarchive.js:NeutronArchiveRegistry.getArchiveURI: narURI = \"" + narURI.spec + "\"\n");

        return narURI;
    }
};
