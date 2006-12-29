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
    __dialogFields     : null,
    __editorController : null,
    __view             : null,
    __findService      : null,
    __webBrowserFind   : null,
    __commandController: null,

    onLoadListener: function () {
        /* DEBUG */ dump("Yulup:findreplace.js:FindReplace.onLoadListener() invoked\n");

        FindReplace.__editorController = window.arguments[0];

        /* DEBUG */ dump("Yulup:findreplace.js:FindReplace.onLoadListener: FindReplace.__editorController = \"" + FindReplace.__editorController + "\"\n");

        if (!FindReplace.__editorController || (FindReplace.__editorController && !FindReplace.__editorController.activeView)) {
            window.close();
            return;
        }

        FindReplace.__view = FindReplace.__editorController.activeView;

        // register a view change listener
        FindReplace.__editorController.addViewChangedListener(FindReplace.viewChanged);

        FindReplace.__dialogFields = {
            searchStringTextbox     : document.getElementById("uiSearchStringTextbox"),
            replacementStringTextbox: document.getElementById("uiReplacementStringTextbox"),
            matchCaseCheckbox       : document.getElementById("uiMatchCaseCheckbox"),
            matchEntireWordCheckbox : document.getElementById("uiMatchEntireWordCheckbox"),
            searchBackwardsCheckbox : document.getElementById("uiSearchBackwardsCheckbox"),
            wrapAroundCheckbox      : document.getElementById("uiWrapAroundCheckbox")
        };

        // get the nsIFindService
        try {
            FindReplace.__findService = Components.classes["@mozilla.org/find/find_service;1"].getService(Components.interfaces.nsIFindService);
        } catch (exception) {
            /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:findreplace.js:FindReplace.onLoadListener", exception);
            Components.utils.reportError(exception);
        }

        // get the nsIWebBrowserFind
        FindReplace.__webBrowserFind = FindReplace.__getWebBrowserFind(FindReplace.__view);

        // register our command controller
        FindReplace.__commandController = new FindReplaceCommandController();
        window.controllers.appendController(FindReplace.__commandController);

        FindReplace.__fillInitialValues();
    },

    onDialogCancelListener: function () {
        /* DEBUG */ dump("Yulup:findreplace.js:FindReplace.onDialogCancelListener() invoked\n");

        // remove view change listener
        FindReplace.__editorController.removeViewChangedListener(FindReplace.viewChanged);

        // unregister our command controller
        window.controllers.removeController(FindReplace.__commandController);

        return true;
    },

    viewChanged: function (aView) {
        /* DEBUG */ dump("Yulup:findreplace.js:FindReplace.viewChanged() invoked\n");

        FindReplace.__view = aView;

        // get the new nsIWebBrowserFind
        FindReplace.__webBrowserFind = FindReplace.__getWebBrowserFind(FindReplace.__view);
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

    findNext: function () {
        /* DEBUG */ dump("Yulup:findreplace.js:FindReplace.findNext() invoked\n");
    },

    replace: function () {
        /* DEBUG */ dump("Yulup:findreplace.js:FindReplace.replace() invoked\n");
    },

    replaceAll: function () {
        /* DEBUG */ dump("Yulup:findreplace.js:FindReplace.replaceAll() invoked\n");
    },

    __getWebBrowserFind: function (aView) {
        if (aView.editor && aView.editor.webBrowserFind) {
            return aView.editor.webBrowserFind;
        } else {
            return null;
        }
    },

    __fillInitialValues: function () {
        /* DEBUG */ dump("Yulup:findreplace.js:FindReplace.__fillInitialValues() invoked\n");

        /* DEBUG */ dump("Yulup:findreplace.js:FindReplace.__fillInitialValues: FindReplace.__findService = \"" + FindReplace.__findService + "\", FindReplace.__webBrowserFind = \"" + FindReplace.__webBrowserFind + "\"\n");

        if (FindReplace.__findService || FindReplace.__webBrowserFind) {
            FindReplace.__dialogFields.searchStringTextbox.value       = (FindReplace.__findService.searchString
                                                                          ? FindReplace.__findService.searchString
                                                                          : FindReplace.__webBrowserFind.searchString);
            FindReplace.__dialogFields.replacementStringTextbox.value  = FindReplace.__findService.replaceString;
            FindReplace.__dialogFields.matchCaseCheckbox.checked       = (FindReplace.__findService.matchCase
                                                                          ? FindReplace.__findService.matchCase
                                                                          : FindReplace.__webBrowserFind.matchCase);
            FindReplace.__dialogFields.matchEntireWordCheckbox.checked = (FindReplace.__findService.entireWord
                                                                          ? FindReplace.__findService.entireWord
                                                                          : FindReplace.__webBrowserFind.entireWord);
            FindReplace.__dialogFields.searchBackwardsCheckbox.checked = (FindReplace.__findService.findBackwards
                                                                          ? FindReplace.__findService.findBackwards
                                                                          : FindReplace.__webBrowserFind.findBackwards);
            FindReplace.__dialogFields.wrapAroundCheckbox.checked      = (FindReplace.__findService.wrapFind
                                                                          ? FindReplace.__findService.wrapFind
                                                                          : FindReplace.__webBrowserFind.wrapFind);
        }
    }
};


/**
 * FindReplaceCommandController constructor. Instantiates a new object of
 * type FindReplaceCommandController.
 *
 * Implements the nsIController interface.
 *
 * @constructor
 * @return {FindReplaceCommandController}
 */
function FindReplaceCommandController() {
    /* DEBUG */ dump("Yulup:findreplace.js:FindReplaceCommandController() invoked\n");
}

FindReplaceCommandController.prototype = {
    /**
     * The nsISupports QueryInterface method.
     */
    QueryInterface: function (aUUID) {
        /* DEBUG */ dump("Yulup:findreplace.js:FindReplaceCommandController.QueryInterface(\"" + aUUID + "\") invoked\n");

        if (aUUID.equals(Components.interfaces.nsISupports) ||
            aUUID.equals(Components.interfaces.nsIController)) {
            return this;
        } else {
            throw Components.results.NS_NOINTERFACE;
        }
    },

    /**
     * The nsIController supportsCommand method.
     */
    supportsCommand: function (aCommand) {
        var retval = false;

        /* DEBUG */ dump("Yulup:findreplace.js:FindReplaceCommandController.supportsCommand(\"" + aCommand + "\") invoked\n");

        switch (aCommand) {
            case "cmd_yulup_find":
            case "cmd_yulup_replace":
            case "cmd_yulup_replaceall":
                retval = true;
                break;
            default:
        }

        return retval;
    },

    /**
     * The nsIController isCommandEnabled method.
     */
    isCommandEnabled: function (aCommand) {
        var retval = false;

        /* DEBUG */ dump("Yulup:findreplace.js:FindReplaceCommandController.isCommandEnabled(\"" + aCommand + "\") invoked\n");

        switch (aCommand) {
            case "cmd_yulup_find":
            case "cmd_yulup_replace":
            case "cmd_yulup_replaceall":
                retval = true;
                break;
            default:
        }

        return retval;
    },

    /**
     * The nsIController doCommand method.
     */
    doCommand: function (aCommand) {
        /* DEBUG */ dump("Yulup:findreplace.js:FindReplaceCommandController.doCommand(\"" + aCommand + "\") invoked\n");

        switch (aCommand) {
            case "cmd_yulup_find":
                FindReplace.findNext();
                break;
            case "cmd_yulup_replace":
                FindReplace.replace();
                break;
            case "cmd_yulup_replaceall":
                FindReplace.replaceAll();
                break;
            default:
        }
    },

    /**
     * The nsIController onEvent method.
     */
    onEvent: function (aEvent) {
        /* DEBUG */ dump("Yulup:findreplace.js:FindReplaceCommandController.onEvent(\"" + aEvent + "\") invoked\n");
    }
};
