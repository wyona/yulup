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

        tree.addEventListener("dblclick", this.onTreeDblclick, false);
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

    onTreeDblclick: function (aEvent) {
        /* DEBUG */ dump("Yulup:resourceselect.js:ResourceSelectDialog.onTreeDblclick() invoked\n");

        if (aEvent.originalTarget.namespaceURI == "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul" &&
            aEvent.originalTarget.localName    == "treechildren") {
            if (document.getElementById("uiYulupResourceSelectTree").view.selection.count <= 0)
                return;

            document.getElementById("uiYulupEditorResourceSelectDialog").acceptDialog();
        }
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

    showResourceSelectDialog: function (aSitetreeURI) {
        var returnObject = null;

        /* DEBUG */ dump("Yulup:widet.js:ResourceSelectDialog.showResourceSelectDialog() invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aSitetreeURI != null);

        returnObject = {
            error: null,
            returnValue: null
        };

        if (!window.openDialog(YULUP_RESOURCE_SELECT_CHROME_URI, "yulupWidgetResourceSelectDialog", "modal,resizable=yes,centerscreen", aSitetreeURI, returnObject))
            return null;

        return returnObject.returnValue;
    }
};
