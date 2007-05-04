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
        var versionInfo = null;

        /* DEBUG */ dump("Yulup:versioninfodialog.js:NeutronVersionInfoDialog.onLoadHandler() invoked\n");

        this.__dialog.document.getElementById("uiYulupVersionGroupboxCaption").label = this.__resourceName;

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
    }
};
