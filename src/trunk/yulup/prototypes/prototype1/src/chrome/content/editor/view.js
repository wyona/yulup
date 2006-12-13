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
 * @author Thomas Comiotto
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

// URIs for the source-tagger and ID-copier XSLT stylesheets
const SOURCETAGGER_CHROME_URI = "chrome://yulup/content/editor/sourcetagger.xsl";

const XUL_NAMESPACE_URI   = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
const XSL_NAMESPACE_URI   = "http://www.w3.org/1999/XSL/Transform";
const YULUP_NAMESPACE_URI = "http://www.yulup.org/Editor/LocationPath";

const DEFAULT_NO_OF_TAB_SPACES = 2;

/**
 * View constructor. Instantiates a new object of
 * type View.
 *
 * @constructor
 * @param  {YulupEditStateController} aEditorController the editor's state machine
 * @param  {Model}                    aModel            the model associated with this view
 * @param  {Barrier}                  aBarrier          the barrier on which to synchronise after setUp()
 * @return {View}
 */
function View(aEditorController, aModel, aBarrier) {
    /* DEBUG */ dump("Yulup:view.js:View(\"" + aEditorController + "\, \"" + aModel + "\", \"" + aBarrier + "\") invoked.\n");

    /* DEBUG */ YulupDebug.ASSERT(aEditorController != null);
    /* DEBUG */ YulupDebug.ASSERT(aModel            != null);
    /* DEBUG */ YulupDebug.ASSERT(aBarrier          != null);

    // public static methods

    /**
     * DocumentStateListener constructor. Instantiates a new object of
     * type DocumentStateListener.
     *
     * Note that this type implements the nsIDocumentStateListener
     * interface.
     *
     * @constructor
     * @param  {Model}                 aModel the model associated with this view
     * @return {DocumentStateListener}
     */
    this.constructor.DocumentStateListener = function (aModel) {
        /* DEBUG */ YulupDebug.ASSERT(aModel != null);

        this.model = aModel;
    };

    this.constructor.DocumentStateListener.prototype = {
        model: null,

        NotifyDocumentCreated:         function () {},
        NotifyDocumentWillBeDestroyed: function () {},

        /**
         * Informs the model about changes of the document state.
         *
         * @param  {Boolean}   aDocumentChanged if true, the document was modified,
         *                                      if false, the documents state was changed to pristine
         * @return {Undefined} does not have a return value
         */
        NotifyDocumentStateChanged: function (aDocumentChanged) {
            /* DEBUG */ dump("Yulup:view.js:DocumentStateListener.NotifyDocumentStateChanged(" + aDocumentChanged + ") invoked.\n");

            if (aDocumentChanged) {
                //this.editorController.editStateController.modelStateChanged("modified");
                this.model.setDirty();
            } else {
                //this.editorController.editStateController.modelStateChanged("saved");
            }
        }
    };

    /**
     * EditorObserver constructor. Instantiates a new object of
     * type EditorObserver.
     *
     * Note that this type implements the nsIEditorObserver
     * interface.
     *
     * DO NOT hook up such a listener unless bug
     * https://bugzilla.mozilla.org/show_bug.cgi?id=278677 gets
     * fixed (browser crashes with sig EXC_BAD_ACCESS). (Fixed
     * in 1.9, i.e. goes into FF3.)
     *
     * @constructor
     * @return {EditorObserver}
     */
    this.constructor.EditorObserver = function () {

    };

    this.constructor.EditorObserver.prototype = {
        EditAction: function () {
            /* DEBUG */ dump("Yulup:view.js:EditorObserver.EditAction() invoked.\n");
        }
    };


    /**
     * EditActionListener constructor. Instantiates a new object of
     * type EditActionListener.
     *
     * Note that this type implements the nsIEditActionListener
     * interface.
     *
     * @constructor
     * @param  {View}               aView  the associated view
     * @param  {Model}              aModel the model
     * @return {EditActionListener}
     */
    this.constructor.EditActionListener = function (aView, aModel) {
        /* DEBUG */ dump("Yulup:view.js:View.EditActionListener(\"" + aView + "\", \"" + aModel + "\") invoked.\n");

        this.view  = aView;
        this.model = aModel;
    };

    this.constructor.EditActionListener.prototype = {
        view : null,
        model: null,

        WillCreateNode: function (aTag, aParent, aPosition) {
            /* DEBUG */ dump("Yulup:view.js:View.EditActionListener.WillCreateNode: tag = \"" + aTag + "\", parent = \"" + aParent.nodeName + "\", position = \"" + aPosition + "\"\n");
        },

        DidCreateNode: function (aTag, aNode, aParent, aPosition, aResult) {
            /* DEBUG */ dump("Yulup:view.js:View.EditActionListener.DidCreateNode:  tag = \"" + aTag + "\", parent = \"" + aParent.nodeName + "\", position = \"" + aPosition + "\", result = \"" + aResult + "\"\n");

            this.view.undoRedoObserver.updateCommands();
            this.model.setDirty();
        },

        WillInsertNode: function (aNode, aParent, aPosition) {
            /* DEBUG */ dump("Yulup:view.js:View.EditActionListener.WillInsertNode: node = \"" + aNode.nodeName + "\", parent = \"" + aParent.nodeName + "\", position = \"" + aPosition + "\"\n");
        },

        DidInsertNode: function (aNode, aParent, aPosition, aResult) {
            /* DEBUG */ dump("Yulup:view.js:View.EditActionListener.DidInsertNode:  node = \"" + aNode.nodeName + "\", parent = \"" + aParent.nodeName + "\", position = \"" + aPosition + "\", result = \"" + aResult + "\"\n");

            this.view.undoRedoObserver.updateCommands();
            this.model.setDirty();
        },

        WillDeleteNode: function (aChild) {
            /* DEBUG */ dump("Yulup:view.js:View.EditActionListener.WillDeleteNode: child = \"" + aChild.nodeName + "\"\n");
        },

        DidDeleteNode: function (aChild, aResult) {
            /* DEBUG */ dump("Yulup:view.js:View.EditActionListener.DidDeleteNode:  child = \"" + aChild.nodeName + "\", result = \"" + aResult + "\"\n");

            this.view.undoRedoObserver.updateCommands();
            this.model.setDirty();
        },

        WillSplitNode: function (aExistingRightNode, aOffset) {
            /* DEBUG */ dump("Yulup:view.js:View.EditActionListener.WillSplitNode:  right node = \"" + aExistingRightNode.nodeName + "\", offset = \"" + aOffset + "\"\n");
        },

        DidSplitNode: function (aExistingRightNode, aOffset, aNewLeftNode, aResult) {
            /* DEBUG */ dump("Yulup:view.js:View.EditActionListener.DidSplitNode:   right node = \"" + aExistingRightNode.nodeName + "\", offset = \"" + aOffset + "\", new left node = \"" + aNewLeftNode.nodeName + "\", result = \"" + aResult + "\"\n");

            this.view.undoRedoObserver.updateCommands();
            this.model.setDirty();
        },

        WillJoinNodes: function (aLeftNode, aRightNode, aParent) {
            /* DEBUG */ dump("Yulup:view.js:View.EditActionListener.WillJoinNodes:  left node = \"" + aLeftNode.nodeName + "\", right node = \"" + aRightNode.nodeName + "\", parent node = \"" + aParent.nodeName + "\"\n");
        },

        DidJoinNodes: function (aLeftNode, aRightNode, aParent, aResult) {
            /* DEBUG */ dump("Yulup:view.js:View.EditActionListener.DidJoinNodes:   left node = \"" + aLeftNode.nodeName + "\", right node = \"" + aRightNode.nodeName + "\", parent node = \"" + aParent.nodeName + "\", result = \"" + aResult + "\"\n");

            this.view.undoRedoObserver.updateCommands();
            this.model.setDirty();
        },

        WillInsertText: function (aTextNode, aOffset, aString) {
            /* DEBUG */ dump("Yulup:view.js:View.EditActionListener.WillInsertText: text node = \"" + aTextNode.nodeName + "\", offset = \"" + aOffset + "\", string = \"" + aString + "\"\n");
        },

        DidInsertText: function (aTextNode, aOffset, aString, aResult) {
            /* DEBUG */ dump("Yulup:view.js:View.EditActionListener.DidInsertText: text node = \"" + aTextNode.nodeName + "\", offset = \"" + aOffset + "\", string = \"" + aString + "\", result = \"" + aResult + "\"\n");

            this.view.undoRedoObserver.updateCommands();
            this.model.setDirty();
        },

        WillDeleteText: function (aTextNode, aOffset, aLength) {
            /* DEBUG */ dump("Yulup:view.js:View.EditActionListener.WillDeleteText: text node = \"" + aTextNode.nodeName + "\", offset = \"" + aOffset + "\", length = \"" + aLength + "\"\n");
        },

        DidDeleteText: function (aTextNode, aOffset, aLength, aResult) {
            /* DEBUG */ dump("Yulup:view.js:View.EditActionListener.DidDeleteText: text node = \"" + aTextNode.nodeName + "\", offset = \"" + aOffset + "\", length = \"" + aLength + "\", result = \"" + aResult + "\"\n");

            this.view.undoRedoObserver.updateCommands();
            this.model.setDirty();
        },

        WillDeleteSelection: function (aSelection) {
            /* DEBUG */ dump("Yulup:view.js:View.EditActionListener.WillDeleteSelection:  selection = \"" + aSelection + "\"\n");
        },

        DidDeleteSelection: function (aSelection) {
            /* DEBUG */ dump("Yulup:view.js:View.EditActionListener.DidDeleteSelection:  selection = \"" + aSelection + "\"\n");

            this.view.undoRedoObserver.updateCommands();
            this.model.setDirty();
        }
    };

    /**
     * TransactionListener constructor. Instantiates a new object of
     * type TransactionListener.
     *
     * Note that this type implements the nsITransactionListener
     * interface.
     *
     * @constructor
     * @param  {nsIEditor}           aEditor the editor which should be acted upon
     * @return {TransactionListener}
     */
    this.constructor.TransactionListener = function (aEditor) {
        /* DEBUG */ YulupDebug.ASSERT(aEditor != null);

        this.__editor = aEditor;
    };

    this.constructor.TransactionListener.prototype = {
        __editor: null,

        /**
         * Called after a new transaction batch starts.
         *
         * @param  {nsITransactionManager} aManager the transaction manager that began the batch
         * @param  {nsresult}              aResult  the nsresult returned after beginning a batch
         * @return {Undefined} does not have a return value
         */
        didBeginBatch: function (aManager, aResult) {
            return;
        },

        /**
         * Called after the transaction manager calls the
         * doTransaction() method of a transaction.
         *
         * @param  {nsITransactionManager} aManager     the transaction manager that did the transaction
         * @param  {nsITransaction}        aTransaction the transaction that was executed
         * @param  {nsresult}              aResult      the nsresult returned after executing the transaction
         * @return {Undefined} does not have a return value
         */
        didDo: function (aManager, aTransaction, aResult) {
            return;
        },

        /**
         * Called after the transaction manager ends a batch.
         *
         * @param  {nsITransactionManager} aManager the transaction manager ending a batch
         * @param  {nsresult}              aResult  the nsresult returned after ending a batch
         * @return {Undefined} does not have a return value
         */
        didEndBatch: function (aManager, aResult) {
            return;
        },

        /**
         * Called after the transaction manager tries to merge a transaction,
         * that was just executed, with the transaction at the top of the undo
         * stack.
         *
         * @param  {nsITransactionManager} aManager            the transaction manager ending a batch
         * @param  {nsITransaction}        aTopTransaction     the transaction at the top of the undo stack
         * @param  {nsITransaction}        aTransactionToMerge the transaction to merge
         * @param  {Boolean}               aDidMerge           true if transaction was merged, else false
         * @param  {nsresult}              aResult             the nsresult returned after the merge attempt
         * @return {Undefined} does not have a return value
         */
        didMerge: function (aManager, aTopTransaction, aTransactionToMerge, aDidMerge, aResult) {
            return;
        },

        /**
         * Called after the transaction manager calls the Redo()
         * method of a transaction.
         *
         * @param  {nsITransactionManager} aManager     the transaction manager redoing the transaction
         * @param  {nsITransaction}        aTransaction the transaction being redone
         * @param  {nsresult}              aResult      the nsresult returned after redoing the transaction
         * @return {Undefined} does not have a return value
         */
        didRedo: function (aManager, aTransaction, aResult) {
            /* DEBUG */ dump("Yulup:view.js:View.TransactionListener.didRedo() invoked\n");

            // scroll to current caret position
            this.__editor.selectionController.scrollSelectionIntoView(Components.interfaces.nsISelectionController.SELECTION_NORMAL,
                                                                      Components.interfaces.nsISelectionController.SELECTION_FOCUS_REGION,
                                                                      false);
        },

        /**
         * Called after the transaction manager calls the Undo()
         * method of a transaction.
         *
         * @param  {nsITransactionManager} aManager     the transaction manager undoing the transaction
         * @param  {nsITransaction}        aTransaction the transaction being undone
         * @param  {nsresult}              aResult      the nsresult returned after undoing the transaction
         * @return {Undefined} does not have a return value
         */
        didUndo: function (aManager, aTransaction, aResult) {
            /* DEBUG */ dump("Yulup:view.js:View.TransactionListener.didUndo() invoked\n");

            // scroll to current caret position
            this.__editor.selectionController.scrollSelectionIntoView(Components.interfaces.nsISelectionController.SELECTION_NORMAL,
                                                                      Components.interfaces.nsISelectionController.SELECTION_FOCUS_REGION,
                                                                      false);
        },

        /**
         * Called before the transaction manager begins a batch.
         *
         * @param  {nsITransactionManager} aManager the transaction manager beginning the batch
         * @return {Undefined} does not have a return value
         */
        willBeginBatch: function (aManager) {
            return;
        },

        /**
         * Called before the transaction manager calls a transaction's
         * doTransaction() method.
         *
         * @param  {nsITransactionManager} aManager      the transaction manager doing the transaction
         * @param  {nsITransaction}        aTransaction  the transaction being executed
         * @return {Undefined} does not have a return value
         */
        willDo: function (aManager, aTransaction) {
            return;
        },

        /**
         * Called before the transaction manager ends a batch.
         *
         * @param  {nsITransactionManager} aManager the transaction manager ending the batch
         * @return {Undefined} does not have a return value
         */
        willEndBatch: function (aManager) {
            return;
        },

        /**
         * Called before the transaction manager tries to merge a transaction,
         * that was just executed, with the transaction at the top of the
         * undo stack.
         *
         * @param  {nsITransactionManager} aManager            the transaction manager ending a batch
         * @param  {nsITransaction}        aTopTransaction     the transaction at the top of the undo stack
         * @param  {nsITransaction}        aTransactionToMerge the transaction to merge
         * @return {Undefined} does not have a return value
         */
        willMerge: function (aManager, aTopTransaction, aTransactionToMerge) {
            return;
        },

        /**
         * Called before the transaction manager calls the Redo() method
         * of a transaction.
         *
         * @param  {nsITransactionManager} aManager      the transaction manager redoing the transaction
         * @param  {nsITransaction}        aTransaction  the transaction being redone
         * @return {Undefined} does not have a return value
         */
        willRedo: function (aManager, aTransaction) {
            return;
        },

        /**
         * Called before the transaction manager calls the Undo() method of
         * a transaction
         *
         * @param  {nsITransactionManager} aManager      the transaction manager undoing the transaction
         * @param  {nsITransaction}        aTransaction  the transaction being undone
         * @return {Undefined} does not have a return value
         */
        willUndo: function (aManager, aTransaction) {
            return;
        }
    };


    this.controller   = aEditorController;
    this.model        = aModel;
    this.barrier      = aBarrier;
    this.editor       = null;
    this.editviewElem = null;
    this.view         = null;
    this.isFilled     = false;

    // instantiate undo/redo and cut/copy observers
    this.undoRedoObserver = new UndoRedoObserver();
    this.cutCopyObserver  = new CutCopyObserver();

    this.commandUpdaters = [ this.undoRedoObserver, this.cutCopyObserver ];
}

View.prototype.controller       = null;
View.prototype.model            = null;
View.commandUpdaters            = null;
View.prototype.undoRedoObserver = null;
View.prototype.cutCopyObserver  = null;
View.prototype.uriRewriter      = null;

/**
 * Show this view.
 *
 * Synchronises the active view with the model, and then
 * fills this view with the document. If this view is already
 * the active view, nothing is done.
 *
 * @return {Undefined} does not have a return value
 */
View.prototype.show = function () {
    var isViewModified   = true;
    var switchSuccessful = false;

    /* DEBUG */ dump("Yulup:view.js:View.show() invoked\n");

    // check if EditorController is initialised
    if (this.controller) {
        /* Check if the user just clicked on the already active tab. If the
         * user clicked on the same tab, we have nothing to do. */
        if (this.controller.activeView !== this) {
            /* Check if we switched views or if we are showing for the first time.
             * If we switched views, this.controller.activeView is initialised. If
             * we are just booting up the editor, no other view has yet been shown,
             * and this.controller.activeView is null. */
            if (this.controller.activeView) {
                /* DEBUG */ dumpTree(this.controller.activeView.editor);

                /* Check if the previous view was modified. If this is the case,
                 * we have to copy it over to the active view later. */
                isViewModified = this.controller.activeView.view.documentModified;

                /* We indeed switched tabs, therefore we have
                 * to synchronise the other view first. */
                this.controller.activeView.syncToModel();

                this.controller.activeView.leaveView();
            }

            // set currently selected view
            previousView = this.controller.activeView;

            this.controller.activeView = this;

            /* If the model was modified or we are hitting the fill
             * for the first time (i.e. we haven't yet filled the view
             * with a document), then fill the view. */
            if (isViewModified || !this.isFilled) {
                // fill view
                for (var i = 0; i < this.commandUpdaters.length; i++) {
                    this.commandUpdaters[i].deactivate();
                    this.commandUpdaters[i].disableCommands();
                }

                this.fillView();

                for (var i = 0; i < this.commandUpdaters.length; i++) {
                    this.commandUpdaters[i].activate();
                }
            }

            for (var i = 0; i < this.commandUpdaters.length; i++) {
                this.commandUpdaters[i].updateCommands();
            }

            this.enterView();

            switchSuccessful = true;
        }
    }

    return switchSuccessful;
};

/**
 * Synchronises this view with the model.
 *
 * If aNoReset is set to true, then the modification
 * count of this view is not reset.
 *
 * Note that you should use setToModel() instead if you
 * want to sync the active view before saving the current
 * document.
 *
 * @param  {Boolean}    aNoReset if true, reset the modification count
 * @return {Undefined} does not have a return value
 */
View.prototype.syncToModel = function (aNoReset) {
    /* DEBUG */ dump("Yulup:view.js:View.syncToModel() invoked\n");

    // documentModified is a readonly attribute of nsIEditor
    if (this.view.documentModified) {
        try {
            this.model.setDocument(this.contentToString());

            if (!aNoReset) {
                // we've synced to the model, therefore view is now pristine again
                this.view.resetModificationCount();
            }
        } catch (exception) {
            /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:view.js:View.syncToModel", exception);
            Components.utils.reportError(exception);
        }
    } else {
        /* DEBUG */ dump("Yulup:view.js:View.syncToModel: not syncing (document not modified)\n");
    }
};

/**
 * Synchronises this view with the model, but do not
 * reset the modification count.
 *
 * Use this method instead of syncToModel() when saving
 * the current document.
 *
 * @return {Undefined} does not have a return value
 */
View.prototype.setToModel = function() {
    /* DEBUG */ dump("Yulup:view.js:View.setToModel() invoked\n");

    this.syncToModel(true);
};


/**
 * Perform view specific actions on view show.
 *
 * @return {Undefined} does not have a return value
 */
View.prototype.enterView = function() {
    /* DEBUG */ dump("Yulup:view.js:View.enterView() invoked\n");
};


/**
 * Perform view specific actions on view leave.
 *
 * @return {Undefined} does not have a return value
 */
View.prototype.leaveView = function() {
    /* DEBUG */ dump("Yulup:view.js:View.leaveView() invoked\n");
};


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
 * @return {SourceModeView}
 */
function SourceModeView(aEditorController, aModel, aShowViewCommand, aBarrier) {
    /* DEBUG */ dump("Yulup:view.js:SourceModeView(\"" + aEditorController + "\", \"" + aModel + "\", \"" + aShowViewCommand + "\", \"" + aBarrier + "\") invoked.\n");

    /* DEBUG */ YulupDebug.ASSERT(aEditorController != null);
    /* DEBUG */ YulupDebug.ASSERT(aModel            != null);
    /* DEBUG */ YulupDebug.ASSERT(aShowViewCommand  != null);
    /* DEBUG */ YulupDebug.ASSERT(aBarrier          != null);

    // call super constructor
    this.__proto__.__proto__.constructor.call(this, aEditorController, aModel, aBarrier);

    // register ourselves as an onload listener to get notified when the editor element is initialised
    document.addEventListener("editorinit", this, false);

    // request an editor element
    this.editviewElem = document.getElementById("uiYulupEditorTabbox").createView("source", aShowViewCommand, Editor.getStringbundleString("editorTabSourceView.label"), Editor.getStringbundleString("editorTabSourceView.tooltip"), this);

    this.editor = this.editviewElem.getView();

    /* DEBUG */ dump("Yulup:view.js:SourceModeView: this.editor = \"" + this.editor + "\"\n");
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

        /* DEBUG */ dump("Yulup:view.js:SourceModeView.setUp() invoked\n");

        try {
            /* DEBUG */ dump("Yulup:view.js:SourceModeView.setUp: this = \"" + this + "\"\n");

            sourceEditor = this.editor;
            sourceEditor.makeEditable("text", false);

            this.view = sourceEditor.getEditor(sourceEditor.contentWindow);
            this.view.QueryInterface(Components.interfaces.nsIEditor);

            // hook up DocumentStateListener
            this.view.addDocumentStateListener(new View.DocumentStateListener(this.model));

            // hook up EditActionListener
            this.view.addEditActionListener(new View.EditActionListener(this, this.model));

            // hook up TransactionListener
            //this.view.transactionManager.AddListener(new View.TransactionListener(this.view));

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
            sourceEditor.contentWindow.getSelection().QueryInterface(Components.interfaces.nsISelectionPrivate).addSelectionListener(new CutCopySelectionListener(this));

            // clear undo and redo stacks
            this.view.transactionManager.clear();

            // hook up undo/redo observer
            sourceEditor.commandManager.addCommandObserver(this.undoRedoObserver, "cmd_undo");
            sourceEditor.commandManager.addCommandObserver(this.undoRedoObserver, "cmd_redo");

            /* DEBUG */ dump("Yulup:view.js:SourceModeView.setUp: initialisation completed\n");
        } catch (exception) {
            /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:view.js:SourceModeView.setUp", exception);
            Components.utils.reportError(exception);
            return;
        }

        /* DEBUG */ dump("%%%%%%%%%%%%%%% Yulup::view.js:SourceModeView.setUp: arrive at view barrier (current thread count is \"" + this.barrier.noOfThreads + "\")\n");
        this.barrier.arrive();
    },

    /**
     * Serialise the content of the current view to a string.
     *
     * @return {String} current content of this view
     */
    contentToString: function () {
        /* DEBUG */ dump("Yulup:view.js:SourceModeView.contentToString() invoked\n");

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

        /* DEBUG */ dump("Yulup:view.js:SourceModeView.fillView() invoked\n");

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
            this.view.insertText(this.model.getDocument());
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
            /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:view.js:SourceModeView.fillView", exception);
            Components.utils.reportError(exception);

            retVal = false;
        }

        //this.model.preserveDirty(false);
        this.model.preserveDirty = false;

        return retVal;
    },

    handleEvent: function (aEvent) {
        /* DEBUG */ dump("Yulup:view.js:SourceModeView.handleEvent(\"" + aEvent + "\") invoked\n");
        /* DEBUG */ dump("Yulup:view.js:SourceModeView.handleEvent: event type = \"" + aEvent.type + "\", event target = \"" + aEvent.target + "\", event target name = \"" + aEvent.target.tagName + "\"\n");
        /* DEBUG */ dump("Yulup:view.js:SourceModeView.handleEvent: this.editviewElem = \"" + this.editviewElem + "\", this.editviewElem.tagName = \"" + this.editviewElem.tagName + "\"\n");

        if (aEvent.target == this.editviewElem) {
            // our editor is initialised
            aEvent.stopPropagation();
            this.setUp();
        }
    }
};


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
 * @return {WYSIWYGModeView}
 */
function WYSIWYGModeView(aEditorController, aModel, aShowViewCommand, aBarrier) {
    /* DEBUG */ dump("Yulup:view.js:WYSIWYGModeView(\"" + aEditorController + "\", \"" + aModel + "\", \"" + aShowViewCommand + "\", \"" + aBarrier + "\") invoked.\n");

    /* DEBUG */ YulupDebug.ASSERT(aEditorController != null);
    /* DEBUG */ YulupDebug.ASSERT(aModel            != null);
    /* DEBUG */ YulupDebug.ASSERT(aShowViewCommand  != null);
    /* DEBUG */ YulupDebug.ASSERT(aBarrier          != null);

    // call super constructor
    this.__proto__.__proto__.constructor.call(this, aEditorController, aModel, aBarrier);

    // register ourselves as an onload listener to get notified when the editor element is initialised
    document.addEventListener("editorinit", this, false);

    // request an editor element
    this.editviewElem = document.getElementById("uiYulupEditorTabbox").createView("wysiwyg", aShowViewCommand, Editor.getStringbundleString("editorTabWYSIWYGView.label"), Editor.getStringbundleString("editorTabWYSIWYGView.tooltip"), this);

    this.editor = this.editviewElem.getView();

    this.uriRewriter = new URIRewriter(this);

    /* DEBUG */ dump("Yulup:view.js:WYSIWYGModeView: this.editor = \"" + this.editor + "\"\n");
}

WYSIWYGModeView.prototype = {
    __proto__: View.prototype,

    documentPreamble: null,

    /**
     * Initialise the current view.
     *
     * Note that nsIHTMLEditor is also an nsIPlaintextEditor.
     *
     * @return {Undefined} does not have a return value
     */
    setUp: function () {
        var wysiwygEditor = null;
        var keyBinding    = null;

        /* DEBUG */ dump("Yulup:view.js:WYSIWYGModeView.setUp() invoked\n");

        try {
            /* DEBUG */ dump("Yulup:view.js:WYSIWYGModeView.setUp: this.editor = \"" + this.editor + "\"\n");
            wysiwygEditor = this.editor;
            wysiwygEditor.makeEditable("html", false);

            this.view = wysiwygEditor.getEditor(wysiwygEditor.contentWindow);
            this.view.QueryInterface(Components.interfaces.nsIEditor);

            // hook up DocumentStateListener
            this.view.addDocumentStateListener(new View.DocumentStateListener(this.model));

            // hook up EditActionListener
            this.view.addEditActionListener(new View.EditActionListener(this, this.model));

            this.view.QueryInterface(Components.interfaces.nsIHTMLEditor);

            // set editor attributes
            this.view.enableUndo(true);
            this.view.returnInParagraphCreatesNewParagraph = true;

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

            // hook up selection listener
            wysiwygEditor.contentWindow.getSelection().QueryInterface(Components.interfaces.nsISelectionPrivate).addSelectionListener(new CutCopySelectionListener(this));

            // clear undo and redo stacks
            this.view.transactionManager.clear();

            // hook up undo/redo observer
            wysiwygEditor.commandManager.addCommandObserver(this.undoRedoObserver, "cmd_undo");
            wysiwygEditor.commandManager.addCommandObserver(this.undoRedoObserver, "cmd_redo");

            // hook up URI rewriter
            this.editor.contentDocument.addEventListener("DOMNodeInserted", this.uriRewriter, true);

            /* DEBUG */ dump("Yulup:view.js:WYSIWYGModeView.setUp: initialisation completed\n");
        } catch (exception) {
            /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:view.js:WYSIWYGModeView.setUp", exception);
            Components.utils.reportError(exception);
            return;
        }

        /* DEBUG */ dump("%%%%%%%%%%%%%%% Yulup::view.js:WYSIWYGModeView.setUp: arrive at view barrier (current thread count is \"" + this.barrier.noOfThreads + "\")\n");
        this.barrier.arrive();
    },

    /**
     * Serialise the content of the current view to a string.
     *
     * @return {String} current content of this view
     */
    contentToString: function () {
        var documentBody   = null;

        /* DEBUG */ dump("Yulup:view.js:WYSIWYGModeView.contentToString() invoked\n");

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

        /* DEBUG */ dump("Yulup:view.js:WYSIWYGModeView.fillView() invoked\n");

        this.model.preserveDirty = true;

        // fill wysiwyg mode view
        try {
            /* What about using this.editor.contentDocument.innerHTML = content, see
             * also https://bugzilla.mozilla.org/show_bug.cgi?id=314987#c2 */
            this.view.rebuildDocumentFromSource(this.setupDocument(this.model.getDocument()));
            this.view.beginningOfDocument();

            // print document to console
            /* DEBUG */ dumpTree(this.controller.activeView.editor);

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
            /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:view.js:WYSIWYGModeView.fillView", exception);
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

        /* DEBUG */ dump("Yulup:view.js:WYSIWYGModeView.setupDocument() invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aDocument != null);

        // extract the preamble
        documentPreamble  = aDocument.substring(0, aDocument.search(/<body/i));
        this.documentPreamble = documentPreamble;

        /* DEBUG */ dump("Yulup:view.js:WYSIWYGModeView.setupDocument: document preamble =\n" + this.documentPreamble + "\n");

        return aDocument;
    },

    handleEvent: function (aEvent) {
        /* DEBUG */ dump("Yulup:view.js:WYSIWYGModeView.handleEvent(\"" + aEvent + "\") invoked\n");
        /* DEBUG */ dump("Yulup:view.js:WYSIWYGModeView.handleEvent: event type = \"" + aEvent.type + "\", event target = \"" + aEvent.target + "\", event target name = \"" + aEvent.target.tagName + "\"\n");
        /* DEBUG */ dump("Yulup:view.js:WYSIWYGModeView.handleEvent: this.editviewElem = \"" + this.editviewElem + "\", this.editviewElem.tagName = \"" + this.editviewElem.tagName + "\"\n");

        if (aEvent.target == this.editviewElem) {
            // our editor is initialised
            aEvent.stopPropagation();
            this.setUp();
        }
    }
};


/**
 * WYSIWYGXSLTModeView constructor. Instantiates a new object of
 * type WYSIWYGXSLTModeView.
 *
 * Subtype of type WYSIWYGModeView.
 *
 * @constructor
 * @param  {YulupEditStateController}   aEditorController  the editor's state machine
 * @param  {Model}                      aModel             the model associated with this view
 * @param  {Function}                   aShowViewCommand   a function to call to show the current view
 * @param  {Barrier}                    aBarrier           the barrier on which to synchronise after setUp()
 * @param  {XMLDocument}                aXMLStyleDocument  the style this view represents
 * @param  {XMLDocument}                aStyleTemplate     the style template
 * @param  {String}                     aStyleTemplateMode how the styleTemplate should be applied (pre/post transformation)
 * @return {WYSIWYGXSLTModeView}
 */
function WYSIWYGXSLTModeView(aEditorController, aModel, aShowViewCommand, aBarrier, aXMLStyleDocument, aStyleTemplate, aStyleTemplateMode) {
    /* DEBUG */ dump("Yulup:view.js:WYSIWYGXSLTModeView(\"" + aEditorController + "\", \"" + aModel + "\", \"" + aShowViewCommand + "\", \"" + aBarrier + "\", \"" + aXMLStyleDocument + "\" , \"" + aStyleTemplate + "\") invoked.\n");

    /* DEBUG */ YulupDebug.ASSERT(aEditorController != null);
    /* DEBUG */ YulupDebug.ASSERT(aModel            != null);
    /* DEBUG */ YulupDebug.ASSERT(aShowViewCommand  != null);
    /* DEBUG */ YulupDebug.ASSERT(aXMLStyleDocument != null);
    /* DEBUG */ YulupDebug.ASSERT(aStyleTemplate ? aStyleTemplateMode != null : true);

    // call super constructor
    WYSIWYGModeView.call(this, aEditorController, aModel, aShowViewCommand, aBarrier);

    // Get xml serializer
    this.xmlSerializer = Components.classes["@mozilla.org/xmlextras/xmlserializer;1"].getService(Components.interfaces.nsIDOMSerializer);


    if (aStyleTemplate != null) {

        this.styleTemplate = Components.classes["@mozilla.org/xml/xml-document;1"].createInstance(Components.interfaces.nsIDOMXMLDocument);
        this.styleTemplate.async = false;

        if (!this.styleTemplate.load(aStyleTemplate.loadURI.spec)) {
            throw new YulupEditorException("view.js:WYSIWYGXSLTModeView: loading style template \"" + aXMLStyleTemplate.loadURI.spec + "\" failed.");
        }
        this.styleTemplateMode = aStyleTemplateMode;
    }

    this.sourceTaggerXSL = Components.classes["@mozilla.org/xml/xml-document;1"].createInstance(Components.interfaces.nsIDOMXMLDocument);
    this.sourceTaggerXSL.async = false;

    if (!this.sourceTaggerXSL.load(SOURCETAGGER_CHROME_URI)) {
        throw new YulupEditorException("view.js:WYSIWYGXSLTModeView: loading XSLT file \"" + SOURCETAGGER_CHROME_URI + "\" failed.");
    }

    this.documentXSL = Components.classes["@mozilla.org/xml/xml-document;1"].createInstance(Components.interfaces.nsIDOMXMLDocument);
    this.documentXSL.async = false;

    if (!this.documentXSL.load(aXMLStyleDocument.loadURI.spec)) {
        throw new YulupEditorException("view.js:WYSIWYGXSLTModeView: loading XSLT file \"" + aXMLStyleDocument.loadURI.spec + "\" failed.");
    }

    this.patchDocumentStyle(this.documentXSL);
}


WYSIWYGXSLTModeView.prototype = {
    __proto__: WYSIWYGModeView.prototype,

    documentXSL               : null,
    defaultNamespace          : null,
    sourceTaggerXSL           : null,
    styleTemplate             : null,
    domDocument               : null,
    xhtmlDocument             : null,
    xmlSerializer             : null,
    xPathToolBarVisible       : true,
    isNamespaceAware          : true,
    currentSourceSelectionPath: null,
    currentXHTMLNode          : null,
    currentSourceNode         : null,
    nsAwareLocationPathCache  : null,
    nsUnawareLocationPathCache: null,

    /**
     * Initialise the current view.
     *
     * Note that nsIHTMLEditor is also an nsIPlaintextEditor.
     *
     * @return {Undefined} does not have a return value
     */
    setUp: function () {
        var wysiwygXSLTEditor      = null;
        var keyBinding             = null;
        var selectionChangeHandler = null;
        var commandController      = null;
        var commandTable           = null;

        /* DEBUG */ dump("Yulup:view.js:WYSIWYGXSLTModeView.setUp() invoked\n");

        try {
            /* DEBUG */ dump("Yulup:view.js:WYSIWYGXSLTModeView.setUp: this.editor = \"" + this.editor + "\"\n");
            wysiwygXSLTEditor = this.editor;
            wysiwygXSLTEditor.makeEditable("html", false);

            this.view = wysiwygXSLTEditor.getEditor(wysiwygXSLTEditor.contentWindow);
            this.view.QueryInterface(Components.interfaces.nsIEditor);

            // hook up DocumentStateListener
            this.view.addDocumentStateListener(new View.DocumentStateListener(this.model));

            // disable object resizing
            this.view.QueryInterface(Components.interfaces.nsIHTMLObjectResizer);
            this.view.objectResizingEnabled = false;

            // disable absolute positioning
            this.view.QueryInterface(Components.interfaces.nsIHTMLAbsPosEditor);
            this.view.absolutePositioningEnabled = false;

            // disable inline table editing
            this.view.QueryInterface(Components.interfaces.nsIHTMLInlineTableEditor);
            this.view.inlineTableEditingEnabled = false;

            this.view.QueryInterface(Components.interfaces.nsIHTMLEditor);

            // make the caret visible even if the current selection is not collapsed
            this.view.selectionController.setCaretVisibilityDuringSelection(true);

            // set editor attributes
            this.view.enableUndo(true);
            this.view.returnInParagraphCreatesNewParagraph = false;

            // set the document URI
            wysiwygXSLTEditor.docShell.setCurrentURI(this.model.documentReference.getLoadURI());

            /* Due to the implementation of updateBaseURL, this is not going to work as
             * is, so we need a C++ call here (see
             * http://lxr.mozilla.org/mozilla1.8.0/source/editor/libeditor/html/nsHTMLEditor.cpp#1209). */
            this.view.updateBaseURL();

            wysiwygXSLTEditor.contentWindow.addEventListener("keypress", new CommandKeyListener(), true);

            wysiwygXSLTEditor.contentWindow.addEventListener("keyup", new WYSIWYGXSLTKeyListener(this), true);

            if ((keyBinding = YulupPreferences.getCharPref("editor.", "keybinding")) != null) {
                switch (keyBinding) {
                    case "readline":
                        wysiwygXSLTEditor.contentWindow.addEventListener("keypress", new ReadlineKeyBindingsListener(wysiwygXSLTEditor), true);
                        break;
                    case "none":
                    default:
                }
            } else {
                // default to readline
                wysiwygXSLTEditor.contentWindow.addEventListener("keypress", new ReadlineKeyBindingsListener(wysiwygXSLTEditor), true);
            }

            /* Prevent keypress events from bubbling to work around
             * bug https://bugzilla.mozilla.org/show_bug.cgi?id=304188
             * (prevent keypress events from invoking FAYT). */
            wysiwygXSLTEditor.contentWindow.addEventListener("keypress", function (aKeyEvent) {
                                                                 aKeyEvent.stopPropagation();
                                                             }, true);

            selectionChangeHandler = new WYSIWYGXSLTSelectionChangeHandler(this);

            // hook up selection listeners
            wysiwygXSLTEditor.contentWindow.getSelection().QueryInterface(Components.interfaces.nsISelectionPrivate).addSelectionListener(new CutCopySelectionListener(this));
            wysiwygXSLTEditor.contentWindow.getSelection().QueryInterface(Components.interfaces.nsISelectionPrivate).addSelectionListener(new LocationPathSelectionListener(selectionChangeHandler));

            var nsCheckbox = document.getElementById("uiYulupXPathToolBarNSAwareCheckbox");
            nsCheckbox.addEventListener('CheckboxStateChange', new NSCheckboxStateChangeListener(this), true);

            this.view.transactionManager.clear();

            // hook up undo/redo observer
            wysiwygXSLTEditor.commandManager.addCommandObserver(this.undoRedoObserver, "cmd_undo");
            wysiwygXSLTEditor.commandManager.addCommandObserver(this.undoRedoObserver, "cmd_redo");

            // hook up URI rewriter
            this.editor.contentDocument.addEventListener("DOMNodeInserted", this.uriRewriter, true);

            // add our own command handlers
            commandController = Components.classes["@mozilla.org/embedcomp/base-command-controller;1"].createInstance(Components.interfaces.nsIControllerContext);
            commandController.init(null);

            // the context set via setCommandContext is passed as the third argument to each doCommand* call
            commandController.setCommandContext(this.view);
            wysiwygXSLTEditor.contentWindow.controllers.insertControllerAt(0, commandController);

            commandTable = commandController.QueryInterface(Components.interfaces.nsIInterfaceRequestor).getInterface(Components.interfaces.nsIControllerCommandTable);

            commandTable.registerCommand("cmd_cut", new WYSIWYGXSLTCutCommand(this, selectionChangeHandler));
            commandTable.registerCommand("cmd_cutOrDelete", new WYSIWYGXSLTCutOrDeleteCommand(this, selectionChangeHandler));
            commandTable.registerCommand("cmd_paste", new WYSIWYGXSLTPasteCommand(this, selectionChangeHandler));

            /* DEBUG */ dump("Yulup:view.js:WYSIWYGXSLTModeView.setUp: initialisation completed\n");
        } catch (exception) {
            /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:view.js:WYSIWYGXSLTModeView.setUp", exception);
            Components.utils.reportError(exception);
            return;
        }

        /* DEBUG */ dump("%%%%%%%%%%%%%%% Yulup::view.js:WYSIWYGXSLTModeView.setUp: arrive at view barrier (current thread count is \"" + this.barrier.noOfThreads + "\")\n");
        this.barrier.arrive();
    },

    /**
     * Serialise the document of the current view to a string.
     *
     * @return {String} current document of this view
     */
    contentToString: function () {
        serialisedDocument = this.xmlSerializer.serializeToString(this.domDocument);

        /* DEBUG */ dump("######## Yulup:view.js:WYSIWYGXSLTModeView.contentToString: document to write back (xmlserializer) =\n" + serialisedDocument + "\n");

        return serialisedDocument;
    },


    /**
     * Fill this view with content from the associated model.
     *
     * @return {Boolean} returns true if successful, false otherwise
     */
    fillView: function () {
        var retVal        = false;
        var defaultNamespace = null;

        /* DEBUG */ dump("Yulup:view.js:WYSIWYGXSLTModeView.fillView() invoked\n");

        this.domDocument = this.model.getDocumentDOM();
        this.domDocument.normalize();

        /* Lookup default namespace */
        var sourceElements = this.domDocument.getElementsByTagName("*");

        for (var i= 0; i < sourceElements.length; i++) {
            if (this.domDocument.documentElement.isDefaultNamespace(sourceElements.item(i).namespaceURI)) {
                defaultNamespace = sourceElements.item(i).namespaceURI;
                break;
            }
        }

        /* DEBUG */ dump("Yulup:view.js:WYSIWYGXSLTModeView.fillView: default Namespace is: \"" + defaultNamespace + "\"\n");
        this.defaultNamespace = defaultNamespace;

        /* Lookup default namespace prefix. Needed for tagging the source with xpath compatible location paths.
        ** Note that the documentElement might not be prefixed. In fact no nodes at all might be prefixed.
        ** Since the mozilla implementation of node.lookupNamespacePrefix(ns) simply returns the prefix of
        ** the the first node within a given namespace (and the value "xmlns" if that node has no prefix),
        ** we do prefix lookup by hand and set a dummy prefix if no prefixed node can be found.
        **/
        var prefix = null;

        if (defaultNamespace != null) {
            var attrs = this.domDocument.documentElement.attributes;
            for (var i= 0; i < attrs.length; i++) {
                var attr = attrs.item(i);
                if (attr.nodeValue == defaultNamespace && attr.nodeName.indexOf(":") > 1) {
                    var delim = attr.nodeName.indexOf(":");
                    prefix = attr.nodeName.substr(delim + 1, attr.nodeName.length);
                }
            }

            /* DEBUG */ dump("Yulup:view.js:WYSIWYGXSLTModeView.fillView: default namespace prefix is: \"" + prefix + "\"\n");
        }


        /* tag the qualified document source with _yulup-location-path attributes */
        var xsltProcessor = new XSLTProcessor();

        xsltProcessor.importStylesheet(this.sourceTaggerXSL);
        if (defaultNamespace != null && prefix != null) {
            xsltProcessor.setParameter(null, "default-namespace", defaultNamespace);
            xsltProcessor.setParameter(null, "default-prefix", prefix);
        }

        var taggedSourceDocument = xsltProcessor.transformToDocument(this.domDocument);

        /* DEBUG */ dump("Yulup:view.js:WYSIWYGXSLTModeView.fillView: tagged source =\n" + this.xmlSerializer.serializeToString (taggedSourceDocument) + "\n");

        /* Apply a style template. Style templates provide a mechanism for aggregating multiple document
        ** sources before the xhml transformation step ( mode="pre" ) is applied, or for aggregating (transformed)
        ** xhtml view fragments (mode="post") whereas in the latter case the aggregated document is used as
        ** the views xhtmlDocument without further transformation steps. The aggregation points are marked by
        ** xi:include directives contained in the style template.
        */
        if (this.styleTemplate) {

            // Apply styleTemplate to the document before document styling by xslt
            if (this.styleTemplateMode == null || this.styleTemplateMode == "pre") {

                var styleTemplate = Components.classes["@mozilla.org/xml/xml-document;1"].createInstance(Components.interfaces.nsIDOMXMLDocument);
                var documentElement = styleTemplate.importNode(this.styleTemplate.documentElement, true);
                styleTemplate.appendChild(documentElement);

                // Import the tagged document source
                var sourceNode = styleTemplate.importNode(taggedSourceDocument.documentElement, true);

                // Lookup xi:include element and include source document
                var xincludeElem = styleTemplate.evaluate("//xi:include", styleTemplate, this.__xsltNSResolver, XPathResult.ANY_TYPE, null).iterateNext();
                xincludeElem.parentNode.replaceChild(sourceNode, xincludeElem);

                var serializedStyleTemplate = this.xmlSerializer.serializeToString(styleTemplate);

                /* DEBUG */ dump("Style Template + Source: " + serializedStyleTemplate);

                taggedSourceDocument = styleTemplate;
            } else {
                /** Not yet implemented **/

            }

        }

        /* Style the tagged source document by xslt. */
        var xhtmlDocument = this.xsltTransform(taggedSourceDocument, this.documentXSL);

        /* Remove extranous and adjacent Text nodes. */
        xhtmlDocument.normalize();

        // shuffle around _yulup-location-path attributes placed in yulup:substitute elements
        this.substitutePlaceholders(xhtmlDocument);

        /* Remove extranous and adjacent Text nodes. */
        xhtmlDocument.normalize();

        /* Serialize the xhtml document before filling the view */
        serializedDoc = this.xmlSerializer.serializeToString(xhtmlDocument);

        /* DEBUG */ dump("######## Yulup:view.js:WYSIWYGXSLTModeView.fillView: transformed document =\n" + serializedDoc + "\n");

        this.model.preserveDirty = true;

        // initialise location path caches
        this.nsAwareLocationPathCache   = new Object;
        this.nsUnawareLocationPathCache = new Object;

        /* Fill the view */
        try {
            /* What about using this.editor.contentDocument.innerHTML = content, see
             * also https://bugzilla.mozilla.org/show_bug.cgi?id=314987#c2 */
            this.view.rebuildDocumentFromSource(serializedDoc);
            this.view.beginningOfDocument(); // FIXME: cursor should be set to first editable node!

            // rewrite URIs
            this.uriRewriter.rewriteURIs();

            /* View is now pristine again */
            this.view.resetModificationCount();

            /* Clear undo and redo stacks. Note that undo/redo is currently not implemented. */
            this.view.transactionManager.clear();

            /* Indicate that this view has content now */
            this.isFilled = true;

            retVal = true;
        } catch (exception) {
            // Cannot handle document content type
            /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:view.js:WYSIWYGXSLTModeView.fillView", exception);
            Components.utils.reportError(exception);

            retVal = false;
        }

        this.model.preserveDirty = false;

        return retVal;
    },

    insertPlaceholder: function (aSelectorNode, aDocumentXSL) {
        var selector    = null;
        var path        = null;
        var subsElement = null;

        /* DEBUG */ YulupDebug.ASSERT(aSelectorNode != null);
        /* DEBUG */ YulupDebug.ASSERT(aDocumentXSL != null);

        selector = aSelectorNode.getAttribute("select");
        path     = null;

        /* Check if selector uses absolute node addressing. If so set _yulup-location-path to that
         * node. If relative addressing is used, concatenate _yulup-locatoin-path attribute selector
         * of the context node with the selected node. */
        if (selector.indexOf("/") == 0) {
            path = selector;
        } else {
            path = "{@_yulup-location-path}/" + selector;
        }

        subsElement = aDocumentXSL.createElementNS(YULUP_NAMESPACE_URI, "substitute");
        subsElement.setAttribute("_yulup-location-path", path);
        subsElement.appendChild(aSelectorNode.cloneNode(true));
        aSelectorNode.parentNode.replaceChild(subsElement, aSelectorNode);
    },

    substitutePlaceholders: function (aXHTMLDocument) {
        var subsElements = null;
        var subsElement  = null;
        var subsChildren = null;
        var isText       = null;

        /* DEBUG */ YulupDebug.ASSERT(aXHTMLDocument != null);

        subsElements = aXHTMLDocument.getElementsByTagNameNS(YULUP_NAMESPACE_URI, "substitute");

        /* Iterate over all yulup:substitute elements. The fact that NodeLists
         * are "live" and the removal of the element after processing guarantees
         * that the NodeList decreases strictly and the loop eventually terminates. */
        while (subsElements.length > 0) {
            subsElement = subsElements.item(0);
            isText      = false;

            /* DEBUG */ dump("Yulup:view.js:WYSIWYGXSLTModeView.substitutePlaceholders: processing node \"" + subsElement + "\"\n");

            // check for parent node availability
            if (subsElement.parentNode) {
                // check if one of the child nodes of the yulup:substitute element is a text node
                subsChildren = subsElement.childNodes;

                for (var j = 0; j < subsChildren.length; j++) {
                    if (subsChildren.item(j).nodeType == Components.interfaces.nsIDOMNode.TEXT_NODE) {
                        isText = true;
                        break;
                    }
                }

                if (isText) {
                    /* DEBUG */ dump("Yulup:view.js:WYSIWYGXSLTModeView.substitutePlaceholders: move location path to parent node\n");
                    // move _yulup-location-path attribute of the yulup:substitute element to the parent node
                    subsElement.parentNode.setAttribute("_yulup-location-path", subsElement.getAttribute("_yulup-location-path"));
                }

                // replace yulup:substitute element by its children
                while (subsElement.hasChildNodes()) {
                    subsElement.parentNode.insertBefore(subsElement.firstChild, subsElement);
                }

                // remove yulup:substitute element
                subsElement.parentNode.removeChild(subsElement);
            }

            /* DEBUG */ dump("Yulup:view.js:WYSIWYGXSLTModeView.substitutePlaceholders: finished processing node \"" + subsElement + "\"\n");
        }
    },

    /** Returns a document style xslt that propagates "_yulup-location-path" attributes from a tagged
     ** document source to the transformed xhtmlDocument.
     **
     ** This is needed for mapping selections and text node changes from the xhtmlDocument contained in
     ** the view back to the underlying xml document (source).
     **
     ** A patched document style has
     ** <ul>
     ** <li>@_yulup-location-path attribute selectors pointing to the current context node in all
     ** parent nodes of templateSelectors (<xsl:apply-templates>). </li>
     ** <li>span tags with @_yulup-location-path attribute selectors surrounding nodeValue selection
     ** directives that point to the current context node (<xsl:value-of select="."/>).</li>
     ** <li>span tags with @_yulup-location-path attributes that concatenate a @_yulup-location-path
     ** selector of the current context node with the nodeValue selector, when pointing to a node relative
     ** to the current context node (<xsl:value-of select="foo/bar/@foo>").</li>
     ** <li>span tags with a @_yulup-location-path attribute that simply contains the select pattern of
     ** the contained nodeValue selector, when using absolute node addressing (<xsl:value-of select="/foo/bar">).</li>
     ** </ul>
     ** Note that selectors pointing to $variables are excluded from the patching process.
     **
     ** @param  {nsIDOMXMLDocument} aDocumentXSL the document style to patch
     ** @return {nsIDOMXMLDocument} the patched document style
     **/
    patchDocumentStyle: function (aDocumentXSL) {
        var outputMethodNode       = null;
        var templateSelectorNodes  = null;
        var parentNode             = null;
        var nodeValueSelectorNodes = null;

        /* DEBUG */ dump("Yulup:view.js:WYSIWYGXSLTModeView.patchDocumentStyle(\"" + aDocumentXSL + "\") invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aDocumentXSL != null);

        /* Remove output method declarations to prevent mozilla from inserting crap into the generated xhtml.
        ** Note that this is for cosmetic reasons only and can be removed if experience should prove that
        ** documentStyling depends on the output method specified.
        */
        try {
            outputMethodNode = aDocumentXSL.evaluate("xsl:stylesheet/xsl:output", aDocumentXSL, this.__xsltNSResolver, XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null).iterateNext();
            if (outputMethodNode != null) {
                /* DEBUG */ dump("Yulup:view.js:WYSIWYGXSLTModeView.patchDocumentStyle: removing <output> element \"" + outputMethodNode + "\"\n");
                outputMethodNode.parentNode.removeChild(outputMethodNode);
            }
        } catch (exception) {
            /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:view.js:WYSIWYGXSLTModeView.patchDocumentStyle", exception);
            /* DEBUG */ Components.utils.reportError(exception);
        }

        /* Add _yulup-location-path attribute matcher to parent nodes of template selectors */
        try {
            templateSelectorNodes = aDocumentXSL.evaluate("xsl:stylesheet/*//xsl:apply-templates", aDocumentXSL, this.__xsltNSResolver, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
            for (var i=0; i< templateSelectorNodes.snapshotLength; i++) {
                parentNode = templateSelectorNodes.snapshotItem(i).parentNode;
                parentNode.setAttribute("_yulup-location-path", "{@_yulup-location-path}");
            }
        } catch (exception) {
            /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:view.js:WYSIWYGXSLTModeView.patchDocumentStyle", exception);
            /* DEBUG */ Components.utils.reportError(exception);
        }

        /* Insert _yulup-location-path yulup:substitute node around xsl:value-of
         * nodeValue selectors. Note that for-each directives and $variable
         * selectors are not implemented yet. */
        try {
            nodeValueSelectorNodes = aDocumentXSL.evaluate("xsl:stylesheet//*/xsl:value-of[not(contains(@select, '$'))]", aDocumentXSL, this.__xsltNSResolver, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);

            for (var i=0; i< nodeValueSelectorNodes.snapshotLength; i++) {
                this.insertPlaceholder(nodeValueSelectorNodes.snapshotItem(i), aDocumentXSL);
            }
        } catch (exception) {
            /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:view.js:WYSIWYGXSLTModeView.patchDocumentStyle", exception);
            /* DEBUG */ Components.utils.reportError(exception);
        }

        /* Insert _yulup-location-path yulup:substitute node around xsl:copy-of
         * nodeValue selectors. Note that for-each directives and $variable
         * selectors are not implemented yet. */
        try {
            nodeValueSelectorNodes = null;

            nodeValueSelectorNodes = aDocumentXSL.evaluate("xsl:stylesheet//*/xsl:copy-of[not(contains(@select, '$'))]", aDocumentXSL, this.__xsltNSResolver, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);

            for (var i=0; i< nodeValueSelectorNodes.snapshotLength; i++) {
                this.insertPlaceholder(nodeValueSelectorNodes.snapshotItem(i), aDocumentXSL);
            }
        } catch (exception) {
            /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:view.js:WYSIWYGXSLTModeView.patchDocumentStyle", exception);
            /* DEBUG */ Components.utils.reportError(exception);
        }
    },

    /**
     * Transform document with supplied XSLT stylesheet.
     *
     * @param  {nsIDOMNode} aDocument            the document to transform
     * @param  {nsIDOMNode} aXStylesheetDocument the stylesheet to apply
     * @return {nsIDOMNode} returns a transformed document after applying the stylesheet
     */
    xsltTransform: function (aDocument, aXStylesheetDocument) {
        var xsltProcessor = null;

        /* DEBUG */ dump("Yulup:view.js:WYSIWYGXSLTModeView.xsltTransform(\"" + aDocument + "\", \"" + aXStylesheetDocument + "\") invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aDocument            != null);
        /* DEBUG */ YulupDebug.ASSERT(aXStylesheetDocument != null);

        /* DEBUG */ // dump("Yulup:view.js:WYSIWYGXSLTModeView.xsltTransform: applying stylesheet\n" + Components.classes["@mozilla.org/xmlextras/xmlserializer;1"].getService(Components.interfaces.nsIDOMSerializer).serializeToString(aXStylesheetDocument)  + "\nto document\n" + Components.classes["@mozilla.org/xmlextras/xmlserializer;1"].getService(Components.interfaces.nsIDOMSerializer).serializeToString(aDocument)  + "\n");

        xsltProcessor = new XSLTProcessor();

        xsltProcessor.importStylesheet(aXStylesheetDocument);

        return xsltProcessor.transformToDocument(aDocument);
    },


    /** Returns an XPath expression to find the source node in the document source
     ** corresponding to the passed xhtmlDocument node by looking up _yulup-location-path
     ** attributes in the ancestor-or-self axis and then issuing an xPath query based
     ** on the gathered location path data.
     **
     ** Supports two modes of operation: namespace aware/unware. This is needed for
     ** source documents that do not use namespaces in a standardized way (quite a lot in fact).
     ** Note that no fallback mechanism from namespace aware to unaware is implemented yet.
     **
     ** @param  {nsIDOMNode} aXHTMLNode        the currently selected node in the WYSIWYG view
     ** @param  {Boolean}    aIsNamespaceAware set to true if you would like namespace-aware evaluation of the query
     ** @return {String} returns the XPath expression to find the corresponding node in the XML source according to the passed in node, or null if none was found
     **/
    getSourceXPathForXHTMLNode: function (aXHTMLNode, aIsNamespaceAware) {
        var xPathToolBarLabel = null;
        var domDocument       = null;
        var xhtmlNode         = null;
        var xpathParseResult  = null;
        var locationPath      = null;
        var xPathExpr         = null;
        var astNode           = null;
        var localPart         = null;
        var sourceNode        = null;

        /* DEBUG */ YulupDebug.ASSERT(aXHTMLNode        != null);
        /* DEBUG */ YulupDebug.ASSERT(aIsNamespaceAware != null);

        domDocument = this.domDocument;
        xhtmlNode   = aXHTMLNode;

        /* Get a handle on the xPathToolBarLabel displaying a xpath expression for
        ** the current context node
        */
        xPathToolBarLabel = document.getElementById("uiYulupXPathToolBarXPathExpression");

        /** Look up location path by finding nearest _yulup-location-path attribute node.
         ** Note that _yulup-locaton-path values of elements with mixed content do not contain information
         ** about the actual text node selected. There is no way around this because marking source text nodes
         ** with location path information would break styling the document. Therefore text node constraints
         ** have to be estimated based on xhtml to source pattern matching.
         **/
        while (xhtmlNode.parentNode != null) {
            if (xhtmlNode.nodeType == Components.interfaces.nsIDOMNode.ELEMENT_NODE && xhtmlNode.getAttribute("_yulup-location-path") != null) {
                locationPath = xhtmlNode.getAttribute("_yulup-location-path");
                break;
            }
            xhtmlNode = xhtmlNode.parentNode;
        }

        /* DEBUG */ dump("Yulup:view.js:WYSIWYGXSLTModeView.getSourceXPathForXHTMLNode: found location path: " + locationPath + "\n");

        /* No location path data found. Update toolbar and return null. */
        if (locationPath == null || locationPath == "" || locationPath == "undefined") {
            xPathToolBarLabel.value = "-";
            return null;
        }

        /* Query the source document for xPathExpr (the location path found) */
        if (!aIsNamespaceAware) {
            // check the cache (undefined means not cached, null means cached but not available)
            if (this.nsUnawareLocationPathCache[locationPath] == undefined) {
                xpathParseResult = this.parseLocationPath(locationPath);

                if (!xpathParseResult) {
                    xPathToolBarLabel.value = "Error parsing location path";

                    // cache it
                    this.nsUnawareLocationPathCache[locationPath] = null;

                    return null;
                }

                astNode = xpathParseResult;

                do {
                    if (astNode instanceof ASTNodeNameTest) {
                        localPart = astNode.getQName().getLocalPart();

                        if (localPart != "*") {
                            // replace name test by QName with prefix null and localname "*"
                            astNode.setQName(new ASTNodeQName(null, "*"));

                            // insert predicate [local-name()='nodename']
                            astNode.insert(new ASTNodeValue("[local-name()='" + localPart + "']"));
                        } else {
                            // replace name test by QName with prefix null and localname "*"
                            astNode.setQName(new ASTNodeQName(null, "*"));
                        }
                    }
                } while ((astNode = astNode.getNext()) != null);

                /* DEBUG */ dump("Yulup:view.js:WYSIWYGXSLTModeView.getSourceXPathForXHTMLNode: rewritten XPath object representation:\n" + xpathParseResult.toObjectString() + "\n");

                // serialise XPath parser result
                xPathExpr = xpathParseResult.toString();

                // cache it
                this.nsUnawareLocationPathCache[locationPath] = xPathExpr;
            } else {
                xPathExpr = this.nsUnawareLocationPathCache[locationPath];

                /* DEBUG */ dump("Yulup:view.js:WYSIWYGXSLTModeView.getSourceXPathForXHTMLNode: use namespace-unaware cached version: " + xPathExpr + "\n");

                if (!xPathExpr) {
                    xPathToolBarLabel.value = "Error parsing location path";
                    return null;
                }
            }

            /* DEBUG */ dump("Yulup:view.js:WYSIWYGXSLTModeView.getSourceXPathForXHTMLNode: rewritten XPath: " + xPathExpr + "\n");

            try {
                sourceNode = domDocument.evaluate(xPathExpr, domDocument, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            } catch (exception) {
                /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:view.js:WYSIWYGXSLTModeView.getSourceXPathForXHTMLNode", exception);
                /* DEBUG */ Components.utils.reportError(exception);
            }
        } else {
            // check the cache (undefined means not cached, null means cached but not available)
            if (this.nsAwareLocationPathCache[locationPath] == undefined) {
                xpathParseResult = this.parseLocationPath(locationPath);

                if (!xpathParseResult) {
                    xPathToolBarLabel.value = "Error parsing location path";

                    // cache it
                    this.nsAwareLocationPathCache[locationPath] = null;

                    return null;
                }

                // serialise XPath parser result
                xPathExpr = xpathParseResult.toString();

                // cache it
                this.nsAwareLocationPathCache[locationPath] = xPathExpr;
            } else {
                xPathExpr = this.nsAwareLocationPathCache[locationPath];

                /* DEBUG */ dump("Yulup:view.js:WYSIWYGXSLTModeView.getSourceXPathForXHTMLNode: use namespace-aware cached version: " + xPathExpr + "\n");

                if (!xPathExpr) {
                    xPathToolBarLabel.value = "Error parsing location path";
                    return null;
                }
            }

            try {
                sourceNode = domDocument.evaluate(xPathExpr, domDocument, domDocument.createNSResolver(domDocument.documentElement), XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            } catch (exception) {
                // the namespace resolver does not seem to know a prefix used in the query
                /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:view.js:WYSIWYGXSLTModeView.getSourceXPathForXHTMLNode", exception);
                /* DEBUG */ Components.utils.reportError(exception);
            }
        }

        /* DEBUG */ dump ("Yulup:view.js:WYSIWYGXSLTModeView.getSourceXPathForXHTMLNode: XPath query returned source node: \"" + sourceNode + "\"\n");

        /** Do a xhtml to source node mapping to add text() constraints */

        /* No corresponding source node found. Return null. */
        if (sourceNode == null) {
            xPathToolBarLabel.value = "Error! No source node for " + xPathExpr;
            return null;
        }

        // Attribute or element node selected
        if (sourceNode.nodeType == Components.interfaces.nsIDOMNode.ATTRIBUTE_NODE || aXHTMLNode.nodeType == Components.interfaces.nsIDOMNode.ELEMENT_NODE) {
            xPathToolBarLabel.value = xPathExpr;
            return xPathExpr;
        }

        /* Find a source (text) node with a value equal to selected xhtml node and calculate text()
         * constraint.
         *
         * FIXME: Add support for static text generated by documentStyle.
         * Possibly extend documentXSLPatcher for that. */
        if (aXHTMLNode.nodeType == Components.interfaces.nsIDOMNode.TEXT_NODE) {
            var childNodes    = sourceNode.childNodes;
            var textNodeCount = 0;
            var selPosition   = null;

            for (var i=0; i < childNodes.length; i++) {
                var childNode = childNodes.item(i);
                if (childNode.nodeType == Components.interfaces.nsIDOMNode.TEXT_NODE) {
                    textNodeCount++;
                    if (childNode.nodeValue == aXHTMLNode.nodeValue) {
                        selPosition = textNodeCount;
                    }
                }
            }

            if (textNodeCount == 1) {
                xPathExpr = xPathExpr + "/text()";
            } else if (textNodeCount > 1 && selPosition != null) {
                xPathExpr = xPathExpr + "/text()[" + selPosition + "]";
            }

            xPathToolBarLabel.value = xPathExpr;

            return xPathExpr;
        }

        return null;
    },

    parseLocationPath: function (aLocationPath) {
        var xpathParseResult = null;

        /* DEBUG */ YulupDebug.ASSERT(aLocationPath != null);

        /* DEBUG */ dump("---------------------- start parsing found location path ----------------------\n");

        // parse found location path
        try {
            xpathParseResult = (new XPathParser(aLocationPath)).parse();

            /* DEBUG */ dump("Yulup:view.js:WYSIWYGXSLTModeView.getSourceXPathForXHTMLNode: object XPath representation:\n" + xpathParseResult.toObjectString() + "\n");
            /* DEBUG */ dump("Yulup:view.js:WYSIWYGXSLTModeView.getSourceXPathForXHTMLNode: parsed XPath: " + xpathParseResult.toString() + "\n");
        } catch (exception) {
            /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:view.js:WYSIWYGXSLTModeView.getSourceXPathForXHTMLNode", exception);
            /* DEBUG */ Components.utils.reportError(exception);
        }

        /* DEBUG */ dump("\n---------------------- finished parsing found location path ----------------------\n");

        return xpathParseResult;
    },

    updateSource: function () {
        var textNodes = null;
        var aggrText  = null;

        /* DEBUG */ dump("Yulup:view.js:WYSIWYGXSLTModeView.updateSource() invoked\n");

        if (this.currentSourceNode != null && (this.currentSourceNode.nodeType == Components.interfaces.nsIDOMNode.TEXT_NODE || this.currentSourceNode.nodeType == Components.interfaces.nsIDOMNode.ATTRIBUTE_NODE)) {
            /* DEBUG */ dump("Yulup:view.js:WYSIWYGXSLTModeView.updateSource: nodeValue of currently selected node = \"" + this.currentXHTMLNode.nodeValue + "\"\n");

            if (this.currentXHTMLNode.nodeType == Components.interfaces.nsIDOMNode.TEXT_NODE) {
                // note that by the virtue of the location_path insertion, the parent node can only contain text nodes
                textNodes = this.currentXHTMLNode.parentNode.childNodes;

                aggrText = "";
                for (var i = 0; i < textNodes.length; i++) {
                    aggrText += textNodes.item(i).data;
                }

                /* DEBUG */ dump("Yulup:view.js:WYSIWYGXSLTModeView.updateSource: propagating aggregated nodeValue = \"" + aggrText + "\"\n");

                this.currentSourceNode.nodeValue = aggrText;
            } else {
                /* DEBUG */ dump("Yulup:view.js:WYSIWYGXSLTModeView.updateSource: propagating nodeValue = \"" + this.currentXHTMLNode.nodeValue + "\"\n");

                this.currentSourceNode.nodeValue = this.currentXHTMLNode.nodeValue;
            }
        }
    },

    /**
     * Resolve "xsl" and "xi" prefixes used in XPath expressions
     * to namespaces.
     *
     * @param  {String} aPrefix a namespace prefix, either "xsl" or "xi"
     * @return {String} the namespace associated with the passed in prefix
     */
    __xsltNSResolver: function (aPrefix) {
        var namespace = null;

        /* DEBUG */ dump("Yulup:view.js:WYSIWYGXSLTModeView.__xsltNSResolver(\"" + aPrefix + "\") invoked\n");

        var namespace = {
            "xsl": "http://www.w3.org/1999/XSL/Transform",
            "xi" : "http://www.w3.org/2001/XInclude"
        };

        return namespace[aPrefix] || null;
    },

    enterView: function () {
        // show XPathToolBar
        document.getElementById("uiYulupXPathToolBar").hidden = false;
    },

    leaveView: function () {
        // hide XPathToolBar
        document.getElementById("uiYulupXPathToolBar").hidden = true;

        // clear the expression display
        document.getElementById("uiYulupXPathToolBarXPathExpression").value = "";
    }
};


function WYSIWYGXSLTKeyListener(aView) {
    /* DEBUG */ YulupDebug.ASSERT(aView != null);

    this.view = aView;
}

WYSIWYGXSLTKeyListener.prototype = {
    view: null,

    handleEvent: function (aKeyEvent) {
        /* DEBUG */ dump("Yulup:view.js:WYSIWYGXSLTKeyListener.handleEvent() invoked\n");

        // hook up paragraph inserter
        this.view.updateSource();
    }
};


function CutCopySelectionListener(aView) {
    /* DEBUG */ YulupDebug.ASSERT(aView != null);

    this.__view = aView;
}

CutCopySelectionListener.prototype = {
    __view: null,

    notifySelectionChanged: function (aDocument, aSelection, aReason) {
        if (this.__view.cutCopyObserver)
            this.__view.cutCopyObserver.updateCommands();
    }
};


function LocationPathSelectionListener(aSelectionChangeHandler) {
    /* DEBUG */ YulupDebug.ASSERT(aSelectionChangeHandler != null);

    this.__selectionChangeHandler = aSelectionChangeHandler;
}

LocationPathSelectionListener.prototype = {
    __selectionChangeHandler: null,

    notifySelectionChanged: function (aDocument, aSelection, aReason) {
        /* DEBUG */ dump("Yulup:view.js:LocationPathSelectionListener.notifySelectionChanged() invoked\n");

        this.__selectionChangeHandler.selectionChanged(aSelection);
    }
};

function WYSIWYGXSLTSelectionChangeHandler(aView) {
    /* DEBUG */ YulupDebug.ASSERT(aView != null);

    this.__view = aView;
}

WYSIWYGXSLTSelectionChangeHandler.prototype = {
    __view                : null,
    __prevNode            : null,
    __prevIsNamespaceAware: null,

    // TODO: we could also move this code directly into the XSLT mode view
    selectionChanged: function (aSelection) {
        var node        = null;
        var domDocument = null;
        var xpath       = null;
        var sourceNode  = null;

        /* DEBUG */ dump("Yulup:view.js:WYSIWYGXSLTSelectionChangeHandler.selectionChanged() invoked\n");

        node        = aSelection.focusNode;
        domDocument = this.__view.domDocument;

        this.__view.currentXHTMLNode = node;

        // check if the current selection is at the same node as the previous selection
        if (this.__prevNode != node || this.__prevIsNamespaceAware != this.__view.isNamespaceAware) {
            this.__prevNode = node;
            this.__prevIsNamespaceAware = this.__view.isNamespaceAware;

            xpath = this.__view.getSourceXPathForXHTMLNode(node, this.__view.isNamespaceAware);

            if (xpath != null && xpath != this.__view.currentSourceSelectionPath) {
                /* DEBUG */ dump("Yulup:view.js:WYSIWYGXSLTSelectionChangeHandler.selectionChanged: XPath of selected node is: \"" + xpath + "\"\n");

                sourceNode = domDocument.evaluate(xpath, domDocument, domDocument.createNSResolver(domDocument.documentElement), XPathResult.ANY_TYPE, null).iterateNext();

                if (sourceNode != null) {
                    /* DEBUG */ dump("Yulup:view.js:WYSIWYGXSLTSelectionChangeHandler.selectionChanged: setting source node \"" + sourceNode + "\" (\"" + sourceNode.nodeValue + "\") with XPath \"" + xpath + "\" as new current node\n");
                    this.__view.currentSourceSelectionPath = xpath;
                    this.__view.currentSourceNode = sourceNode;

                } else {
                    this.__view.currentSourceSelectionPath = null;
                    this.__view.currentSourceNode = null;
                }
            }
        }

        /* DEBUG */ dump("Yulup:view.js:WYSIWYGXSLTSelectionChangeHandler.selectionChanged: current source node is: \"" + this.__view.currentSourceNode + "\" (\"" + (this.__view.currentSourceNode ? this.__view.currentSourceNode.nodeValue : this.__view.currentSourceNode) + "\")\n");
    }
};


/**
 * WYSIWYGXSLTCutCommand constructor. Instantiates a new object of
 * type WYSIWYGXSLTCutCommand.
 *
 * Implements nsIControllerCommand.
 *
 * @constructor
 */
function WYSIWYGXSLTCutCommand(aView, aSelectionChangeHandler) {
    /* DEBUG */ YulupDebug.ASSERT(aView                   != null);
    /* DEBUG */ YulupDebug.ASSERT(aSelectionChangeHandler != null);

    this.__view                   = aView;
    this.__selectionChangeHandler = aSelectionChangeHandler;
}

WYSIWYGXSLTCutCommand.prototype = {
    __view                  : null,
    __selectionChangeHandler: null,

    doCommand: function (aCommandName, aCommandContext) {
        dump("Yulup:view.js:WYSIWYGXSLTCutCommand.doCommand(\"" + aCommandName + "\", \"" + aCommandContext + "\") invoked\n");

        if ("cmd_cut" == aCommandName) {
            aCommandContext.cut();

            this.__selectionChangeHandler.selectionChanged(aCommandContext.selection);
            this.__view.updateSource();

            return true;
        } else {
            return false;
        }
    },

    doCommandParams: function (aCommandName, aParams, aCommandContext) {
        dump("Yulup:view.js:WYSIWYGXSLTCutCommand.doCommandParams(\"" + aCommandName + "\", \"" + aParams + "\", \"" + aCommandContext + "\") invoked\n");

        return this.doCommand(aCommandName, aCommandContext);
    },

    getCommandStateParams: function (aCommandName, aParams, aCommandContext) {
        var canCut = false;

        dump("Yulup:view.js:WYSIWYGXSLTCutCommand.getCommandStateParams(\"" + aCommandName + "\", \"" + aParams + "\", \"" + aCommandContext + "\") invoked\n");

        canCut = this.isCommandEnabled(aCommandName, aCommandContext);
        aParams.setBooleanValue("state_enabled", canCut);
    },

    isCommandEnabled: function (aCommandName, aCommandContext) {
        var retVal = false;

        dump("Yulup:view.js:WYSIWYGXSLTCutCommand.isCommandEnabled(\"" + aCommandName + "\", \"" + aCommandContext + "\") invoked\n");

        if (aCommandName == "cmd_cut") {
            retVal = aCommandContext.canCut();
        }

        dump("Yulup:view.js:WYSIWYGXSLTCutCommand.isCommandEnabled: " + aCommandName + " retVal = \"" + retVal + "\"\n");

        return retVal;
    }
};

/**
 * WYSIWYGXSLTCutOrDeleteCommand constructor. Instantiates a new object of
 * type WYSIWYGXSLTCutOrDeleteCommand.
 *
 * Implements nsIControllerCommand.
 *
 * @constructor
 */
function WYSIWYGXSLTCutOrDeleteCommand(aView, aSelectionChangeHandler) {
    /* DEBUG */ YulupDebug.ASSERT(aView                   != null);
    /* DEBUG */ YulupDebug.ASSERT(aSelectionChangeHandler != null);

    this.__view                   = aView;
    this.__selectionChangeHandler = aSelectionChangeHandler;
}

WYSIWYGXSLTCutOrDeleteCommand.prototype = {
    __view                  : null,
    __selectionChangeHandler: null,

    doCommand: function (aCommandName, aCommandContext) {
        dump("Yulup:view.js:WYSIWYGXSLTCutOrDeleteCommand.doCommand(\"" + aCommandName + "\", \"" + aCommandContext + "\") invoked\n");

        if ("cmd_cutOrDelete" == aCommandName) {
            if (aCommandContext.selection && aCommandContext.selection.isCollapsed) {
                aCommandContext.deleteSelection(Components.interfaces.nsIEditor.eNext);
            } else {
                aCommandContext.cut();
            }

            this.__selectionChangeHandler.selectionChanged(aCommandContext.selection);
            this.__view.updateSource();

            return true;
        } else {
            return false;
        }
    },

    doCommandParams: function (aCommandName, aParams, aCommandContext) {
        dump("Yulup:view.js:WYSIWYGXSLTCutOrDeleteCommand.doCommandParams(\"" + aCommandName + "\", \"" + aParams + "\", \"" + aCommandContext + "\") invoked\n");

        return this.doCommand(aCommandName, aCommandContext);
    },

    getCommandStateParams: function (aCommandName, aParams, aCommandContext) {
        var canCutOrDelete = false;

        dump("Yulup:view.js:WYSIWYGXSLTCutOrDeleteCommand.getCommandStateParams(\"" + aCommandName + "\", \"" + aParams + "\", \"" + aCommandContext + "\") invoked\n");

        canCutOrDelete = this.isCommandEnabled(aCommandName, aCommandContext);
        aParams.setBooleanValue("state_enabled", canCutOrDelete);
    },

    isCommandEnabled: function (aCommandName, aCommandContext) {
        var retVal = false;

        dump("Yulup:view.js:WYSIWYGXSLTCutOrDeleteCommand.isCommandEnabled(\"" + aCommandName + "\", \"" + aCommandContext + "\") invoked\n");

        if (aCommandName == "cmd_cutOrDelete") {
            retVal = aCommandContext.canCut();
        }

        dump("Yulup:view.js:WYSIWYGXSLTCutOrDeleteCommand.isCommandEnabled: " + aCommandName + " retVal = \"" + retVal + "\"\n");

        return retVal;
    }
};


/**
 * WYSIWYGXSLTPasteCommand constructor. Instantiates a new object of
 * type WYSIWYGXSLTPasteCommand.
 *
 * Implements nsIControllerCommand.
 *
 * @constructor
 */
function WYSIWYGXSLTPasteCommand(aView, aSelectionChangeHandler) {
    /* DEBUG */ YulupDebug.ASSERT(aView                   != null);
    /* DEBUG */ YulupDebug.ASSERT(aSelectionChangeHandler != null);

    this.__view                   = aView;
    this.__selectionChangeHandler = aSelectionChangeHandler;
}

WYSIWYGXSLTPasteCommand.prototype = {
    __view                  : null,
    __selectionChangeHandler: null,

    doCommand: function (aCommandName, aCommandContext) {
        dump("Yulup:view.js:WYSIWYGXSLTPasteCommand.doCommand(\"" + aCommandName + "\", \"" + aCommandContext + "\") invoked\n");

        if ("cmd_paste" == aCommandName) {
            /* Instead of pasting directly, we should take the contents of the
             * clipboard, extract the text and insert it afterwards. We don't want
             * to be able to paste XML into the view, only plaintext! */
            aCommandContext.paste(Components.interfaces.nsIClipboard.kGlobalClipboard);

            this.__selectionChangeHandler.selectionChanged(aCommandContext.selection);
            this.__view.updateSource();

            return true;
        } else {
            return false;
        }
    },

    doCommandParams: function (aCommandName, aParams, aCommandContext) {
        dump("Yulup:view.js:WYSIWYGXSLTPasteCommand.doCommandParams(\"" + aCommandName + "\", \"" + aParams + "\", \"" + aCommandContext + "\") invoked\n");

        return this.doCommand(aCommandName, aCommandContext);
    },

    getCommandStateParams: function (aCommandName, aParams, aCommandContext) {
        var canPaste = false;

        dump("Yulup:view.js:WYSIWYGXSLTPasteCommand.getCommandStateParams(\"" + aCommandName + "\", \"" + aParams + "\", \"" + aCommandContext + "\") invoked\n");

        canPaste = this.isCommandEnabled(aCommandName, aCommandContext);
        aParams.setBooleanValue("state_enabled", canPaste);
    },

    isCommandEnabled: function (aCommandName, aCommandContext) {
        var retVal = false;

        dump("Yulup:view.js:WYSIWYGXSLTPasteCommand.isCommandEnabled(\"" + aCommandName + "\", \"" + aCommandContext + "\") invoked\n");

        if (aCommandName == "cmd_paste") {
            /* In addition to canPaste(), we should also look at the actual
             * clipboard contents to find out if it's in a format we can paste. */
            retVal = aCommandContext.canPaste(Components.interfaces.nsIClipboard.kGlobalClipboard);
        }

        dump("Yulup:view.js:WYSIWYGXSLTPasteCommand.isCommandEnabled: " + aCommandName + " retVal = \"" + retVal + "\"\n");

        return retVal;
    }
};


function NSCheckboxStateChangeListener(aView) {
    /* DEBUG */ YulupDebug.ASSERT(aView != null);

    this.view = aView;
}

NSCheckboxStateChangeListener.prototype = {
    view: null,

    handleEvent: function (aNSCheckboxStateChangeEvent) {
        // hook up paragraph inserter
        if (this.view.isNamespaceAware) {
            this.view.isNamespaceAware = false;
        } else {
            this.view.isNamespaceAware = true;
        }
    }
};


/**
 * Dump the document of a given view to stdout.
 *
 * Note that this is only a helper function and ist
 * meant for debugging purposes. Please do not use
 * it for anything else, since it might go away
 * anytime.
 *
 * @param  {nsIDOMNode} the XUL <editor> element
 * @return {Undefined}  does not have a return value
 */
function dumpTree(aEditor) {
    dump("\nYulup:view.js:dumpTree: innerHTML:\n" + aEditor.contentDocument.childNodes[1].innerHTML + "\n");

    dump("\nYulup:view.js:dumpTree: serialised:\n");
    dump((new WYSIWYGDOMSerialiser(aEditor.contentDocument, false, true)).serialise());
    dump("\n\n");
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

    /* DEBUG */ dump("Yulup:view.js:WYSIWYGDOMSerialiser(\"" + aRootNode + "\", \"" + aEscapeCharacters + "\", \"" + aConvertEntities + "\") invoked\n");

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
                /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:view.js:WYSIWYGDOMSerialiser.__doConvertEntities", exception);
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

        /* DEBUG */ dump("Yulup:view.js:WYSIWYGDOMSerialiser.serialise() invoked\n");

        this.__outputString = "";

        // get the <body> element
        bodyNode = this.__rootNode.evaluate("//body", this.__rootNode, this.__rootNode.createNSResolver(this.__rootNode), XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null).iterateNext();

        if (!bodyNode)
            throw new YulupEditorException("Yulup:view.js:WYSIWYGDOMSerialiser.serialise: no <body> element found.");

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
        /* DEBUG */ dump("Yulup:view.js:WYSIWYGDOMSerialiser.serialiseXML() invoked\n");

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
            /* DEBUG */ dump("Yulup:view.js:WYSIWYGDOMSerialiser.emitNodeStart: aNode.nodeValue = \"" + aNode.nodeValue + "\"\n");
            tmpString = this.__doEscapeCharacters(aNode.nodeValue);
            tmpString = this.__doConvertEntities(tmpString);
            /* TODO: this is a good place to solve the double-linebreaks on Windows
             * problem. Maybe we can simply replace \n, \r and friends by a canonical
             * character. Needs some experimentation first. */
            /* DEBUG */ dump("Yulup:view.js:WYSIWYGDOMSerialiser.emitNodeStart: encoded aNode.nodeValue = \"" + tmpString + "\"\n");
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
            /* DEBUG */ dump("Yulup:view.js:WYSIWYGDOMSerialiser.emitNodeStart: unknown node \"" + aNode.nodeName + "\" of node type \"" + aNode.nodeType + "\" encountered\n");
            throw new YulupEditorException("Yulup:view.js:WYSIWYGDOMSerialiser.emitNodeStart: unknown node \"" + aNode.nodeName + "\" of node type \"" + aNode.nodeType + "\" encountered.");
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
    /* DEBUG */ dump("Yulup:view.js:WYSIWYGDOMCleaner(\"" + aRootNode + "\") invoked\n");

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
        /* DEBUG */ dump("Yulup:view.js:WYSIWYGDOMCleaner.cleanse() invoked\n");

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
     * empty because all child nodes were removed.
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
                    // the child node has to be removed
                    /* DEBUG */ dump("Yulup:view.js:WYSIWYGDOMCleaner.cleanseDOMTree: remove node \"" + tmpChild + "\"\n");
                    aNode.removeChild(tmpChild);
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
        /* DEBUG */ dump("Yulup:view.js:WYSIWYGDOMCleaner.shouldRemove(\"" + aNode + "\") invoked\n");

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
 * WYSIWYGXSLTDOMCleaner constructor. Instantiates a new object of
 * type WYSIWYGXSLTDOMCleaner.
 *
 * @constructor
 * @param  {nsIDOMDocument}        aRootNode the DOM document to clean
 * @return {WYSIWYGXSLTDOMCleaner}
 */
function WYSIWYGXSLTDOMCleaner(aRootNode) {
    /* DEBUG */ dump("Yulup:view.js:WYSIWYGXSLTDOMCleaner(\"" + aRootNode + "\") invoked\n");

    /* DEBUG */ YulupDebug.ASSERT(aRootNode != null);

    this.rootNode = aRootNode;
}

WYSIWYGXSLTDOMCleaner.prototype = {
    rootNode:     null,

    /**
     * Clean the body of the DOM document which was set
     * by the constructor.
     *
     * @return {String} a cleaned document
     */
    cleanse: function () {
        var bodyNode = null;

        /* DEBUG */ dump("Yulup:view.js:WYSIWYGXSLTDOMCleaner.cleanse() invoked\n");

        this.cleanseDOMTree(this.rootNode);

        return this.rootNode;
    },

    /**
     * Clean a node and its subtree.
     *
     * @param  {nsIDOMNode} aNode the node to serialise
     * @return {Undefined} does not have a return value
     */
    cleanseDOMTree: function (aNode) {
        var child = null;

        /* DEBUG */ YulupDebug.ASSERT(aNode != null);

        this.cleanseNode(aNode);

        for (child = aNode.firstChild; child != null; child = child.nextSibling) {
            this.cleanseDOMTree(child);
        }
    },

    /**
     * Clean the passed DOM node.
     *
     * This method should be called before the subtree of the
     * node is visited.
     *
     * @param  {nsIDOMNode} aNode the node to clean
     * @return {Undefined}  does not have a return value
     */
    cleanseNode: function (aNode) {
        /* DEBUG */ YulupDebug.ASSERT(aNode != null);

        switch (aNode.nodeType) {
            case Components.interfaces.nsIDOMNode.ELEMENT_NODE:
                if (aNode.hasAttribute("_yulup-location-path")) {
                    // remove it
                    aNode.removeAttribute("_yulup-location-path");
                }
                break;
            case Components.interfaces.nsIDOMNode.TEXT_NODE:
                break;
            case Components.interfaces.nsIDOMNode.PROCESSING_INSTRUCTION_NODE:
                break;
            case Components.interfaces.nsIDOMNode.COMMENT_NODE:
                break;
            case Components.interfaces.nsIDOMNode.DOCUMENT_NODE:
                break;
            case Components.interfaces.nsIDOMNode.DOCUMENT_TYPE_NODE:
                break;
            default:
                /* DEBUG */ dump("Yulup:view.js:WYSIWYGXSLTDOMCleaner.cleanseNode: unknown node \"" + aNode.nodeName + "\" of node type \"" + aNode.nodeType + "\" encountered\n");
                throw new YulupEditorException("Yulup:view.js:WYSIWYGXSLTDOMCleaner.cleanseNode: unknown node \"" + aNode.nodeName + "\" of node type \"" + aNode.nodeType + "\" encountered.");
        }
    }
};


function TextEditorKeyListener(aEditor, aUseSpaces, aNoOfSpaces) {
    dump("Yulup:view.js:TextEditorKeyListener() invoked\n");

    /* DEBUG */ YulupDebug.ASSERT(aEditor != null);
    /* DEBUG */ YulupDebug.ASSERT(aUseSpaces != null);
    /* DEBUG */ YulupDebug.ASSERT(typeof(aUseSpaces)  == "boolean");
    /* DEBUG */ YulupDebug.ASSERT(aUseSpaces ? aNoOfSpaces != null : true);
    /* DEBUG */ YulupDebug.ASSERT(aUseSpaces ? typeof(aNoOfSpaces) == "number" : true);
    /* DEBUG */ YulupDebug.ASSERT(aUseSpaces ? aNoOfSpaces >= 0 : true);

    this.__editor    = aEditor;
    this.__useSpaces = aUseSpaces;
    this.__spaces    = "";

    if (aUseSpaces) {
        for (var i = 0; i < aNoOfSpaces; i++) {
            this.__spaces += " ";
        }
    }
}

TextEditorKeyListener.prototype = {
    __editor   : null,
    __useSpaces: null,
    __spaces   : null,

    handleEvent: function (aKeyEvent) {
        var isAnyModifierKeyButShift = null;

        dump("Yulup:view.js:TextEditorKeyListener:handleEvent() invoked\n");

        if (0 != aKeyEvent.keyCode) {
            isAnyModifierKeyButShift = aKeyEvent.altKey;

            if (!isAnyModifierKeyButShift) {
                isAnyModifierKeyButShift = aKeyEvent.metaKey;

                if (!isAnyModifierKeyButShift) {
                    isAnyModifierKeyButShift = aKeyEvent.ctrlKey;
                }
            }

            switch (aKeyEvent.keyCode) {
            case Components.interfaces.nsIDOMKeyEvent.DOM_VK_TAB:
                dump("key event = DOM_VK_TAB\n");

                if (this.__useSpaces) {
                    if (isAnyModifierKeyButShift)
                        return true;

                    // else we insert the tab straight through
                    this.__editor.QueryInterface(Components.interfaces.nsIPlaintextEditor);
                    this.__editor.insertText(this.__spaces);

                    // we consumed this event
                    aKeyEvent.preventDefault();
                    return true;
                }
                break;
            }
        }

        return true;
    }
};


function CommandKeyListener() {
    var prefAccelKey = null;

    /* DEBUG */ dump("Yulup:view.js:CommandKeyListener() invoked\n");

    /* Detect platform to set accel key correctly. This is a
     * workaround until https://bugzilla.mozilla.org/show_bug.cgi?id=180840
     * gets fixed. */

    // try to retrieve pref (cf. http://lxr.mozilla.org/mozilla1.8.0/source/content/xbl/src/nsXBLPrototypeHandler.cpp#188)
    if ((prefAccelKey = YulupPreferences.getAnyPref("ui.key.", "accelKey", "int")) != null) {
        /* DEBUG */ dump("Yulup:view.js:CommandKeyListener: prefAccelKey = \"" + prefAccelKey + "\"\n");

        switch (prefAccelKey) {
            case Components.interfaces.nsIDOMKeyEvent.DOM_VK_ALT:
            case Components.interfaces.nsIDOMKeyEvent.DOM_VK_CONTROL:
            case Components.interfaces.nsIDOMKeyEvent.DOM_VK_META:
                this.__accelKey = prefAccelKey;
                break;
            default:
        }
    }

    if (!this.__accelKey) {
        if ((new RegExp("Mac")).test(navigator.platform)) {
            this.__accelKey = Components.interfaces.nsIDOMKeyEvent.DOM_VK_META;
        } else {
            this.__accelKey = Components.interfaces.nsIDOMKeyEvent.DOM_VK_CONTROL;
        }
    }

    /* DEBUG */ dump("Yulup:view.js:CommandKeyListener: this.__accelKey = \"" + this.__accelKey + "\"\n");
}

CommandKeyListener.prototype = {
    __accelKey: null,

    __isAccelKey: function (aKeyEvent) {
        switch (this.__accelKey) {
            case Components.interfaces.nsIDOMKeyEvent.DOM_VK_ALT:
                return aKeyEvent.altKey;
            case Components.interfaces.nsIDOMKeyEvent.DOM_VK_CONTROL:
                return aKeyEvent.ctrlKey;
            case Components.interfaces.nsIDOMKeyEvent.DOM_VK_META:
                return aKeyEvent.metaKey;
            default:
                return false;
        }
    },

    handleEvent: function (aKeyEvent) {
        var controller = null;

        /* DEBUG */ dump("Yulup:view.js:CommandKeyListener.handleEvent() invoked\n");

        if (this.__isAccelKey(aKeyEvent)) {
            /* DEBUG */ dump("Yulup:view.js:CommandKeyListener.handleEvent: char code = " + String.fromCharCode(aKeyEvent.charCode) + "\n");

            switch (String.fromCharCode(aKeyEvent.charCode)) {
                case "t":
                case "T":
                    if (aKeyEvent.shiftKey) {
                        Editor.goDoFileOperationsCommand("cmd_yulup_savetemp");

                        // we consumed this event
                        aKeyEvent.preventDefault();
                        return true;
                    }

                    break;
                case "s":
                case "S":
                    if (aKeyEvent.shiftKey) {
                        Editor.goDoFileOperationsCommand("cmd_yulup_savecms");

                        // we consumed this event
                        aKeyEvent.preventDefault();
                        return true;
                    }

                    break;
                case "c":
                case "C":
                    if (aKeyEvent.shiftKey) {
                        Editor.goDoFileOperationsCommand("cmd_yulup_checkincms");

                        // we consumed this event
                        aKeyEvent.preventDefault();
                        return true;
                    }

                    break;
                case "u":
                case "U":
                    if (aKeyEvent.shiftKey) {
                        Editor.goDoFileOperationsCommand("cmd_yulup_upload");

                        // we consumed this event
                        aKeyEvent.preventDefault();
                        return true;
                    }

                    break;
                default:
            }
        }
    }
};


function ReadlineKeyBindingsListener(aEditorElem) {
    /* DEBUG */ dump("Yulup:view.js:ReadlineKeyBindingsListener() invoked\n");

    /* DEBUG */ YulupDebug.ASSERT(aEditorElem != null);

    this.editorElem = aEditorElem;
}

ReadlineKeyBindingsListener.prototype = {
    editorElem: null,

    handleEvent: function (aKeyEvent) {
        var controller = null;

        /* DEBUG */ dump("Yulup:view.js:ReadlineKeyBindingsListener.handleEvent() invoked\n");

        switch (String.fromCharCode(aKeyEvent.charCode)) {
        case "a":
        case "A":
            /* DEBUG */ dump("Yulup:view.js:ReadlineKeyBindingsListener.handleEvent: char code = a\n");
            if (!aKeyEvent.ctrlKey) {
                break;
            } else {
                if (aKeyEvent.shiftKey) {
                    controller = this.editorElem.contentWindow.controllers.getControllerForCommand("cmd_selectBeginLine");
                    controller.doCommand("cmd_selectBeginLine");
                } else {
                    controller = this.editorElem.contentWindow.controllers.getControllerForCommand("cmd_beginLine");
                    controller.doCommand("cmd_beginLine");
                }

                // we consumed this event
                aKeyEvent.preventDefault();
                return true;
                break;
            }
        case "b":
        case "B":
            /* DEBUG */ dump("Yulup:view.js:ReadlineKeyBindingsListener.handleEvent: char code = b\n");
            if (!aKeyEvent.ctrlKey) {
                break;
            } else {
                if (aKeyEvent.shiftKey) {
                    controller = this.editorElem.contentWindow.controllers.getControllerForCommand("cmd_selectCharPrevious");
                    controller.doCommand("cmd_selectCharPrevious");
                } else {
                    controller = this.editorElem.contentWindow.controllers.getControllerForCommand("cmd_charPrevious");
                    controller.doCommand("cmd_charPrevious");
                }

                // we consumed this event
                aKeyEvent.preventDefault();
                return true;
                break;
            }
        case "d":
            /* DEBUG */ dump("Yulup:view.js:ReadlineKeyBindingsListener.handleEvent: char code = d\n");
            if (!aKeyEvent.ctrlKey) {
                break;
            } else {
                controller = this.editorElem.contentWindow.controllers.getControllerForCommand("cmd_deleteCharForward");
                controller.doCommand("cmd_deleteCharForward");

                // we consumed this event
                aKeyEvent.preventDefault();
                return true;
                break;
            }
        case "e":
        case "E":
            /* DEBUG */ dump("Yulup:view.js:ReadlineKeyBindingsListener.handleEvent: char code = e\n");
            if (!aKeyEvent.ctrlKey) {
                break;
            } else {
                if (aKeyEvent.shiftKey) {
                    controller = this.editorElem.contentWindow.controllers.getControllerForCommand("cmd_selectEndLine");
                    controller.doCommand("cmd_selectEndLine");
                } else {
                    controller = this.editorElem.contentWindow.controllers.getControllerForCommand("cmd_endLine");
                    controller.doCommand("cmd_endLine");
                }

                // we consumed this event
                aKeyEvent.preventDefault();
                return true;
                break;
            }
        case "f":
        case "F":
            /* DEBUG */ dump("Yulup:view.js:ReadlineKeyBindingsListener.handleEvent: char code = f\n");
            if (!aKeyEvent.ctrlKey) {
                break;
            } else {
                if (aKeyEvent.shiftKey) {
                    controller = this.editorElem.contentWindow.controllers.getControllerForCommand("cmd_selectCharPrevious");
                    controller.doCommand("cmd_selectCharNext");
                } else {
                    controller = this.editorElem.contentWindow.controllers.getControllerForCommand("cmd_charNext");
                    controller.doCommand("cmd_charNext");
                }

                // we consumed this event
                aKeyEvent.preventDefault();
                return true;
                break;
            }
        case "h":
            /* DEBUG */ dump("Yulup:view.js:ReadlineKeyBindingsListener.handleEvent: char code = h\n");
            if (!aKeyEvent.ctrlKey) {
                break;
            } else {
                controller = this.editorElem.contentWindow.controllers.getControllerForCommand("cmd_deleteCharBackward");
                controller.doCommand("cmd_deleteCharBackward");

                // we consumed this event
                aKeyEvent.preventDefault();
                return true;
                break;
            }
        case "k":
            /* DEBUG */ dump("Yulup:view.js:ReadlineKeyBindingsListener.handleEvent: char code = k\n");
            if (!aKeyEvent.ctrlKey) {
                break;
            } else {
                controller = this.editorElem.contentWindow.controllers.getControllerForCommand("cmd_deleteToEndOfLine");
                controller.doCommand("cmd_deleteToEndOfLine");

                // we consumed this event
                aKeyEvent.preventDefault();
                return true;
                break;
            }
        case "n":
        case "N":
            /* DEBUG */ dump("Yulup:view.js:ReadlineKeyBindingsListener.handleEvent: char code = n\n");
            if (!aKeyEvent.ctrlKey) {
                break;
            } else {
                if (aKeyEvent.shiftKey) {
                    controller = this.editorElem.contentWindow.controllers.getControllerForCommand("cmd_selectLineNext");
                    controller.doCommand("cmd_selectLineNext");
                } else {
                    controller = this.editorElem.contentWindow.controllers.getControllerForCommand("cmd_lineNext");
                    controller.doCommand("cmd_lineNext");
                }

                // we consumed this event
                aKeyEvent.preventDefault();
                return true;
                break;
            }
        case "p":
        case "P":
            /* DEBUG */ dump("Yulup:view.js:ReadlineKeyBindingsListener.handleEvent: char code = p\n");
            if (!aKeyEvent.ctrlKey) {
                break;
            } else {
                if (aKeyEvent.shiftKey) {
                    controller = this.editorElem.contentWindow.controllers.getControllerForCommand("cmd_selectLinePrevious");
                    controller.doCommand("cmd_selectLinePrevious");
                } else {
                    controller = this.editorElem.contentWindow.controllers.getControllerForCommand("cmd_linePrevious");
                    controller.doCommand("cmd_linePrevious");
                }

                // we consumed this event
                aKeyEvent.preventDefault();
                return true;
                break;
            }
        case "u":
            /* DEBUG */ dump("Yulup:view.js:ReadlineKeyBindingsListener.handleEvent: char code = u\n");
            if (!aKeyEvent.ctrlKey) {
                break;
            } else {
                controller = this.editorElem.contentWindow.controllers.getControllerForCommand("cmd_deleteToBeginningOfLine");
                controller.doCommand("cmd_deleteToBeginningOfLine");

                // we consumed this event
                aKeyEvent.preventDefault();
                return true;
                break;
            }
        case "w":
        case "W":
            /* DEBUG */ dump("Yulup:view.js:ReadlineKeyBindingsListener.handleEvent: char code = w\n");
            if (!aKeyEvent.ctrlKey) {
                break;
            } else {
                if (aKeyEvent.shiftKey) {
                    controller = this.editorElem.contentWindow.controllers.getControllerForCommand("cmd_deleteWordForward");
                    controller.doCommand("cmd_deleteWordForward");
                } else {
                    controller = this.editorElem.contentWindow.controllers.getControllerForCommand("cmd_deleteWordBackward");
                    controller.doCommand("cmd_deleteWordBackward");
                }

                // we consumed this event
                aKeyEvent.preventDefault();
                return true;
                break;
            }
        case "_":
            /* DEBUG */ dump("Yulup:view.js:ReadlineKeyBindingsListener.handleEvent: char code = _\n");
            if (!aKeyEvent.ctrlKey) {
                break;
            } else {
                controller = this.editorElem.contentWindow.controllers.getControllerForCommand("cmd_undo");
                controller.doCommand("cmd_undo");

                // we consumed this event
                aKeyEvent.preventDefault();
                return true;
                break;
            }
        }

        return true;
    }
};


function GuidedTagInserterKeyListener(aView) {
    /* DEBUG */ dump("Yulup:view.js:GuidedTagInserterKeyListener() invoked\n");

    /* DEBUG */ YulupDebug.ASSERT(aView != null);

    this.view = aView;
}

GuidedTagInserterKeyListener.prototype = {
    editor: null,

    handleEvent: function (aKeyEvent) {
        var controller = null;

        /* DEBUG */ dump("Yulup:view.js:GuidedTagInserterKeyListener.handleEvent() invoked\n");

        if (String.fromCharCode(aKeyEvent.charCode) == "i") {
            /* DEBUG */ dump("Yulup:view.js:GuidedTagInserterKeyListener.handleEvent: char code = i\n");

            if (aKeyEvent.ctrlKey) {
                this.view.guidedTagInserter.startTagPrompting();

                // we consumed this event
                aKeyEvent.preventDefault();
                return true;
            }
        }
    }
};

function GuidedTagInserter(aView, aXULDocument, aPromptContainer) {
    /* DEBUG */ YulupDebug.ASSERT(aView            != null);
    /* DEBUG */ YulupDebug.ASSERT(aXULDocument     != null);
    /* DEBUG */ YulupDebug.ASSERT(aPromptContainer != null);

    this.view            = aView;
    this.xulDocument     = aXULDocument;
    this.promptContainer = aPromptContainer;
    this.promptStage     = this.PROMPT_STAGE_UNITIALISED;
}

GuidedTagInserter.prototype = {
    PROMPT_STAGE_UNITIALISED: 0,
    PROMPT_STAGE_TAGNAME    : 1,
    PROMPT_STAGE_ATTRNAME   : 2,
    PROMPT_STAGE_ATTRVALUE  : 3,
    PROMPT_STAGE_EMPTYTAG   : 4,

    view           : null,
    xulDocument    : null,
    promptContainer: null,
    promptTextBox  : null,
    promptStage    : null,
    tagName        : null,
    newTag         : null,

    startTagPrompting: function () {
        var promptLabel   = null;
        var promptTextBox = null;

        /* DEBUG */ dump("Yulup:view.js:GuidedTagInserter:startTagPrompting() invoked\n");

        this.promptTextBox = null;
        this.tagName       = "";
        this.newTag        = "";

        if (this.promptStage != this.PROMPT_STAGE_UNITIALISED) {
            // something must have gone wrong during the last time, do some cleanup
            this.clearPromptBox();
        } else {
            // everything ok, let's go
            this.promptStage = this.PROMPT_STAGE_TAGNAME;
        }

        // prompt for tag name
        promptLabel = this.xulDocument.createElementNS(XUL_NAMESPACE_URI, "label");
        promptLabel.setAttribute("value", Editor.getStringbundleString("editorGuidedTagInserterElementName.label") + ":");
        promptLabel.setAttribute("style", "font-weight: bolder;");
        promptLabel.setAttribute("control", "uiPromptBoxTextbox");

        promptTextBox = this.xulDocument.createElementNS(XUL_NAMESPACE_URI, "textbox");
        promptTextBox.setAttribute("id", "uiPromptBoxTextbox");
        promptTextBox.setAttribute("flex", "1");
        promptTextBox.addEventListener("keypress", this, true);

        this.promptTextBox = promptTextBox;

        this.promptContainer.appendChild(this.createAbortButton());
        this.promptContainer.appendChild(promptLabel);
        this.promptContainer.appendChild(promptTextBox);
        this.promptContainer.removeAttribute("hidden");

        this.promptTextBox.focus();
        /* The promptTextBox may need some time be inserted, but we
         * can't catch the DOMNodeInserted event for some reason, so
         * we just have to wait for a reasonable amount of time. */
        window.setTimeout(function () { promptTextBox.focus(); }, 100);
    },

    promptAttributeName: function () {
        var promptLabel   = null;
        var promptTextBox = null;

        /* DEBUG */ dump("Yulup:view.js:GuidedTagInserter:promptAttributeName() invoked\n");

        this.clearPromptBox();

        this.promptTextBox = null;
        this.promptStage = this.PROMPT_STAGE_ATTRNAME;

        // prompt for attribute name
        promptLabel = this.xulDocument.createElementNS(XUL_NAMESPACE_URI, "label");
        promptLabel.setAttribute("value", Editor.getStringbundleString("editorGuidedTagInserterAttributeName.label") + ":");
        promptLabel.setAttribute("style", "font-weight: bolder;");
        promptLabel.setAttribute("control", "uiPromptBoxTextbox");

        promptTextBox = this.xulDocument.createElementNS(XUL_NAMESPACE_URI, "textbox");
        promptTextBox.setAttribute("id", "uiPromptBoxTextbox");
        promptTextBox.setAttribute("flex", "1");
        promptTextBox.addEventListener("keypress", this, true);

        this.promptTextBox = promptTextBox;

        this.promptContainer.appendChild(this.createAbortButton());
        this.promptContainer.appendChild(promptLabel);
        this.promptContainer.appendChild(promptTextBox);
        this.promptContainer.removeAttribute("hidden");

        this.promptTextBox.focus();
    },

    promptAttributeValue: function () {
        var promptLabel   = null;
        var promptTextBox = null;

        /* DEBUG */ dump("Yulup:view.js:GuidedTagInserter:promptAttributeValue() invoked\n");

        this.clearPromptBox();

        this.promptTextBox = null;
        this.promptStage = this.PROMPT_STAGE_ATTRVALUE;

        // prompt for attribute value
        promptLabel = this.xulDocument.createElementNS(XUL_NAMESPACE_URI, "label");
        promptLabel.setAttribute("value", Editor.getStringbundleString("editorGuidedTagInserterAttributeValue.label") + ":");
        promptLabel.setAttribute("style", "font-weight: bolder;");
        promptLabel.setAttribute("control", "uiPromptBoxTextbox");

        promptTextBox = this.xulDocument.createElementNS(XUL_NAMESPACE_URI, "textbox");
        promptTextBox.setAttribute("id", "uiPromptBoxTextbox");
        promptTextBox.setAttribute("flex", "1");
        promptTextBox.addEventListener("keypress", this, true);

        this.promptTextBox = promptTextBox;

        this.promptContainer.appendChild(this.createAbortButton());
        this.promptContainer.appendChild(promptLabel);
        this.promptContainer.appendChild(promptTextBox);
        this.promptContainer.removeAttribute("hidden");

        this.promptTextBox.focus();
    },

    promptEmptyTag: function () {
        var promptLabel               = null;
        var promptEmptyTagFalseButton = null;
        var promptEmptyTagTrueButton  = null;

        /* DEBUG */ dump("Yulup:view.js:GuidedTagInserter:promptEmptyTag() invoked\n");

        this.clearPromptBox();

        this.promptTextBox = null;
        this.promptStage = this.PROMPT_STAGE_EMPTYTAG;

        // prompt for empty tag
        promptLabel = this.xulDocument.createElementNS(XUL_NAMESPACE_URI, "label");
        promptLabel.setAttribute("value", Editor.getStringbundleString("editorGuidedTagInserterCreate.label") + ":");
        promptLabel.setAttribute("style", "font-weight: bolder;");

        promptEmptyTagFalseButton = this.xulDocument.createElementNS(XUL_NAMESPACE_URI, "button");
        promptEmptyTagFalseButton.setAttribute("label", Editor.getStringbundleString("editorGuidedTagInserterNonEmptyButton.label"));
        promptEmptyTagFalseButton.setAttribute("tooltiptext", Editor.getStringbundleString("editorGuidedTagInserterNonEmptyButton.tooltip"));
        promptEmptyTagFalseButton.setAttribute("id", "uiPromptBoxNonEmptyButton");
        promptEmptyTagFalseButton.setAttribute("default", "true");
        promptEmptyTagFalseButton.addEventListener("command", this, true);
        promptEmptyTagFalseButton.addEventListener("keypress", this, true);

        promptEmptyTagTrueButton = this.xulDocument.createElementNS(XUL_NAMESPACE_URI, "button");
        promptEmptyTagTrueButton.setAttribute("label", Editor.getStringbundleString("editorGuidedTagInserterEmptyButton.label"));
        promptEmptyTagTrueButton.setAttribute("tooltiptext", Editor.getStringbundleString("editorGuidedTagInserterEmptyButton.tooltip"));
        promptEmptyTagTrueButton.setAttribute("id", "uiPromptBoxEmptyButton");
        promptEmptyTagTrueButton.addEventListener("command", this, true);

        this.promptContainer.appendChild(this.createAbortButton());
        this.promptContainer.appendChild(promptLabel);
        this.promptContainer.appendChild(promptEmptyTagFalseButton);
        this.promptContainer.appendChild(promptEmptyTagTrueButton);
        this.promptContainer.removeAttribute("hidden");

        promptEmptyTagFalseButton.focus();
    },

    /**
     * Insert the passed tag into the current editor.
     *
     * If aOpeningTagString is null, we do not insert anything.
     * If aOpeningTagString contains data but aClosingTagString
     * is null, we assume an empty-tag is to be inserted. If
     * aOpeningTagString as well as aClosingTagString are non-null,
     * we assume a non-empty tag is to inserted.
     *
     * If the associated editor contains a collapsed selection, empty
     * as well as non-empty tags are simply inserted at this location.
     * If the associated editor contain a non-collapes selection,
     * empty tags simply overwrite that selection. Non-empty tags instead
     * surround this selection.
     *
     * @param  {String} aOpeningTagString the opening tag, or null if nothing should be inserted
     * @param  {String} aClosingTagString the closing tag, or null if an empty tag should be inserted
     * @return {Undefined} does not have a return value
     */
    finishPrompting: function (aOpeningTagString, aClosingTagString) {
        /* DEBUG */ dump("Yulup:view.js:GuidedTagInserter:finishPrompting(\"" + aOpeningTagString + "\", \"" + aClosingTagString + "\") invoked\n");

        this.clearPromptBox();

        this.promptStage = this.PROMPT_STAGE_UNITIALISED;

        // check if we have something to insert
        if (aOpeningTagString) {
            if (aClosingTagString) {
                /* Check if we have a selection. If we have one, surround that
                 * selection by the new tag instead of overwriting it. */
                if (this.view.view.selection.isCollapsed) {
                    // selection is collaped, simply insert

                    //params = Components.classes["@mozilla.org/embedcomp/command-params;1"].createInstance(Components.interfaces.nsICommandParams);
                    //params.setStringValue("state_data", "foo");
                    //controller = this.editorElem.contentWindow.controllers.getControllerForCommand("cmd_insertText");

                    /* Insert text directly because doCommandParams is not exposed via
                     * XPConnect for this controller, and doCommand is not implemented. */
                    this.view.view.insertText(aOpeningTagString + aClosingTagString);

                    // move selection to the middle of the inserted element tuple
                    for (var i = 0; i < aClosingTagString.length; i++)
                        this.view.view.selectionController.characterMove(false, false);
                } else {
                    // selection is not collapsed, surround the selection
                    this.view.view.insertText(aOpeningTagString + this.view.view.selection + aClosingTagString);
                }
            } else {
                /* Ignore a possible selection and simply overwrite it,
                 * because with an empty tag we can't surround anything. */
                this.view.view.insertText(aOpeningTagString);
            }
        }

        // transfer focus back to editor
        this.view.editor.contentWindow.focus();
    },

    clearPromptBox: function () {
        this.promptContainer.setAttribute("hidden", "true");

        while(this.promptContainer.hasChildNodes())
            this.promptContainer.removeChild(this.promptContainer.firstChild);
    },

    createAbortButton: function () {
        var abortButton = null;

        abortButton = this.xulDocument.createElementNS(XUL_NAMESPACE_URI, "toolbarbutton");
        abortButton.setAttribute("class", "uiEditorFooterToolBarCloseButton");
        abortButton.setAttribute("tooltiptext", Editor.getStringbundleString("editorGuidedTagInserterAbortButton.tooltip"));
        abortButton.setAttribute("id", "uiPromptBoxAbortButton");
        abortButton.addEventListener("command", this, true);

        return abortButton;
    },

    handleEvent: function (aEvent) {
        var enteredText = null;

        /* DEBUG */ dump("Yulup:view.js:GuidedTagInserter:handleEvent(\"" + aEvent + "\") invoked\n");

        if (aEvent.type == "keypress") {
            switch (aEvent.target.getAttribute("id")) {
                case "uiPromptBoxTextbox":
                    if (aEvent.keyCode == Components.interfaces.nsIDOMKeyEvent.DOM_VK_RETURN ||
                        aEvent.keyCode == Components.interfaces.nsIDOMKeyEvent.DOM_VK_ENTER) {
                        // get entered text
                        enteredText = this.promptTextBox.value;

                        // dispatch to next stage
                        switch (this.promptStage) {
                            case this.PROMPT_STAGE_TAGNAME:
                                // handle entered text
                                if (enteredText == "") {
                                    // nothing entered means directly abort prompting
                                    this.finishPrompting(null, null);
                                } else {
                                    // add it to the new tag string
                                    this.tagName  = enteredText;
                                    this.newTag  += "<" + enteredText;

                                    // enter next stage
                                    this.promptAttributeName();
                                }
                                break;
                            case this.PROMPT_STAGE_ATTRNAME:
                                // handle entered text
                                if (enteredText == "") {
                                    // nothing entered means abort prompting for attributes
                                    this.promptEmptyTag();
                                } else {
                                    // add it to the new tag string
                                    this.newTag += " " + enteredText + "=";

                                    // enter next stage
                                    this.promptAttributeValue();
                                }
                                break;
                            case this.PROMPT_STAGE_ATTRVALUE:
                                // handle entered text
                                this.newTag += "\"" + enteredText + "\"";

                                // enter next stage
                                this.promptAttributeName();
                                break;
                            default:
                        }
                    }
                    break;
                case "uiPromptBoxNonEmptyButton":
                    if (aEvent.keyCode == Components.interfaces.nsIDOMKeyEvent.DOM_VK_RETURN ||
                        aEvent.keyCode == Components.interfaces.nsIDOMKeyEvent.DOM_VK_ENTER) {
                        // emulate keyboard activation for platform Mac
                        aEvent.target.doCommand();
                    }
                    break;
                default:
            }
        } else if (aEvent.type == "command") {
            switch (aEvent.target.getAttribute("id")) {
                case "uiPromptBoxAbortButton":
                    this.finishPrompting(null, null);
                    break;
                case "uiPromptBoxNonEmptyButton":
                    this.newTag += ">";
                    this.finishPrompting(this.newTag, "</" + this.tagName + ">");
                    break;
                case "uiPromptBoxEmptyButton":
                    this.newTag += "/>";
                    this.finishPrompting(this.newTag, null);
                    break;
                default:
            }
        }
    }
};


/**
 * URIRewriter constructor. Instantiates a new object of
 * type URIRewriter.
 *
 * Rewrites URIs on the go as DOM nodes are created as
 * well as on request.
 *
 * Note that this type implements the nsIDOMEventListener
 * interface.
 *
 * @constructor
 * @param  {View}        aView the view to operate on
 * @return {URIRewriter}
 */
function URIRewriter(aView) {
    /* DEBUG */ YulupDebug.ASSERT(aView != null);
    /* DEBUG */ YulupDebug.ASSERT(aView instanceof View);

    this.__view = aView;

    this.__ioService = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);
};

URIRewriter.prototype = {
    __view     : null,
    __ioService: null,

    /**
     * Rewrite image URIs to display images which are
     * referenced relatively to the current location.
     *
     * Adds a __yulupOriginalURI property which
     * contains the original URI of the image.
     *
     * @return {Undefined} does not have a return value
     */
    rewriteURIs: function() {
        var targetNodes = null;
        var baseURI     = null;

        /* DEBUG */ dump("Yulup:view.js:URIRewriter.rewriteURIs() invoked\n");

        if (this.__view.model.documentReference && (baseURI = this.__view.model.documentReference.getBaseURI()) != null) {
            // image URI rewriting
            targetNodes = this.__view.editor.contentDocument.images;

            for (var i = 0; i < targetNodes.length; i++) {
                this.__rewriteImgURI(targetNodes.item(i), baseURI);
            }

            // anchor URI rewriting
            targetNodes = this.__view.editor.contentDocument.links;

            for (var i = 0; i < targetNodes.length; i++) {
                this.__rewriteAURI(targetNodes.item(i), baseURI);
            }

            // link URI rewriting
            targetNodes = this.__view.editor.contentDocument.getElementsByTagName("link");

            for (var i = 0; i < targetNodes.length; i++) {
                this.__rewriteLinkURI(targetNodes.item(i), baseURI);
            }
        }
    },

    handleEvent: function (aEvent) {
        var baseURI     = null;

        /* DEBUG */ dump("Yulup:view.js:URIRewriter.handleEvent(\"" + aEvent.target + "\") invoked\n");

        if (this.__view.model.documentReference && (baseURI = this.__view.model.documentReference.getBaseURI()) != null) {
            if (aEvent.target instanceof HTMLImageElement) {
                this.__rewriteImgURI(aEvent.target, baseURI);
            } else if (aEvent.target instanceof HTMLAnchorElement) {
                this.__rewriteAURI(aEvent.target, baseURI);
            }
        }
    },

    __rewriteImgURI: function(aNode, aBaseURI) {
        var originalURI = null;
        var newURI      = null;

        originalURI = aNode.getAttribute("src");

        /* DEBUG */ dump("Yulup:view.js:URIRewriter.__rewriteImgURI: rewriting image URI \"" + originalURI + "\"\n");

        try {
            newURI = this.__ioService.newURI(originalURI, null, aBaseURI);

            aNode.setAttribute("src", newURI.spec);
            aNode.__yulupOriginalURI = originalURI;

            /* DEBUG */ dump("Yulup:view.js:URIRewriter.__rewriteImgURI: new image URI is \"" + aNode.getAttribute("src") + "\"\n");
        } catch (exception) {
            /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:view.js:URIRewriter.__rewriteImgURI", exception);
        }
    },

    __rewriteAURI: function(aNode, aBaseURI) {
        var originalURI = null;
        var newURI      = null;

        originalURI = aNode.getAttribute("href");

        /* DEBUG */ dump("Yulup:view.js:URIRewriter.__rewriteAURI: rewriting anchor URI \"" + originalURI + "\"\n");

        try {
            newURI = this.__ioService.newURI(originalURI, null, aBaseURI);

            aNode.setAttribute("href", newURI.spec);
            aNode.__yulupOriginalURI = originalURI;

            /* DEBUG */ dump("Yulup:view.js:URIRewriter.__rewriteAURI: new anchor URI is \"" + aNode.getAttribute("href") + "\"\n");
        } catch (exception) {
            /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:view.js:URIRewriter.__rewriteAURI", exception);
        }
    },

    __rewriteLinkURI: function(aNode, aBaseURI) {
        var originalURI = null;
        var newURI      = null;

        originalURI = aNode.getAttribute("href");

        /* DEBUG */ dump("Yulup:view.js:URIRewriter.__rewriteLinkURI: rewriting link URI \"" + originalURI + "\"\n");

        try {
            newURI = this.__ioService.newURI(originalURI, null, aBaseURI);

            aNode.setAttribute("href", newURI.spec);
            aNode.__yulupOriginalURI = originalURI;

            /* DEBUG */ dump("Yulup:view.js:URIRewriter.__rewriteLinkURI: new link URI is \"" + aNode.getAttribute("href") + "\"\n");
        } catch (exception) {
            /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:view.js:URIRewriter.__rewriteLinkURI", exception);
        }
    }
};