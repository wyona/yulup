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
    __editorController : null,
    __view             : null,
    __findService      : null,
    __webBrowserFind   : null,
    __commandController: null,

    dialogFields: null,

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

        FindReplace.dialogFields = {
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
        FindReplace.__commandController = new FindReplaceCommandController(FindReplace);
        window.controllers.appendController(FindReplace.__commandController);

        FindReplace.__fillInitialValues(FindReplace.dialogFields, FindReplace.__findService, FindReplace.__webBrowserFind);

        FindReplace.goUpdateFindReplaceCommands();
    },

    onDialogCancelListener: function () {
        /* DEBUG */ dump("Yulup:findreplace.js:FindReplace.onDialogCancelListener() invoked\n");

        // remove view change listener
        FindReplace.__editorController.removeViewChangedListener(FindReplace.viewChanged);

        // unregister our command controller
        window.controllers.removeController(FindReplace.__commandController);

        FindReplace.dialogFields = null;

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
            controller = window.controllers.getControllerForCommand(aCommand);

            /* DEBUG */ dump("Yulup:findreplace.js:FindReplace.goUpdateFindReplaceCommand: controller = \"" + controller + "\"\n");

            enabled = false;

            if (controller)
                enabled = controller.isCommandEnabled(aCommand);

            FindReplace.goSetFindReplaceCommandEnabled(aCommand, enabled);
        } catch (exception) {
            /* DEBUG */ dump("Yulup:findreplace.js:FindReplace.goUpdateFindReplaceCommand: an error occurred updating command \"" + aCommand + "\": " + exception + "\n");
            /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:findreplace.js:FindReplace.goUpdateFindReplaceCommand", exception);
        }
    },

    goDoFindReplaceCommand: function (aCommand) {
        var controller = null;

        /* DEBUG */ dump("Yulup:findreplace.js:FindReplace.goDoFindReplaceCommand(\"" + aCommand + "\") invoked\n");

        try {
            controller = window.controllers.getControllerForCommand(aCommand);

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

    goUpdateFindReplaceCommands: function () {
        /* DEBUG */ dump("Yulup:findreplace.js:FindReplace.goUpdateFindReplaceCommands() invoked\n");

        FindReplace.goUpdateFindReplaceCommand("cmd_yulup_find");
        FindReplace.goUpdateFindReplaceCommand("cmd_yulup_replace");
        FindReplace.goUpdateFindReplaceCommand("cmd_yulup_replaceall");
    },

    findNext: function () {
        var found = false;

        /* DEBUG */ dump("Yulup:findreplace.js:FindReplace.findNext() invoked\n");

        if (FindReplace.__findService)
            FindReplace.__setUpFindService(FindReplace.dialogFields, FindReplace.__findService);

        FindReplace.__setUpWebBrowserFind(FindReplace.dialogFields, FindReplace.__webBrowserFind);

        // find
        try {
            found = FindReplace.__webBrowserFind.findNext();
        } catch (exception) {
            /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:findreplace.js:FindReplace.findNext", exception);
            Components.utils.reportError(exception);
        }

        if (!found) {
            // TODO: better alert (maybe at bottom of dialog) and i18n
            alert("Phrase " + FindReplace.dialogFields.searchStringTextbox.value + " not found.");
        }
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

    __setUpFindService: function (aDialogFields, aFindService) {
        /* DEBUG */ dump("Yulup:findreplace.js:FindReplace.__setUpFindService() invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aDialogFields != null);
        /* DEBUG */ YulupDebug.ASSERT(aFindService  != null);

        aFindService.searchString  = aDialogFields.searchStringTextbox.value;
        aFindService.replaceString = aDialogFields.replacementStringTextbox.value;
        aFindService.matchCase     = aDialogFields.matchCaseCheckbox.checked;
        aFindService.entireWord    = aDialogFields.matchEntireWordCheckbox.checked;
        aFindService.findBackwards = aDialogFields.searchBackwardsCheckbox.checked;
        aFindService.wrapFind      = aDialogFields.wrapAroundCheckbox.checked;
    },

    __setUpWebBrowserFind: function (aDialogFields, aWebBrowserFind) {
        /* DEBUG */ dump("Yulup:findreplace.js:FindReplace.__setUpWebBrowserFind() invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aDialogFields   != null);
        /* DEBUG */ YulupDebug.ASSERT(aWebBrowserFind != null);

        aWebBrowserFind.searchString  = aDialogFields.searchStringTextbox.value;
        aWebBrowserFind.matchCase     = aDialogFields.matchCaseCheckbox.checked;
        aWebBrowserFind.entireWord    = aDialogFields.matchEntireWordCheckbox.checked;
        aWebBrowserFind.findBackwards = aDialogFields.searchBackwardsCheckbox.checked;
        aWebBrowserFind.wrapFind      = aDialogFields.wrapAroundCheckbox.checked;
    },

    __fillInitialValues: function (aDialogFields, aFindService, aWebBrowserFind) {
        /* DEBUG */ dump("Yulup:findreplace.js:FindReplace.__fillInitialValues() invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aDialogFields != null);

        /* DEBUG */ dump("Yulup:findreplace.js:FindReplace.__fillInitialValues: aFindService = \"" + aFindService + "\", aWebBrowserFind = \"" + aWebBrowserFind + "\"\n");

        if (aFindService || aWebBrowserFind) {
            aDialogFields.searchStringTextbox.value       = (aFindService.searchString
                                                             ? aFindService.searchString
                                                             : aWebBrowserFind.searchString);
            aDialogFields.replacementStringTextbox.value  = (aFindService.replaceString
                                                             ? aFindService.replaceString
                                                             : "");
            aDialogFields.matchCaseCheckbox.checked       = (aFindService.matchCase
                                                             ? aFindService.matchCase
                                                             : aWebBrowserFind.matchCase);
            aDialogFields.matchEntireWordCheckbox.checked = (aFindService.entireWord
                                                             ? aFindService.entireWord
                                                             : aWebBrowserFind.entireWord);
            aDialogFields.searchBackwardsCheckbox.checked = (aFindService.findBackwards
                                                             ? aFindService.findBackwards
                                                             : aWebBrowserFind.findBackwards);
            aDialogFields.wrapAroundCheckbox.checked      = (aFindService.wrapFind
                                                             ? aFindService.wrapFind
                                                             : aWebBrowserFind.wrapFind);
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
function FindReplaceCommandController(aFindReplace) {
    /* DEBUG */ dump("Yulup:findreplace.js:FindReplaceCommandController() invoked\n");

    /* DEBUG */ YulupDebug.ASSERT(aFindReplace != null);

    this.__findReplace = aFindReplace;
}

FindReplaceCommandController.prototype = {
    __findReplace: null,

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
                if (this.__findReplace.__webBrowserFind                       &&
                    this.__findReplace.dialogFields.searchStringTextbox.value &&
                    this.__findReplace.dialogFields.searchStringTextbox.value != "") {
                    retval = true;
                }

                break;
            case "cmd_yulup_replace":
                retval = false;
                break;
            case "cmd_yulup_replaceall":
                if (this.__findReplace.__webBrowserFind                       &&
                    this.__findReplace.__findService                          &&
                    this.__findReplace.dialogFields.searchStringTextbox.value &&
                    this.__findReplace.dialogFields.searchStringTextbox.value != "") {
                    retval = true;
                }

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
