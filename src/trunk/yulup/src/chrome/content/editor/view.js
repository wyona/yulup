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

const XUL_NAMESPACE_URI   = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";

/**
 * View constructor. Instantiates a new object of
 * type View.
 *
 * @constructor
 * @param  {YulupEditStateController} aEditorController the editor's state machine
 * @param  {Model}                    aModel            the model associated with this view
 * @param  {Barrier}                  aBarrier          the barrier on which to synchronise after setUp()
 * @param  {nsIDOMXULElement}         aContextMenuPopup the context menu of this view
 * @return {View}
 */
function View(aEditorController, aModel, aBarrier, aContextMenuPopup) {
    /* DEBUG */ dump("Yulup:view.js:View(\"" + aEditorController + "\, \"" + aModel + "\", \"" + aBarrier + "\") invoked.\n");

    /* DEBUG */ YulupDebug.ASSERT(aEditorController != null);
    /* DEBUG */ YulupDebug.ASSERT(aModel            != null);
    /* DEBUG */ YulupDebug.ASSERT(aBarrier          != null);

    this.controller         = aEditorController;
    this.model              = aModel;
    this.barrier            = aBarrier;
    this.__contextMenuPopup = aContextMenuPopup;
    this.isFilled           = false;

    // instantiate undo/redo and cut/copy observers
    this.undoRedoObserver = new UndoRedoObserver();
    this.cutCopyObserver  = new CutCopyObserver();

    this.commandUpdaters = [ this.undoRedoObserver, this.cutCopyObserver ];

    this.xmlSerializer = Components.classes["@mozilla.org/xmlextras/xmlserializer;1"].getService(Components.interfaces.nsIDOMSerializer);
}

View.prototype = {
    __contextMenuPopup: null,
    __contextTarget   : null,

    controller      : null,
    model           : null,
    barrier         : null,
    editor          : null,
    editviewElem    : null,
    view            : null,
    isFilled        : null,
    commandUpdaters : null,
    undoRedoObserver: null,
    cutCopyObserver : null,
    uriRewriter     : null,
    xmlSerializer   : null,

    /**
     * Show this view.
     *
     * Synchronises the active view with the model, and then
     * fills this view with the document. If this view is already
     * the active view, nothing is done.
     *
     * @return {Undefined} does not have a return value
     */
    show: function () {
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
                    this.controller.activeView.leaveView();

                    /* DEBUG */ dumpTree(this.controller.activeView.editor);

                    /* Check if the previous view was modified. If this is the case,
                     * we have to copy it over to the active view later. */
                    isViewModified = this.controller.activeView.view.documentModified;

                    /* We indeed switched tabs, therefore we have
                     * to synchronise the other view first. */
                    this.controller.activeView.syncToModel();
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
    },

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
    syncToModel: function (aNoReset) {
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
    },

    /**
     * Synchronises this view with the model, but do not
     * reset the modification count.
     *
     * Use this method instead of syncToModel() when saving
     * the current document.
     *
     * @return {Undefined} does not have a return value
     */
    setToModel: function() {
        /* DEBUG */ dump("Yulup:view.js:View.setToModel() invoked\n");

        this.syncToModel(true);
    },

    /**
     * Perform view specific actions on view show.
     *
     * @return {Undefined} does not have a return value
     */
    enterView: function() {
        /* DEBUG */ dump("Yulup:view.js:View.enterView() invoked\n");
    },

    /**
     * Perform view specific actions on view leave.
     *
     * @return {Undefined} does not have a return value
     */
    leaveView: function() {
        /* DEBUG */ dump("Yulup:view.js:View.leaveView() invoked\n");
    },

    /**
     * Add a selection listener of type nsISelectionListener.
     *
     * @param  {nsISelectionListener} aSelectionListener the selection listener to add
     * @return {Boolean} returns true if the listener was attached successfully, false otherwise
     */
    addSelectionListener: function (aSelectionListener) {
        /* DEBUG */ dump("Yulup:view.js:View.addSelectionListener() invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aSelectionListener != null);

        // since this is the base class, we can't add any listeners
        return false;
    },

    /**
     * Remove a selection listener of type nsISelectionListener.
     *
     * @param  {nsISelectionListener} aSelectionListener the selection listener to remove
     * @return {Undefined} does not have a return value
     */
    removeSelectionListener: function (aSelectionListener) {
        /* DEBUG */ dump("Yulup:view.js:View.removeSelectionListener() invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aSelectionListener != null);
    },

    getContextTarget: function () {
        return this.__contextTarget;
    },

    /**
     * Show a context menu for this view.
     *
     * @param  {nsIDOMMouseEvent} aEvent the event triggered
     * @return {Undefined} does not have a return value
     */
    showContextMenu: function (aEvent) {
        // store the event target
        this.__contextTarget = aEvent.originalTarget;

        // open the context menu
        this.__contextMenuPopup.showPopup(this.editor, aEvent.clientX, aEvent.clientY, "context");
    },

    registerContextMenu: function (aEditor) {
        var self = null;

        /* DEBUG */ YulupDebug.ASSERT(aEditor != null);

        self = this;

        aEditor.contentWindow.addEventListener("contextmenu", function (aEvent) { self.showContextMenu(aEvent); }, false);
    }
};


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
function DocumentStateListener(aModel) {
    /* DEBUG */ YulupDebug.ASSERT(aModel != null);

    this.__model = aModel;
}

DocumentStateListener.prototype = {
    __model: null,

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
            this.__model.setDirty();
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
function EditorObserver() {}

EditorObserver.prototype = {
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
function EditActionListener(aView, aModel) {
    /* DEBUG */ dump("Yulup:view.js:EditActionListener(\"" + aView + "\", \"" + aModel + "\") invoked.\n");

    this.__view  = aView;
    this.__model = aModel;
}

EditActionListener.prototype = {
    __view : null,
    __model: null,

    WillCreateNode: function (aTag, aParent, aPosition) {
        /* DEBUG */ dump("Yulup:view.js:EditActionListener.WillCreateNode: tag = \"" + aTag + "\", parent = \"" + aParent.nodeName + "\", position = \"" + aPosition + "\"\n");
    },

    DidCreateNode: function (aTag, aNode, aParent, aPosition, aResult) {
        /* DEBUG */ dump("Yulup:view.js:EditActionListener.DidCreateNode:  tag = \"" + aTag + "\", parent = \"" + aParent.nodeName + "\", position = \"" + aPosition + "\", result = \"" + aResult + "\"\n");

        this.__view.undoRedoObserver.updateCommands();
        this.__model.setDirty();
    },

    WillInsertNode: function (aNode, aParent, aPosition) {
        /* DEBUG */ dump("Yulup:view.js:EditActionListener.WillInsertNode: node = \"" + aNode.nodeName + "\", parent = \"" + aParent.nodeName + "\", position = \"" + aPosition + "\"\n");
    },

    DidInsertNode: function (aNode, aParent, aPosition, aResult) {
        /* DEBUG */ dump("Yulup:view.js:EditActionListener.DidInsertNode:  node = \"" + aNode.nodeName + "\", parent = \"" + aParent.nodeName + "\", position = \"" + aPosition + "\", result = \"" + aResult + "\"\n");

        this.__view.undoRedoObserver.updateCommands();
        this.__model.setDirty();
    },

    WillDeleteNode: function (aChild) {
        /* DEBUG */ dump("Yulup:view.js:EditActionListener.WillDeleteNode: child = \"" + aChild.nodeName + "\"\n");
    },

    DidDeleteNode: function (aChild, aResult) {
        /* DEBUG */ dump("Yulup:view.js:EditActionListener.DidDeleteNode:  child = \"" + aChild.nodeName + "\", result = \"" + aResult + "\"\n");

        this.__view.undoRedoObserver.updateCommands();
        this.__model.setDirty();
    },

    WillSplitNode: function (aExistingRightNode, aOffset) {
        /* DEBUG */ dump("Yulup:view.js:EditActionListener.WillSplitNode:  right node = \"" + aExistingRightNode.nodeName + "\", offset = \"" + aOffset + "\"\n");
    },

    DidSplitNode: function (aExistingRightNode, aOffset, aNewLeftNode, aResult) {
        /* DEBUG */ dump("Yulup:view.js:EditActionListener.DidSplitNode:   right node = \"" + aExistingRightNode.nodeName + "\", offset = \"" + aOffset + "\", new left node = \"" + aNewLeftNode.nodeName + "\", result = \"" + aResult + "\"\n");

        this.__view.undoRedoObserver.updateCommands();
        this.__model.setDirty();
    },

    WillJoinNodes: function (aLeftNode, aRightNode, aParent) {
        /* DEBUG */ dump("Yulup:view.js:EditActionListener.WillJoinNodes:  left node = \"" + aLeftNode.nodeName + "\", right node = \"" + aRightNode.nodeName + "\", parent node = \"" + aParent.nodeName + "\"\n");
    },

    DidJoinNodes: function (aLeftNode, aRightNode, aParent, aResult) {
        /* DEBUG */ dump("Yulup:view.js:EditActionListener.DidJoinNodes:   left node = \"" + aLeftNode.nodeName + "\", right node = \"" + aRightNode.nodeName + "\", parent node = \"" + aParent.nodeName + "\", result = \"" + aResult + "\"\n");

        this.__view.undoRedoObserver.updateCommands();
        this.__model.setDirty();
    },

    WillInsertText: function (aTextNode, aOffset, aString) {
        /* DEBUG */ dump("Yulup:view.js:EditActionListener.WillInsertText: text node = \"" + aTextNode.nodeName + "\", offset = \"" + aOffset + "\", string = \"" + aString + "\"\n");
    },

    DidInsertText: function (aTextNode, aOffset, aString, aResult) {
        /* DEBUG */ dump("Yulup:view.js:EditActionListener.DidInsertText: text node = \"" + aTextNode.nodeName + "\", offset = \"" + aOffset + "\", string = \"" + aString + "\", result = \"" + aResult + "\"\n");

        this.__view.undoRedoObserver.updateCommands();
        this.__model.setDirty();
    },

    WillDeleteText: function (aTextNode, aOffset, aLength) {
        /* DEBUG */ dump("Yulup:view.js:EditActionListener.WillDeleteText: text node = \"" + aTextNode.nodeName + "\", offset = \"" + aOffset + "\", length = \"" + aLength + "\"\n");
    },

    DidDeleteText: function (aTextNode, aOffset, aLength, aResult) {
        /* DEBUG */ dump("Yulup:view.js:EditActionListener.DidDeleteText: text node = \"" + aTextNode.nodeName + "\", offset = \"" + aOffset + "\", length = \"" + aLength + "\", result = \"" + aResult + "\"\n");

        this.__view.undoRedoObserver.updateCommands();
        this.__model.setDirty();
    },

    WillDeleteSelection: function (aSelection) {
        /* DEBUG */ dump("Yulup:view.js:EditActionListener.WillDeleteSelection:  selection = \"" + aSelection + "\"\n");
    },

    DidDeleteSelection: function (aSelection) {
        /* DEBUG */ dump("Yulup:view.js:EditActionListener.DidDeleteSelection:  selection = \"" + aSelection + "\"\n");

        this.__view.undoRedoObserver.updateCommands();
        this.__model.setDirty();
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
function TransactionListener(aEditor) {
    /* DEBUG */ dump("Yulup:view.js:TransactionListener() invoked\n");

    /* DEBUG */ YulupDebug.ASSERT(aEditor != null);

    this.__editor = aEditor;
}

TransactionListener.prototype = {
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
        /* DEBUG */ dump("Yulup:view.js:TransactionListener.didRedo() invoked\n");

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
        /* DEBUG */ dump("Yulup:view.js:TransactionListener.didUndo() invoked\n");

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


function EditCommandUpdater() {
    /* DEBUG */ dump("Yulup:view.js:EditCommandUpdater() invoked\n");

    this.__active = false;
}

EditCommandUpdater.prototype = {
    __active: null,

    activate: function () {
        /* DEBUG */ dump("Yulup:view.js:EditCommandUpdater.activate() invoked\n");

        this.__active = true;
    },

    deactivate: function () {
        /* DEBUG */ dump("Yulup:view.js:EditCommandUpdater.deactivate() invoked\n");

        this.__active = false;
    }
};


function UndoRedoObserver() {
    /* DEBUG */ dump("Yulup:view.js:UndoRedoObserver() invoked\n");

    EditCommandUpdater.call(this);
}

UndoRedoObserver.prototype = {
    __proto__: EditCommandUpdater.prototype,

    disableCommands: function () {
        /* DEBUG */ dump("Yulup:view.js:UndoRedoObserver.disableCommands() invoked\n");

        Editor.goSetCommandEnabled("cmd_undo", false);
        Editor.goSetCommandEnabled("cmd_redo", false);
    },

    updateCommands: function () {
        /* DEBUG */ dump("Yulup:view.js:UndoRedoObserver.updateCommands() invoked\n");

        if (this.__active) {
            Editor.goUpdateCommand("cmd_undo");
            Editor.goUpdateCommand("cmd_redo");
        }
    },

    observe: function (aSubject, aTopic, aData) {
        /* DEBUG */ dump("Yulup:view.js:UndoRedoObserver.observe(\"" + aSubject + "\", \"" + aTopic + "\", \"" + aData + "\") invoked\n");

        if (this.__active) {
            Editor.goUpdateCommand(aTopic);
            //window.updateCommands("undo");
        }
    }
};


function CutCopyObserver() {
    /* DEBUG */ dump("Yulup:view.js:CutCopyObserver() invoked\n");

    EditCommandUpdater.call(this);
}

CutCopyObserver.prototype = {
    __proto__: EditCommandUpdater.prototype,

    disableCommands: function () {
        /* DEBUG */ dump("Yulup:view.js:CutCopyObserver.disableCommands() invoked\n");

        Editor.goSetCommandEnabled("cmd_cut", false);
        Editor.goSetCommandEnabled("cmd_copy", false);
        Editor.goSetCommandEnabled("cmd_delete", false);
    },

    updateCommands: function () {
        /* DEBUG */ dump("Yulup:view.js:CutCopyObserver.updateCommands() invoked\n");

        if (this.__active) {
            Editor.goUpdateCommand("cmd_cut");
            Editor.goUpdateCommand("cmd_copy");
            Editor.goUpdateCommand("cmd_delete");
        }
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
