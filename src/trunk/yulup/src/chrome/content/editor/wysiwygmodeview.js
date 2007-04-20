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

/**
 * WYSIWYGModeView constructor. Instantiates a new object of
 * type WYSIWYGModeView.
 *
 * Subtype of type View.
 *
 * @constructor
 * @param  {YulupEditStateController} aEditorController the editor's state machine
 * @param  {Model}                    aModel            the model associated with this view
 * @param  {Function}                 aShowViewCommand  a function to call to show the current view
 * @param  {Barrier}                  aBarrier          the barrier on which to synchronise after setUp()
 * @param  {nsIDOMXULElement}         aContextMenuPopup the context menu of this view
 * @return {WYSIWYGModeView}
 */
function WYSIWYGModeView(aEditorController, aModel, aShowViewCommand, aBarrier, aContextMenuPopup) {
    /* DEBUG */ dump("Yulup:wysiwygmodeview.js:WYSIWYGModeView(\"" + aEditorController + "\", \"" + aModel + "\", \"" + aShowViewCommand + "\", \"" + aBarrier + "\") invoked.\n");

    /* DEBUG */ YulupDebug.ASSERT(aEditorController != null);
    /* DEBUG */ YulupDebug.ASSERT(aModel            != null);
    /* DEBUG */ YulupDebug.ASSERT(aShowViewCommand  != null);
    /* DEBUG */ YulupDebug.ASSERT(aBarrier          != null);
    /* DEBUG */ YulupDebug.ASSERT(aContextMenuPopup != null);

    // call super constructor
    View.call(this, aEditorController, aModel, aBarrier, aContextMenuPopup);

    // register ourselves as an onload listener to get notified when the editor element is initialised
    document.addEventListener("editorinit", this, false);

    // request an editor element
    this.editviewElem = document.getElementById("uiYulupEditorTabbox").createView("wysiwyg", aShowViewCommand, Editor.getStringbundleString("editorTabWYSIWYGView.label"), Editor.getStringbundleString("editorTabWYSIWYGView.tooltip"), this);

    this.editor = this.editviewElem.getView();

    this.uriRewriter = new URIRewriter(this);

    this.__atomService = Components.classes["@mozilla.org/atom-service;1"].getService(Components.interfaces.nsIAtomService);

    /* DEBUG */ dump("Yulup:wysiwygmodeview.js:WYSIWYGModeView: this.editor = \"" + this.editor + "\"\n");
}

WYSIWYGModeView.prototype = {
    __proto__: View.prototype,

    __atomService: null,

    documentPreamble: null,

    /**
     * Initialise the current view.
     *
     * Note that nsIHTMLEditor is also an nsIPlaintextEditor.
     *
     * @return {Undefined} does not have a return value
     */
    setUp: function () {
        var wysiwygEditor         = null;
        var keyBinding            = null;
        var widgetUpSelListener   = null;
        var selectContentsCommand = null;
        var editAttributesCommand = null;
        var moveCommand           = null;
        var commandController     = null;
        var commandTable          = null;

        /* DEBUG */ dump("Yulup:wysiwygmodeview.js:WYSIWYGModeView.setUp() invoked\n");

        try {
            /* DEBUG */ dump("Yulup:wysiwygmodeview.js:WYSIWYGModeView.setUp: this.editor = \"" + this.editor + "\"\n");
            wysiwygEditor = this.editor;
            wysiwygEditor.makeEditable("html", false);

            this.registerContextMenu(wysiwygEditor);

            this.view = wysiwygEditor.getEditor(wysiwygEditor.contentWindow);
            this.view.QueryInterface(Components.interfaces.nsIEditor);

            // mark as readonly
            this.view.flags |= Components.interfaces.nsIPlaintextEditor.eEditorReadonlyMask;

            // TODO: experimental, remove after use
            this.validator = Validation.validatorFactory(this.view.document, "-//W3C//DTD HTML 4.01//EN");

            // hook up DocumentStateListener
            this.view.addDocumentStateListener(new DocumentStateListener(this.model));

            // hook up EditActionListener
            this.view.addEditActionListener(new EditActionListener(this, this.model));

            this.view.QueryInterface(Components.interfaces.nsIHTMLEditor);

            // set editor attributes
            this.view.enableUndo(true);
            this.view.returnInParagraphCreatesNewParagraph = true;
            this.view.isCSSEnabled = false;

            // make the caret visible even if the current selection is not collapsed
            this.view.selectionController.setCaretVisibilityDuringSelection(true);

            // set the document URI
            wysiwygEditor.docShell.setCurrentURI(this.model.documentReference.getLoadURI());

            /* Due to the implementation of updateBaseURL, this is not going to work as
             * is, so we need a C++ call here (see
             * http://lxr.mozilla.org/mozilla1.8.0/source/editor/libeditor/html/nsHTMLEditor.cpp#1209). */
            this.view.updateBaseURL();

            wysiwygEditor.contentWindow.addEventListener("keypress", new CommandKeyListener(), true);

            if ((keyBinding = YulupPreferences.getCharPref("editor.", "keybinding")) != null) {
                switch (keyBinding) {
                    case "readline":
                        wysiwygEditor.contentWindow.addEventListener("keypress", new ReadlineKeyBindingsListener(wysiwygEditor), true);
                        break;
                    case "none":
                    default:
                }
            } else {
                // default to readline
                wysiwygEditor.contentWindow.addEventListener("keypress", new ReadlineKeyBindingsListener(wysiwygEditor), true);
            }

            /* Prevent keypress events from bubbling to work around
             * bug https://bugzilla.mozilla.org/show_bug.cgi?id=304188
             * (prevent keypress events from invoking FAYT). */
            wysiwygEditor.contentWindow.addEventListener("keypress", function (aKeyEvent) {
                                                             aKeyEvent.stopPropagation();
                                                         }, true);

            // hook up selection listeners
            this.addSelectionListener(new CutCopySelectionListener(this));

            widgetUpSelListener = new WYSIWYGUpdateSelectionListener(this, this.controller.widgetManager.surroundCommandList);
            this.addSelectionListener(widgetUpSelListener);

            // clear undo and redo stacks
            this.view.transactionManager.clear();

            // hook up undo/redo observer
            wysiwygEditor.commandManager.addCommandObserver(this.undoRedoObserver, "cmd_undo");
            wysiwygEditor.commandManager.addCommandObserver(this.undoRedoObserver, "cmd_redo");

            // hook up URI rewriter
            this.editor.contentDocument.addEventListener("DOMNodeInserted", this.uriRewriter, true);

            // add our own command handlers
            commandController = Components.classes["@mozilla.org/embedcomp/base-command-controller;1"].createInstance(Components.interfaces.nsIControllerContext);
            commandController.init(null);

            // the context set via setCommandContext is passed as the third argument to each doCommand* call
            commandController.setCommandContext(this.view);
            wysiwygEditor.contentWindow.controllers.insertControllerAt(0, commandController);

            commandTable = commandController.QueryInterface(Components.interfaces.nsIInterfaceRequestor).getInterface(Components.interfaces.nsIControllerCommandTable);

            selectContentsCommand = new WYSIWYGSelectContentsCommand(this, widgetUpSelListener);
            editAttributesCommand = new WYSIWYGEditAttributesCommand(this);
            moveCommand           = new WYSIWYGMoveContextCommand(this, widgetUpSelListener);

            commandTable.registerCommand("cmd_yulup_selectContents", selectContentsCommand);
            commandTable.registerCommand("cmd_yulup_selectContextContents", selectContentsCommand);
            commandTable.registerCommand("cmd_yulup_editAttributes", editAttributesCommand);
            commandTable.registerCommand("cmd_yulup_editContextAttributes", editAttributesCommand);
            commandTable.registerCommand("cmd_yulup_deleteContextElement", new WYSIWYGDeleteContextElementCommand(this, widgetUpSelListener));
            commandTable.registerCommand("cmd_yulup_moveUp", moveCommand);
            commandTable.registerCommand("cmd_yulup_moveDown", moveCommand);

            /* DEBUG */ dump("Yulup:wysiwygmodeview.js:WYSIWYGModeView.setUp: initialisation completed\n");
        } catch (exception) {
            /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:wysiwygmodeview.js:WYSIWYGModeView.setUp", exception);
            Components.utils.reportError(exception);
            return;
        }

        /* DEBUG */ dump("%%%%%%%%%%%%%%% Yulup::wysiwygmodeview.js:WYSIWYGModeView.setUp: arrive at view barrier (current thread count is \"" + this.barrier.noOfThreads + "\")\n");
        this.barrier.arrive();
    },

    /**
     * Serialise the content of the current view to a string.
     *
     * @return {String} current content of this view
     */
    contentToString: function () {
        var documentBody   = null;

        /* DEBUG */ dump("Yulup:wysiwygmodeview.js:WYSIWYGModeView.contentToString() invoked\n");

        documentBody = (new WYSIWYGDOMSerialiser((new WYSIWYGDOMCleaner(this.editor.contentDocument)).cleanse(), true, true)).serialise();

        return this.documentPreamble + documentBody + "\n</html>";
    },

    /**
     * Fill this view with content from the associated model.
     *
     * @return {Boolean} returns true if successful, false otherwise
     */
    fillView: function () {
        var retVal = false;

        /* DEBUG */ dump("Yulup:wysiwygmodeview.js:WYSIWYGModeView.fillView() invoked\n");

        this.model.preserveDirty = true;

        // fill wysiwyg mode view
        try {
            /* What about using this.editor.contentDocument.innerHTML = content, see
             * also https://bugzilla.mozilla.org/show_bug.cgi?id=314987#c2 */
            this.view.rebuildDocumentFromSource(this.setupDocument(this.model.getDocument()));
            this.view.beginningOfDocument();

            // print document to console
            ///* DEBUG */ dumpTree(this.controller.activeView.editor);

            // rewrite URIs
            this.uriRewriter.rewriteURIs();

            // view is now pristine again
            this.view.resetModificationCount();

            // clear undo and redo stacks
            this.view.transactionManager.clear();

            // indicate that this view has content now
            this.isFilled = true;

            retVal = true;
        } catch (exception) {
            // cannot handle document content type
            /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:wysiwygmodeview.js:WYSIWYGModeView.fillView", exception);
            Components.utils.reportError(exception);

            retVal = false;
        }

        this.model.preserveDirty = false;

        return retVal;
    },

    /**
     * Prepare the document for insertion into the WYSIWYG view
     * and save the preamble for later retrieval.
     *
     * Note that you have to preprocess the document with this
     * method first before you fill the WYSIWYG view, because the
     * WYSIWYG editor destroys your document, and you have to reassemble
     * it afterwards with help of the preamble which gets saved by this
     * method.
     *
     * @param  {String} aDocument the document to process
     * @return {String} the document prepared for the WYSIWYG view
     */
    setupDocument: function (aDocument) {
        var documentPreamble  = null;
        var documentRemainder = null;
        var documentFixup     = null;

        /* DEBUG */ dump("Yulup:wysiwygmodeview.js:WYSIWYGModeView.setupDocument() invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aDocument != null);

        // extract the preamble
        documentPreamble  = aDocument.substring(0, aDocument.search(/<body/i));
        this.documentPreamble = documentPreamble;

        /* DEBUG */ dump("Yulup:wysiwygmodeview.js:WYSIWYGModeView.setupDocument: document preamble =\n" + this.documentPreamble + "\n");

        return aDocument;
    },

    handleEvent: function (aEvent) {
        /* DEBUG */ dump("Yulup:wysiwygmodeview.js:WYSIWYGModeView.handleEvent(\"" + aEvent + "\") invoked\n");
        /* DEBUG */ dump("Yulup:wysiwygmodeview.js:WYSIWYGModeView.handleEvent: event type = \"" + aEvent.type + "\", event target = \"" + aEvent.target + "\", event target name = \"" + aEvent.target.tagName + "\"\n");
        /* DEBUG */ dump("Yulup:wysiwygmodeview.js:WYSIWYGModeView.handleEvent: this.editviewElem = \"" + this.editviewElem + "\", this.editviewElem.tagName = \"" + this.editviewElem.tagName + "\"\n");

        if (aEvent.target == this.editviewElem) {
            // our editor is initialised
            aEvent.stopPropagation();
            this.setUp();
        }
    },

    enterView: function () {
        /* DEBUG */ dump("Yulup:sourcemodeview.js:SourceModeView.enterView() invoked\n");

        this.editviewElem.toggleDisplayBlur(this.setReadWrite, this);

        // show path toolbar
        document.getElementById("uiYulupEditorPathToolBar").hidden = false;
    },

    leaveView: function () {
        /* DEBUG */ dump("Yulup:sourcemodeview.js:SourceModeView.leaveView() invoked\n");

        // mark editor readonly
        this.view.flags |= Components.interfaces.nsIPlaintextEditor.eEditorReadonlyMask;

        this.editviewElem.toggleDisplayBlur();

        // hide path toolbar
        document.getElementById("uiYulupEditorPathToolBar").hidden = true;
    },

    setReadWrite: function () {
        // mark editor writable
        this.view.flags &= ~Components.interfaces.nsIPlaintextEditor.eEditorReadonlyMask;

        this.editor.contentWindow.focus();
    },

    addSelectionListener: function (aSelectionListener) {
        var retval = false;

        /* DEBUG */ dump("Yulup:wysiwygmodeview.js:WYSIWYGModeView.addSelectionListener() invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aSelectionListener != null);

        try {
            this.editor.contentWindow.getSelection().QueryInterface(Components.interfaces.nsISelectionPrivate).addSelectionListener(aSelectionListener);

            retval = true;
        } catch (exception) {
            /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:wysiwygmodeview.js:WYSIWYGModeView.addSelectionListener", exception);
            Components.utils.reportError(exception);
        }

        return retval;
    },

    removeSelectionListener: function (aSelectionListener) {
        /* DEBUG */ dump("Yulup:wysiwygmodeview.js:WYSIWYGModeView.removeSelectionListener() invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aSelectionListener != null);

        try {
            this.editor.contentWindow.getSelection().QueryInterface(Components.interfaces.nsISelectionPrivate).removeSelectionListener(aSelectionListener);
        } catch (exception) {
            /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:wysiwygmodeview.js:WYSIWYGModeView.removeSelectionListener", exception);
            Components.utils.reportError(exception);
        }
    },

    prefersSurround: function () {
        return !this.view.selection.isCollapsed;
    },

    doInsertCommand: function (aCommand, aFragment) {
        var fragmentData = null;

        /* DEBUG */ YulupDebug.ASSERT(aCommand  != null);
        /* DEBUG */ YulupDebug.ASSERT(aFragment != null);

        /* DEBUG */ dump("Yulup:wysiwygmodeview.js:WYSIWYGModeView.doInsertCommand() invoked\n");

        fragmentData = this.xmlSerializer.serializeToString(aFragment);

        this.view.insertHTML(fragmentData);
    },

    doSurroundCommand: function (aCommand, aFragment) {
        var elemName   = null;
        var elemAtom   = null;
        var attributes = null;
        var attrName   = null;
        var attrValue  = null;

        /* DEBUG */ YulupDebug.ASSERT(aCommand  != null);
        /* DEBUG */ YulupDebug.ASSERT(aFragment != null);

        /* DEBUG */ dump("Yulup:wysiwygmodeview.js:WYSIWYGModeView.doSurroundCommand() invoked\n");

        if (aFragment.documentElement) {
            elemName = aFragment.documentElement.localName.toLowerCase();

            elemAtom = this.__atomService.getAtom(elemName);

            attributes = aFragment.documentElement.attributes;

            if (attributes.length > 0) {
                attrName  = attributes.item(0).nodeName;
                attrValue = attributes.item(0).nodeValue;
            }

            this.view.setInlineProperty(elemAtom, attrName, attrValue);

            /* TODO: we should perform a map lookup first to activate
             * all similar commands (would provide nicer UI behaviour). */
            WidgetHandler.activateCommands([aCommand]);
        }
    },

    doUnsurroundCommand: function (aCommand, aFragment) {
        var elemName   = null;
        var elemAtom   = null;
        var attributes = null;
        var attrName   = null;
        var attrValue  = null;

        /* DEBUG */ YulupDebug.ASSERT(aCommand  != null);
        /* DEBUG */ YulupDebug.ASSERT(aFragment != null);

        /* DEBUG */ dump("Yulup:wysiwygmodeview.js:WYSIWYGModeView.doUnsurroundCommand(\"" + aCommand + "\", \"" + aFragment + "\") invoked\n");

        if (aFragment.documentElement) {
            elemName = aFragment.documentElement.localName.toLowerCase();

            elemAtom = this.__atomService.getAtom(elemName);

            this.view.removeInlineProperty(elemAtom, null);

            /* TODO: we should perform a map lookup first to deactivate
             * all similar commands (would provide nicer UI behaviour). */
            WidgetHandler.deactivateCommands([aCommand]);
        }
    },

    isUnsurround: function (aFragment) {
        var isUnsurround = null;
        var elemName     = null;

        isUnsurround = false;

        if (aFragment.documentElement) {
            elemName = aFragment.documentElement.localName.toLowerCase();

            if (this.__pathToRootContains(elemName, this.view.selection.anchorNode)) {
                isUnsurround = true;
            }
        }

        return isUnsurround;
    },

    __pathToRootContains: function (aElementName, aStartNode) {
        var elemName = null;
        var node     = null;

        /* DEBUG */ YulupDebug.ASSERT(aElementName != null);
        /* DEBUG */ YulupDebug.ASSERT(aStartNode   != null);

        /* DEBUG */ dump("Yulup:wysiwygmodeview.js:WYSIWYGModeView.__pathToRootContains(\"" + aElementName + "\", \"" + aStartNode + "\") invoked\n");

        elemName = aElementName.toLowerCase();
        node     = aStartNode;

        while (node) {
            ///* DEBUG */ dump("Yulup:sourcemodeview.js:SourceModeView.__pathToRootContains: visiting node \"" + node.localName + "\"\n");

            if (node.nodeType == Components.interfaces.nsIDOMNode.ELEMENT_NODE &&
                node.localName.toLowerCase() == elemName)
                return node;

            node = node.parentNode;
        }

        return null;
    },

    /**
     * Return a list of nodes, starting from the anchor node of the
     * a selection up to and including the root node.
     *
     * Note that the node at index 0 of the returned list is the
     * selection node, and the node at the highest index is the
     * root node.
     *
     * @param  {nsISelection} aSelection the selection
     * @return {Array} returns an array of nodes
     */
    getNodesToRoot: function (aSelection) {
        var elemNameList = null;
        var node         = null;
        var position     = 0;

        /* DEBUG */ YulupDebug.ASSERT(aSelection != null);

        /* DEBUG */ dump("Yulup:wysiwygmodeview.js:WYSIWYGModeView.getNodesToRoot() invoked\n");

        elemNameList = new Array();

        if (aSelection.anchorNode) {
            /* Add all element names on the path from the current selection anchor
             * to the element names map. */
            node = aSelection.anchorNode;

            /* DEBUG */ dump("Yulup:wysiwygmodeview.js:WYSIWYGModeView.getNodesToRoot: current anchor node = \"" + (node ? node.nodeName : node) + "\"\n");

            while (node) {
                if (node.localName) {
                    elemNameList[position++] = { node: node, name: node.localName.toLowerCase() };
                }

                node = node.parentNode;
            }
        }

        return elemNameList;
    }
};


/**
 * WYSIWYGDOMSerialiser constructor. Instantiates a new object of
 * type WYSIWYGDOMSerialiser.
 *
 * @constructor
 * @param  {nsIDOMDocument}       aRootNode         the DOM document to serialise
 * @param  {Boolean}              aEscapeCharacters escape characters
 * @param  {Boolean}              aConvertEntities  convert characters to entities
 * @return {WYSIWYGDOMSerialiser}
 */
function WYSIWYGDOMSerialiser(aRootNode, aEscapeCharacters, aConvertEntities) {
    var entityConverter = null;

    /* DEBUG */ dump("Yulup:wysiwygmodeview.js:WYSIWYGDOMSerialiser(\"" + aRootNode + "\", \"" + aEscapeCharacters + "\", \"" + aConvertEntities + "\") invoked\n");

    /* DEBUG */ YulupDebug.ASSERT(aRootNode         != null);
    /* DEBUG */ YulupDebug.ASSERT(aEscapeCharacters != null);
    /* DEBUG */ YulupDebug.ASSERT(aConvertEntities  != null);

    this.__rootNode         = aRootNode;
    this.__escapeCharacters = aEscapeCharacters;
    this.__convertEntities  = aConvertEntities;

    if (aConvertEntities) {
        // retrieve converter settings
        entityConverter = YulupPreferences.getIntPref("editor.", "entityconverter");
        if (entityConverter == null) {
            // don't convert
            this.__convertEntities = false;
        } else {
            /* See mozilla/intl/unicharutil/tables/html40Latin1.properties,
             * mozilla/intl/unicharutil/tables/html40Symbols.properties etc.
             * for what entities are converted how. For avaialable encoding
             * flags, see nsIEntityConverter. */
            switch (entityConverter) {
            case 1:
                this.__converterFlags  = Components.interfaces.nsIEntityConverter.html40Latin1;
                break;
            case 2:
                this.__converterFlags  = Components.interfaces.nsIEntityConverter.html40Symbols;
                break;
            case 3:
                this.__converterFlags  = Components.interfaces.nsIEntityConverter.html40Special;
                break;
            case 4:
                this.__converterFlags  = Components.interfaces.nsIEntityConverter.mathml20;
                break;
            case 5:
                this.__converterFlags  = Components.interfaces.nsIEntityConverter.html40;
                break;
            case 6:
                this.__converterFlags  = Components.interfaces.nsIEntityConverter.entityW3C;
                break;
            case 0:
            default:
                // don't convert
                this.__convertEntities = false;
            }
        }

        // if conversion is still enabled, instantiate the converter
        if (this.__convertEntities) {
            this.__entityConverter = Components.classes["@mozilla.org/intl/entityconverter;1"].createInstance(Components.interfaces.nsIEntityConverter);
        }
    }
}

WYSIWYGDOMSerialiser.prototype = {
    __rootNode        : null,
    __escapeCharacters: null,
    __convertEntities : null,
    __entityConverter : null,
    __converterFlags  : null,
    __outputString    : null,

    /**
     * Escape all "&", "<" and """ characters in
     * the passed string if character escaping
     * is enabled.
     *
     * @param  {String} the string in which to escape the characters
     * @return {String} the string with the characters escaped
     */
    __doEscapeCharacters: function (aString) {
        var retString = null;

        const escapeRegExp = new RegExp('[<>&"]', "g");

        const escapeTable = {
            '<': "&lt;",
            '>': "&gt;",
            '&': "&amp;",
            '"': "&quot;"
        };

        function lookupReplacementChar(aChar) {
            return escapeTable[aChar];
        };

        if (this.__escapeCharacters) {
            retString = aString.replace(escapeRegExp, lookupReplacementChar);
        } else {
            retString = aString;
        }

        return retString;
    },

    __doRemoveDoubleLinebreaks: function (aString) {
        var retString = null;

        const removeDblLBRegExp = new RegExp("\n\n", "g");

        retString = aString.replace(removeDblLBRegExp, "\n")

        return retString;
    },

    /**
     * Replace all characters by entities in the passed string
     * if entity conversion is enabled.
     *
     * @param  {String} the string in which to replace the characters by the entities
     * @return {String} the string with the replaced entities
     */
    __doConvertEntities: function (aString) {
        var retString = null;

        if (this.__convertEntities) {
            try {
                retString = this.__entityConverter.ConvertToEntities(aString, this.__converterFlags);
            } catch (exception) {
                /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:wysiwygmodeview.js:WYSIWYGDOMSerialiser.__doConvertEntities", exception);
                Components.utils.reportError(exception);

                retString = aString;
            }
        } else {
            retString = aString;
        }

        return retString;
    },

    /**
     * Serialise the body of the DOM document which was set
     * by the constructor.
     *
     * @return {String} a serialisation of the document body
     */
    serialise: function () {
        var bodyNode = null;

        /* DEBUG */ dump("Yulup:wysiwygmodeview.js:WYSIWYGDOMSerialiser.serialise() invoked\n");

        this.__outputString = "";

        // get the <body> element
        bodyNode = this.__rootNode.evaluate("//body", this.__rootNode, this.__rootNode.createNSResolver(this.__rootNode), XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null).iterateNext();

        if (!bodyNode)
            throw new YulupEditorException("Yulup:wysiwygmodeview.js:WYSIWYGDOMSerialiser.serialise: no <body> element found.");

        this.__serialiseDOMTree(bodyNode);

        return this.__outputString;
    },

    /**
     * Serialise the XML DOM document which was set
     * by the constructor.
     *
     * @return {String} a serialisation of the document body
     */
    serialiseXML: function () {
        /* DEBUG */ dump("Yulup:wysiwygmodeview.js:WYSIWYGDOMSerialiser.serialiseXML() invoked\n");

        this.__outputString = "";

        this.__serialiseDOMTree(this.__rootNode);

        return this.__outputString;
    },

    /**
     * Serialise a node and its subtree.
     *
     * @param  {nsIDOMNode} aNode the node to serialise
     * @return {Undefined} does not have a return value
     */
    __serialiseDOMTree: function (aNode) {
        var child = null;

        /* DEBUG */ YulupDebug.ASSERT(aNode != null);

        this.emitNodeStart(aNode);

        for (child = aNode.firstChild; child != null; child = child.nextSibling) {
            this.__serialiseDOMTree(child);
        }

        this.emitNodeEnd(aNode);
    },

    /**
     * Emits a textual representation of the passed DOM node.
     *
     * This method should be called before the subtree of the
     * node is visited.
     *
     * @param  {nsIDOMNode} aNode the node to serialise
     * @return {Undefined}  does not have a return value
     */
    emitNodeStart: function (aNode) {
        var tmpString = null;

        /* DEBUG */ YulupDebug.ASSERT(aNode != null);

        switch (aNode.nodeType) {
        case Components.interfaces.nsIDOMNode.ELEMENT_NODE:
            this.__outputString += "<" + aNode.nodeName.toLowerCase();

            if (aNode.__yulupOriginalURI) {
                switch (aNode.nodeName.toLowerCase()) {
                case "img":
                    aNode.setAttribute("src", aNode.__yulupOriginalURI);
                    break;
                case "a":
                case "link":
                case "area":
                    aNode.setAttribute("href", aNode.__yulupOriginalURI);
                    break;
                default:
                }
            }

            if (aNode.hasAttributes()) {
                // emit the attributes
                for (var i = 0; i < aNode.attributes.length; i++) {
                    if (aNode.attributes.item(i).nodeName.search("_moz") == -1 && aNode.attributes.item(i).nodeValue.search("_moz") == -1)
                        this.__outputString += " " + aNode.attributes.item(i).nodeName + "=\"" + aNode.attributes.item(i).nodeValue + "\"";
                }
            }

            if (aNode.hasChildNodes()) {
                this.__outputString += ">";
            } else {
                this.__outputString += "/>";
            }
            break;
        case Components.interfaces.nsIDOMNode.TEXT_NODE:
            /* DEBUG */ dump("Yulup:wysiwygmodeview.js:WYSIWYGDOMSerialiser.emitNodeStart: aNode.nodeValue = \"" + aNode.nodeValue + "\"\n");
            tmpString = this.__doEscapeCharacters(aNode.nodeValue);
            tmpString = this.__doConvertEntities(tmpString);
            /* TODO: this is a good place to solve the double-linebreaks on Windows
             * problem. Maybe we can simply replace \n, \r and friends by a canonical
             * character. Needs some experimentation first. */
            tmpString = this.__doRemoveDoubleLinebreaks(tmpString);

            /* DEBUG */ dump("Yulup:wysiwygmodeview.js:WYSIWYGDOMSerialiser.emitNodeStart: encoded aNode.nodeValue = \"" + tmpString + "\"\n");
            this.__outputString += tmpString;
            break;
        case Components.interfaces.nsIDOMNode.CDATA_SECTION_NODE:
            this.__outputString += "<![CDATA[" + aNode.nodeValue + "]]>";
            break;
        case Components.interfaces.nsIDOMNode.PROCESSING_INSTRUCTION_NODE:
            this.__outputString += "<?" + aNode.target + " " + aNode.data + "?>";
            break;
        case Components.interfaces.nsIDOMNode.COMMENT_NODE:
            this.__outputString += "<!--" + aNode.nodeValue + "-->";
            break;
        case Components.interfaces.nsIDOMNode.DOCUMENT_NODE:
            // the document itself; nothing to emit here
            break;
        case Components.interfaces.nsIDOMNode.DOCUMENT_TYPE_NODE:
            // TODO: emit notations (see http://www.w3.org/TR/DOM-Level-2-Core/core.html#ID-412266927)
            this.__outputString += "<!DOCTYPE " + aNode.name + (aNode.publicId ? " PUBLIC \"" + aNode.publicId + "\" " : " ")  + "\"" + aNode.systemId + "\">\n";
            break;
        default:
            /* DEBUG */ dump("Yulup:wysiwygmodeview.js:WYSIWYGDOMSerialiser.emitNodeStart: unknown node \"" + aNode.nodeName + "\" of node type \"" + aNode.nodeType + "\" encountered\n");
            throw new YulupEditorException("Yulup:wysiwygmodeview.js:WYSIWYGDOMSerialiser.emitNodeStart: unknown node \"" + aNode.nodeName + "\" of node type \"" + aNode.nodeType + "\" encountered.");
        }
    },

    /**
     * Emits a textual representation of the passed DOM node.
     *
     * This method should be called after the subtree of the
     * node was visited.
     *
     * @param  {nsIDOMNode} aNode the node to serialise
     * @return {Undefined}  does not have a return value
     */
    emitNodeEnd: function (aNode) {
        /* DEBUG */ YulupDebug.ASSERT(aNode != null);

        switch (aNode.nodeType) {
            case Components.interfaces.nsIDOMNode.ELEMENT_NODE:
            if (aNode.hasChildNodes()) {
                this.__outputString += "</" + aNode.nodeName.toLowerCase() + ">";
            }
            break;
            default:
            // nothing to do here
        }
    }
};


/**
 * WYSIWYGDOMCleaner constructor. Instantiates a new object of
 * type WYSIWYGDOMCleaner.
 *
 * @constructor
 * @param  {nsIDOMDocument}    aRootNode the DOM document to clean
 * @return {WYSIWYGDOMCleaner}
 */
function WYSIWYGDOMCleaner(aRootNode) {
    /* DEBUG */ dump("Yulup:wysiwygmodeview.js:WYSIWYGDOMCleaner(\"" + aRootNode + "\") invoked\n");

    /* DEBUG */ YulupDebug.ASSERT(aRootNode != null);

    this.rootNode = aRootNode;
}

WYSIWYGDOMCleaner.prototype = {
    rootNode:     null,

    /**
     * Clean the body of the DOM document which was set
     * by the constructor.
     *
     * @return {nsIDOMDocument} a cleaned document
     */
    cleanse: function () {
        /* DEBUG */ dump("Yulup:wysiwygmodeview.js:WYSIWYGDOMCleaner.cleanse() invoked\n");

        this.cleanseDOMTree(this.rootNode);

        return this.rootNode;
    },

    /**
     * Clean a node and its subtree.
     *
     * Removes all nodes which are indicated as to be
     * removed by the shouldRemove() method.
     *
     * Note that the current node is removed if either
     * indicated by the shouldRemove() method, or if it
     * is empty because all child nodes were removed.
     *
     * @param  {nsIDOMNode} aNode the node to serialise
     * @return {Boolean} returns true if the current node should be removed, false otherwise
     */
    cleanseDOMTree: function (aNode) {
        var child    = null;
        var tmpChild = null;
        var remove   = null;

        /* DEBUG */ YulupDebug.ASSERT(aNode != null);

        if (aNode.hasChildNodes()) {
            // the current node should be removed unless we find a child node which stays
            remove = true;

            // walk all child nodes
            child = aNode.firstChild;

            while (child != null) {
                // iterate to sibling node because child might get removed
                tmpChild = child;
                child    = child.nextSibling;

                if (this.cleanseDOMTree(tmpChild)) {
                    // the child node has to be removed, except empty table cell elements
                    if (!(tmpChild instanceof HTMLTableCellElement)) {
                        /* DEBUG */ dump("Yulup:wysiwygmodeview.js:WYSIWYGDOMCleaner.cleanseDOMTree: remove child node \"" + tmpChild + "\"\n");
                        aNode.removeChild(tmpChild);
                    }
                } else {
                    // don't remove the current node since we have found a child node which should stay
                    remove = false;
                }
            }
        } else {
            // the current node has no child nodes, therefore removal status only depends on the current node itself
            remove = false;
        }

        // if the current node should be removed, override the removal status as set by its children
        return (this.shouldRemove(aNode) ? true : remove);
    },

    /**
     * Check if the given node should be removed.
     *
     * All nodes which contain an attribute called "type" with
     * value "_moz" are marked for removal.
     *
     * @param  {nsIDOMNode} aNode the node to check
     * @return {Boolean} returns true if given node should be removed, false otherwise
     */
    shouldRemove: function (aNode) {
        /* DEBUG */ dump("Yulup:wysiwygmodeview.js:WYSIWYGDOMCleaner.shouldRemove(\"" + aNode + "\") invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aNode != null);

        if (aNode.nodeType == Components.interfaces.nsIDOMNode.ELEMENT_NODE && aNode.hasAttribute("type") && aNode.getAttribute("type") == "_moz") {
            // remove this node
            return true;
        } else {
            return false;
        }
    }
};


/**
 * WYSIWYGSelectContentsCommand constructor. Instantiates a new object of
 * type WYSIWYGSelectContentsCommand.
 *
 * Implements nsIControllerCommand.
 *
 * @constructor
 */
function WYSIWYGSelectContentsCommand(aView, aSelectionChangeHandler) {
    /* DEBUG */ YulupDebug.ASSERT(aView                   != null);
    /* DEBUG */ YulupDebug.ASSERT(aSelectionChangeHandler != null);

    this.__view                   = aView;
    this.__selectionChangeHandler = aSelectionChangeHandler;
}

WYSIWYGSelectContentsCommand.prototype = {
    __view                  : null,
    __selectionChangeHandler: null,

    doCommand: function (aCommandName, aCommandContext) {
        var selectionNode = null;

        dump("Yulup:wysiwygmodeview.js:WYSIWYGSelectContentsCommand.doCommand(\"" + aCommandName + "\", \"" + aCommandContext + "\") invoked\n");

        if ("cmd_yulup_selectContents" == aCommandName || "cmd_yulup_selectContextContents" == aCommandName) {
            if ("cmd_yulup_selectContents" == aCommandName) {
                selectionNode = aCommandContext.selection.anchorNode;
            } else {
                selectionNode = this.__view.getContextTarget();
            }

            if (selectionNode) {
                if (selectionNode.nodeType == Components.interfaces.nsIDOMNode.TEXT_NODE) {
                    selectionNode = selectionNode.parentNode;
                }

                aCommandContext.selection.removeAllRanges();
                aCommandContext.selection.selectAllChildren(selectionNode);

                this.__selectionChangeHandler.notifySelectionChanged(aCommandContext.document, aCommandContext.selection, null);

                return true;
            }
        }

        return false;
    },

    doCommandParams: function (aCommandName, aParams, aCommandContext) {
        dump("Yulup:wysiwygmodeview.js:WYSIWYGSelectContentsCommand.doCommandParams(\"" + aCommandName + "\", \"" + aParams + "\", \"" + aCommandContext + "\") invoked\n");

        return this.doCommand(aCommandName, aCommandContext);
    },

    getCommandStateParams: function (aCommandName, aParams, aCommandContext) {
        dump("Yulup:wysiwygmodeview.js:WYSIWYGSelectContentsCommand.getCommandStateParams(\"" + aCommandName + "\", \"" + aParams + "\", \"" + aCommandContext + "\") invoked\n");

        aParams.setBooleanValue("state_enabled", this.isCommandEnabled(aCommandName, aCommandContext));
    },

    isCommandEnabled: function (aCommandName, aCommandContext) {
        var selectionNode = null;

        dump("Yulup:wysiwygmodeview.js:WYSIWYGSelectContentsCommand.isCommandEnabled(\"" + aCommandName + "\", \"" + aCommandContext + "\") invoked\n");

        if ("cmd_yulup_selectContents" == aCommandName || "cmd_yulup_selectContextContents" == aCommandName) {
            if ("cmd_yulup_selectContents" == aCommandName) {
                selectionNode = aCommandContext.selection.anchorNode;
            } else {
                selectionNode = this.__view.getContextTarget();
            }

            if (selectionNode) {
                return true;
            }
        }

        return false;
    }
};


/**
 * WYSIWYGDeleteContextElementCommand constructor. Instantiates a new object of
 * type WYSIWYGDeleteContextElementCommand.
 *
 * Implements nsIControllerCommand.
 *
 * @constructor
 */
function WYSIWYGDeleteContextElementCommand(aView, aSelectionChangeHandler) {
    /* DEBUG */ YulupDebug.ASSERT(aView                   != null);
    /* DEBUG */ YulupDebug.ASSERT(aSelectionChangeHandler != null);

    this.__view                   = aView;
    this.__selectionChangeHandler = aSelectionChangeHandler;
}

WYSIWYGDeleteContextElementCommand.prototype = {
    __view                  : null,
    __selectionChangeHandler: null,

    doCommand: function (aCommandName, aCommandContext) {
        var selectionNode = null;

        dump("Yulup:wysiwygmodeview.js:WYSIWYGDeleteContextElementCommand.doCommand(\"" + aCommandName + "\", \"" + aCommandContext + "\") invoked\n");

        if ("cmd_yulup_deleteContextElement" == aCommandName) {
            selectionNode = this.__view.getContextTarget();

            if (selectionNode) {
                this.__view.view.deleteNode(selectionNode);

                this.__selectionChangeHandler.notifySelectionChanged(aCommandContext.document, aCommandContext.selection, null);

                return true;
            }
        }

        return false;
    },

    doCommandParams: function (aCommandName, aParams, aCommandContext) {
        dump("Yulup:wysiwygmodeview.js:WYSIWYGDeleteContextElementCommand.doCommandParams(\"" + aCommandName + "\", \"" + aParams + "\", \"" + aCommandContext + "\") invoked\n");

        return this.doCommand(aCommandName, aCommandContext);
    },

    getCommandStateParams: function (aCommandName, aParams, aCommandContext) {
        dump("Yulup:wysiwygmodeview.js:WYSIWYGDeleteContextElementCommand.getCommandStateParams(\"" + aCommandName + "\", \"" + aParams + "\", \"" + aCommandContext + "\") invoked\n");

        aParams.setBooleanValue("state_enabled", this.isCommandEnabled(aCommandName, aCommandContext));
    },

    isCommandEnabled: function (aCommandName, aCommandContext) {
        var selectionNode = null;

        dump("Yulup:wysiwygmodeview.js:WYSIWYGDeleteContextElementCommand.isCommandEnabled(\"" + aCommandName + "\", \"" + aCommandContext + "\") invoked\n");

        if ("cmd_yulup_deleteContextElement" == aCommandName) {
            selectionNode = this.__view.getContextTarget();

            if (selectionNode) {
                return true;
            }
        }

        return false;
    }
};


/**
 * WYSIWYGMoveContextCommand constructor. Instantiates a new object of
 * type WYSIWYGMoveContextCommand.
 *
 * Implements nsIControllerCommand.
 *
 * @constructor
 */
function WYSIWYGMoveContextCommand(aView, aSelectionChangeHandler) {
    /* DEBUG */ YulupDebug.ASSERT(aView                   != null);
    /* DEBUG */ YulupDebug.ASSERT(aSelectionChangeHandler != null);

    this.__view                   = aView;
    this.__selectionChangeHandler = aSelectionChangeHandler;
}

WYSIWYGMoveContextCommand.prototype = {
    __view                  : null,
    __selectionChangeHandler: null,

    doCommand: function (aCommandName, aCommandContext) {
        var targetNode   = null;
        var childNodes   = null;
        var siblingElem  = null;
        var position     = null;
        var found        = false;

        dump("Yulup:wysiwygmodeview.js:WYSIWYGMoveContextCommand.doCommand(\"" + aCommandName + "\", \"" + aCommandContext + "\") invoked\n");

        if ("cmd_yulup_moveUp" == aCommandName || "cmd_yulup_moveDown" == aCommandName) {
            targetNode = this.__view.getContextTarget();

            parentNode = targetNode.parentNode;

            if (parentNode) {
                childNodes = parentNode.childNodes;

                switch (aCommandName) {
                    case "cmd_yulup_moveUp":
                        for (position = 0; position < childNodes.length; position++) {
                            if (childNodes.item(position) == targetNode) {
                                found = true;
                                break;
                            } else if (childNodes.item(position).nodeType == Components.interfaces.nsIDOMNode.ELEMENT_NODE) {
                                // store the closest younger sibling element to the current position
                                siblingElem = { node: childNodes.item(position), position: position };
                            }
                        }

                        break;
                    case "cmd_yulup_moveDown":
                        for (position = (childNodes.length - 1); position >= 0; position--) {
                            if (childNodes.item(position) == targetNode) {
                                found = true;
                                break;
                            } else if (childNodes.item(position).nodeType == Components.interfaces.nsIDOMNode.ELEMENT_NODE) {
                                // store the closest older sibling element to the current position
                                siblingElem = { node: childNodes.item(position), position: position };
                            }
                        }

                        break;
                }

                if (found && siblingElem) {
                    // begin transaction
                    this.__view.view.beginTransaction();

                    try {
                        this.__view.view.deleteNode(targetNode);
                        this.__view.view.insertNode(targetNode, parentNode, siblingElem.position);
                    } catch  (exception) {
                        /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:wysiwygmodeview.js:WYSIWYGMoveContextCommand.doCommand", exception);
                        /* DEBUG */ Components.utils.reportError(exception);
                    }

                    // end transaction
                    this.__view.view.endTransaction();

                    // inform observer about state change
                    this.__view.undoRedoObserver.updateCommands();
                }

                aCommandContext.selection.removeAllRanges();
                aCommandContext.selection.selectAllChildren(targetNode);

                this.__selectionChangeHandler.notifySelectionChanged(aCommandContext.document, aCommandContext.selection, null);

                return true;
            }
        }

        return false;
    },

    doCommandParams: function (aCommandName, aParams, aCommandContext) {
        dump("Yulup:wysiwygmodeview.js:WYSIWYGMoveContextCommand.doCommandParams(\"" + aCommandName + "\", \"" + aParams + "\", \"" + aCommandContext + "\") invoked\n");

        return this.doCommand(aCommandName, aCommandContext);
    },

    getCommandStateParams: function (aCommandName, aParams, aCommandContext) {
        dump("Yulup:wysiwygmodeview.js:WYSIWYGMoveContextCommand.getCommandStateParams(\"" + aCommandName + "\", \"" + aParams + "\", \"" + aCommandContext + "\") invoked\n");

        aParams.setBooleanValue("state_enabled", this.isCommandEnabled(aCommandName, aCommandContext));
    },

    isCommandEnabled: function (aCommandName, aCommandContext) {
        var targetNode   = null;
        var childNodes   = null;
        var siblingElem  = null;
        var position     = null;
        var found        = false;

        dump("Yulup:wysiwygmodeview.js:WYSIWYGMoveContextCommand.isCommandEnabled(\"" + aCommandName + "\", \"" + aCommandContext + "\") invoked\n");

        if ("cmd_yulup_moveUp" == aCommandName || "cmd_yulup_moveDown" == aCommandName) {
            targetNode = this.__view.getContextTarget();

            if (targetNode) {
                parentNode = targetNode.parentNode;

                if (parentNode) {
                    childNodes = parentNode.childNodes;

                    switch (aCommandName) {
                        case "cmd_yulup_moveUp":
                            for (position = 0; position < childNodes.length; position++) {
                                if (childNodes.item(position) == targetNode) {
                                    found = true;
                                    break;
                                } else if (childNodes.item(position).nodeType == Components.interfaces.nsIDOMNode.ELEMENT_NODE) {
                                    // store the closest younger sibling element to the current position
                                    siblingElem = { node: childNodes.item(position), position: position };
                                }
                            }

                            break;
                        case "cmd_yulup_moveDown":
                            for (position = (childNodes.length - 1); position >= 0; position--) {
                                if (childNodes.item(position) == targetNode) {
                                    found = true;
                                    break;
                                } else if (childNodes.item(position).nodeType == Components.interfaces.nsIDOMNode.ELEMENT_NODE) {
                                    // store the closest older sibling element to the current position
                                    siblingElem = { node: childNodes.item(position), position: position };
                                }
                            }

                            break;
                    }

                    if (found && siblingElem) {
                        return true;
                    }
                }
            }
        }

        return false;
    }
};


/**
 * WYSIWYGEditAttributesCommand constructor. Instantiates a new object of
 * type WYSIWYGEditAttributesCommand.
 *
 * Implements nsIControllerCommand.
 *
 * @constructor
 */
function WYSIWYGEditAttributesCommand(aView) {
    /* DEBUG */ YulupDebug.ASSERT(aView != null);

    this.__view = aView;
}

WYSIWYGEditAttributesCommand.prototype = {
    __view: null,

    doCommand: function (aCommandName, aCommandContext) {
        var target            = null;
        var allowedAttrs      = null;
        var currentAttrValue  = null;
        var attributeValues   = null;
        var changeAttrTxn     = null;
        var attrNode          = null;

        dump("Yulup:wysiwygmodeview.js:WYSIWYGEditAttributesCommand.doCommand(\"" + aCommandName + "\", \"" + aCommandContext + "\") invoked\n");

        if ("cmd_yulup_editAttributes" == aCommandName || "cmd_yulup_editContextAttributes" == aCommandName) {
            if ("cmd_yulup_editAttributes" == aCommandName) {
                target = this.__view.view.selection.anchorNode;
            } else {
                // use mouse click target node
                target = this.__view.getContextTarget();
            }

            if (target) {
                if (target.nodeType == Components.interfaces.nsIDOMNode.TEXT_NODE) {
                    target = target.parentNode;
                }

                allowedAttrs = this.__view.validator.ElementEditVAL(target).allowedAttributes;

                if (allowedAttrs) {
                    for (var i = 0; i < allowedAttrs.length; i ++) {
                        currentAttrValue = target.getAttributeNS(allowedAttrs.getNamespaceURI(i), allowedAttrs.getName(i));

                        allowedAttrs.getObject(i).currentValue = currentAttrValue;

                        /* DEBUG */ dump("Yulup:wysiwygmodeview.js:WYSIWYGEditAttributesCommand.doCommand: attribute namespace = \"" + allowedAttrs.getNamespaceURI(i) + "\", name = \"" + allowedAttrs.getName(i) + "\", current value = \"" + allowedAttrs.getObject(i).currentValue + "\"\n");
                    }

                    attributeValues = AttributeParamsDialog.showAttributeParamsDialog(allowedAttrs, this.__view.controller, target.localName.toLowerCase());

                    if (attributeValues && attributeValues.length > 0) {
                        /* DEBUG */ dump("Yulup:wysiwygmodeview.js:WYSIWYGEditAttributesCommand.doCommand: attributeValues.length = \"" + (attributeValues ? attributeValues.length : attributeValues) + "\"\n");

                        // begin transaction
                        this.__view.view.beginTransaction();

                        try {
                            for (var i = 0; i < attributeValues.length; i++) {
                                changeAttrTxn = null;
                                attrNode      = target.getAttributeNodeNS(attributeValues[i].attribute.namespaceURI, attributeValues[i].attribute.name);

                                if (attributeValues[i].value) {
                                    // set attribute

                                    if (!attrNode || (attrNode && attrNode.value != attributeValues[i].value)) {
                                        // attribute node does not exist or does not have the desired value
                                        changeAttrTxn = new YulupEditorChangeAttributeNSTransaction(target.ownerDocument, target, attributeValues[i].attribute.namespaceURI, attributeValues[i].attribute.name, attributeValues[i].value, false);
                                    }
                                } else {
                                    // remove attribute

                                    if (attrNode) {
                                        // attribute node indeed exists
                                        changeAttrTxn = new YulupEditorChangeAttributeNSTransaction(target.ownerDocument, target, attributeValues[i].attribute.namespaceURI, attributeValues[i].attribute.name, null, true);
                                    }
                                }

                                if (changeAttrTxn)
                                    this.__view.view.doTransaction(changeAttrTxn);
                            }
                        } catch (exception) {
                            /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:wysiwygmodeview.js:WYSIWYGEditAttributesCommand.doCommand", exception);
                            /* DEBUG */ Components.utils.reportError(exception);
                        }

                        // end transaction
                        this.__view.view.endTransaction();

                        // inform observer about state change
                        this.__view.undoRedoObserver.updateCommands();
                    }

                    return true;
                }
            }
        }

        /* DEBUG */ dump("Yulup:wysiwygmodeview.js:WYSIWYGEditAttributesCommand.doCommand: no attributes available\n");

        return false;
    },

    doCommandParams: function (aCommandName, aParams, aCommandContext) {
        dump("Yulup:wysiwygmodeview.js:WYSIWYGEditAttributesCommand.doCommandParams(\"" + aCommandName + "\", \"" + aParams + "\", \"" + aCommandContext + "\") invoked\n");

        return this.doCommand(aCommandName, aCommandContext);
    },

    getCommandStateParams: function (aCommandName, aParams, aCommandContext) {
        dump("Yulup:wysiwygmodeview.js:WYSIWYGEditAttributesCommand.getCommandStateParams(\"" + aCommandName + "\", \"" + aParams + "\", \"" + aCommandContext + "\") invoked\n");

        aParams.setBooleanValue("state_enabled", this.isCommandEnabled(aCommandName, aCommandContext));
    },

    isCommandEnabled: function (aCommandName, aCommandContext) {
        var target = null;

        dump("Yulup:wysiwygmodeview.js:WYSIWYGEditAttributesCommand.isCommandEnabled(\"" + aCommandName + "\", \"" + aCommandContext + "\") invoked\n");

        if ("cmd_yulup_editAttributes" == aCommandName || "cmd_yulup_editContextAttributes" == aCommandName) {
            if ("cmd_yulup_editAttributes" == aCommandName) {
                target = this.__view.view.selection.anchorNode;
            } else {
                // use mouse click target node
                target = this.__view.getContextTarget();
            }

            if (target) {
                return true;
            }
        }

        return false;
    }
};


function WYSIWYGUpdateSelectionListener(aView, aWidgetCommandList) {
    /* DEBUG */ YulupDebug.ASSERT(aView              != null);
    /* DEBUG */ YulupDebug.ASSERT(aWidgetCommandList != null);

    /* DEBUG */ dump("Yulup:wysiwygmodeview.js:WYSIWYGUpdateSelectionListener() invoked\n");

    this.__view              = aView;
    this.__widgetCommandList = aWidgetCommandList;
    this.__locationPathBox   = document.getElementById("uiYulupEditorPathToolBarPathBox");
    this.__menuPopup         = document.getElementById("uiYulupEditorEditorLocationBarMenu");
}

WYSIWYGUpdateSelectionListener.prototype = {
    __view             : null,
    __widgetCommandList: null,
    __locationPathBox  : null,
    __menuPopup        : null,
    __currentNode      : null,

    notifySelectionChanged: function (aDocument, aSelection, aReason) {
        var elemNameList            = null;
        var currentLocationPathNode = null;
        var elem                    = null;

        /* DEBUG */ dump("Yulup:wysiwygmodeview.js:WYSIWYGUpdateSelectionListener.notifySelectionChanged() invoked\n");

        // check if the selected node actually changed
        if (this.__currentNode != aSelection.anchorNode) {
            this.__currentNode = aSelection.anchorNode;

            elemNameList = this.__view.getNodesToRoot(aSelection);

            WidgetHandler.updateCommandActiveStates(this.__widgetCommandList, elemNameList);

            /* Invariant: currentLocationPathNode always points to a "/" label or null,
             * and a "/" label always has a non-null next sibling. */
            currentLocationPathNode = this.__locationPathBox.firstChild;

            for (var i = elemNameList.length - 1; i >= 0; i--) {
                if (currentLocationPathNode) {
                    if (currentLocationPathNode.nextSibling.locationNode == elemNameList[i].node) {
                        /* DEBUG */ dump("Yulup:wysiwygmodeview.js:WYSIWYGUpdateSelectionListener.notifySelectionChanged: path element \"" + elemNameList[i].name + "\" already exists\n");

                        currentLocationPathNode = currentLocationPathNode.nextSibling.nextSibling;
                    } else {
                        /* DEBUG */ dump("Yulup:wysiwygmodeview.js:WYSIWYGUpdateSelectionListener.notifySelectionChanged: replacing path element \"" + currentLocationPathNode.nextSibling.label + "\" by \"" + elemNameList[i].name + "\"\n");

                        currentLocationPathNode.nextSibling.label        = elemNameList[i].name;
                        currentLocationPathNode.nextSibling.locationNode = elemNameList[i].node;

                        currentLocationPathNode = currentLocationPathNode.nextSibling.nextSibling;
                    }
                } else {
                    /* DEBUG */ dump("Yulup:wysiwygmodeview.js:WYSIWYGUpdateSelectionListener.notifySelectionChanged: creating new path section " + i + " for \"" + elemNameList[i].name + "\"\n");

                    elem = document.createElementNS(XUL_NAMESPACE_URI, "label");
                    elem.setAttribute("value", "/");
                    this.__locationPathBox.appendChild(elem);

                    elem = this.__createPathButton(elemNameList[i].name, elemNameList[i].node);

                    this.__locationPathBox.appendChild(elem);

                    currentLocationPathNode = elem.nextSibling;
                }
            }

            // remove remaining siblings
            if (currentLocationPathNode)
                this.__deleteSelfAndFollowingSiblings(currentLocationPathNode);
        }
    },

    __createPathButton: function (aName, aNode) {
        var button = null;
        var self   = this;

        /* DEBUG */ YulupDebug.ASSERT(aName != null);
        /* DEBUG */ YulupDebug.ASSERT(aNode != null);

        /* DEBUG */ dump("Yulup:wysiwygmodeview.js:WYSIWYGUpdateSelectionListener.__createPathButton() invoked\n");

        button = document.createElementNS(XUL_NAMESPACE_URI, "button");
        button.setAttribute("label", aName);
        // TODO: i18n
        button.setAttribute("tooltiptext", "Click to open menu to modify this element");
        button.locationNode = aNode;
        button.addEventListener("command", function (aEvent) { self.__showContextMenu(aEvent); }, false);

        return button;
    },

    __deleteSelfAndFollowingSiblings: function (aNode) {
        var parentNode = null;

        /* DEBUG */ YulupDebug.ASSERT(aNode != null);

        /* DEBUG */ dump("Yulup:wysiwygmodeview.js:WYSIWYGUpdateSelectionListener.__deleteSelfAndFollowingSiblings() invoked\n");

        parentNode = aNode.parentNode;

        if (parentNode) {
            while (parentNode.lastChild != aNode)
                parentNode.removeChild(parentNode.lastChild);

            parentNode.removeChild(aNode);
        }
    },

    __showContextMenu: function (aEvent) {
        /* DEBUG */ dump("Yulup:wysiwygmodeview.js:WYSIWYGUpdateSelectionListener.__showContextMenu() invoked\n");

        if (aEvent.originalTarget.locationNode) {
            // store the locationNode as contextTarget
            this.__view.setContextTarget(aEvent.originalTarget.locationNode);

            // open the context menu
            this.__menuPopup.showPopup(aEvent.originalTarget, -1, -1, "popup", "bottomleft", "topleft");
        }
    }
};
