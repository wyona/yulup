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

const YULUP_VERSIONINFO_CHROME_URI = "chrome://yulup/content/neutronsidebar/versioninfodialog.xul";

function NeutronVersionInfoDialog(aWindow, aNeutronResourceName, aNeutronResourceVersion) {
    /* DEBUG */ dump("Yulup:versioninfodialog.js:NeutronVersionInfoDialog() invoked\n");

    /* DEBUG */ YulupDebug.ASSERT(aWindow                 != null);
    /* DEBUG */ YulupDebug.ASSERT(aNeutronResourceName    != null);
    /* DEBUG */ YulupDebug.ASSERT(aNeutronResourceVersion != null);

    this.__resourceName    = aNeutronResourceName;
    this.__resourceVersion = aNeutronResourceVersion;

    this.__dialog = aWindow.openDialog(YULUP_VERSIONINFO_CHROME_URI, "yulupNeutronVersionInfoDialog" + YulupAppServices.generateUID(), "resizable=yes", this);
}

NeutronVersionInfoDialog.prototype = {
    /**
     * Initialise the dialog.
     *
     * @return {Undefined} does not have a return value
     */
    onLoadHandler: function () {
        var versionCaption = null;
        var versionInfo    = null;

        /* DEBUG */ dump("Yulup:versioninfodialog.js:NeutronVersionInfoDialog.onLoadHandler() invoked\n");

        versionCaption = this.__dialog.document.getElementById("uiYulupVersionGroupboxCaption");
        versionCaption.label = versionCaption.label + " \"" + this.__resourceName + "\"";

        this.__dialog.title = this.__dialog.title + " - " + this.__resourceName;

        versionInfo = this.__dialog.document.getElementById("uiYulupVersionInfoDisplay");

        versionInfo.clearFields();

        versionInfo.revision = this.__resourceVersion.revision;
        versionInfo.date     = this.__resourceVersion.date;
        versionInfo.comment  = this.__resourceVersion.comment;
        versionInfo.user     = this.__resourceVersion.user;

        if (this.__resourceVersion.getWorkflowState()) {
            versionInfo.wfState = this.__resourceVersion.getWorkflowState().state;
            versionInfo.wfDate  = this.__resourceVersion.getWorkflowState().date;
        }

        // set up workflow history tree
        if (this.__resourceVersion.getWorkflowHistory())
            this.__dialog.document.getElementById("uiYulupWorkflowHistoryTree").view = new NeutronVersionInfoWorkflowHistoryTree(this.__resourceVersion.getWorkflowHistory());
    }
};


/**
 * NeutronVersionInfoWorkflowHistoryTree constructor. Instantiates a new object of
 * type NeutronVersionInfoWorkflowHistoryTree.
 *
 * Implementes the nsITreeView interface.
 *
 * @constructor
 * @param  {Array} aNeutronWorkflowHistory  an array of NeutronWorkflowState objects
 * @return {NeutronVersionInfoWorkflowHistoryTree} a new NeutronVersionInfoWorkflowHistoryTree object
 */
function NeutronVersionInfoWorkflowHistoryTree(aNeutronWorkflowHistory) {
    /* DEBUG */ dump("Yulup:versioninfodialog.js:NeutronVersionInfoWorkflowHistoryTree() invoked\n");

    /* DEBUG */ YulupDebug.ASSERT(aNeutronWorkflowHistory != null);

    // call super constructor
    YulupTreeViewBase.call(this);

    this.__treeSource = aNeutronWorkflowHistory;
    this.rowCount     = this.__treeSource.length;

    /* DEBUG */ dump("Yulup:versioninfodialog.js:NeutronVersionInfoWorkflowHistoryTree: this.rowCount = \"" + this.rowCount + "\"\n");
}

NeutronVersionInfoWorkflowHistoryTree.prototype = {
    __proto__: YulupTreeViewBase.prototype,

    __treeSource: null,

    /**
     * Get the text for a given cell.
     *
     * @param  {Number}        aRow    the row
     * @param  {nsITreeColumn} aColumn the column
     * @return {String}
     */
    getCellText: function (aRow, aColumn) {
        var workflowState = null;

        /* DEBUG */ dump("Yulup:versioninfodialog.js:NeutronVersionInfoWorkflowHistoryTree.getCellText(\"" + aRow + "\", \"" + aColumn + "\") invoked\n");

        switch (aColumn.element.getAttribute("name")) {
            case "state":
                return this.__treeSource[aRow].state;
                break;
            case "date":
                return this.__treeSource[aRow].date;
                break;
        }

        return "";
    }
};
