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
     * Selects a local or remote asset and performs
     * upload if needed.
     *
     * @param  {nsIURI}       aSitetreeURI  the URI of the sitetree
     * @param  {String}       aTextBoxId    a textbox ID to write the selected URI to
     * @param  {nsIDOMWindow} aWindow       a handle to a non-modal window
     * @return {Undefined}  does not have a return value
     */
    doSelectCommand: function(aSitetreeURI, aTextBoxId, aWindow) {
        var enumLabels     = null;
        var objectSource   = null;
        var localFileURI   = null;
        var objectTarget   = null;
        var returnObject   = null;
        var progressDialog = null;
        var mimeType       = null;
        var sourceFile     = null;
        var targetURI      = null;
        var uploadURI      = null;

        /* DEBUG */ dump("Yulup:widet.js:ResourceSelectDialog.doSelectCommand() invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aSitetreeURI != null);
        /* DEBUG */ YulupDebug.ASSERT(aTextBoxId   != null);
        /* DEBUG */ YulupDebug.ASSERT(aWindow      != null);

        // TODO: i18n
        enumLabels = ["Local", "Remote"];

        // find out if we should select a local or a remote resource
        // TODO: i18n
        if ((objectSource = YulupDialogService.openEnumDialog("Select Source", "Please select the source of the resource.", enumLabels, 0)) == null)
            return;

        if (objectSource != null && objectSource != -1) {
            /* DEBUG */ dump("Yulup:widet.js:ResourceSelectDialog.doSelectCommand: selection source = \"" + objectSource + "\"\n");

            switch (objectSource) {
                case 0:
                    // select from local
                    localFileURI = PersistenceService.queryOpenFileURI();

                    if (!localFileURI)
                        return;

                    // find out where to place the local resource
                    // TODO: i18n
                    enumLabels = ["Near the document", "Select target manually"];

                    // TODO: i18n
                    if ((objectTarget = YulupDialogService.openEnumDialog("Select Target", "Please select where your asset should be stored.", enumLabels, 0)) == null)
                        return;

                    switch (objectTarget) {
                        case 0:
                            // upload the object relative to the document URI
                            // TODO: get document URI
                            uploadURI = "http://demo.yulup.org/" + localFileURI.file.leafName;

                            break;
                        case 1:
                            // query for the upload location
                            uploadURI = ResourceUploadDialog.showDocumentUploadDialog(aSitetreeURI);

                            if (!uploadURI)
                                return;

                            break;
                        default:
                            return;
                    }

                    // upload the object
                    progressDialog = new ProgressDialog(aWindow, document.getElementById("uiYulupOverlayStringbundle").getString("yulupResourceUploadProgressDialogTitle.label"), uploadURI);

                    // figure out MIME type
                    mimeType = YulupContentServices.getContentTypeFromURI(localFileURI);

                    sourceFile = PersistenceService.getFileDescriptor(localFileURI.path);

                    // TODO: after closing the dialog, the download dies
                    NetworkService.httpRequestUploadFile(uploadURI, sourceFile, null, mimeType, ResourceUploadDialog.__uploadRequestFinishedHandler, ResourceUploadDialog.__resourceUploadFinished, false, true, progressDialog);

                    targetURI = uploadURI;

                    break;
                case 1:
                    // select from remote
                    returnObject = {
                        error: null,
                        returnValue: null
                    };

                    if (!window.openDialog(YULUP_RESOURCE_SELECT_CHROME_URI, "yulupWidgetResourceSelectDialog", "modal,resizable=no,centerscreen", aSitetreeURI, returnObject))
                        return;

                    if (!returnObject.returnValue)
                        return;

                    targetURI = returnObject.returnValue.spec;

                    break;
                default:
                    return;
            }

            /* DEBUG */ dump("Yulup:widet.js:ResourceSelectDialog.doSelectCommand: inserting URI \"" + targetURI + "\"\n");
            document.getElementById(aTextBoxId).setAttribute("value", targetURI);
        }
    }
};
