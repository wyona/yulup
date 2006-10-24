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

var WorkspaceWizard = {
    /**
     * Initialise the dialog.
     *
     * @return {Undefined} does not have a return value
     */
    onLoadHandler: function () {
        /* DEBUG */ dump("Yulup:workspacewizard.js:WorkspaceWizard.onLoadHandler() invoked\n");
    },

    selectDirectory: function () {
        var target     = null;
        var filePicker = null;

        /* DEBUG */ dump("Yulup:workspacewizard.js:WorkspaceWizard.selectFolder() invoked\n");

        // open file picker dialog for local file system
        filePicker = Components.classes["@mozilla.org/filepicker;1"].createInstance(Components.interfaces.nsIFilePicker);

        filePicker.init(window, document.getElementById("uiYulupWorkspaceWizardStringbundle").getString("workspaceFilePicker.title"), Components.interfaces.nsIFilePicker.modeGetFolder);

        if (filePicker.show() == Components.interfaces.nsIFilePicker.returnOK) {
            // cast nsIFileURL to nsIURI
            target = filePicker.fileURL;
            target.QueryInterface(Components.interfaces.nsIURI);

            /* DEBUG */ dump("Yulup:workspacewizard.js:WorkspaceWizard.selectFolder: selected target: \"" + target.spec + "\"\n");

            document.getElementById("uiWorkspaceLocationTextbox").value = target.spec;
        }
    }
};
