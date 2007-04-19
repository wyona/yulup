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

// constants from nsIDocumentEncoder
const NSIDOCENC_OutputSelectionOnly        = (1 << 0);
const NSIDOCENC_OutputFormatted            = (1 << 1);
const NSIDOCENC_OutputRaw                  = (1 << 2);
const NSIDOCENC_OutputBodyOnly             = (1 << 3);
const NSIDOCENC_OutputPreformatted         = (1 << 4);
const NSIDOCENC_OutputWrap                 = (1 << 5);
const NSIDOCENC_OutputFormatFlowed         = (1 << 6);
const NSIDOCENC_OutputAbsoluteLinks        = (1 << 7);
const NSIDOCENC_OutputEncodeW3CEntities    = (1 << 8);
const NSIDOCENC_OutputCRLineBreak          = (1 << 9);
const NSIDOCENC_OutputLFLineBreak          = (1 << 10);
const NSIDOCENC_OutputNoScriptContent      = (1 << 11);
const NSIDOCENC_OutputNoFramesContent      = (1 << 12);
const NSIDOCENC_OutputNoFormattingInPre    = (1 << 13);
const NSIDOCENC_OutputEncodeBasicEntities  = (1 << 14);
const NSIDOCENC_OutputEncodeLatin1Entities = (1 << 15);
const NSIDOCENC_OutputEncodeHTMLEntities   = (1 << 16);

const DEFAULT_NO_OF_TAB_SPACES = 2;

/**
 * SourceModeView constructor. Instantiates a new object of
 * type SourceModeView.
 *
 * Subtype of type View.
 *
 * @constructor
 * @param  {YulupEditStateController} aEditorController the editor's state machine
 * @param  {Model}                    aModel            the model associated with this view
 * @param  {Function}                 aShowViewCommand  a function to call to show the current view
 * @param  {Barrier}                  aBarrier          the barrier on which to synchronise after setUp()
 * @param  {nsIDOMXULElement}         aContextMenuPopup the context menu of this view
 * @return {SourceModeView}
 */
function SourceModeView(aEditorController, aModel, aShowViewCommand, aBarrier, aContextMenuPopup) {
    /* DEBUG */ dump("Yulup:sourcemodeview.js:SourceModeView(\"" + aEditorController + "\", \"" + aModel + "\", \"" + aShowViewCommand + "\", \"" + aBarrier + "\") invoked.\n");

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
    this.editviewElem = document.getElementById("uiYulupEditorTabbox").createView("source", aShowViewCommand, Editor.getStringbundleString("editorTabSourceView.label"), Editor.getStringbundleString("editorTabSourceView.tooltip"), this);

    this.editor = this.editviewElem.getView();

    /* DEBUG */ dump("Yulup:sourcemodeview.js:SourceModeView: this.editor = \"" + this.editor + "\"\n");
}

SourceModeView.prototype = {
    __proto__: View.prototype,

    guidedTagInserter: null,

    /**
     * Initialise the current view.
     *
     * @return {Undefined} does not have a return value
     */
    setUp: function () {
        var sourceEditor  = null;
        var wrapText      = null;
        var keyBinding    = null;
        var useTabSpaces  = null;
        var noOfTabSpaces = null;

        /* DEBUG */ dump("Yulup:sourcemodeview.js:SourceModeView.setUp() invoked\n");

        try {
            /* DEBUG */ dump("Yulup:sourcemodeview.js:SourceModeView.setUp: this = \"" + this + "\"\n");

            sourceEditor = this.editor;
            sourceEditor.makeEditable("text", false);

            this.registerContextMenu(sourceEditor);

            this.view = sourceEditor.getEditor(sourceEditor.contentWindow);
            this.view.QueryInterface(Components.interfaces.nsIEditor);

            // mark as readonly
            this.view.flags |= Components.interfaces.nsIPlaintextEditor.eEditorReadonlyMask;

            // hook up DocumentStateListener
            this.view.addDocumentStateListener(new DocumentStateListener(this.model));

            // hook up EditActionListener
            this.view.addEditActionListener(new EditActionListener(this, this.model));

            // hook up TransactionListener
            //this.view.transactionManager.AddListener(new TransactionListener(this.view));

            this.view.QueryInterface(Components.interfaces.nsIPlaintextEditor);

            // set editor attributes
            this.view.enableUndo(true);
            this.view.rootElement.style.fontFamily = "-moz-fixed";
            this.view.rootElement.style.whiteSpace = "pre";
            this.view.rootElement.style.margin     = 0;

            // wrap to window width
            if ((wrapText = YulupPreferences.getBoolPref("editor.", "wrap")) != null) {
                if (wrapText)
                    this.view.wrapWidth = 0;
            }

            // make the caret visible even if the current selection is not collapsed
            this.view.selectionController.setCaretVisibilityDuringSelection(true);

            // set the document URI
            //sourceEditor.docShell.setCurrentURI(this.model.documentURI);

            // determine tab settings
            if ((useTabSpaces = YulupPreferences.getBoolPref("editor.", "usetabspaces")) == null) {
                useTabSpaces = true;
            }

            if (useTabSpaces) {
                if ((noOfTabSpaces = YulupPreferences.getIntPref("editor.", "tabspaces")) == null) {
                    // use a sane default
                    noOfTabSpaces = DEFAULT_NO_OF_TAB_SPACES;
                }
            }

            sourceEditor.contentWindow.addEventListener("keypress", new CommandKeyListener(), true);

            sourceEditor.contentWindow.addEventListener("keypress", new TextEditorKeyListener(this.view, useTabSpaces, noOfTabSpaces), true);
            sourceEditor.contentWindow.addEventListener("keypress", new GuidedTagInserterKeyListener(this), true);

            if ((keyBinding = YulupPreferences.getCharPref("editor.", "keybinding")) != null) {
                switch (keyBinding) {
                    case "readline":
                        sourceEditor.contentWindow.addEventListener("keypress", new ReadlineKeyBindingsListener(sourceEditor), true);
                        break;
                    case "none":
                    default:
                }
            } else {
                // default to readline
                sourceEditor.contentWindow.addEventListener("keypress", new ReadlineKeyBindingsListener(sourceEditor), true);
            }

            /* Prevent keypress events from bubbling to work around
             * bug https://bugzilla.mozilla.org/show_bug.cgi?id=304188
             * (prevent keypress events from invoking FAYT). */
            sourceEditor.contentWindow.addEventListener("keypress", function (aKeyEvent) {
                                                            aKeyEvent.stopPropagation();
                                                        }, true);

            // activate guided tag insertion
            this.guidedTagInserter = new GuidedTagInserter(this, document, document.getElementById("uiYulupEditorPromptBox"));

            // hook up selection listener
            this.addSelectionListener(new CutCopySelectionListener(this));

            // clear undo and redo stacks
            this.view.transactionManager.clear();

            // hook up undo/redo observer
            sourceEditor.commandManager.addCommandObserver(this.undoRedoObserver, "cmd_undo");
            sourceEditor.commandManager.addCommandObserver(this.undoRedoObserver, "cmd_redo");

            /* DEBUG */ dump("Yulup:sourcemodeview.js:SourceModeView.setUp: initialisation completed\n");
        } catch (exception) {
            /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:sourcemodeview.js:SourceModeView.setUp", exception);
            Components.utils.reportError(exception);
            return;
        }

        /* DEBUG */ dump("%%%%%%%%%%%%%%% Yulup::sourcemodeview.js:SourceModeView.setUp: arrive at view barrier (current thread count is \"" + this.barrier.noOfThreads + "\")\n");
        this.barrier.arrive();
    },

    /**
     * Serialise the content of the current view to a string.
     *
     * @return {String} current content of this view
     */
    contentToString: function () {
        /* DEBUG */ dump("Yulup:sourcemodeview.js:SourceModeView.contentToString() invoked\n");

        /* Flags according to nsIDocumentEncoder (nsIPlaintextEditor uses
         * nsDocumentEncoder to serialise its content). */
        return this.view.outputToString("text/plain", (NSIDOCENC_OutputFormatted |
                                                       NSIDOCENC_OutputNoScriptContent |
                                                       NSIDOCENC_OutputNoFramesContent));
    },

    /**
     * Fill this view with content from the associated model.
     *
     * @return {Boolean} returns true if successful, false otherwise
     */
    fillView: function () {
        var retVal = false;

        /* DEBUG */ dump("Yulup:sourcemodeview.js:SourceModeView.fillView() invoked\n");

        var viewScrollBoxObject = null;

        //this.model.preserveDirty(true);
        this.model.preserveDirty = true;

        // fill source mode view
        try {
            /* What about using this.editor.contentDocument.innerHTML = content, see
             * also https://bugzilla.mozilla.org/show_bug.cgi?id=314987#c2 */
            this.view.selectAll();
            this.view.deleteSelection(0);
            this.view.beginningOfDocument();
            this.view.flags &= ~Components.interfaces.nsIPlaintextEditor.eEditorReadonlyMask;
            this.view.insertText(this.model.getDocument());
            this.view.flags |= Components.interfaces.nsIPlaintextEditor.eEditorReadonlyMask;
            this.view.beginningOfDocument();

            // print document to console
            ///* DEBUG */ dumpTree(this.controller.activeView.editor);

            // scroll to the beginning of the document
            this.editor.contentWindow.scrollTo(0, 0);

            // view is now pristine again
            this.view.resetModificationCount();

            // clear undo and redo stacks
            this.view.transactionManager.clear();

            // indicate that this view has content now
            this.isFilled = true;

            retVal = true;
        } catch (exception) {
            // cannot handle document content type
            /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:sourcemodeview.js:SourceModeView.fillView", exception);
            Components.utils.reportError(exception);

            retVal = false;
        }

        //this.model.preserveDirty(false);
        this.model.preserveDirty = false;

        return retVal;
    },

    handleEvent: function (aEvent) {
        /* DEBUG */ dump("Yulup:sourcemodeview.js:SourceModeView.handleEvent(\"" + aEvent + "\") invoked\n");
        /* DEBUG */ dump("Yulup:sourcemodeview.js:SourceModeView.handleEvent: event type = \"" + aEvent.type + "\", event target = \"" + aEvent.target + "\", event target name = \"" + aEvent.target.tagName + "\"\n");
        /* DEBUG */ dump("Yulup:sourcemodeview.js:SourceModeView.handleEvent: this.editviewElem = \"" + this.editviewElem + "\", this.editviewElem.tagName = \"" + this.editviewElem.tagName + "\"\n");

        if (aEvent.target == this.editviewElem) {
            // our editor is initialised
            aEvent.stopPropagation();
            this.setUp();
        }
    },

    enterView: function () {
        /* DEBUG */ dump("Yulup:sourcemodeview.js:SourceModeView.enterView() invoked\n");

        this.editviewElem.toggleDisplayBlur(this.setReadWrite, this);
    },

    leaveView: function () {
        /* DEBUG */ dump("Yulup:sourcemodeview.js:SourceModeView.leaveView() invoked\n");

        // mark editor readonly
        this.view.flags |= Components.interfaces.nsIPlaintextEditor.eEditorReadonlyMask;

        this.editviewElem.toggleDisplayBlur();
    },

    setReadWrite: function () {
        // mark editor writable
        this.view.flags &= ~Components.interfaces.nsIPlaintextEditor.eEditorReadonlyMask;

        this.editor.contentWindow.focus();
    },

    addSelectionListener: function (aSelectionListener) {
        var retval = false;

        /* DEBUG */ dump("Yulup:sourcemodeview.js:SourceModeView.addSelectionListener() invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aSelectionListener != null);

        try {
            this.editor.contentWindow.getSelection().QueryInterface(Components.interfaces.nsISelectionPrivate).addSelectionListener(aSelectionListener);

            retval = true;
        } catch (exception) {
            /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:sourcemodeview.js:SourceModeView.addSelectionListener", exception);
            Components.utils.reportError(exception);
        }

        return retval;
    },

    removeSelectionListener: function (aSelectionListener) {
        /* DEBUG */ dump("Yulup:sourcemodeview.js:SourceModeView.removeSelectionListener() invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aSelectionListener != null);

        try {
            this.editor.contentWindow.getSelection().QueryInterface(Components.interfaces.nsISelectionPrivate).removeSelectionListener(aSelectionListener);
        } catch (exception) {
            /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:sourcemodeview.js:SourceModeView.removeSelectionListener", exception);
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

        /* DEBUG */ dump("Yulup:sourcemodeview.js:SourceModeView.doInsertCommand() invoked\n");

        fragmentData = this.xmlSerializer.serializeToString(aFragment);

        this.view.insertText(fragmentData);
    },

    doSurroundCommand: function (aCommand, aFragment) {
        var collapsed    = null;
        var fragmentData = null;
        var nodeName     = null;
        var prefixName   = null;
        var tagLength    = null;

        /* DEBUG */ YulupDebug.ASSERT(aCommand  != null);
        /* DEBUG */ YulupDebug.ASSERT(aFragment != null);

        /* DEBUG */ dump("Yulup:sourcemodeview.js:SourceModeView.doSurroundCommand() invoked\n");

        collapsed = this.view.selection.isCollapsed;

        aFragment.firstChild.appendChild(aFragment.createTextNode(this.view.selection));

        /* Don't use @mozilla.org/xmlextras/xmlserializer;1 here because we
         * don't want the tags contained on the text node to be escaped. */
        fragmentData = (new WYSIWYGDOMSerialiser(aFragment, false, true)).serialiseXML();
        this.view.insertText(fragmentData);

        // move selection to the middle of the inserted element tuple
        if (collapsed && aFragment.documentElement) {
            nodeName   = aFragment.documentElement.nodeName;
            prefixName = aFragment.documentElement.prefix;

            tagLength = 3;

            if (prefixName && prefixName != "") {
                tagLength += prefixName.length + 1;
            }

            tagLength += nodeName.length;

            for (var i = 0; i < tagLength; i++)
                this.view.selectionController.characterMove(false, false);
        }
    },

    isUnsurround: function (aFragment) {
        return false;
    }
};
