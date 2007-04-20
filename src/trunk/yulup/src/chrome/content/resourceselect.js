/*
 * ***** BEGIN LICENSE BLOCK *****
 * Copyright 2006-2007 Wyona AG Zurich
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
 * @author Andreas Wuest
 *
 */

const YULUP_RESOURCE_SELECT_CHROME_URI = "chrome://yulup/content/resourceselectdialog.xul";

var ResourceSelectDialog = {
    uiYulupEditorResourceSelectOnDialogLoadHandler: function() {
        var tree          = null;
        var sitetreeURI   = null;

        /* DEBUG */ dump("Yulup:resourceselect.js:ResourceSelectDialog.uiYulupEditorResourceSelectOnDialogLoadHandler() invoked\n");

        tree = document.getElementById("uiYulupResourceSelectTree");

        tree.view = new SitetreeView(window.arguments[0], ResourceSelectDialog.sitetreeErrorListener);
    },

    sitetreeErrorListener: function () {
        returnObject = null;

        if (window.arguments[1]) {
            returnObject = window.arguments[1];

            returnObject.error = true;
        }

        // close the dialog
        document.getElementById("uiYulupEditorResourceSelectDialog").cancelDialog();
    },

    save: function () {
        var tree        = null;
        var resourceURI = null;

        /* DEBUG */ dump("Yulup:resourceselect.js:ResourceSelectDialog.save() invoked\n");

        returnObject = window.arguments[1];

        tree = document.getElementById("uiYulupResourceSelectTree");

        // fetch tree selection
        resourceURI = tree.view.wrappedJSObject.getCurrentResourceURI();

        if (!resourceURI) {
            alert(document.getElementById("uiYulupEditorStringbundle").getString("yulupResourceSelectionNoResourceProvided.label"));

            document.getElementById("uiYulupResourceSelectTree").focus();

            return false;
        }

        // write tree selection to the returnObject
        returnObject.returnValue = resourceURI;

        /* DEBUG */ dump("Yulup:resourceselect.js:ResourceSelectDialog.save: URI to return is \"" + returnObject.returnValue + "\"\n");

        return true;
    },

    /**
     * Selects a local asset and performs upload if needed.
     *
     * @param  {nsIURI}       aSitetreeURI  the URI of the sitetree
     * @param  {nsIDOMWindow} aWindow       a handle to a non-modal window
     * @return {String}  returns the URI of the selected asset or null if the selection was aborted
     */
    doSelectFromLocal: function (aSitetreeURI, aWindow) {
        var localFileURI   = null;
        var enumLabels     = null;
        var objectTarget   = null;
        var progressDialog = null;
        var mimeType       = null;
        var sourceFile     = null;
        var uploadURI      = null;

        /* DEBUG */ dump("Yulup:widet.js:ResourceSelectDialog.doSelectFromLocal() invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aSitetreeURI != null);
        /* DEBUG */ YulupDebug.ASSERT(aWindow      != null);

        // select from local
        localFileURI = PersistenceService.queryOpenFileURI(PersistenceService.FILETYPE_BINARY);

        if (!localFileURI)
            return null;

        // find out where to place the local resource
        // TODO: i18n
        enumLabels = ["Near the document", "Select target manually"];

        // TODO: i18n
        if ((objectTarget = YulupDialogService.openEnumDialog("Select Target", "Please select where your asset should be stored.", enumLabels, 0)) == null)
            return null;

        switch (objectTarget) {
            case 0:
                // upload the object relative to the document URI
                // TODO: get document URI
                uploadURI = "http://demo.yulup.org/" + localFileURI.file.leafName;

                break;
            case 1:
                // query for the upload location
                uploadURI = ResourceUploadDialog.showDocumentUploadDialog(aSitetreeURI, localFileURI.file.leafName);

                if (!uploadURI)
                    return null;

                break;
           default:
               return null;
        }

        // upload the object
        // TODO: perform i18n via stringbundle loader
        progressDialog = new ProgressDialog(aWindow, document.getElementById("uiYulupOverlayStringbundle").getString("yulupResourceUploadProgressDialogTitle.label"), uploadURI);

        // figure out MIME type
        mimeType = YulupContentServices.getContentTypeFromURI(localFileURI);

        sourceFile = PersistenceService.getFileDescriptor(localFileURI.path);

        // TODO: after closing the dialog, the download dies
        NetworkService.httpRequestUploadFile(uploadURI, sourceFile, null, mimeType, ResourceUploadDialog.__uploadRequestFinishedHandler, ResourceUploadDialog.__resourceUploadFinished, false, true, progressDialog);

        /* DEBUG */ dump("Yulup:widet.js:ResourceSelectDialog.doSelectFromLocal: asset URI is \"" + uploadURI + "\"\n");

        return uploadURI;
    },

    /**
     * Selects a remote asset.
     *
     * @param  {nsIURI}       aSitetreeURI  the URI of the sitetree
     * @param  {nsIDOMWindow} aWindow       a handle to a non-modal window
     * @return {String}  returns the URI of the selected asset or null if the selection was aborted
     */
    doSelectFromRemote: function (aSitetreeURI, aWindow) {
        var returnObject = null;
        var targetURI    = null;

        /* DEBUG */ dump("Yulup:widet.js:ResourceSelectDialog.doSelectFromRemote() invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aSitetreeURI != null);
        /* DEBUG */ YulupDebug.ASSERT(aWindow      != null);

        // select from remote
        returnObject = {
            error: null,
            returnValue: null
        };

        if (!window.openDialog(YULUP_RESOURCE_SELECT_CHROME_URI, "yulupWidgetResourceSelectDialog", "modal,resizable=no,centerscreen", aSitetreeURI, returnObject))
            return null;

        if (!returnObject.returnValue)
            return null;

        targetURI = returnObject.returnValue.spec;

        /* DEBUG */ dump("Yulup:widet.js:ResourceSelectDialog.doSelectFromRemote: asset URI is \"" + targetURI + "\"\n");

        return targetURI;
    }
};
