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
    __findAndReplace        : null,
    __editorController      : null,
    __view                  : null,
    __findService           : null,
    __webBrowserFind        : null,
    __commandController     : null,
    __viewSelectionListeners: [],

    dialogFields: null,

    onLoadListener: function () {
        var commandTable = null;

        /* DEBUG */ dump("Yulup:findreplace.js:FindReplace.onLoadListener() invoked\n");

        FindReplace.__findAndReplace   = window.arguments[0];
        FindReplace.__editorController = window.arguments[1];

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

        FindReplace.__fillInitialValues(FindReplace.dialogFields, FindReplace.__findService, FindReplace.__webBrowserFind);

        // add our own command controller
        FindReplace.__commandController = Components.classes["@mozilla.org/embedcomp/base-command-controller;1"].createInstance(Components.interfaces.nsIControllerContext);
        FindReplace.__commandController.init(null);

        // don't set a context here unless bug https://bugzilla.mozilla.org/show_bug.cgi?id=366724 gets fixed, otherwise we crash
        FindReplace.__commandController.setCommandContext(null);
        window.controllers.insertControllerAt(0, FindReplace.__commandController);

        commandTable = FindReplace.__commandController.QueryInterface(Components.interfaces.nsIInterfaceRequestor).getInterface(Components.interfaces.nsIControllerCommandTable);


        if (FindReplace.__findAndReplace) {
            // set window title
            document.title = document.getElementById("uiYulupFindReplaceStringbundle").getString("findReplaceDialog.title");

            // register controller commands
            commandTable.registerCommand("cmd_yulup_find",       new FindReplaceFindCommand("cmd_yulup_find", FindReplace));
            commandTable.registerCommand("cmd_yulup_replace",    new FindReplaceReplaceCommand("cmd_yulup_replace", FindReplace));
            commandTable.registerCommand("cmd_yulup_replaceall", new FindReplaceReplaceAllCommand("cmd_yulup_replaceall", FindReplace));

            // install replace command updaters
            document.getElementById("uiSearchStringTextbox").addEventListener("input", FindReplace.replaceCommandUpdater, false);
            document.getElementById("uiMatchCaseCheckbox").addEventListener("command", FindReplace.replaceCommandUpdater, false);

            // show hidden UI
            document.getElementById("uiReplacementStringRow").removeAttribute("hidden");
            document.getElementById("uiReplaceAllButton").removeAttribute("hidden");
            document.getElementById("uiReplaceButton").removeAttribute("hidden");
        } else {
            // set window title
            document.title = document.getElementById("uiYulupFindReplaceStringbundle").getString("findDialog.title");

            // register controller command
            commandTable.registerCommand("cmd_yulup_find", new FindReplaceFindCommand("cmd_yulup_find", FindReplace));
        }

        FindReplace.goUpdateFindReplaceCommands();

        // register a selection change listener for the active view
        FindReplace.__installSelectionListener(FindReplace.__view);
    },

    onDialogCancelListener: function () {
        /* DEBUG */ dump("Yulup:findreplace.js:FindReplace.onDialogCancelListener() invoked\n");

        // shutdown
        FindReplace.__shutdown();

        return true;
    },

    onCloseListener: function () {
        /* DEBUG */ dump("Yulup:findreplace.js:FindReplace.onCloseListener() invoked\n");

        FindReplace.__shutdown();
    },

    replaceCommandUpdater: function () {
        /* DEBUG */ dump("Yulup:findreplace.js:FindReplace.replaceCommandUpdater() invoked\n");

        FindReplace.goUpdateFindReplaceCommand("cmd_yulup_replace");
    },

    viewChanged: function (aView) {
        /* DEBUG */ dump("Yulup:findreplace.js:FindReplace.viewChanged(\"" + aView + "\") invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aView != null);

        FindReplace.__view = aView;

        // make sure we have a listener for this view
        FindReplace.__installSelectionListener(aView);

        // get the new nsIWebBrowserFind
        FindReplace.__webBrowserFind = FindReplace.__getWebBrowserFind(FindReplace.__view);
    },

    goUpdateFindReplaceCommand: function (aCommand) {
        var controller = null;
        var enabled    = null;

        /* DEBUG */ dump("Yulup:findreplace.js:FindReplace.goUpdateFindReplaceCommand(\"" + aCommand + "\") invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aCommand != null);

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

        /* DEBUG */ YulupDebug.ASSERT(aCommand != null);

        try {
            controller = window.controllers.getControllerForCommand(aCommand);

            if (controller && controller.isCommandEnabled(aCommand))
                controller.doCommand(aCommand);
        } catch (exception) {
            /* DEBUG */ dump("Yulup:findreplace.js:FindReplace.goDoFindReplaceCommand: an error occurred executing command \"" + aCommand + "\": " + exception + "\n");
            /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:findreplace.js:FindReplace.goDoFindReplaceCommand", exception);
        }
    },

    goSetFindReplaceCommandEnabled: function (aCommand, aEnabled) {
        var node = null;

        /* DEBUG */ dump("Yulup:findreplace.js:FindReplace.goSetFindReplaceCommandEnabled(\"" + aCommand + "\", \"" + aEnabled + "\") invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aCommand != null);
        /* DEBUG */ YulupDebug.ASSERT(aEnabled != null);

        node = document.getElementById(aCommand);

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

    /**
     * Find the next match.
     *
     * @return {Undefined} does not have a return value
     */
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

    /**
     * Replace the search string inside the current selection with the
     * replacement string if the search string is found inside the
     * current selection.
     *
     * @return {Boolean} returns true if a match has been replaced, false otherwise
     */
    replace: function () {
        var found           = false;
        var selection       = null;
        var selectionString = null;
        var searchString    = null;
        var replaceString   = null;
        var selectionRange  = null;

        /* DEBUG */ dump("Yulup:findreplace.js:FindReplace.replace() invoked\n");

        selection = FindReplace.__view.view.selection;

        selectionString = selection.toString();
        searchString    = FindReplace.dialogFields.searchStringTextbox.value;

        if (!FindReplace.dialogFields.matchCaseCheckbox.checked) {
            selectionString = selectionString.toLowerCase();
            searchString    = searchString.toLowerCase();
        }

        /* DEBUG */ dump("Yulup:findreplace.js:FindReplace.replace: selectionString = \"" + selectionString + "\"\n");
        /* DEBUG */ dump("Yulup:findreplace.js:FindReplace.replace: searchString    = \"" + searchString + "\"\n");

        if (selectionString == searchString) {
            // found
            found = true;

            /* DEBUG */ dump("Yulup:findreplace.js:FindReplace.replace: search string found\n");

            if (FindReplace.dialogFields.searchBackwardsCheckbox.checked && selection.rangeCount > 0) {
                selectionRange = selection.getRangeAt(0).cloneRange();
                selectionRange.collapse(true);
            }

            replacementString = FindReplace.dialogFields.replacementStringTextbox.value;

            if (!replacementString || replacementString == "") {
                FindReplace.__view.view.QueryInterface(Components.interfaces.nsIEditor)
                    .deleteSelection(Components.interfaces.nsIEditor.eNone);
            } else {
                FindReplace.__view.view.QueryInterface(Components.interfaces.nsIPlaintextEditor)
                    .insertText(replacementString);
            }

            if (selectionRange) {
                FindReplace.__view.view.selection.removeAllRanges();
                FindReplace.__view.view.selection.addRange(selectionRange);
            }
        } else {
            // TODO: better alert (maybe at bottom of dialog) and i18n
            alert("Phrase " + FindReplace.dialogFields.searchStringTextbox.value + " not contained in the current selection.");
        }

        return found;
    },

    /**
     * Replace all matches with the replacement string.
     *
     * @return {Undefined} does not have a return value
     */
    replaceAll: function () {
        /* DEBUG */ dump("Yulup:findreplace.js:FindReplace.replaceAll() invoked\n");
    },

    __isReplaceMatch: function () {
        var selection       = null;
        var selectionString = null;
        var searchString    = null;

        /* DEBUG */ dump("Yulup:findreplace.js:FindReplace.__isReplaceMatch() invoked\n");

        selection = FindReplace.__view.view.selection;

        selectionString = selection.toString();
        searchString    = FindReplace.dialogFields.searchStringTextbox.value;

        if (!FindReplace.dialogFields.matchCaseCheckbox.checked) {
            selectionString = selectionString.toLowerCase();
            searchString    = searchString.toLowerCase();
        }

        return (selectionString == searchString);
    },

    __getWebBrowserFind: function (aView) {
        /* DEBUG */ dump("Yulup:findreplace.js:FindReplace.__getWebBrowserFind() invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aView != null);

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
    },

    __installSelectionListener: function (aView) {
        var found             = false;
        var selectionListener = null;

        /* DEBUG */ dump("Yulup:findreplace.js:FindReplace.__installSelectionListener(\"" + aView + "\") invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aView != null);

        /* Check if there already is a selection listener installed for this view.
         * This is not really fast, but there may only be around 2-3 views, so it's ok. */
        for (var i = 0; i < FindReplace.__viewSelectionListeners.length; i++) {
            if (FindReplace.__viewSelectionListeners[i][0] == aView) {
                found = true;
                break;
            }
        }

        if (!found) {
            /* DEBUG */ dump("Yulup:findreplace.js:FindReplace.__installSelectionListener: installing a new selection listener\n");

            selectionListener = new FindReplaceSelectionListener(FindReplace, aView);

            if (aView.addSelectionListener(selectionListener))
                FindReplace.__viewSelectionListeners.push([aView, selectionListener]);
        }
    },

    __shutdown: function () {
        /* DEBUG */ dump("Yulup:findreplace.js:FindReplace.__shutdown() invoked\n");

        // remove view change listener
        FindReplace.__editorController.removeViewChangedListener(FindReplace.viewChanged);

        // remove selection change listeners
        for (var i = 0; i < FindReplace.__viewSelectionListeners.length; i++) {
            FindReplace.__viewSelectionListeners[i][0].removeSelectionListener(FindReplace.__viewSelectionListeners[i][1]);
        }

        // unregister our command controller
        window.controllers.removeController(FindReplace.__commandController);

        FindReplace.dialogFields = null;
    }
};


function FindReplaceSelectionListener(aFindReplace, aView) {
    /* DEBUG */ dump("Yulup:findreplace.js:FindReplaceSelectionListener() invoked\n");

    /* DEBUG */ YulupDebug.ASSERT(aFindReplace != null);
    /* DEBUG */ YulupDebug.ASSERT(aView        != null);

    this.__findReplace = aFindReplace;
    this.__view        = aView;
}

FindReplaceSelectionListener.prototype = {
    __findReplace: null,

    notifySelectionChanged: function (aDocument, aSelection, aReason) {
        /* DEBUG */ dump("Yulup:findreplace.js:FindReplaceSelectionListener.notifySelectionChanged() invoked\n");

        if (this.__view == this.__findReplace.__view)
            FindReplace.goUpdateFindReplaceCommand("cmd_yulup_replace");
    }
};


/**
 * FindReplaceFindCommand constructor. Instantiates a new object of
 * type FindReplaceFindCommand.
 *
 * Implements nsIControllerCommand.
 *
 * @constructor
 * @param  {String} aCommandName the name of this command
 * @return {FindReplaceFindCommand}
 */
function FindReplaceFindCommand(aCommandName, aFindReplace) {
    /* DEBUG */ dump("Yulup:findreplace.js:FindReplaceFindCommand() invoked\n");

    /* DEBUG */ YulupDebug.ASSERT(aCommandName != null);
    /* DEBUG */ YulupDebug.ASSERT(aFindReplace != null);

    this.__commandName = aCommandName;
    this.__findReplace = aFindReplace;
}

FindReplaceFindCommand.prototype = {
    __commandName: null,

    /**
     * The nsISupports QueryInterface method.
     */
    QueryInterface: function (aUUID) {
        /* DEBUG */ dump("Yulup:findreplace.js:FindReplaceFindCommand.QueryInterface(\"" + aUUID + "\") invoked\n");

        if (aUUID.equals(Components.interfaces.nsISupports) ||
            aUUID.equals(Components.interfaces.nsIControllerCommand)) {
            return this;
        } else {
            throw Components.results.NS_NOINTERFACE;
        }
    },

    doCommand: function (aCommandName, aCommandContext) {
        /* DEBUG */ dump("Yulup:findreplace.js:FindReplaceFindCommand.doCommand() invoked\n");

        if (this.__commandName == aCommandName) {
            this.__findReplace.findNext();

            return true;
        } else {
            return false;
        }
    },

    doCommandParams: function (aCommandName, aParams, aCommandContext) {
        /* DEBUG */ dump("Yulup:findreplace.js:FindReplaceFindCommand.doCommandParams() invoked\n");

        return this.doCommand(aCommandName, aCommandContext);
    },

    getCommandStateParams: function (aCommandName, aParams, aCommandContext) {
        /* DEBUG */ dump("Yulup:findreplace.js:FindReplaceFindCommand.getCommandStateParams() invoked\n");

        // no state params
    },

    isCommandEnabled: function (aCommandName, aCommandContext) {
        var retval = false;

        /* DEBUG */ dump("Yulup:findreplace.js:FindReplaceFindCommand.isCommandEnabled() invoked\n");

        if (this.__commandName == aCommandName) {
            if (this.__findReplace.__webBrowserFind                       &&
                this.__findReplace.dialogFields.searchStringTextbox.value &&
                this.__findReplace.dialogFields.searchStringTextbox.value != "") {
                retval = true;
            }
        }

        return retval;
    }
};


/**
 * FindReplaceReplaceCommand constructor. Instantiates a new object of
 * type FindReplaceReplaceCommand.
 *
 * Implements nsIControllerCommand.
 *
 * @constructor
 * @param  {String} aCommandName the name of this command
 * @return {FindReplaceReplaceCommand}
 */
function FindReplaceReplaceCommand(aCommandName, aFindReplace) {
    /* DEBUG */ dump("Yulup:findreplace.js:FindReplaceReplaceCommand() invoked\n");

    /* DEBUG */ YulupDebug.ASSERT(aCommandName != null);
    /* DEBUG */ YulupDebug.ASSERT(aFindReplace != null);

    this.__commandName = aCommandName;
    this.__findReplace = aFindReplace;
}

FindReplaceReplaceCommand.prototype = {
    __commandName: null,

    /**
     * The nsISupports QueryInterface method.
     */
    QueryInterface: function (aUUID) {
        /* DEBUG */ dump("Yulup:findreplace.js:FindReplaceReplaceCommand.QueryInterface(\"" + aUUID + "\") invoked\n");

        if (aUUID.equals(Components.interfaces.nsISupports) ||
            aUUID.equals(Components.interfaces.nsIControllerCommand)) {
            return this;
        } else {
            throw Components.results.NS_NOINTERFACE;
        }
    },

    doCommand: function (aCommandName, aCommandContext) {
        /* DEBUG */ dump("Yulup:findreplace.js:FindReplaceReplaceCommand.doCommand() invoked\n");

        if (this.__commandName == aCommandName) {
            if (this.__findReplace.replace())
                this.__findReplace.findNext();

            return true;
        } else {
            return false;
        }
    },

    doCommandParams: function (aCommandName, aParams, aCommandContext) {
        /* DEBUG */ dump("Yulup:findreplace.js:FindReplaceReplaceCommand.doCommandParams() invoked\n");

        return this.doCommand(aCommandName, aCommandContext);
    },

    getCommandStateParams: function (aCommandName, aParams, aCommandContext) {
        /* DEBUG */ dump("Yulup:findreplace.js:FindReplaceReplaceCommand.getCommandStateParams() invoked\n");

        // no state params
    },

    isCommandEnabled: function (aCommandName, aCommandContext) {
        var retval = false;

        /* DEBUG */ dump("Yulup:findreplace.js:FindReplaceReplaceCommand.isCommandEnabled() invoked\n");

        if (this.__commandName == aCommandName) {
            /* Only enable replace if the current selection actually matches the search
             * string. Note that for this to work, we need to i) update on every selection change
             * (requires a selection changed event from the currently active view) and ii) update
             * on every search string change. */
            if (this.__findReplace.__webBrowserFind                             &&
                this.__findReplace.dialogFields.searchStringTextbox.value       &&
                this.__findReplace.dialogFields.searchStringTextbox.value != "" &&
                this.__findReplace.__isReplaceMatch()) {
                retval = true;
            }
        }

        return retval;
    }
};


/**
 * FindReplaceReplaceAllCommand constructor. Instantiates a new object of
 * type FindReplaceReplaceAllCommand.
 *
 * Implements nsIControllerCommand.
 *
 * @constructor
 * @param  {String} aCommandName the name of this command
 * @return {FindReplaceReplaceAllCommand}
 */
function FindReplaceReplaceAllCommand(aCommandName, aFindReplace) {
    /* DEBUG */ dump("Yulup:findreplace.js:FindReplaceReplaceAllCommand() invoked\n");

    /* DEBUG */ YulupDebug.ASSERT(aCommandName != null);
    /* DEBUG */ YulupDebug.ASSERT(aFindReplace != null);

    this.__commandName = aCommandName;
    this.__findReplace = aFindReplace;
}

FindReplaceReplaceAllCommand.prototype = {
    __commandName: null,

    /**
     * The nsISupports QueryInterface method.
     */
    QueryInterface: function (aUUID) {
        /* DEBUG */ dump("Yulup:findreplace.js:FindReplaceReplaceAllCommand.QueryInterface(\"" + aUUID + "\") invoked\n");

        if (aUUID.equals(Components.interfaces.nsISupports) ||
            aUUID.equals(Components.interfaces.nsIControllerCommand)) {
            return this;
        } else {
            throw Components.results.NS_NOINTERFACE;
        }
    },

    doCommand: function (aCommandName, aCommandContext) {
        /* DEBUG */ dump("Yulup:findreplace.js:FindReplaceReplaceAllCommand.doCommand() invoked\n");

        if (this.__commandName == aCommandName) {
            this.__findReplace.replaceAll();

            return true;
        } else {
            return false;
        }
    },

    doCommandParams: function (aCommandName, aParams, aCommandContext) {
        /* DEBUG */ dump("Yulup:findreplace.js:FindReplaceReplaceAllCommand.doCommandParams() invoked\n");

        return this.doCommand(aCommandName, aCommandContext);
    },

    getCommandStateParams: function (aCommandName, aParams, aCommandContext) {
        /* DEBUG */ dump("Yulup:findreplace.js:FindReplaceReplaceAllCommand.getCommandStateParams() invoked\n");

        // no state params
    },

    isCommandEnabled: function (aCommandName, aCommandContext) {
        var retval = false;

        /* DEBUG */ dump("Yulup:findreplace.js:FindReplaceReplaceAllCommand.isCommandEnabled() invoked\n");

        if (this.__commandName == aCommandName) {
            if (this.__findReplace.__webBrowserFind                       &&
                this.__findReplace.__findService                          &&
                this.__findReplace.dialogFields.searchStringTextbox.value &&
                this.__findReplace.dialogFields.searchStringTextbox.value != "") {
                retval = true;
            }

            // not yet implemented
            retval = false;
        }

        return retval;
    }
};
