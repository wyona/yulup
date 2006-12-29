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

const FindReplace = {
    __editorController: null,
    __view            : null,
    __findService     : null,

    onLoadListener: function () {
        /* DEBUG */ dump("Yulup:findreplace.js:FindReplace.onLoadListener() invoked\n");

        FindReplace.__editorController = window.arguments[0];

        /* DEBUG */ dump("Yulup:findreplace.js:FindReplace.onLoadListener: FindReplace.__editorController = \"" + FindReplace.__editorController + "\"\n");

        if (!FindReplace.__editorController || (FindReplace.__editorController && !FindReplace.__editorController.activeView)) {
            window.close();
            return;
        }

        FindReplace.__view = FindReplace.__editorController.activeView;

        // get the nsIFindService
        try {
            FindReplace.__findService = Components.classes["@mozilla.org/find/find_service;1"].getService(Components.interfaces.nsIFindService);
        } catch (exception) {
            /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:findreplace.js:FindReplace.onLoadListener", exception);
            Components.utils.reportError(exception);
        }

        // get the nsIWebBrowserFind
        FindReplace.__webBrowserFind = FindReplace.__getWebBrowserFind(FindReplace.__view);

        // register a view change listener
        FindReplace.__editorController.addViewChangedListener(FindReplace.viewChanged);

        FindReplace.__fillInitialValues();
    },

    onDialogCancelListener: function () {
        /* DEBUG */ dump("Yulup:findreplace.js:FindReplace.onDialogCancelListener() invoked\n");

        // remove view change listener
        FindReplace.__editorController.removeViewChangedListener(FindReplace.viewChanged);

        return true;
    },

    viewChanged: function (aView) {
        /* DEBUG */ dump("Yulup:findreplace.js:FindReplace.viewChanged() invoked\n");

        FindReplace.__view = aView;
    },

    goUpdateFindReplaceCommand: function (aCommand) {
        var controller = null;
        var enabled    = null;

        /* DEBUG */ dump("Yulup:findreplace.js:FindReplace.goUpdateFindReplaceCommand(\"" + aCommand + "\") invoked\n");

        try {
            controller = document.commandDispatcher.getControllerForCommand(aCommand);

            enabled = false;

            if (controller)
                enabled = controller.isCommandEnabled(aCommand);

            Editor.goSetFileOperationsCommandEnabled(aCommand, enabled);
        } catch (exception) {
            /* DEBUG */ dump("Yulup:findreplace.js:FindReplace.goUpdateFindReplaceCommand: an error occurred updating command \"" + aCommand + "\": " + exception + "\n");
            /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:findreplace.js:FindReplace.goUpdateFindReplaceCommand", exception);
        }
    },

    goDoFindReplaceCommand: function (aCommand) {
        var controller = null;

        /* DEBUG */ dump("Yulup:findreplace.js:FindReplace.goDoFindReplaceCommand(\"" + aCommand + "\") invoked\n");

        try {
            controller = document.commandDispatcher.getControllerForCommand(aCommand);

            if (controller && controller.isCommandEnabled(aCommand))
                controller.doCommand(aCommand);
        } catch (exception) {
            /* DEBUG */ dump("Yulup:findreplace.js:FindReplace.goDoFindReplaceCommand: an error occurred executing command \"" + aCommand + "\": " + exception + "\n");
            /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:findreplace.js:FindReplace.goDoFindReplaceCommand", exception);
        }
    },

    goSetFindReplaceCommandEnabled: function (aCmdId, aEnabled) {
        var node = null;

        /* DEBUG */ dump("Yulup:findreplace.js:FindReplace.goSetFindReplaceCommandEnabled(\"" + aCmdId + "\", \"" + aEnabled + "\") invoked\n");

        node = document.getElementById(aCmdId);

        if (node) {
            if (aEnabled) {
                node.setAttribute("disabled", "false");
            } else {
                node.setAttribute("disabled", "true");
            }
        }
    },

    __getWebBrowserFind: function (aView) {
        if (aView.editor && aView.editor.webBrowserFind) {
            return aView.editor.webBrowserFind;
        } else {
            return null;
        }
    },

    __fillInitialValues: function () {
        
    }
};
