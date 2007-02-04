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

const YULUP_RESOURCE_UPLOAD_CHROME_URI = "chrome://yulup/content/resourceuploaddialog.xul";

var ResourceUploadDialog = {
    showFilePicker: function () {
        var filePicker = null;
        var ret        = null;

        /* DEBUG */ dump("Yulup:resourceupload.js:ResourceUploadDialog.showFilePicker() invoked\n");

        filePicker = Components.classes["@mozilla.org/filepicker;1"].createInstance(Components.interfaces.nsIFilePicker);

        filePicker.init(window, "Select a File", Components.interfaces.nsIFilePicker.modeOpen);
        ret = filePicker.show();

        if (ret == Components.interfaces.nsIFilePicker.returnOK) {
            document.getElementById("uiYulupResourceUploadTextBox").value           = filePicker.file.path;
            document.getElementById("uiYulupResourceUploadRemoteNameTextBox").value = filePicker.file.leafName;
        }
    },

    uiYulupEditorResourceUploadOnDialogLoadHandler: function () {
        var tree = null;

        /* DEBUG */ dump("Yulup:resourceupload.js:ResourceUploadDialog.uiYulupEditorResourceUploadOnDialogLoadHandler() invoked\n");

        // coerce the window to have a min height of 400 because of bug https://bugzilla.mozilla.org/show_bug.cgi?id=291331
        if (document.getElementById("uiYulupEditorResourceUploadDialog").height < 400)
            document.getElementById("uiYulupEditorResourceUploadDialog").height = 400;

        // coerce the window to have a min width of 400 because of bug https://bugzilla.mozilla.org/show_bug.cgi?id=291331
        if (document.getElementById("uiYulupEditorResourceUploadDialog").width < 400)
            document.getElementById("uiYulupEditorResourceUploadDialog").width = 400;

        if (window.arguments[0]) {
            document.getElementById("uiYulupResourceSelect").removeAttribute("hidden");
        } else if (window.arguments[3]) {
            document.getElementById("uiYulupResourceUploadRemoteNameTextBox").value = window.arguments[3];
        }

        tree = document.getElementById("uiYulupResourceUploadTree");

        tree.view = new SitetreeView(window.arguments[1], ResourceUploadDialog.sitetreeErrorListener);
        tree.view.wrappedJSObject.selectionChangeObserver = ResourceUploadDialog.onSelectionChangeListener;
    },

    onSelectionChangeListener: function (aNode) {
        /* DEBUG */ dump("Yulup:resourceupload.js:ResourceUploadDialog.onSelectionChangeListener() invoked\n");

        if (!aNode.isContainer)
            document.getElementById("uiYulupResourceUploadRemoteNameTextBox").value = aNode.name;
    },

    /**
     * Show the resource upload dialog.
     *
     * @param  {nsIURI} aURI          the entry URI
     * @return {Undefined} does not have a return value
     */
    showResourceUploadDialog: function (aURI) {
        var returnObject   = null;
        var mimeService    = null;
        var sourceFile     = null;
        var targetURI      = null;
        var mimeType       = null;
        var progressDialog = null;

        /* DEBUG */ dump("Yulup:resourceupload.js:ResourceUploadDialog.showResourceUploadDialog() invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aURI != null);

        returnObject = {
            error        : false,
            resourceURI  : null,
            collectionURI: null,
            resourceName : null
        };

        window.openDialog(YULUP_RESOURCE_UPLOAD_CHROME_URI, "yulupResourceUploadDialog", "modal,resizable=yes,centerscreen", true, aURI, returnObject);

        if (returnObject.error) {
            alert(document.getElementById("uiYulupOverlayStringbundle").getString("yulupSitetreeLoadFailure.label"));

            return;
        }

        if (returnObject.resourceURI && returnObject.collectionURI && returnObject.resourceName) {
            // figure out MIME type
            mimeService = Components.classes["@mozilla.org/mime;1"].getService(Components.interfaces.nsIMIMEService);
            sourceFile  = PersistenceService.getFileDescriptor(returnObject.resourceURI);

            try {
                mimeType = mimeService.getTypeFromFile(sourceFile);
            } catch (exception) {
                // could not figure out MIME type, fall back to generic octet-stream
                mimeType = "application/octet-stream";
            }

            // construct target URI
            targetURI = returnObject.collectionURI.spec + "/" + returnObject.resourceName;

            progressDialog = new ProgressDialog(window, document.getElementById("uiYulupOverlayStringbundle").getString("yulupResourceUploadProgressDialogTitle.label"), targetURI);

            // upload file to server
            NetworkService.httpRequestUploadFile(targetURI, sourceFile, null, mimeType, ResourceUploadDialog.__uploadRequestFinishedHandler, ResourceUploadDialog.__resourceUploadFinished, false, true, progressDialog);
        }
    },

    /**
     * Show the document upload dialog.
     *
     * @param  {nsIURI} aURI          the entry URI
     * @param  {String} aDocumentName a proposed name for the document name on the server
     * @return {String} the selected target URI or null if none was selected
     */
    showDocumentUploadDialog: function (aURI, aDocumentName) {
        var returnObject   = null;
        var mimeService    = null;
        var sourceFile     = null;
        var targetURI      = null;
        var mimeType       = null;
        var progressDialog = null;

        /* DEBUG */ dump("Yulup:resourceupload.js:ResourceUploadDialog.showDocumentUploadDialog() invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aURI != null);

        returnObject = {
            error        : false,
            collectionURI: null,
            resourceName : null
        };

        window.openDialog(YULUP_RESOURCE_UPLOAD_CHROME_URI, "yulupDocumentUploadDialog", "modal,resizable=yes,centerscreen", false, aURI, returnObject, aDocumentName);

        if (returnObject.error) {
            alert(document.getElementById("uiYulupOverlayStringbundle").getString("yulupSitetreeLoadFailure.label"));

            return null;
        }

        if (returnObject.collectionURI && returnObject.resourceName) {
            // return target URI
            return returnObject.collectionURI.spec + "/" + returnObject.resourceName;
        } else {
            return null;
        }
    },

    uploadResource: function () {
        var collectionURI = null;
        var resourceURI   = null;
        var resourceName  = null;
        var returnObject  = null;

        /* DEBUG */ dump("Yulup:resourceupload.js:ResourceUploadDialog.uploadResource() invoked\n");

        if (window.arguments[0])
            resourceURI   = document.getElementById("uiYulupResourceUploadTextBox").value;

        resourceName  = document.getElementById("uiYulupResourceUploadRemoteNameTextBox").value;
        collectionURI = document.getElementById("uiYulupResourceUploadTree").view.wrappedJSObject.getCurrentCollectionURI();

        /* DEBUG */ dump("Yulup:resourceupload.js:ResourceUploadDialog.uploadResource: file to upload = \"" + resourceURI + "\", remote resource name = \"" + resourceName + "\", target collection = \"" + (collectionURI ? collectionURI.spec : collectionURI) + "\"\n");

        // check if a file to upload was selected
        if (window.arguments[0] && (!resourceURI || resourceURI == "")) {
            alert(document.getElementById("uiYulupOverlayStringbundle").getString("yulupResourceUploadNoFileProvided.label"));

            document.getElementById("uiYulupResourceUploadShowFilePickerButton").focus();

            return false;
        }

        // check if a target resource was selected
        if (!collectionURI) {
            alert(document.getElementById("uiYulupOverlayStringbundle").getString("yulupResourceUploadNoTargetResourceProvided.label"));

            document.getElementById("uiYulupResourceUploadTree").focus();

            return false;
        }

        // check if a remote file name was given
        if (!resourceName || resourceName == "") {
            alert(document.getElementById("uiYulupOverlayStringbundle").getString("yulupResourceUploadNoResourceNameProvided.label"));

            document.getElementById("uiYulupResourceUploadRemoteNameTextBox").focus();

            return false;
        }

        if (window.arguments[2]) {
            returnObject = window.arguments[2];

            if (window.arguments[0])
                returnObject.resourceURI = resourceURI;

            returnObject.resourceName  = resourceName;
            returnObject.collectionURI = collectionURI;

            return true;
        }

        return false;
    },

    cancelDialog: function () {
        if (window.arguments[2]) {
            returnObject = window.arguments[2];

            if (window.arguments[0])
                returnObject.resourceURI = null;

            returnObject.resourceName  = null;
            returnObject.collectionURI = null;
        }

        return true;
    },

    sitetreeErrorListener: function () {
        returnObject = null;

        if (window.arguments[2]) {
            returnObject = window.arguments[2];

            returnObject.error = true;
        }

        // close the dialog
        document.getElementById("uiYulupEditorResourceUploadDialog").cancelDialog();
    },

    __uploadRequestFinishedHandler: function (aDocumentData, aResponseStatusCode, aRequestFinishedCallback, aResponseHeaders, aException) {
        /* DEBUG */ dump("Yulup:resourceupload.js:ResourceUploadDialog.__uploadRequestFinishedHandler() invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aResponseStatusCode              != null);
        /* DEBUG */ YulupDebug.ASSERT(aRequestFinishedCallback         != null);
        /* DEBUG */ YulupDebug.ASSERT(typeof(aRequestFinishedCallback) == "function");

        if (aResponseStatusCode == 200 && !aException) {
            // success, call back to original caller
            aRequestFinishedCallback(aDocumentData, null);
        } else {
            if (aException) {
                aRequestFinishedCallback(null, aException);
            } else if (aDocumentData) {
                try {
                    // parse error message (throws an exeception)
                    Neutron.response(aDocumentData);
                } catch (exception) {
                    aRequestFinishedCallback(null, exception);
                    return;
                }
            } else {
                aRequestFinishedCallback(null, null);
            }
        }
    },

    /**
     * Callback function to handle finished document uploads.
     *
     * @param  {String}    aDocumentData the response document as sent by the remote host
     * @param  {Error}     aException    an exception as returned by the server (e.g. a Neutron exception)
     * @return {Undefined} does not have a return value
     */
    __resourceUploadFinished: function (aDocumentData, aException) {
        /* DEBUG */ dump("Yulup:resourceupload.js:ResourceUploadDialog.__resourceUploadFinished(\"" + aDocumentData + "\", \"" + aException + "\") invoked\n");

        if (aException == null) {
            // report success
            alert(document.getElementById("uiYulupOverlayStringbundle").getString("yulupDocumentUploadSuccess.label"));

        } else {
            if (aException && (aException instanceof NeutronProtocolException || aException instanceof NeutronAuthException)) {
                // report error message retrieved from response
                alert(document.getElementById("uiYulupOverlayStringbundle").getString("yulupDocumentUploadServerError.label") + ": \n\n" + aException.message);
            } else if (aException) {
                dump("Yulup:resourceupload.js:ResourceUploadDialog.__resourceUploadFinished: an error occurred during parsing the response message: " + aException.toString() + "\n");

                // report generic error
                alert(document.getElementById("uiYulupOverlayStringbundle").getString("yulupDocumentUploadFailure.label"));

                /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:resourceupload.js:ResourceUploadDialog.__resourceUploadFinished", aException);

                Components.utils.reportError(aException);
            } else {
                dump("Yulup:resourceupload.js:ResourceUploadDialog.__resourceUploadFinished: received neither document data nor an exception.\n");

                // report generic error
                alert(document.getElementById("uiYulupOverlayStringbundle").getString("yulupDocumentUploadFailure.label"));
            }
        }
    }
};
