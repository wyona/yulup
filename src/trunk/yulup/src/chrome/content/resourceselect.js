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

        sitetreeURI = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService).newURI(window.arguments[0], null, null);

        tree.view = new SitetreeView(sitetreeURI, ResourceSelectDialog.sitetreeErrorListener);
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

    doSelectCommand: function(aURI, aTextBoxId) {
        var returnObject = null;

        /* DEBUG */ YulupDebug.ASSERT(aURI       != null);
        /* DEBUG */ YulupDebug.ASSERT(aTextBoxId != null);

        /* DEBUG */ dump("Yulup:widet.js:ResourceSelectDialog.doSelectCommand() invoked\n");

        returnObject = {
            error: null,
            returnValue: null
        };

        if (window.openDialog(YULUP_RESOURCE_SELECT_CHROME_URI, "yulupWidgetResourceSelectDialog", "modal,resizable=no,centerscreen", aURI, returnObject)) {
            if (returnObject.returnValue) {
                /* DEBUG */ dump("Yulup:widet.js:ResourceSelectDialog.doSelectCommand: inserting URI \"" + returnObject.returnValue.spec + "\"\n");
                document.getElementById(aTextBoxId).setAttribute("value", returnObject.returnValue.spec);
            }
        }
    }

};
