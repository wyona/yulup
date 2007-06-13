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
 * @author Andreas Wuest
 *
 */

const EDITOR_WINDOW_TITLE      = "Yulup Editor";
const YULUP_EDITOR_CHROME_URI  = "chrome://yulup/content/editor/editor.xul";
const YULUP_REPLACE_CHROME_URI = "chrome://yulup/content/editor/findreplace/findreplacedialog.xul";
const YULUP_FAVICON_CHROME_URI = "chrome://yulup/skin/icons/yulup-logo.png";

var gMainBrowserWindow = null;

var Editor = {
    __editorTab           : null,
    __triggerURI          : null,
    __findWindow          : null,
    __replaceWindow       : null,
    __windowList          : [],
    __callerSessionHistory: null,
    __controlledShutdown  : false,
    __mainBrowserWindow   : null,

    /**
     * Main entry point for editor creation. Creates a new
     * editor and installs various listeners.
     *
     * Arguments to the editor are passed in via the instance
     * manager of the browser window.
     *
     * @return {Undefined} does not have a return value
     */
    onLoadListener: function () {
        var instanceID      = null;
        var parameterObject = null;
        var showIconsOnly   = null;
        var themeID         = null;

        /* DEBUG */ dump("Yulup:editor.js:Editor.onLoadListener() invoked\n");

        // prevent from multiple initialisations
        if (!document.getElementById("uiYulupEditorWindow").getAttribute("editorInit")) {
            /* DEBUG */ dump("Yulup:editor.js:Editor.onLoadListener() is being run for the first time\n");

            // we are initialising
            document.getElementById("uiYulupEditorWindow").setAttribute("editorInit", true);

            // set window title
            document.title = EDITOR_WINDOW_TITLE;

            // update toolbar according to prefs
            if ((showIconsOnly = YulupPreferences.getBoolPref("editor.toolbox.", "showiconsonly")) != null) {
                document.getElementById("uiYulupEditorToolbox").setAttribute("showiconsonly", showIconsOnly);
            } else {
                document.getElementById("uiYulupEditorToolbox").setAttribute("showiconsonly", false);
            }

            // add toolbox stylesheet according to preferred theme
            if ((themeID = YulupPreferences.getCharPref("editor.", "theme")) != null) {
                if (themeID != "default") {
                    document.styleSheets.item(2).insertRule("@import url(chrome://yulup/skin/theme." + themeID + ".css);", 0);
                }
            }

            // show toolbox
            document.getElementById("uiYulupEditorToolbox").removeAttribute("hidden");

            // get a handle on the main browser window
            Editor.__mainBrowserWindow = YulupAppServices.getMainBrowserWindow();

            gMainBrowserWindow = Editor.__mainBrowserWindow;

            /* DEBUG */ dump("Yulup:editor.js:Editor.onLoadListener: window.location.search = \"" + window.location.search + "\"\n");

            // grab our parameters if an instance ID is present
            if (window.location.search && window.location.search != "") {
                instanceID = window.location.search.slice(1);

                if (parameterObject = Editor.__mainBrowserWindow.yulup.instancesManager.retrieveInstance(instanceID)) {
                    // save our tab for replaceEditor
                    Editor.__editorTab = parameterObject.tab;

                    // save our trigger URI
                    Editor.__triggerURI           = parameterObject.triggerURI;
                    Editor.__callerSessionHistory = parameterObject.sessionHistory;

                    // set favicon
                    Editor.__mainBrowserWindow.getBrowser().setIcon(Editor.__editorTab, YULUP_FAVICON_CHROME_URI);

                    // instantiate the editor
                    new YulupEditController(Editor.__mainBrowserWindow, parameterObject);
                } else {
                    /* Looks like the user hit reload, and therefore the
                     * instance corresponding to our instance ID has already
                     * run and been destroyed. Or the instance ID got somehow
                     * mangled in the process. Anyway, we don't like that! To
                     * prevent this for the future in this tab, we do an
                     * immediate reload with a blank instance ID. */
                    window.location.replace(YULUP_EDITOR_CHROME_URI);
                    // Can't do the following because we lack tab information
                    //Editor.replaceEditor(new EditorParameters(null, "blank"));

                    return;
                }
            } else {
                // no instance ID given, therefore load an empty editor
                new YulupEditController(Editor.__mainBrowserWindow, null);
            }

            // install shutdown handlers
            window.addEventListener("beforeunload", Editor.onBeforeUnloadListener, false);
            window.addEventListener("unload", Editor.onUnloadListener, false);
        } else {
            /* DEBUG */ dump("Yulup:editor.js:Editor.onLoadListener() already ran. Not going to initialise multiple times.\n");
            return;
        }
    },

    /**
     * Shows a dialog if there are unsaved changes.
     *
     * TODO: could we also solve this using an approach like
     * http://developer.mozilla.org/en/docs/Mozilla_Embedding_FAQ:How_do_I...#How_do_I_block_a_load.3F?
     *
     * @return {Boolean} always returns true
     */
    onBeforeUnloadListener: function (aEvent) {
        var returnObject    = null;
        var applicableItems = null;

        /* DEBUG */ dump("Yulup:editor.js:Editor.onBeforeUnloadListener() invoked\n");

        /* Check if we have a controller and if yes, if this is not
         * a controlled shutdown, i.e. neither an "open" or "new"
         * method has been called, and the user was not yet asked
         * for confirmation. */
        if (gEditorController && gEditorController.initialised && gEditorController.model.isDirty() && !Editor.__controlledShutdown && gEditorController.editStateController.isCurrentState(gEditorController.editStateController.STATE_SUPERIOR_DOCUMENTOK)) {
            /* DEBUG */ dump("Yulup:editor.js:Editor.onBeforeUnloadListener: not a controlled shutdown\n");

            aEvent.QueryInterface(Components.interfaces.nsIDOMBeforeUnloadEvent);
            aEvent.returnValue = Editor.getStringbundleString("editorCloseConfirmation2.label");
        }

        return true;
    },

    onUnloadListener: function () {
        /* DEBUG */ dump("Yulup:editor.js:Editor.onUnloadListener() invoked\n");

        try {
            // close all open windows
            Editor.__closeAllWindows();

            // unlock document if needed
            if (unlockURI = gEditorController.document.shouldUnlock()) {
                Editor.__mainBrowserWindow.yulup.unlockDocument(unlockURI);
            }
        } catch (exception) {
            /* DEBUG */ dump("Yulup:editor.js:Editor.onUnloadListener: " + exception + "\n");
            /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:editor.js:Editor.onUnloadListener", exception);
        }

        // remove listeners
        window.removeEventListener("beforeunload", Editor.onBeforeUnloadListener, false);
        window.removeEventListener("unload", Editor.onUnloadListener, false);
    },

    /**
     * Return a string defined in a properties file.
     *
     * A properties file is a simple map of identifier/value
     * pairs. Values are only returned for identifiers contained
     * in the properties file of the uiYulupEditorStringbundle
     * string bundle.
     *
     * @param  {String} aString the string identifier of the string to return
     * @return {String} the string as identified by aString
     */
    getStringbundleString: function (aString) {
        /* DEBUG */ dump("Yulup:editor.js:Editor.getStringBundleString(\"" + aString + "\") invoked\n");

        return document.getElementById("uiYulupEditorStringbundle").getString(aString);
    },

    /**
     * Replace the editor in the current tab with a new one.
     *
     * @param  {EditorParameters} aEditorParameters the editor parameters object
     * @return {Undefined} does not have a return value
     */
    replaceEditor: function (aEditorParameters) {
        var instanceID = null;
        var targetURI  = null;

        /* DEBUG */ dump("Yulup:editor.js:Editor.replaceEditor(\"" + aEditorParameters + "\") invoked\n");

        // we reached this method with consent by the user
        Editor.__controlledShutdown = true;

        try {
            // prepare parameters for pick-up
            instanceID = Editor.__mainBrowserWindow.yulup.instancesManager.addInstance(Editor.__editorTab, aEditorParameters, null);

            // construct target URI
            targetURI = YULUP_EDITOR_CHROME_URI + "?" + instanceID;

            // replace editor in current tab
            window.location.replace(targetURI);
        } catch (exception) {
            dump("Yulup:editor.js:Editor.replaceEditor: failed to replace editor: " + exception.toString() + "\n");

            // clean up
            if (instanceID)
                Editor.__mainBrowserWindow.yulup.instancesManager.removeInstance(instanceID);

            return;
        }

        /* DEBUG */ dump("Yulup:editor.js:Editor.replaceEditor: replaced editor\n");
    },

    /**
     * Display a dialog asking the user if he wants to close the editor,
     * if the document has unsaved changes.
     *
     * @return {Boolean} returns true if the user wants to close the editor, false otherwise
     */
    checkClose: function () {
        /* DEBUG */ dump("Yulup:editor.js:Editor.checkClose() invoked\n");

        if (gEditorController && gEditorController.initialised && gEditorController.model.isDirty() && gEditorController.editStateController.isCurrentState(gEditorController.editStateController.STATE_SUPERIOR_DOCUMENTOK)) {
            // document has been changed
            return window.confirm(Editor.getStringbundleString("editorCloseConfirmation.label"));
        }

        return true;
    },

    shutdownEditor: function () {
        var unlockURI = null;

        /* DEBUG */ dump("Yulup:editor.js:Editor.shutdownEditor() invoked\n");

        try {
            // remove shutdown event listeners manually
            Editor.onUnloadListener();

            // remove command controller
            if (gEditorController && gEditorController.editorCommandController)
                window.controllers.removeController(gEditorController.editorCommandController);
        } catch (exception) {
            /* DEBUG */ dump("Yulup:editor.js:Editor.shutdownEditor: " + exception + "\n");
            /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:editor.js:Editor.shutdownEditor", exception);
        }
    },

    exitEditor: function () {
        /* DEBUG */ dump("Yulup:editor.js:Editor.exitEditor() invoked\n");

        if (Editor.checkClose()) {
            Editor.shutdownEditor();

            /* DEBUG */ dump("Yulup:editor.js:Editor.exitEditor: replacing tab with URI = \"" + Editor.__triggerURI + "\"\n");
            Editor.__mainBrowserWindow.yulup.replaceTab(Editor.__editorTab, Editor.__triggerURI, Editor.__callerSessionHistory);
        }
    },

    /**
     * Create a new editor instance starting with a built-in
     * document template.
     *
     * @param  {String}  aTemplateName a template identifier
     * @return {Boolean} return true on success, false otherwise
     */
    createNew: function (aTemplateName) {
        var editorParameters = null;
        var template         = null;

        /* DEBUG */ dump("Yulup:editor.js:Editor.createNew(\"" + aTemplateName + "\") invoked\n");

        if (Editor.checkClose()) {
            Editor.shutdownEditor();

            template = gEditorController.archiveRegistry.getTemplateByName(aTemplateName);

            // set editor parameters according to NAR template
            editorParameters = new EditorParameters(template.uri, template.mimeType, null, null, null, null);

            Editor.replaceEditor(editorParameters);

            return true;
        }

        return false;
    },

    /**
     * Create a new editor instance starting with a document
     * template loaded from a remote host.
     *
     * @return {Undefined} does not have a return value
     */
    createNewFromTemplateCMS: function () {
        /* DEBUG */ dump("Yulup:editor.js:Editor.createNewFromTemplateCMS() invoked\n");

        throw new YulupEditorException("Yulup:editor.js:Editor.createNewFromTemplateCMS: method not implemented.");
    },

    /**
     * Create a new editor instance starting with a document
     * loaded from the local file system.
     *
     * @return {Boolean} return true on success, false otherwise
     */
    openFromFile: function () {
        var mimeType         = null;
        var editorParameters = null;
        var documentURI      = null;

        /* DEBUG */ dump("Yulup:editor.js:Editor.openFromFile() invoked\n");

        if (Editor.checkClose()) {
            if (documentURI = PersistenceService.queryOpenFileURI(PersistenceService.FILETYPE_TEXT)) {
                // figure out MIME type from document URI
                mimeType = YulupContentServices.getContentTypeFromURI(documentURI);

                editorParameters = new EditorParameters(documentURI, mimeType, null, null, null, null, null);

                // replace the current editor
                Editor.replaceEditor(editorParameters);

                return true;
            }
        }

        // user aborted
        return false;
    },

    /**
     * Create a new editor instance starting with a document
     * loaded from a remote host.
     *
     * @return {Boolean} return true on success, false otherwise
     */
    openFromCMS: function () {
        var documentURI = null;

        /* DEBUG */ dump("Yulup:editor.js:Editor.openFromCMS() invoked\n");

        throw new YulupEditorException("Yulup:editor.js:Editor.openFromCMS: method not implemented.");
    },

    /**
     * Handle document save request.
     *
     * Shows a warning dialog if the save operation did
     * not succeed.
     *
     * Pass in one of the following save modes: "save",
     * "savetemp", "savecms", "checkincms", "saveaslocal",
     * "saveascms".
     *
     * @param  {String}    aSaveMode
     * @return {Undefined} does not have a return value
     */
    saveDispatcher: function (aSaveMode) {
        var wellFormednessError = null;
        var promptService       = null;
        var saveSucceeded       = false;

        /* DEBUG */ dump("Yulup:editor.js:Editor.saveDispatcher() invoked\n");

        // set document of active view to model
        gEditorController.activeView.setToModel();

        // if document is XML, perform well-formedness check
        if (gEditorController.model.documentReference.isContentXML()) {
            if (wellFormednessError = YulupXMLServices.checkWellFormedness(gEditorController.model.getDocument())) {
                promptService = Components.classes["@mozilla.org/embedcomp/prompt-service;1"].getService(Components.interfaces.nsIPromptService);

                if (promptService.confirmEx(null,
                                            Editor.getStringbundleString("editorWellFormednessDialog.title"),
                                            YulupXMLServices.createWellFormednessAlertString(wellFormednessError) + "\n" + Editor.getStringbundleString("editorWellFormednessDialog.label"),
                                            promptService.BUTTON_POS_0 * promptService.BUTTON_TITLE_SAVE + promptService.BUTTON_POS_1 * promptService.BUTTON_TITLE_CANCEL,
                                            "", "", "",
                                            null,
                                            { value: false }) != 0) {
                    return;
                }
            }
        }

        // dispatch to requested save function
        switch (aSaveMode) {
            case "save":
                saveSucceeded = Editor.saveToFile();
                break;
            case "savetemp":
                saveSucceeded = Editor.saveTempToFile();
                break;
            case "savecms":
                saveSucceeded = Editor.saveToCMS();
                break;
            case "checkincms":
                saveSucceeded = Editor.checkinToCMSAndExit();
                break;
            case "saveaslocal":
                saveSucceeded = Editor.saveAsToFile();
                break;
            case "saveascms":
                saveSucceeded = Editor.saveAsToCMS();
                break;
            default:
                /* DEBUG */ dump("Yulup:editor.js:Editor.saveDispatcher: \"" + aSaveMode + "\" is not a valid save mode.\n");
                throw new YulupEditorException("Yulup:editor.js:Editor.saveDispatcher: \"" + aSaveMode + "\" is not a valid save mode.");
        }

        if (!saveSucceeded) {
            // save did not succeed, warn user
            alert(Editor.getStringbundleString("editorDocumentSaveFailure.label"));
        }
    },

    /**
     * Save current document to a file on the local file
     * system, based on a local path set on an erlier save,
     * or if the current document was initially loaded
     * from the local file system.
     *
     * Do not use this method directly. Instead, call
     * saveDispatcher() with a save mode identifier of
     * "save".
     *
     * @return {Boolean} return true on success, false otherwise
     */
    saveToFile: function () {
        var filePath = null;

        /* DEBUG */ dump("Yulup:editor.js:Editor.saveToFile() invoked\n");

        if (filePath = gEditorController.document.getLocalSavePath()) {
            // a local save path exists, therefore persist the document
            if (gEditorController.document.saveDocument(PersistenceService.getFileDescriptor(filePath), gEditorController.model.getDocument())) {
                // update the current view
                YulupEditController.updateView();

                gEditorController.model.unsetDirty();

                // report success
                alert(Editor.getStringbundleString("editorDocumentUploadSuccess.label"));

                return true;
            } else {
                return false;
            }
        } else {
            // we can't save since there is no local save path (we can only reach this point via a bug)
            /* DEBUG */ dump("Yulup:editor.js:Editor.saveToFile: attempt to save file to local file system without having a save path\n");
            throw new YulupEditorException("Yulup:editor.js:Editor.saveToFile: attempt to save file to local file system without having a save path.");
        }
    },

    /**
     * Save current document to a temporary file on the
     * local file system.
     *
     * Do not use this method directly. Instead, call
     * saveDispatcher() with a save mode identifier of
     * "savetemp".
     *
     * @return {Boolean} return true on success, false otherwise
     */
    saveTempToFile: function () {
        /* DEBUG */ dump("Yulup:editor.js:Editor.saveTempToFile() invoked\n");

        throw new YulupEditorException("Yulup:editor.js:Editor.saveTempToFile: method not implemented.");

        // report success
        gEditorController.model.unsetDirty();

        return true;
    },

    /**
     * Upload the current document to its remote host.
     *
     * Do not use this method directly. Instead, call
     * saveDispatcher() with a save mode identifier of
     * "savecms".
     *
     * @return {Boolean} return true on success, false otherwise
     */
    saveToCMS: function () {
        /* DEBUG */ dump("Yulup:editor.js:Editor.saveToCMS() invoked\n");

        try {
            gEditorController.document.uploadDocument(gEditorController.model.getDocument(), Editor.documentUploadFinished);
        } catch (exception) {
            dump("Yulup:editor.js:Editor.saveToCMS: an error occurred saving to CMS: " + exception.toString() + "\n");
            /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:editor.js:Editor.saveToCMS", exception);

            return false;
        }

        return true;
    },

    checkinToCMSAndExit: function () {
        promptService = null;

        /* DEBUG */ dump("Yulup:editor.js:Editor.checkinToCMSAndExit() invoked\n");

        promptService = Components.classes["@mozilla.org/embedcomp/prompt-service;1"].getService(Components.interfaces.nsIPromptService);

        if (promptService.confirmEx(null,
                                    Editor.getStringbundleString("editorCheckinAndExitConfirmation.title"),
                                    Editor.getStringbundleString("editorCheckinAndExitConfirmation.label"),
                                    promptService.BUTTON_POS_0 * promptService.BUTTON_TITLE_SAVE + promptService.BUTTON_POS_1 * promptService.BUTTON_TITLE_CANCEL,
                                    "", "", "",
                                    null,
                                    { value: false }) != 0) {
            return true;
        }

        try {
            gEditorController.document.uploadDocument(gEditorController.model.getDocument(), Editor.documentCheckinFinished);
        } catch (exception) {
            dump("Yulup:editor.js:Editor.checkinToCMSAndExit: an error occurred saving to CMS: " + exception.toString() + "\n");
            /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:editor.js:Editor.checkinToCMSAndExit", exception);

            return false;
        }

        return true;
    },

    /**
     * Save current document to a file on the local file
     * system, first querying for a path using a file
     * picker dialog.
     *
     * Do not use this method directly. Instead, call
     * saveDispatcher() with a save mode identifier of
     * "saveaslocal".
     *
     * @return {Boolean} return true on success, false otherwise
     */
    saveAsToFile: function () {
        var localFile = null;

        /* DEBUG */ dump("Yulup:editor.js:Editor.saveAsToFile() invoked\n");

        if (localFile = PersistenceService.querySaveAsFileURI(gEditorController.document.getDocumentBaseName(), gEditorController.document.getDocumentExtension())) {
            // user selected a file to save to, therefore persist the document
            if (gEditorController.document.saveDocument(localFile, gEditorController.model.getDocument())) {
                // update the current view
                YulupEditController.updateView();

                gEditorController.model.unsetDirty();

                // report success
                alert(Editor.getStringbundleString("editorDocumentUploadSuccess.label"));

                return true;
            }
        }

        // user aborted or an error occurred during saving
        return false;
    },

    /**
     * Upload current document to its remote host, first
     * querying for a path using a file picker dialog.
     *
     * Do not use this method directly. Instead, call
     * saveDispatcher() with a save mode identifier of
     * "saveascms".
     *
     * @return {Boolean} return true on success, false otherwise
     */
    saveAsToCMS: function () {
        var ioService       = null;
        var serverURIString = null;
        var serverURI       = null;
        var targetURIString = null;
        var targetURI       = null;

        /* DEBUG */ dump("Yulup:editor.js:Editor.saveAsToCMS() invoked\n");

        ioService = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);

        // query for server address if no sitetree available
        if (gEditorController.editorParams.navigation &&
            gEditorController.editorParams.navigation.sitetree &&
            gEditorController.editorParams.navigation.sitetree.uri) {
            serverURI = gEditorController.editorParams.navigation.sitetree.uri;
        } else {
            serverURIString = ServerURIPrompt.showServerURIDialog();

            if (!serverURIString) {
                // user cancelled
                return true;
            } else if (serverURIString == "") {
                return false;
            }

            try {
                serverURI = ioService.newURI(serverURIString, null, null);
            } catch (exception) {
                /* DEBUG */ dump("Yulup:editor.js:Editor.saveAsToCMS: server URI \"" + serverURIString + "\" is not a valid URI: " + exception + "\n");
                /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:editor.js:Editor.saveAsToCMS", exception);

                alert(Editor.getStringbundleString("editorURINotValidFailure.label") + ": \"" + serverURIString + "\".");

                return false;
            }
        }

        // show document upload dialog
        targetURIString = ResourceUploadDialog.showDocumentUploadDialog(serverURI, gEditorController.document.getDocumentName());

        if (!targetURIString) {
            // user cancelled
            return true;
        } else {
            try {
                targetURI = ioService.newURI(targetURIString, null, null);
            } catch (exception) {
                /* DEBUG */ dump("Yulup:editor.js:Editor.saveAsToCMS: target URI \"" + targetURIString + "\" is not a valid URI: " + exception + "\n");
                /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:editor.js:Editor.saveAsToCMS", exception);

                alert(Editor.getStringbundleString("editorTargetLocationNotValidFailure.label") + ": \"" + targetURIString + "\".");

                return false;
            }

            /* DEBUG */ dump("Yulup:editor.js:Editor.saveAsToCMS: target URI = \"" + targetURI.spec + "\"\n");

            // retarget the document to selected URI
            gEditorController.document.retargetTo(targetURI);

            try {
                gEditorController.document.uploadDocument(gEditorController.model.getDocument(), Editor.documentUploadFinished);
            } catch (exception) {
                /* DEBUG */ dump("Yulup:editor.js:Editor.saveAsToCMS: an error occurred saving to CMS: " + exception.toString() + "\n");
                /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:editor.js:Editor.saveAsToCMS", exception);

                return false;
            }
        }

        return true;
    },

    loadTemplate: function (aURI) {
        var documentDOM    = null;
        var templateString = "";

        /* DEBUG */ dump("Yulup:editor.js:Editor.loadTemplate(\"" + aURI + "\") invoked\n");

        documentDOM = Components.classes["@mozilla.org/xml/xml-document;1"].createInstance(Components.interfaces.nsIDOMXMLDocument);
        documentDOM.async = false;

        try {
            if (documentDOM.load(aURI)) {
                templateString = Components.classes["@mozilla.org/xmlextras/xmlserializer;1"].getService(Components.interfaces.nsIDOMSerializer).serializeToString(documentDOM);
            }
        } catch (exception) {
            // something went wrong, we simply return the empty string
            /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:editor.js:Editor.loadTemplate", exception);
            Components.utils.reportError(exception);
        }

        return templateString;
    },

    resourceUpload: function () {
        // open dialog
        ResourceUploadDialog.showResourceUploadDialog(gEditorController.editorParams.navigation.sitetree.uri);
    },

    findString: function () {
        /* DEBUG */ dump("Yulup:editor.js:Editor.findString() invoked\n");

        if (!Editor.__findWindow || (Editor.__findWindow && Editor.__findWindow.closed)) {
            Editor.__findWindow = window.openDialog(YULUP_REPLACE_CHROME_URI, "yulupReplaceDialog", "chrome,resizable=yes,centerscreen", false, gEditorController);

            Editor.__registerWindow(Editor.__findWindow);
        } else {
            Editor.__findWindow.focus();
        }
    },

    replaceString: function () {
        /* DEBUG */ dump("Yulup:editor.js:Editor.replaceString() invoked\n");

        if (!Editor.__replaceWindow || (Editor.__replaceWindow && Editor.__replaceWindow.closed)) {
            Editor.__replaceWindow = window.openDialog(YULUP_REPLACE_CHROME_URI, "yulupReplaceDialog", "chrome,resizable=yes,centerscreen", true, gEditorController);

            Editor.__registerWindow(Editor.__replaceWindow);
        } else {
            Editor.__replaceWindow.focus();
        }
    },

    updateToolboxContextMenu: function () {
        document.getElementById("uiYulupEditorToolboxToggleTextItem").setAttribute("checked", document.getElementById("uiYulupEditorToolbox").getAttribute("showiconsonly") == "true");
    },

    toggleToolbarButtonText: function () {
        if (document.getElementById("uiYulupEditorToolbox").getAttribute("showiconsonly") != "true") {
            document.getElementById("uiYulupEditorToolbox").setAttribute("showiconsonly", "true");

            // persist current state
            YulupPreferences.setBoolPref("editor.toolbox.", "showiconsonly", true);
        } else {
            document.getElementById("uiYulupEditorToolbox").setAttribute("showiconsonly", "false");

            // persist current state
            YulupPreferences.setBoolPref("editor.toolbox.", "showiconsonly", false);
        }
    },

    goUpdateFileOperationsCommand: function (aCommand) {
        var controller = null;
        var enabled    = null;

        /* DEBUG */ dump("Yulup:editor.js:Editor.goUpdateFileOperationsCommand(\"" + aCommand + "\") invoked\n");

        try {
            /* Use the document's commandDispatcher instead of window.controllers,
             * because otherwise FF2 crashes (works with FF1.5). */
            controller = document.commandDispatcher.getControllerForCommand(aCommand);

            enabled = false;

            if (controller)
                enabled = controller.isCommandEnabled(aCommand);

            Editor.goSetFileOperationsCommandEnabled(aCommand, enabled);
        } catch (exception) {
            /* DEBUG */ dump("Yulup:editor.js:Editor.goUpdateFileOperationsCommand: an error occurred updating command \"" + aCommand + "\": " + exception + "\n");
            /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:editor.js:Editor.goUpdateFileOperationsCommand", exception);
        }
    },

    goDoFileOperationsCommand: function (aCommand) {
        var controller = null;

        /* DEBUG */ dump("Yulup:editor.js:Editor.goDoFileOperationsCommand(\"" + aCommand + "\") invoked\n");

        try {
            /* Use the document's commandDispatcher instead of window.controllers,
             * because otherwise FF2 crashes (works with FF1.5). */
            controller = document.commandDispatcher.getControllerForCommand(aCommand);

            if (controller && controller.isCommandEnabled(aCommand))
                controller.doCommand(aCommand);
        } catch (exception) {
            /* DEBUG */ dump("Yulup:editor.js:Editor.goDoFileOperationsCommand: an error occurred executing command \"" + aCommand + "\": " + exception + "\n");
            /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:editor.js:Editor.goDoFileOperationsCommand", exception);
        }
    },

    goSetFileOperationsCommandEnabled: function (aCmdId, aEnabled) {
        var node = null;

        /* DEBUG */ dump("Yulup:editor.js:Editor.goSetFileOperationsCommandEnabled(\"" + aCmdId + "\", \"" + aEnabled + "\") invoked\n");

        node = document.getElementById(aCmdId);

        if (node) {
            if (aEnabled) {
                node.setAttribute("disabled", "false");
            } else {
                node.setAttribute("disabled", "true");
            }
        }
    },

    goUpdateSaveCommands: function () {
        /* DEBUG */ dump("Yulup:editor.js:Editor.goUpdateSaveCommands() invoked\n");

        Editor.goUpdateFileOperationsCommand("cmd_yulup_savelocal");
        Editor.goUpdateFileOperationsCommand("cmd_yulup_savetemp");
        Editor.goUpdateFileOperationsCommand("cmd_yulup_savecms");
        Editor.goUpdateFileOperationsCommand("cmd_yulup_checkincms");
    },

    goUpdateUploadCommands: function () {
        /* DEBUG */ dump("Yulup:editor.js:Editor.goUpdateUploadCommands() invoked\n");

        Editor.goUpdateFileOperationsCommand("cmd_yulup_upload");
    },

    goUpdateFindReplaceCommands: function () {
        /* DEBUG */ dump("Yulup:editor.js:Editor.goUpdateFindReplaceCommands() invoked\n");

        Editor.goUpdateFileOperationsCommand("cmd_yulup_find");
        Editor.goUpdateFileOperationsCommand("cmd_yulup_replace");
    },

    goUpdateCommand: function (aCommand) {
        var controller = null;
        var enabled    = null;

        /* DEBUG */ dump("Yulup:editor.js:Editor.goUpdateCommand(\"" + aCommand + "\") invoked\n");

        try {
            controller = gEditorController.activeView.editor.contentWindow.controllers.getControllerForCommand(aCommand);

            enabled = false;

            if (controller)
                enabled = controller.isCommandEnabled(aCommand);

            Editor.goSetCommandEnabled(aCommand, enabled);
        } catch (exception) {
            /* DEBUG */ dump("Yulup:editor.js:Editor.goUpdateCommand: an error occurred updating command \"" + aCommand + "\": " + exception.toString() + "\n");
            /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:editor.js:Editor.goUpdateCommand", exception);
        }
    },

    goDoCommand: function (aCommand) {
        var controller = null;

        /* DEBUG */ dump("Yulup:editor.js:Editor.goDoCommand(\"" + aCommand + "\") invoked\n");

        try {
            controller = gEditorController.activeView.editor.contentWindow.controllers.getControllerForCommand(aCommand);
            if (controller && controller.isCommandEnabled(aCommand))
                controller.doCommand(aCommand);
        } catch (exception) {
            /* DEBUG */ dump("Yulup:editor.js:Editor.goUpdateCommand: an error occurred executing command \"" + aCommand + "\": " + exception.toString() + "\n");
            /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:editor.js:Editor.goDoCommand", exception);
        }
    },

    goSetCommandEnabled: function (aCmdId, aEnabled) {
        var node = null;

        /* DEBUG */ dump("Yulup:editor.js:Editor.goSetCommandEnabled(\"" + aCmdId + "\", \"" + aEnabled + "\") invoked\n");

        node = document.getElementById(aCmdId);

        if (node) {
            if (aEnabled) {
                node.setAttribute("disabled", "false");
            } else {
                node.setAttribute("disabled", "true");
            }
        }
    },

    goUpdateFocusEventCommands: function () {
        /* DEBUG */ dump("Yulup:editor.js:Editor.goUpdateFocusEventCommands() invoked\n");

        Editor.goUpdateCommand("cmd_undo");
        Editor.goUpdateCommand("cmd_redo");
        Editor.goUpdateCommand("cmd_cut");
        Editor.goUpdateCommand("cmd_copy");
        Editor.goUpdateCommand("cmd_paste");
        Editor.goUpdateCommand("cmd_delete");
    },

    goUpdateSelectEventCommands: function () {
        /* DEBUG */ dump("Yulup:editor.js:Editor.goUpdateSelectEventCommands() invoked\n");

        Editor.goUpdateCommand("cmd_cut");
        Editor.goUpdateCommand("cmd_copy");
        Editor.goUpdateCommand("cmd_delete");
    },

    goUpdateUndoEventCommands: function () {
        /* DEBUG */ dump("Yulup:editor.js:Editor.goUpdateUndoEventCommands() invoked\n");

        Editor.goUpdateCommand("cmd_undo");
        Editor.goUpdateCommand("cmd_redo");
    },

    goUpdateClipboardEventCommands: function () {
        /* DEBUG */ dump("Yulup:editor.js:Editor.goUpdateClipboardEventCommands() invoked\n");

        Editor.goUpdateCommand("cmd_paste");
    },

    goUpdateEditorContextCommands: function () {
        /* DEBUG */ dump("Yulup:editor.js:Editor.goUpdateEditorContextCommands() invoked\n");

        Editor.goUpdateCommand("cmd_yulup_selectAll");
        Editor.goUpdateCommand("cmd_yulup_selectContents");
        Editor.goUpdateCommand("cmd_yulup_editAttributes");
    },

    goUpdateLocationBarContextCommands: function () {
        /* DEBUG */ dump("Yulup:editor.js:Editor.goUpdateLocationBarContextCommands() invoked\n");

        Editor.goUpdateCommand("cmd_yulup_deleteContextElement");
        Editor.goUpdateCommand("cmd_yulup_selectContextContents");
        Editor.goUpdateCommand("cmd_yulup_moveUp");
        Editor.goUpdateCommand("cmd_yulup_moveDown");
        Editor.goUpdateCommand("cmd_yulup_editContextAttributes");
    },

    updateSaveMenu: function () {
        var disable        = true;
        var saveMenu       = null;
        var saveCommandset = null;
        var childNodes     = null;
        var node           = null;

        /* DEBUG */ dump("Yulup:editor.js:Editor.updateSaveMenu() invoked\n");

        // enable the save menu if at least one of the save commands is active
        saveMenu       = document.getElementById("uiFileOperationSave");
        saveCommandset = document.getElementById("uiYulupEditorFileOperationsSaveCommandset");

        if (saveCommandset) {
            childNodes = saveCommandset.getElementsByTagNameNS("http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul", "command");

            for (var i = 0; i < childNodes.length; i++) {
                if (childNodes.item(i).getAttribute("disabled") == "false") {
                    disable = false;
                    break;
                }
            }
        }

        if (saveMenu)
            saveMenu.setAttribute("disabled", disable);
    },

    documentCheckinFinished: function (aDocumentData, aException) {
        /* DEBUG */ dump("Yulup:editor.js:Editor.documentCheckinFinished(\"" + aDocumentData + "\", \"" + aException + "\") invoked\n");

        if (Editor.documentUploadFinished(aDocumentData, aException)) {
            // close editor
            Editor.shutdownEditor();

            /* DEBUG */ dump("Yulup:editor.js:Editor.documentCheckinFinished: replacing tab\n");
            Editor.__mainBrowserWindow.yulup.replaceTab(Editor.__editorTab, Editor.__triggerURI, Editor.__callerSessionHistory);
        }
    },

    /**
     * Callback function to handle finished document uploads.
     *
     * @param  {String}    aDocumentData the response document as sent by the remote host
     * @param  {Error}     aException    an exception as returned by the server (e.g. a Neutron exception)
     * @return {Boolean} returns true if upload was successful, false otherwise
     */
    documentUploadFinished: function (aDocumentData, aException) {
        /* DEBUG */ dump("Yulup:editor.js:Editor.documentUploadFinished(\"" + aDocumentData + "\", \"" + aException + "\") invoked\n");

        if (aDocumentData != null) {
            // report success
            alert(Editor.getStringbundleString("editorDocumentUploadSuccess.label"));

            /* unsetDirty after the user notification, because this
             * manipulates the edit state controller. If something fails
             * there, the user would never receive the notification, and
             * would maybe retry to save the document, although if we've
             * reached this point here, we are sure that is has been
             * saved. */
            gEditorController.model.unsetDirty();

            return true;
        } else {
            if (aException && (aException instanceof NeutronProtocolException || aException instanceof NeutronAuthException)) {
                // report error message retrieved from response
                alert(Editor.getStringbundleString("editorDocumentUploadServerError.label") + ": \n\n" + aException.message);
            } else if (aException) {
                dump("Yulup:editor.js:Editor.documentUploadFinished: an error occurred during parsing the response message: " + aException.toString() + "\n");

                // report generic error
                alert(Editor.getStringbundleString("editorDocumentUploadFailure.label"));

                /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:editor.js:Editor.documentUploadFinished", aException);

                Components.utils.reportError(aException);
            } else {
                dump("Yulup:editor.js:Editor.documentUploadFinished: received neither document data nor an exception.\n");

                // report generic error
                alert(Editor.getStringbundleString("editorDocumentUploadFailure.label"));
            }

            return false;
        }
    },

    /**
     * Register a window with the editor global
     * window list.
     *
     * If the window is already registered, it
     * is not added again.
     *
     * @param  {nsIXULWindow} aWindow the window to register
     * @return {Undefined} does not have a return value
     */
    __registerWindow: function (aWindow) {
        /* DEBUG */ dump("Yulup:editor.js:Editor.__registerWindow() invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aWindow != null);

        if (Editor.__getWindowRegisterIndex(aWindow) == -1) {
            Editor.__windowList.push(aWindow);
        }
    },

    /**
     * Unregister a window with the editor global
     * window list.
     *
     * If the window is not registered, the method
     * silently returns.
     *
     * @param  {nsIXULWindow} aWindow the window to unregister
     * @return {Undefined} does not have a return value
     */
    __unregisterWindow: function (aWindow) {
        /* DEBUG */ dump("Yulup:editor.js:Editor.__unregisterWindow() invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aWindow != null);

        var index = null;

        if ((index = Editor.__getWindowRegisterIndex(aWindow)) >= 0) {
            Editor.__windowList.splice(index, 1);
        }
    },

    /**
     * Return the position of a window in the editor
     * global window list.
     *
     * If the passed window is not registered, -1 is
     * returned.
     *
     * @param  {nsIXULWindow} aWindow the window for which the index should be returned
     * @return {Number} the index of the passed window in the editor global window list, or -1 if not found
     */
    __getWindowRegisterIndex: function (aWindow) {
        /* DEBUG */ dump("Yulup:editor.js:Editor.__getWindowRegisterIndex() invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aWindow != null);

        var index = null;

        for (var i = 0; i < Editor.__windowList.length; i++) {
            if (Editor.__windowList[i] == aWindow) {
                index = i;
                break;
            }
        }

        return (index ? index : -1);
    },

    /**
     * Close all open windows which are registered with
     * the editor global window list.
     *
     * @return {Undefined} does not have a return value
     */
    __closeAllWindows: function () {
        /* DEBUG */ dump("Yulup:editor.js:Editor.__closeAllWindows() invoked\n");

        for (var i = 0; i < Editor.__windowList.length; i++) {
            if (!Editor.__windowList[i].closed) {
                Editor.__windowList[i].close()
            }
        }
    }
};
