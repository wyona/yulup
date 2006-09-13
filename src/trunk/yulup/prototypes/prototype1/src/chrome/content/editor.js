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

const EDITOR_WINDOW_TITLE           = "Yulup Editor";
const YULUP_EDITOR_CHROME_URI       = "chrome://yulup/content/editor.xul";
const YULUP_CONFIRMCLOSE_CHROME_URI = "chrome://yulup/content/confirmclose.xul";
const YULUP_FAVICON_CHROME_URI      = "chrome://yulup/skin/icons/yulup-logo.png";

var gMainBrowserWindow  = null;
var gYulupTab           = null;
var gControlledShutdown = false;

var Editor = {
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

        /* DEBUG */ dump("Yulup:editor.js:Editor.onLoadListener() invoked\n");

        // prevent from multiple initialisations
        if (!document.getElementById("uiYulupEditorWindow").getAttribute("editorInit")) {
            /* DEBUG */ dump("Yulup:editor.js:Editor.onLoadListener() is being run for the first time\n");

            // we are initialising
            document.getElementById("uiYulupEditorWindow").setAttribute("editorInit", true);

            // set window title
            document.title = EDITOR_WINDOW_TITLE;

            // get a handle on the main browser window
            gMainBrowserWindow = window.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
                .getInterface(Components.interfaces.nsIWebNavigation)
                .QueryInterface(Components.interfaces.nsIDocShellTreeItem)
                .rootTreeItem
                .QueryInterface(Components.interfaces.nsIInterfaceRequestor)
                .getInterface(Components.interfaces.nsIDOMWindow);

            /* DEBUG */ dump("Yulup:editor.js:Editor.onLoadListener: window.location.search = \"" + window.location.search + "\"\n");

            // grab our parameters if an instance ID is present
            if (window.location.search && window.location.search != "") {
                instanceID = window.location.search.slice(1);

                if (parameterObject = gMainBrowserWindow.yulup.instancesManager.retrieveInstance(instanceID)) {
                    // save our tab for replaceEditor
                    gYulupTab = parameterObject.tab;

                    // set favicon
                    gMainBrowserWindow.getBrowser().setIcon(gYulupTab, YULUP_FAVICON_CHROME_URI);

                    // instantiate the editor
                    new YulupEditController(parameterObject);
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
                new YulupEditController(null);
            }

            // install onbeforeunload handler
            window.addEventListener("beforeunload", Editor.onBeforeUnloadListener, false);
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
    onBeforeUnloadListener: function () {
        var returnObject    = null;
        var applicableItems = null;

        /* DEBUG */ dump("Yulup:editor.js:Editor.onBeforeUnloadListener() invoked\n");

        /* Check if we have a controller and if yes, if this is not
         * a controlled shutdown, i.e. neither an "open" or "new"
         * method has been called, and the user was not yet asked
         * for confirmation. */
        if (gEditorController && gEditorController.initialised && gEditorController.model.isDirty() && !gControlledShutdown && gEditorController.editStateController.isCurrentState(gEditorController.editStateController.STATE_SUPERIOR_DOCUMENTOK)) {
            /* DEBUG */ dump("Yulup:editor.js:Editor.onBeforeUnloadListener: not a controlled shutdown\n");

            returnObject    = new Object();
            applicableItems = new Array();

            if (gEditorController.document instanceof NeutronDocument) {
                applicableItems.push("savecms");
                applicableItems.push("checkincms");
            }

            if (window.openDialog(YULUP_CONFIRMCLOSE_CHROME_URI, "yulupEditorConfirmCloseDialog", "modal,resizable=no", returnObject, applicableItems)) {
                if (returnObject.returnValue) {
                    // user selected save
                    Editor.saveDispatcher(returnObject.returnValue);
                }
            }
        }

        // remove onbeforeunload listener
        window.removeEventListener("beforeunload", Editor.onBeforeUnloadListener, false);

        return true;
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

        return document.getElementById('uiYulupEditorStringbundle').getString(aString);
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
        gControlledShutdown = true;

        try {
            // prepare parameters for pick-up
            instanceID = gMainBrowserWindow.yulup.instancesManager.addInstance(gYulupTab, aEditorParameters);

            // construct target URI
            targetURI = YULUP_EDITOR_CHROME_URI + "?" + instanceID;

            // replace editor in current tab
            window.location.replace(targetURI);
        } catch (exception) {
            dump("Yulup:editor.js:Editor.replaceEditor: failed to replace editor: " + exception.toString() + "\n");

            // clean up
            if (instanceID)
                gMainBrowserWindow.yulup.instancesManager.removeInstance(instanceID);

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

    /**
     * Create a new editor instance starting with a built-in
     * document template.
     *
     * Pass in a template identifier from the following list:
     * "blank", "template-xml", "template-xhtml".
     *
     * @param  {String}  aTemplate a template identifier
     * @return {Boolean} return true on success, false otherwise
     */
    createNew: function (aTemplate) {
        var editorParameters = null;

        /* DEBUG */ dump("Yulup:editor.js:Editor.createNew(\"" + aTemplate + "\") invoked\n");

        if (Editor.checkClose()) {
            editorParameters = new EditorParameters(null, aTemplate);

            Editor.replaceEditor(editorParameters);

            return true;
        }

        return false;
    },

    /**
     * Create a new editor instance starting with a document
     * template loaded from a local file.
     *
     * @return {Undefined} does not have a return value
     */
    createNewFromTemplateLocal: function () {
        /* DEBUG */ dump("Yulup:editor.js:Editor.createNewFromTemplateLocal() invoked\n");

        throw new YulupEditorException("Yulup:editor.js:Editor.createNewFromTemplateLocal: method not implemented.");
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
        var editorParameters = null;
        var documentURI      = null;

        /* DEBUG */ dump("Yulup:editor.js:Editor.openFromFile() invoked\n");

        if (Editor.checkClose()) {
            if (documentURI = PersistenceService.queryOpenFileURI()) {
                editorParameters = new EditorParameters(documentURI, null);

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
            if (wellFormednessError = Editor.checkWellFormedness(gEditorController.model.getDocument())) {
                promptService = Components.classes["@mozilla.org/embedcomp/prompt-service;1"].getService(Components.interfaces.nsIPromptService);

                if (promptService.confirmEx(null,
                                            Editor.getStringbundleString("editorWellFormednessDialog.title"),
                                            Editor.createWellFormednessAlertString(wellFormednessError) + "\n" + Editor.getStringbundleString("editorWellFormednessDialog.label"),
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
                saveSucceeded = Editor.checkinToCMS();
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
            alert("Saving document did not succeed.");
        }
    },

    createWellFormednessAlertString: function (aWellFormednessError) {
        return Editor.getStringbundleString("editorWellFormednessError0.label") + ": " + Editor.getStringbundleString("editorWellFormednessError1.label") + ": " + aWellFormednessError.line + ", " + Editor.getStringbundleString("editorWellFormednessError2.label") + ": " + aWellFormednessError.column + (aWellFormednessError.sourceText != "" ? "\n" + aWellFormednessError.sourceText : "");
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
            if (gEditorController.document.saveDocument(PersistenceService.getFileDescriptor(filePath.path), gEditorController.model.getDocument())) {
                // update the current view
                YulupEditController.updateView();

                // report success
                gEditorController.model.unsetDirty();

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

    // TODO: remove, since we use saveToCMS also for Neutron checkins
    checkinToCMS: function () {
        /* DEBUG */ dump("Yulup:editor.js:Editor.checkinToCMS() invoked\n");

       throw new YulupEditorException("Yulup:editor.js:Editor.checkinToCMS: method not implemented.");
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

                // report success
                gEditorController.model.unsetDirty();

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
        /* DEBUG */ dump("Yulup:editor.js:Editor.saveAsToCMS() invoked\n");

        throw new YulupEditorException("Yulup:editor.js:Editor.saveAsToCMS: method not implemented.");

        // report success
        gEditorController.model.unsetDirty();

        return true;
    },

    /**
     * Check the well-formedness of a given document.
     *
     * @param {String}  aDocument the document to check
     * @return {String} a message containing the result of the check, or null if check successful
     */
    checkWellFormedness: function (aDocument) {
        var domParser              = null;
        var domDocument            = null;
        var rootElement            = null;
        var xmlSerialiser          = null;
        var sourceTextElement      = null;
        var parseErrorString       = null;
        var sourceTextString       = null;
        var parseErrorStringRegExp = null;
        var errorLine              = null;
        var errorColumn            = null;

        /* DEBUG */ dump("Yulup:editor.js:Editor.checkWellFormedness() invoked\n");

        domParser   = new DOMParser();
        domDocument = domParser.parseFromString(aDocument, "text/xml");

        rootElement = domDocument.documentElement;
        if ((rootElement.tagName == "parserError") ||
            (rootElement.namespaceURI == "http://www.mozilla.org/newlayout/xml/parsererror.xml")) {
            xmlSerialiser = Components.classes["@mozilla.org/xmlextras/xmlserializer;1"].getService(Components.interfaces.nsIDOMSerializer);

            /* DEBUG */ dump("Yulup:editor.js:Editor.checkWellFormedness: well-formedness error:\n" + xmlSerialiser.serializeToString(rootElement) + "\n");

            // get parser error string
            parseErrorString = "";

            for (var child = rootElement.firstChild; child != null; child = child.nextSibling) {
                if (child.nodeType == Components.interfaces.nsIDOMNode.TEXT_NODE) {
                    parseErrorString += child.nodeValue;
                } else if (child.nodeType == Components.interfaces.nsIDOMNode.ELEMENT_NODE && child.tagName == "sourcetext") {
                    sourceTextElement = child;
                }
            }

            // extract line number and column
            parseErrorStringRegExp = new RegExp(".*Line Number (.*?), Column (.*):");
            parseErrorArray        = parseErrorStringRegExp.exec(parseErrorString);

            /* Note that the matched results start at index 1, index 0
             * contains the not matched strings (not what we want). */
            errorLine = parseErrorArray[1];
            errorColumn     = parseErrorArray[2];

            // get source text
            sourceTextString = "";

            if (sourceTextElement) {
                for (var child = sourceTextElement.firstChild; child != null; child = child.nextSibling) {
                    if (child.nodeType == Components.interfaces.nsIDOMNode.TEXT_NODE) {
                        sourceTextString += child.nodeValue;
                    }
                }
            }

            /* DEBUG */ dump("Yulup:editor.js:Editor.checkWellFormedness: well-formedness error, line number = " + errorLine + ", column = " + errorColumn + ", source text = " + sourceTextString + "\n");

            return { line: errorLine, column: errorColumn, sourceText: sourceTextString };
        } else {
            return null;
        }
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

    goUpdateCommand: function (aCommand) {
        var controller = null;
        var enabled    = null;

        /* DEBUG */ dump("Yulup:editor.js:Editor.goUpdateCommand(\"" + aCommand + "\") invoked\n");

        try {
            controller = gEditorController.activeView.editor.contentWindow.controllers.getControllerForCommand(aCommand);
            //controller = top.document.commandDispatcher.getControllerForCommand(aCommand);

            enabled = false;

            if (controller)
                enabled = controller.isCommandEnabled(aCommand);

            goSetCommandEnabled(aCommand, enabled);
        } catch (exception) {
            dump("Yulup:editor.js:Editor.goUpdateCommand: an error occurred updating command \"" + aCommand + "\": " + exception.toString() + "\n");
            /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:editor.js:Editor.goUpdateCommand", exception);
        }
    },

    goDoCommand: function (aCommand) {
        var controller = null;

        /* DEBUG */ dump("Yulup:editor.js:Editor.goDoCommand(\"" + aCommand + "\") invoked\n");

        try {
            //controller = top.document.commandDispatcher.getControllerForCommand(aCommand);
            controller = gEditorController.activeView.editor.contentWindow.controllers.getControllerForCommand(aCommand);
            if (controller && controller.isCommandEnabled(aCommand))
                controller.doCommand(aCommand);
        } catch (exception) {
            dump("Yulup:editor.js:Editor.goUpdateCommand: an error occurred executing command \"" + aCommand + "\": " + exception.toString() + "\n");
            /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:editor.js:Editor.goDoCommand", exception);
        }
    },

    goSetCommandEnabled: function (aCmdId, aEnabled) {
        var node = null;

        /* DEBUG */ dump("Yulup:editor.js:Editor.goSetCommandEnabled(\"" + aCmdID + "\", \"" + aEnabled + "\") invoked\n");

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

        Editor.goUpdateCommand('cmd_undo');
        Editor.goUpdateCommand('cmd_redo');
        Editor.goUpdateCommand('cmd_cut');
        Editor.goUpdateCommand('cmd_copy');
        Editor.goUpdateCommand('cmd_paste');
    },

    goUpdateSelectEventCommands: function () {
        /* DEBUG */ dump("Yulup:editor.js:Editor.goUpdateSelectEventCommands() invoked\n");

        Editor.goUpdateCommand('cmd_cut');
        Editor.goUpdateCommand('cmd_copy');
    },

    goUpdateUndoEventCommands: function () {
        /* DEBUG */ dump("Yulup:editor.js:Editor.goUpdateUndoEventCommands() invoked\n");

        Editor.goUpdateCommand('cmd_undo');
        Editor.goUpdateCommand('cmd_redo');
    },

    goUpdateClipboardEventCommands: function () {
        /* DEBUG */ dump("Yulup:editor.js:Editor.goUpdateClipboardEventCommands() invoked\n");

        Editor.goUpdateCommand('cmd_paste');
    },

    /**
     * Callback function to handle finished document uploads.
     *
     * @param  {String}    aDocumentData the response document as sent by the remote host
     * @param  {Error}     aException    an exception as returned by the server (e.g. a Neutron exception)
     * @return {Undefined} does not have a return value
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
            }
        }
    }
};
