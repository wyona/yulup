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

const YULUP_PROGRESSDIALOG_CHROME_URI = "chrome://yulup/content/progressdialog.xul";

function ProgressDialog(aWindow, aAction, aDocumentName) {
    /* DEBUG */ dump("Yulup:progressdialog.js:ProgressDialog() invoked\n");

    /* DEBUG */ YulupDebug.ASSERT(aWindow       != null);
    /* DEBUG */ YulupDebug.ASSERT(aAction       != null);
    /* DEBUG */ YulupDebug.ASSERT(aDocumentName != null);

    this.__action       = aAction;
    this.__documentName = aDocumentName;

    this.__dialog = aWindow.openDialog(YULUP_PROGRESSDIALOG_CHROME_URI, "yulupProgressDialog" + Date.now(), "resizable=yes", this);
}

ProgressDialog.prototype = {
    __init        : false,
    __dialog      : null,
    __action      : null,
    __documentName: null,
    __currentPos  : 0,

    /**
     * Initialise the dialog.
     *
     * @return {Undefined} does not have a return value
     */
    onLoadHandler: function () {
        /* DEBUG */ dump("Yulup:progressdialog.js:ProgressDialog.onLoadHandler() invoked\n");

        this.__init = true;

        this.__dialog.document.getElementById("uiYulupProgressDialogActionLabel").setAttribute("value", this.__action + ":");
        this.__dialog.document.getElementById("uiYulupProgressDialogDocumentNameLabel").setAttribute("value", this.__documentName);
    },

    onCloseHandler: function () {
        this.__init = false;

        return true;
    },

    closeDialog: function () {
        /* DEBUG */ dump("Yulup:progressdialog.js:ProgressDialog.closeDialog() invoked\n");

        if (this.__init) {
            // close the dialog box
            this.__dialog.document.getElementById("uiYulupProgressDialog").acceptDialog();
        }
    },

    onProgress: function (aProgress, aProgressMax) {
        var percentProgress = 0;
        var byteProgress    = 0;
        var byteMax         = 0;

        /* DEBUG */ dump("Yulup:progressdialog.js:ProgressDialog.onProgress(\"" + aProgress + "\", \"" + aProgressMax + "\") invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aProgress    != null);
        /* DEBUG */ YulupDebug.ASSERT(aProgressMax != null);

        if (this.__init) {
            byteProgress = (aProgress / 1024);

            if (aProgressMax == -1) {
                this.__dialog.document.getElementById("uiYulupProgressDialogProgressMeter").setAttribute("mode", "undetermined");

                this.__dialog.document.getElementById("uiYulupProgressDialogProgressLabel").setAttribute("value", byteProgress.toFixed(2) + " KiB");
            } else {
                percentProgress = (aProgressMax / aProgress) * 100;

                this.__dialog.document.getElementById("uiYulupProgressDialogProgressMeter").setAttribute("value", percentProgress + "%");
                this.__dialog.document.getElementById("uiYulupProgressDialogProgressMeter").setAttribute("mode", "determined");

                byteMax = (aProgressMax / 1024);

                this.__dialog.document.getElementById("uiYulupProgressDialogProgressLabel").setAttribute("value", byteProgress.toFixed(2) + " KiB / " + byteMax.toFixed(2) + " Kib");
            }
        }

        this.__currentPos = aProgress;
    },

    requestFinished: function () {
        var byteProgress   = 0;
        var progressDialog = null;

        /* DEBUG */ dump("Yulup:progressdialog.js:ProgressDialog.requestFinished() invoked\n");

        if (this.__init) {
            byteProgress = (this.__currentPos / 1024);
            this.__dialog.document.getElementById("uiYulupProgressDialogProgressLabel").setAttribute("value", "Finished (" + byteProgress.toFixed(2) + " KiB)");

            progressDialog = this;

            // close the dialog box after a short timeout
            this.__dialog.setTimeout(function() { progressDialog.closeDialog(); }, 2000);
        }
    }
};
