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
const SOURCETAGGER_CHROME_URI = "chrome://yulup/content/sourcetagger.xsl";

const XUL_NAMESPACE_URI = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";

// TODO: make this configurable via the preferences system
const INSERT_TAB_STRING = "  ";

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
     * https://bugzilla.mozilla.org/show_bug.cgi?id=345335 gets
     * fixed (browser crashes with sig EXC_BAD_ACCESS).
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
     * @return {EditActionListener}
     */
    this.constructor.EditActionListener = function (aModel) {
        /* DEBUG */ dump("Yulup:view.js:View.EditActionListener(\"" + aModel + "\") invoked.\n");

        this.model = aModel;
    };

    this.constructor.EditActionListener.prototype = {
        model: null,

        WillCreateNode: function (aTag, aParent, aPosition) {
            /* DEBUG */ dump("Yulup:view.js:View.EditActionListener.WillCreateNode: tag = \"" + aTag + "\", parent = \"" + aParent.nodeName + "\", position = \"" + aPosition + "\"\n");
        },

        DidCreateNode: function (aTag, aNode, aParent, aPosition, aResult) {
            /* DEBUG */ dump("Yulup:view.js:View.EditActionListener.DidCreateNode:  tag = \"" + aTag + "\", parent = \"" + aParent.nodeName + "\", position = \"" + aPosition + "\", result = \"" + aResult + "\"\n");

            this.model.setDirty();
        },

        WillInsertNode: function (aNode, aParent, aPosition) {
            /* DEBUG */ dump("Yulup:view.js:View.EditActionListener.WillInsertNode: node = \"" + aNode.nodeName + "\", parent = \"" + aParent.nodeName + "\", position = \"" + aPosition + "\"\n");
        },

        DidInsertNode: function (aNode, aParent, aPosition, aResult) {
            /* DEBUG */ dump("Yulup:view.js:View.EditActionListener.DidInsertNode:  node = \"" + aNode.nodeName + "\", parent = \"" + aParent.nodeName + "\", position = \"" + aPosition + "\", result = \"" + aResult + "\"\n");

            this.model.setDirty();
        },

        WillDeleteNode: function (aChild) {
            /* DEBUG */ dump("Yulup:view.js:View.EditActionListener.WillDeleteNode: child = \"" + aChild.nodeName + "\"\n");
        },

        DidDeleteNode: function (aChild, aResult) {
            /* DEBUG */ dump("Yulup:view.js:View.EditActionListener.DidDeleteNode:  child = \"" + aChild.nodeName + "\", result = \"" + aResult + "\"\n");

            this.model.setDirty();
        },

        WillSplitNode: function (aExistingRightNode, aOffset) {
            /* DEBUG */ dump("Yulup:view.js:View.EditActionListener.WillSplitNode:  right node = \"" + aExistingRightNode.nodeName + "\", offset = \"" + aOffset + "\"\n");
        },

        DidSplitNode: function (aExistingRightNode, aOffset, aNewLeftNode, aResult) {
            /* DEBUG */ dump("Yulup:view.js:View.EditActionListener.DidSplitNode:   right node = \"" + aExistingRightNode.nodeName + "\", offset = \"" + aOffset + "\", new left node = \"" + aNewLeftNode.nodeName + "\", result = \"" + aResult + "\"\n");

            this.model.setDirty();
        },

        WillJoinNodes: function (aLeftNode, aRightNode, aParent) {
            /* DEBUG */ dump("Yulup:view.js:View.EditActionListener.WillJoinNodes:  left node = \"" + aLeftNode.nodeName + "\", right node = \"" + aRightNode.nodeName + "\", parent node = \"" + aParent.nodeName + "\"\n");
        },

        DidJoinNodes: function (aLeftNode, aRightNode, aParent, aResult) {
            /* DEBUG */ dump("Yulup:view.js:View.EditActionListener.DidJoinNodes:   left node = \"" + aLeftNode.nodeName + "\", right node = \"" + aRightNode.nodeName + "\", parent node = \"" + aParent.nodeName + "\", result = \"" + aResult + "\"\n");

            this.model.setDirty();
        },

        WillInsertText: function (aTextNode, aOffset, aString) {
            /* DEBUG */ dump("Yulup:view.js:View.EditActionListener.WillInsertText: text node = \"" + aTextNode.nodeName + "\", offset = \"" + aOffset + "\", string = \"" + aString + "\"\n");
        },

        DidInsertText: function (aTextNode, aOffset, aString, aResult) {
            /* DEBUG */ dump("Yulup:view.js:View.EditActionListener.DidInsertText: text node = \"" + aTextNode.nodeName + "\", offset = \"" + aOffset + "\", string = \"" + aString + "\", result = \"" + aResult + "\"\n");

            this.model.setDirty();
        },

        WillDeleteText: function (aTextNode, aOffset, aLength) {
            /* DEBUG */ dump("Yulup:view.js:View.EditActionListener.WillDeleteText: text node = \"" + aTextNode.nodeName + "\", offset = \"" + aOffset + "\", length = \"" + aLength + "\"\n");
        },

        DidDeleteText: function (aTextNode, aOffset, aLength, aResult) {
            /* DEBUG */ dump("Yulup:view.js:View.EditActionListener.DidDeleteText: text node = \"" + aTextNode.nodeName + "\", offset = \"" + aOffset + "\", length = \"" + aLength + "\", result = \"" + aResult + "\"\n");

            this.model.setDirty();
        },

        WillDeleteSelection: function (aSelection) {
            /* DEBUG */ dump("Yulup:view.js:View.EditActionListener.WillDeleteSelection:  selection = \"" + aSelection + "\"\n");
        },

        DidDeleteSelection: function (aSelection) {
            /* DEBUG */ dump("Yulup:view.js:View.EditActionListener.DidDeleteSelection:  selection = \"" + aSelection + "\"\n");

            this.model.setDirty();
        }
    };

    this.controller   = aEditorController;
    this.model        = aModel;
    this.barrier      = aBarrier;
    this.editor       = null;
    this.editviewElem = null;
    this.view         = null;
    this.editorImpl   = null;
    this.isFilled     = false;
}

// TODO: what is that for and who put it here?
View.prototype.controller = null;
View.prototype.model      = null;

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
            }
            // set currently selected view
            previousView = this.controller.activeView;

            this.controller.activeView = this;

            /* If the model was modified or we are hitting the fill
             * for the first time (i.e. we haven't yet filled the view
             * with a document), then fill the view. */
            if (isViewModified || !this.isFilled) {
                // fill view
                this.fillView();
            }

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
        /* DEBUG */ dump("Yulup:view.js:SourceModeView.setUp() invoked\n");

        var sourceEditor             = null;
        var commandControllerContext = null;
        var commandTable             = null;

        try {
            /* DEBUG */ dump("Yulup:view.js:SourceModeView.setUp: this = \"" + this + "\"\n");

            sourceEditor = this.editor;
            sourceEditor.makeEditable("text", false);

            this.editorImpl = sourceEditor.getEditor(sourceEditor.contentWindow);
            this.editorImpl.QueryInterface(Components.interfaces.nsIEditor);

            // hook up DocumentStateListener
            this.editorImpl.addDocumentStateListener(new View.DocumentStateListener(this.model));

            // hook up EditActionListener
            this.editorImpl.addEditActionListener(new View.EditActionListener(this.model));

            this.view = sourceEditor.getEditor(sourceEditor.contentWindow);
            this.view.QueryInterface(Components.interfaces.nsIPlaintextEditor);

            // set editor attributes
            this.view.enableUndo(true);
            this.view.rootElement.style.fontFamily = "-moz-fixed";
            this.view.rootElement.style.whiteSpace = "pre";
            this.view.rootElement.style.margin     = 0;

            // make the caret visible even if the current selection is not collapsed
            this.view.selectionController.setCaretVisibilityDuringSelection(true);

            // set the document URI
            //sourceEditor.docShell.setCurrentURI(this.model.documentURI);

            sourceEditor.contentWindow.addEventListener("keypress", new TextEditorKeyListener(this.view), true);
            sourceEditor.contentWindow.addEventListener("keypress", new GuidedTagInserterKeyListener(this), true);

            // TODO: make this configurable via the preferences system
            if (true) {
                sourceEditor.contentWindow.addEventListener("keypress", new ReadlineKeyBindingsListener(sourceEditor), true);
            }

            /* Prevent keypress events from bubbling to work around
             * bug https://bugzilla.mozilla.org/show_bug.cgi?id=304188
             * (prevent keypress events from invoking FAYT). */
            sourceEditor.contentWindow.addEventListener("keypress", function (aKeyEvent) {
                                                            aKeyEvent.preventBubble();
                                                        }, true);

            // activate guided tag insertion
            this.guidedTagInserter = new GuidedTagInserter(this, document, document.getElementById("uiYulupEditorPromptBox"));

            // clear undo and redo stacks
            this.editorImpl.transactionManager.clear();

            /* DEBUG */ dump("Yulup:view.js:SourceModeView.setUp: initialisation completed\n");
        } catch (exception) {
            /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:view.js:SourceModeView.setUp", exception);
            Components.utils.reportError(exception);
            return;
        }

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
            /* DEBUG */ dumpTree(this.controller.activeView.editor);

            // scroll to the beginning of the document
            this.editor.contentWindow.scrollTo(0, 0);

            // view is now pristine again
            this.view.resetModificationCount();

            // clear undo and redo stacks
            this.editorImpl.transactionManager.clear();

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

    // call super constructor
    this.__proto__.__proto__.constructor.call(this, aEditorController, aModel, aBarrier);

    // register ourselves as an onload listener to get notified when the editor element is initialised
    document.addEventListener("editorinit", this, false);

    // request an editor element
    this.editviewElem = document.getElementById("uiYulupEditorTabbox").createView("wysiwyg", aShowViewCommand, Editor.getStringbundleString("editorTabWYSIWYGView.label"), Editor.getStringbundleString("editorTabWYSIWYGView.tooltip"), this);

    this.editor = this.editviewElem.getView();


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
        /* DEBUG */ dump("Yulup:view.js:WYSIWYGModeView.setUp() invoked\n");
        var wysiwygEditor            = null;
        var commandControllerContext = null;
        var commandTable             = null;

        try {
            /* DEBUG */ dump("Yulup:view.js:WYSIWYGModeView.setUp: this.editor = \"" + this.editor + "\"\n");
            wysiwygEditor = this.editor;
            wysiwygEditor.makeEditable("html", false);

            this.editorImpl = wysiwygEditor.getEditor(wysiwygEditor.contentWindow);
            this.editorImpl.QueryInterface(Components.interfaces.nsIEditor);

            // hook up DocumentStateListener
            this.editorImpl.addDocumentStateListener(new View.DocumentStateListener(this.model));

            // hook up EditActionListener
            this.editorImpl.addEditActionListener(new View.EditActionListener(this.model));

            this.view = wysiwygEditor.getEditor(wysiwygEditor.contentWindow);
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

            // TODO: make this configurable via the preferences system
            if (true) {
                wysiwygEditor.contentWindow.addEventListener("keypress", new ReadlineKeyBindingsListener(wysiwygEditor), true);
            }

            /* Prevent keypress events from bubbling to work around
             * bug https://bugzilla.mozilla.org/show_bug.cgi?id=304188
             * (prevent keypress events from invoking FAYT). */
            wysiwygEditor.contentWindow.addEventListener("keypress", function (aKeyEvent) {
                                                             aKeyEvent.preventBubble();
                                                         }, true);

            // clear undo and redo stacks
            this.editorImpl.transactionManager.clear();

            /* DEBUG */ dump("Yulup:view.js:WYSIWYGModeView.setUp: initialisation completed\n");
        } catch (exception) {
            /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:view.js:WYSIWYGModeView.setUp", exception);
            Components.utils.reportError(exception);
            return;
        }

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

        documentBody = (new WYSIWYGDOMSerialiser(this.editor.contentDocument)).serialise();

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

            // view is now pristine again
            this.view.resetModificationCount();

            // clear undo and redo stacks
            this.editorImpl.transactionManager.clear();

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

        // extract the preamble
        documentPreamble  = aDocument.substring(0, aDocument.search(/<body/i));
        this.documentPreamble = documentPreamble;

        /* DEBUG */ dump("Yulup:view.js:WYSIWYGModeView.setupDocument: document preamble =\n" + this.documentPreamble + "\n");

        // extract the remainder
        documentRemainder = aDocument.substring(aDocument.search(/<body/i));

        /* DEBUG */ dump("Yulup:view.js:WYSIWYGModeView.setupDocument: document remainder =\n" + documentRemainder + "\n");

        // fixup the document
        documentFixup  = "<html><head></head>";
        documentFixup += documentRemainder;

        return documentFixup;
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
 * @param  {YulupEditStateController} aEditorController the editor's state machine
 * @param  {Model}                      aModel            the model associated with this view
 * @param  {Function}                   aShowViewCommand  a function to call to show the current view
 * @param  {Barrier}                    aBarrier          the barrier on which to synchronise after setUp()
 * @param  {XMLDocument}                aXMLStyleDocument the style this view represents
 * @param  {XMLDocument}                aStyleTemplate the style template
 * @param  {String}                     aStyleTemplateMode how the styleTemplate should be applied (pre/post transformation)
 * @return {WYSIWYGXSLTModeView}
 */
function WYSIWYGXSLTModeView(aEditorController, aModel, aShowViewCommand, aBarrier, aXMLStyleDocument, aStyleTemplate, aStyleTemplateMode) {
    /* DEBUG */ dump("Yulup:view.js:WYSIWYGXSLTModeView(\"" + aEditorController + "\", \"" + aModel + "\", \"" + aShowViewCommand + "\", \"" + aBarrier + "\", \"" + aXMLStyleDocument + "\" , \"" + aStyleTemplate + "\") invoked.\n");

    // call super constructor
    //this.__proto__.__proto__.constructor.call(this, aEditorController, aModel, aShowViewCommand);
    // as always, inheritance does not work reliably in SpiderMonkey, therefore name super-constructor explicitely
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

    documentXSL      : null,
    defaultNamespace  : null,
    sourceTaggerXSL  : null,
    styleTemplate    : null,
    domDocument      : null,
    xhtmlDocument    : null,
    xmlSerializer    : null,
    xPathToolBarVisible : true,
    isNamespaceAware   : true,
    currentSourceSelectionPath: null,
    currentXHTMLNode : null,
    currentSourceNode : null,

    /**
     * Initialise the current view.
     *
     * Note that nsIHTMLEditor is also an nsIPlaintextEditor.
     *
     * @return {Undefined} does not have a return value
     */

    setUp: function () {
        var wysiwygXSLTEditor        = null;
        var commandControllerContext = null;
        var commandTable             = null;

        /* DEBUG */ dump("Yulup:view.js:WYSIWYGXSLTModeView.setUp() invoked\n");

        try {
            /* DEBUG */ dump("Yulup:view.js:WYSIWYGXSLTModeView.setUp: this.editor = \"" + this.editor + "\"\n");
            wysiwygXSLTEditor = this.editor;
            wysiwygXSLTEditor.makeEditable("html", false);

            this.editorImpl = wysiwygXSLTEditor.getEditor(wysiwygXSLTEditor.contentWindow);
            this.editorImpl.QueryInterface(Components.interfaces.nsIEditor);

            // hook up DocumentStateListener
            this.editorImpl.addDocumentStateListener(new View.DocumentStateListener(this.model));

            this.view = wysiwygXSLTEditor.getEditor(wysiwygXSLTEditor.contentWindow);
            this.view.QueryInterface(Components.interfaces.nsIHTMLEditor);

            // make the caret visible even if the current selection is not collapsed
            this.view.selectionController.setCaretVisibilityDuringSelection(true);

            // set the document URI
            wysiwygXSLTEditor.docShell.setCurrentURI(this.model.documentReference.getLoadURI());

            /* Due to the implementation of updateBaseURL, this is not going to work as
             * is, so we need a C++ call here (see
             * http://lxr.mozilla.org/mozilla1.8.0/source/editor/libeditor/html/nsHTMLEditor.cpp#1209). */
            this.view.updateBaseURL();

            wysiwygXSLTEditor.contentWindow.addEventListener("keyup", new WYSIWYGXSLTKeyListener(this), true);

            /* Prevent keypress events from bubbling to work around
             * bug https://bugzilla.mozilla.org/show_bug.cgi?id=304188
             * (prevent keypress events from invoking FAYT). */
            wysiwygXSLTEditor.contentWindow.addEventListener("keypress", function (aKeyEvent) {
                                                                 aKeyEvent.preventBubble();
                                                             }, true);

            /** No selection events fired onSelectionChanged so we have to use a mouse listener for keeping track of selection changes **/
            wysiwygXSLTEditor.contentWindow.addEventListener("mousedown", new WYSIWYGXSLTMouseListener(this), true);

            wysiwygXSLTEditor.contentWindow.addEventListener("mousedown", new WYSIWYGXSLTMouseListener(this), true);
            var nsCheckbox = document.getElementById("uiYulupXPathToolBarNSAwareCheckbox");
            nsCheckbox.addEventListener('CheckboxStateChange', new NSCheckboxStateChangeListener(this), true);

            this.editorImpl.transactionManager.clear();

            /* DEBUG */ dump("Yulup:view.js:WYSIWYGModeView.setUp: initialisation completed\n");
        } catch (exception) {
            /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:view.js:WYSIWYGModeView.setUp", exception);
            Components.utils.reportError(exception);
            return;
        }

        /* Set XPathToolBar to visible */

        document.getElementById("uiYulupXPathToolBar").hidden = false;

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

        dump("Default Namespace is: " + defaultNamespace + "\n");
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

          /* DEBUG */ dump("Yulup:view.js:WYSIWYGXSLTModeView.fillView: Default namespace prefix is: " + prefix + "\n");
        }


        /* tag the qualified document source with _yulup-location-path attributes */

        var xsltProcessor = new XSLTProcessor();

        xsltProcessor.importStylesheet(this.sourceTaggerXSL);
        if (defaultNamespace != null && prefix != null) {
          xsltProcessor.setParameter(null, "default-namespace", defaultNamespace);
          xsltProcessor.setParameter(null, "default-prefix", prefix);
        }

        var taggedSourceDocument = xsltProcessor.transformToDocument(this.domDocument);

        /* DEBUG */ dump("Yulup:view.js:WYSIWYGXSLTModeView.fillView: tagged source: " + this.xmlSerializer.serializeToString (taggedSourceDocument) + "\n");

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
              var xincludeElem = styleTemplate.evaluate("//xi:include", styleTemplate, styleTemplate.createNSResolver(styleTemplate.documentElement), XPathResult.ANY_TYPE, null).iterateNext();
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

        /* Serialize the xhtml document before filling the view */
        serializedDoc = this.xmlSerializer.serializeToString(xhtmlDocument);

        /* DEBUG */ // dump("######## Yulup:view.js:WYSIWYGXSLTModeView.fillView: transformed document =\n" + serializedDoc + "\n");

        this.model.preserveDirty = true;

        /* Fill the view */
        try {
            /* What about using this.editor.contentDocument.innerHTML = content, see
             * also https://bugzilla.mozilla.org/show_bug.cgi?id=314987#c2 */
            this.view.rebuildDocumentFromSource(serializedDoc);
            this.view.beginningOfDocument(); // FIXME: cursor should be set to first editable node!

            /* View is now pristine again */
            this.view.resetModificationCount();

            /* Clear undo and redo stacks. Note that undo/redo is currently not implemented. */
            this.editorImpl.transactionManager.clear();

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


    /** returns a document style xslt that propagates _yulup-location-path attributes from a tagged
    ** document source to the transformed xhtmlDocument.
    ** This is needed for mapping selections and text node changes from the xhtmlDocument contained in
    ** the view back to the underlying xml document (source).
    ** A patched document style has
    ** <ul>
    ** <li>@_yulup-location-path attribute selectors pointing to the current context node in all
    ** parent nodes of templateSelectors (xsl:apply-templates). </li>
    ** <li>span tags with @_yulup-location-path attribute selectors surrounding nodeValue selection
    ** directives that point to the current context node. (xsl:value-of select="."/>)</li>
    ** <li>span tags with @_yulup-location-path attributes that concatenate a @_yulup-location-path
    ** selector of the current context node with the nodeValue selector, when pointing to a node relative
    ** to the current context node.(xsl:value-of select="foo/bar/@foo")</li>
    ** <li>span tags with a @_yulup-location-path attribute that simply contains the select pattern of
    ** the contained nodeValue selector, when using absolute node addressing (<xsl:value-of select="/foo/bar")
    ** </li>
    ** </ul>
    ** Note that selectors pointing to $variables are excluded from the patching process.
    **/

    patchDocumentStyle: function (aDocumentXSL) {

        /* DEBUG */ dump("Yulup:view.js:WYSIWYGXSLTModeView.patchDocumentStyle(\"" + aDocumentXSL + "\") invoked\n");

        /* Remove output method declarations to prevent mozilla from inserting crap into the generated xhtml.
        ** Note that this is for cosmetic reasons only and can be removed if experience should prove that
        ** documentStyling depends on the output method specified.
        */

        try {
          var outputMethodNode = aDocumentXSL.evaluate("xsl:stylesheet/xsl:output", aDocumentXSL, aDocumentXSL.createNSResolver(aDocumentXSL.documentElement), XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null).iterateNext();
	      if (outputMethodNode != null)
	        outputMethodNode.parentNode.removeChild(outputMethodNode);
	    } catch (e) {
          dump(e);
        }

        /* Add _yulup-location-path attribute matcher to parent nodes of template selectors */

        try {
          var templateSelectorNodes = aDocumentXSL.evaluate("xsl:stylesheet/*//xsl:apply-templates", aDocumentXSL, aDocumentXSL.createNSResolver(aDocumentXSL.documentElement), XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
          for (var i=0; i< templateSelectorNodes.snapshotLength; i++) {
            parentNode = templateSelectorNodes.snapshotItem(i).parentNode;
            parentNode.setAttribute("_yulup-location-path", "{@_yulup-location-path}");
          }
        } catch (e) {
          dump(e);
        }

        /* Insert _yulup-location-path span node around nodeValue selectors.
        ** Note that for-each directives and $variable selectors are not implemented yet.
        */

        try {
          var nodeValueSelectorNodes = aDocumentXSL.evaluate("xsl:stylesheet//*/xsl:value-of[not(contains(@select, '$'))]", aDocumentXSL, aDocumentXSL.createNSResolver(aDocumentXSL.documentElement), XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
	      span = aDocumentXSL.createElement("span");

          for (var i=0; i< nodeValueSelectorNodes.snapshotLength; i++) {
            selectorNode = nodeValueSelectorNodes.snapshotItem(i);
            var select = selectorNode.getAttribute("select");
            var path = null;

            /* Check if selector uses absolute node addressing. If so set _yulup-location-path to that node.
            ** If relative addressing is used, concatenate _yulup-locatoin-path attribute selector
            ** of the context node with the selected node
            **/
            if (select.indexOf("/") == 0) {
              path = select;
            } else {
              path = "{@_yulup-location-path}/" + select;
            }

            aSpan = span.cloneNode(true);
            aSpan.setAttribute("_yulup-location-path", path);
            aSpan.appendChild(selectorNode.cloneNode(true));
            selectorNode.parentNode.replaceChild(aSpan, selectorNode);
          }
        } catch (e) {
          dump(e);
        }
        // dump("Yulup:view.js:WYSIWYGXSLTModeView.patchDocumentStyle: patched document =\n" + this.xmlSerializer.serializeToString(aDocumentXSL) + "\n");
    },


    /** returns a transformed document after applying aXStylesheetDocument **/

    xsltTransform: function (aDocument, aXStylesheetDocument) {
        var xsltProcessor = null;

        /* DEBUG */ dump("Yulup:view.js:WYSIWYGXSLTModeView.xsltTransform(\"" + aDocument + "\", \"" + aXStylesheetDocument + "\") invoked\n");

        /* DEBUG */ // dump("Yulup:view.js:WYSIWYGXSLTModeView.xsltTransform: applying stylesheet\n" + Components.classes["@mozilla.org/xmlextras/xmlserializer;1"].getService(Components.interfaces.nsIDOMSerializer).serializeToString(aXStylesheetDocument)  + "\nto document\n" + Components.classes["@mozilla.org/xmlextras/xmlserializer;1"].getService(Components.interfaces.nsIDOMSerializer).serializeToString(aDocument)  + "\n");

        xsltProcessor = new XSLTProcessor();

        xsltProcessor.importStylesheet(aXStylesheetDocument);

        return xsltProcessor.transformToDocument(aDocument);
    },


    /** returns a node in the document source based on a passed xhtmlDocument node
    ** by looking up _yulup-location-path attributes in the ancestor-or-self axis
    ** and then issuing an xPath query based on the gathered location path data.
    ** Supports two modes of operation: namespace aware/unware. This is needed for
    ** source documents that do not use namespaces in a standardized way (quite a lot in fact).
    ** Note that no fallback mechanism from namespace aware to unaware is implemented yet.
    **/


    getSourceXPathForXHTMLNode: function (aXHTMLNode, aIsNamespaceAware) {

        var xPathToolBarLabel;
        var domDocument = this.domDocument;
        var xhtmlNode;
        var namespaceAware = aIsNamespaceAware;

        xhtmlNode = aXHTMLNode;

        /* Get a handle on the xPathToolBarLabel displaying a xpath expression for
        ** the current context node
        */
        xPathToolBarLabel = document.getElementById("uiYulupXPathToolBarXPathExpression");


        /** Look up location path by finding nearest _yulup-location-path attribute node.
        ** Note that _yulup-locaton-path values of elements with mixed content do not contain information
        ** about the actual text node selected. There is no way around this because marking source text nodes
        ** with location path information would break styling the document. Therefore text node constraints
        ** have to be estimated based on xhtml to source pattern matching.
        **
        **/

        var locationPath = null;

        while (xhtmlNode.parentNode != null) {
            if (xhtmlNode.nodeType == 1 && xhtmlNode.getAttribute('_yulup-location-path') != null) {
                locationPath = xhtmlNode.getAttribute('_yulup-location-path');
                break;
            }
            xhtmlNode = xhtmlNode.parentNode;
        }

        /* DEBUG */ dump("Yulup:view.js:WYSIWYGXSLTModeView.getSourceXPathForXHTMLNode: Location path: " + locationPath + "\n");


        /* no location path data found. Update toolbar and return null */
        if (locationPath == null || locationPath == "" || locationPath == 'undefined') {
          xPathToolBarLabel.value = "-";
          return null;
        }

        var xPathExpr = locationPath;

        if (!namespaceAware) {
          xPathToolBarLabel.value = "Not yet implemented!";
          return null;
        }

        /* Query the source document for xPathExpr */

        var sourceNode = domDocument.evaluate(xPathExpr, domDocument, domDocument.createNSResolver(domDocument.documentElement), XPathResult.ANY_TYPE, null).iterateNext();

        dump ("Xpath query returned source node: " + sourceNode);

        /** Do a xhtml to source node mapping to add text() constaints */

        if (sourceNode == null) {
          xPathToolBarLabel.value = "Error! No source node for " + xPathExpr;
          return null;
        }

        // Attribute or element node selected
        if (sourceNode.nodeType == 2 || aXHTMLNode.nodeType == 1) {
          xPathToolBarLabel.value = xPathExpr;
          return xPathExpr;
        }

        /* Find a source (text) node with a value equal to selected xhtml node and calculate text()
        ** constraint.
        ** FIXME: Add support for static text generated by documentStyle.
        ** Possibly extend documentXSLPatcher for that.
        */

        if (aXHTMLNode.nodeType == 3) {

          var childNodes = sourceNode.childNodes;
          var textNodeCount = 0;
          var selPosition = null;

          for (var i=0; i < childNodes.length; i++) {
            var childNode = childNodes.item(i);
            if (childNode.nodeType == 3) {
              textNodeCount++;
              if(childNode.nodeValue == aXHTMLNode.nodeValue) {
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

    },


    updateSource: function () {

        if (this.currentSourceNode != null && (this.currentSourceNode.nodeType == 3 || this.currentSourceNode.nodeType == 2)) {
            this.currentSourceNode.nodeValue = this.currentXHTMLNode.nodeValue;
        }

    }

};


function WYSIWYGXSLTKeyListener(aView) {
    this.view = aView;
}


WYSIWYGXSLTKeyListener.prototype = {
    view: null,

    handleEvent: function (aKeyEvent) {
        // hook up paragraph inserter
        this.view.updateSource();

    }
};

function WYSIWYGXSLTMouseListener(aView) {
    this.view = aView;
}


WYSIWYGXSLTMouseListener.prototype = {

    view: null,

    handleEvent: function (aMouseEvent) {

        var node = aMouseEvent.explicitOriginalTarget; // (Mozilla bug 185889)

        this.view.currentXHTMLNode = node;

        var domDocument = this.view.domDocument;
        var xpath = this.view.getSourceXPathForXHTMLNode(node, this.view.isNamespaceAware);

        if (xpath != null && xpath != this.view.currentSourceSelectionPath) {
            dump("xpath is : " + xpath);
            var sourceNode = domDocument.evaluate(xpath, domDocument, domDocument.createNSResolver(domDocument.documentElement), XPathResult.ANY_TYPE, null).iterateNext();
            if (sourceNode != null) {

                /* DEBUG */ dump("Yulup:view.js:WYSIWYGXSLTMouseListener.handleEvent: Setting source node " + sourceNode + " with xpath " + xpath + " as new current node\n");
                this.view.currentSourceSelectionPath = xpath;
                this.view.currentSourceNode = sourceNode;

            } else {
                this.view.currentSourceSelectionPath = null;
                this.view.currentSourceNode = null;
            }
        }
    }
};


function NSCheckboxStateChangeListener(aView) {
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
    dump((new WYSIWYGDOMSerialiser(aEditor.contentDocument)).serialise());
    dump("\n\n");
};


/**
 * WYSIWYGDOMSerialiser constructor. Instantiates a new object of
 * type WYSIWYGDOMSerialiser.
 *
 * @constructor
 * @param  {nsIDOMDocument}       aRootNode the DOM document to serialise
 * @return {WYSIWYGDOMSerialiser}
 */
function WYSIWYGDOMSerialiser(aRootNode) {
    /* DEBUG */ dump("Yulup:view.js:WYSIWYGDOMSerialiser(\"" + aRootNode + "\") invoked\n");

    this.rootNode = aRootNode;
}

WYSIWYGDOMSerialiser.prototype = {
    rootNode:     null,
    outputString: null,

    /**
     * Serialise the body of the DOM document which was set
     * by the constructor.
     *
     * @return {String} a serialisation of the document body
     */
    serialise: function () {
        var bodyNode = null;

        /* DEBUG */ dump("Yulup:view.js:WYSIWYGDOMSerialiser.serialise() invoked\n");

        this.outputString = "";

        // get the <body> element
        bodyNode = this.rootNode.evaluate("//body", this.rootNode, this.rootNode.createNSResolver(this.rootNode), XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null).iterateNext();

        if (!bodyNode)
            throw new YulupEditorException("Yulup:view.js:WYSIWYGDOMSerialiser.serialise: no <body> element found.");

        this.serialiseDOMTree(bodyNode);

        return this.outputString;
    },

    /**
     * Serialise the XML DOM document which was set
     * by the constructor.
     *
     * @return {String} a serialisation of the document body
     */
    serialiseXML: function () {
        var bodyNode = null;

        /* DEBUG */ dump("Yulup:view.js:WYSIWYGDOMSerialiser.serialiseXML() invoked\n");

        this.outputString = "";

        this.serialiseDOMTree(this.rootNode);

        return this.outputString;
    },

    /**
     * Serialise a node and its subtree.
     *
     * @param  {nsIDOMNode} aNode the node to serialise
     * @return {Undefined} does not have a return value
     */
    serialiseDOMTree: function (aNode) {
        var child = null;

        // if emitNodeStart() returns false, don't inspect its children
        if (this.emitNodeStart(aNode)) {
            for (child = aNode.firstChild; child != null; child = child.nextSibling) {
                this.serialiseDOMTree(child);
            }

            this.emitNodeEnd(aNode);
        }
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
        var retVal = true;

        switch (aNode.nodeType) {
        case Components.interfaces.nsIDOMNode.ELEMENT_NODE:
            this.outputString += "<" + aNode.nodeName.toLowerCase();

            if (aNode.hasAttributes()) {
                // emit the attributes
                for (var i = 0; i < aNode.attributes.length; i++) {
                    if (aNode.attributes.item(i).nodeName != "_moz_dirty" && aNode.attributes.item(i).nodeValue.search("_moz") == -1)
                        this.outputString += " " + aNode.attributes.item(i).nodeName + "=\"" + aNode.attributes.item(i).nodeValue + "\"";
                }
            }

            if (aNode.hasChildNodes()) {
                this.outputString += ">";
            } else {
                this.outputString += "/>";
            }
            break;
        case Components.interfaces.nsIDOMNode.TEXT_NODE:
            this.outputString += aNode.nodeValue;
            break;
        case Components.interfaces.nsIDOMNode.CDATA_SECTION_NODE:
            this.outputString += "<![CDATA[" + aNode.nodeValue + "]]>";
            break;
        case Components.interfaces.nsIDOMNode.PROCESSING_INSTRUCTION_NODE:
            this.outputString += "<?" + aNode.target + " " + aNode.data + "?>";
            break;
        case Components.interfaces.nsIDOMNode.COMMENT_NODE:
            this.outputString += "<!--" + aNode.nodeValue + "-->";
            break;
        case Components.interfaces.nsIDOMNode.DOCUMENT_NODE:
            // the document itself; nothing to emit here
            break;
        case Components.interfaces.nsIDOMNode.DOCUMENT_TYPE_NODE:
            // TODO: emit notations (see http://www.w3.org/TR/DOM-Level-2-Core/core.html#ID-412266927)
            this.outputString += "<!DOCTYPE " + aNode.name + (aNode.publicId ? " PUBLIC \"" + aNode.publicId + "\" " : " ")  + "\"" + aNode.systemId + "\">\n";
            break;
        default:
            /* DEBUG */ dump("Yulup:view.js:WYSIWYGDOMSerialiser.emitNodeStart: unknown node \"" + aNode.nodeName + "\" of node type \"" + aNode.nodeType + "\" encountered\n");
            throw new YulupEditorException("Yulup:view.js:WYSIWYGDOMSerialiser.emitNodeStart: unknown node \"" + aNode.nodeName + "\" of node type \"" + aNode.nodeType + "\" encountered.");
        }

        return retVal;
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
        switch (aNode.nodeType) {
            case Components.interfaces.nsIDOMNode.ELEMENT_NODE:
            if (aNode.hasChildNodes()) {
                this.outputString += "</" + aNode.nodeName.toLowerCase() + ">";
            }
            break;
            default:
            // nothing to do here
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

        this.cleanseNodeStart(aNode);
        for (child = aNode.firstChild; child != null; child = child.nextSibling) {
            this.cleanseDOMTree(child);
        }

        this.cleanseNodeEnd(aNode);
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
    cleanseNodeStart: function (aNode) {

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
            /* DEBUG */ dump("Yulup:view.js:WYSIWYGXSLTDOMCleaner.cleanseNodeStart: unknown node \"" + aNode.nodeName + "\" of node type \"" + aNode.nodeType + "\" encountered\n");
            throw new YulupEditorException("Yulup:view.js:WYSIWYGXSLTDOMCleaner.cleanseNodeStart: unknown node \"" + aNode.nodeName + "\" of node type \"" + aNode.nodeType + "\" encountered.");
        }
    },

    /**
     * Clean the passed DOM node.
     *
     * This method should be called after the subtree of the
     * node was visited.
     *
     * @param  {nsIDOMNode} aNode the node to clean
     * @return {Undefined}  does not have a return value
     */
    cleanseNodeEnd: function (aNode) {
        switch (aNode.nodeType) {
            case Components.interfaces.nsIDOMNode.ELEMENT_NODE:
            break;
            default:
            // nothing to do here
        }
    }
};


function TextEditorKeyListener(aEditor) {
    dump("Yulup:view.js:TextEditorKeyListener() invoked\n");

    this.editor = aEditor;
}

TextEditorKeyListener.prototype = {
    editor: null,

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

                if (isAnyModifierKeyButShift)
                    return true;

                // else we insert the tab straight through
                this.editor.QueryInterface(Components.interfaces.nsIPlaintextEditor);
                this.editor.insertText(INSERT_TAB_STRING);

                // we consumed this event
                aKeyEvent.preventDefault();
                return true;
                break;
            }
        }
    }
};


function ReadlineKeyBindingsListener(aEditorElem) {
    /* DEBUG */ dump("Yulup:view.js:ReadlineKeyBindingsListener() invoked\n");

    this.editorElem = aEditorElem;
}

ReadlineKeyBindingsListener.prototype = {
    editorElem: null,

    handleEvent: function (aKeyEvent) {
        var controller = null;

        dump("Yulup:view.js:ReadlineKeyBindingsListener:handleEvent() invoked\n");

        switch (String.fromCharCode(aKeyEvent.charCode)) {
        case "a":
        case "A":
            dump("char code = a\n");
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
            dump("char code = b\n");
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
            dump("char code = d\n");
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
            dump("char code = e\n");
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
            dump("char code = f\n");
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
            dump("char code = h\n");
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
            dump("char code = k\n");
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
            dump("char code = n\n");
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
            dump("char code = p\n");
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
            dump("char code = u\n");
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
            dump("char code = w\n");
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
            dump("char code = _\n");
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
    }
};


function GuidedTagInserterKeyListener(aView) {
    dump("Yulup:view.js:GuidedTagInserterKeyListener() invoked\n");

    this.view = aView;
}

GuidedTagInserterKeyListener.prototype = {
    editor: null,

    handleEvent: function (aKeyEvent) {
        var controller = null;

        dump("Yulup:view.js:GuidedTagInserterKeyListener:handleEvent() invoked\n");

        if (String.fromCharCode(aKeyEvent.charCode) == "i") {
            dump("char code = i\n");

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

        dump("Yulup:view.js:GuidedTagInserter:startTagPrompting() invoked\n");

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
    },

    promptAttributeName: function () {
        var promptLabel   = null;
        var promptTextBox = null;

        dump("Yulup:view.js:GuidedTagInserter:promptAttributeName() invoked\n");

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

        dump("Yulup:view.js:GuidedTagInserter:promptAttributeValue() invoked\n");

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

        dump("Yulup:view.js:GuidedTagInserter:promptEmptyTag() invoked\n");

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
        promptEmptyTagFalseButton.addEventListener("command", this, true);

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
        dump("Yulup:view.js:GuidedTagInserter:finishPrompting(\"" + aOpeningTagString + "\", \"" + aClosingTagString + "\") invoked\n");

        this.clearPromptBox();

        this.promptStage = this.PROMPT_STAGE_UNITIALISED;

        // check if we have something to insert
        if (aOpeningTagString) {
            if (aClosingTagString) {
                /* Check if we have a selecton. If we have one, surround that
                 * selection by the new tag instead of overwriting it. */
                if (this.view.editorImpl.selection.isCollapsed) {
                    // selection is collaped, simply insert

                    //params = Components.classes["@mozilla.org/embedcomp/command-params;1"].createInstance(Components.interfaces.nsICommandParams);
                    //params.setStringValue("state_data", "foo");
                    //controller = this.editorElem.contentWindow.controllers.getControllerForCommand("cmd_insertText");

                    /* Insert text directly because doCommandParams is not exposed via
                     * XPConnect for this controller, and doCommand is not implemented. */
                    this.view.editorImpl.insertText(aOpeningTagString + aClosingTagString);
                } else {
                    // selection is not collapsed, surround the selection
                    this.view.editorImpl.insertText(aOpeningTagString + this.view.editorImpl.selection + aClosingTagString);
                }
            } else {
                /* Ignore a possible selection and simply overwrite it,
                 * because with an empty tag we can't surround anything. */
                this.view.editorImpl.insertText(aOpeningTagString);
            }
        }
    },

    clearPromptBox: function () {
        this.promptContainer.setAttribute("hidden", "true");

        while(this.promptContainer.hasChildNodes())
            this.promptContainer.removeChild(this.promptContainer.firstChild);
    },

    createAbortButton: function () {
        var abortButton = null;

        abortButton = this.xulDocument.createElementNS(XUL_NAMESPACE_URI, "toolbarbutton");
        //abortButton.setAttribute("label", Editor.getStringbundleString("editorGuidedTagInserterAbortButton.label"));
        abortButton.setAttribute("class", "uiEditorFooterToolBarCloseButton");
        abortButton.setAttribute("tooltiptext", Editor.getStringbundleString("editorGuidedTagInserterAbortButton.tooltip"));
        abortButton.setAttribute("id", "uiPromptBoxAbortButton");
        abortButton.addEventListener("command", this, true);

        return abortButton;
    },

    handleEvent: function (aEvent) {
        var enteredText = null;

        dump("Yulup:view.js:GuidedTagInserter:handleEvent(\"" + aEvent + "\") invoked\n");

        if (aEvent.type == "keypress") {
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
