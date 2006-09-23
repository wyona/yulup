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
const EDITOR_MODE_REGULAR = 0;
const EDITOR_MODE_NEUTRON = 1;
const EDITOR_MODE_ATOM    = 2;

var gEditorController = null;

function YulupEditController(aParameterObject) {
    var fromTemplate   = false;
    var templateString = null;
    var documentSuffix = null;

    /* DEBUG */ dump("Yulup:controller.js:YulupEditController(\"" + aParameterObject + "\") invoked\n");

    // public static methods

    /**
     * Shows the passed view.
     *
     * Note that you have to switch the tab to the view
     * by yourself.
     *
     * @param  {View}      aView the view to show
     * @param  {String}    aTitle a window title
     * @return {Undefined} does not have a return value
     */
    this.constructor.onCommandShowView = function (aView, aTitle) {
        var switchSuccessful = false;

        /* DEBUG */ dump("Yulup:controller.js:YulupEditController.onCommandShowView(\"" + aView + "\", " + aTitle + "\") invoked\n");

        // check if editor initialisation has been completed
        if (gEditorController.initialised) {
            try {
                switchSuccessful = aView.show();
            } catch (exception) {
                alert(Editor.getStringbundleString("editorTabSwitchError.label") + "\n\n" + exception.message);
            }
        }

        if (switchSuccessful)
            YulupEditController.updateWindowTitle(aTitle);
    };

    /**
     * Updates the title of the window according to the currently
     * selected view.
     *
     * @return {Undefined} does not have a return value
     */
    this.constructor.updateWindowTitle = function (aViewIndicator) {
        /* DEBUG */ dump("Yulup:controller.js:YulupEditController.updateWindowTitle() invoked\n");

        windowTitle = EDITOR_WINDOW_TITLE;
        if (gEditorController.document.getScreenName()) {
            windowTitle += " - " + gEditorController.document.getScreenName();
        }
        document.title = windowTitle +  " (" + aViewIndicator + ")";
    };

    /**
     * Check which tab is currently selected and run
     * its activation code.
     *
     * @return {Undefined} does not have a return value
     */
    this.constructor.updateView = function () {
        /* DEBUG */ dump("Yulup:controller.js:YulupEditController.updateView() invoked\n");

        document.getElementById("uiYulupEditorTabbox").selectedTab.doCommand();
    };

    /**
     * Initialises the document with data from the neutron-archive, then
     * continues with the editor initialisation
     *
     * @param  {nsIFile}   aResultFile
     * @param  {Exception} aException
     * @return {Undefined} does not have a return value
     */
    this.constructor.archiveLoadFinished = function (aResultFile, aException) {
       /* DEBUG */ dump("Yulup:controller.js:YulupEditController.archiveLoadFinished() invoked\n");

       /* DEBUG */ YulupDebug.ASSERT(gEditorController != null && gEditorController.editStateController);

        try {
            if (aResultFile) {
                /* DEBUG */ dump("Yulup:controller.js:YulupEditController.archiveLoadFinished: archive file: " + aResultFile + "\n");

                gEditorController.archive.extractNeutronArchive();
                gEditorController.editorParams.substituteIntrospectionParams(gEditorController.archive.introspection);

                gEditorController.constructor.enterStageTemplateLoad(null, null);
            } else {
                /* DEBUG */ dump("Yulup:controller.js:YulupEditController.archiveLoadFinished: failed to load Neutron archive \"" + gEditorController.archive.loadURI.spec + "\": \"" + aException + "\"\n");

                if (aException && (aException instanceof NeutronProtocolException || aException instanceof NeutronAuthException)) {
                    // report error message retrieved from response
                    throw new YulupException(Editor.getStringbundleString("editorDocumentLoadError0.label") + " \"" + gEditorController.archive.loadURI.spec + "\".\n" + Editor.getStringbundleString("editorDocumentLoadServerError.label") + ": " + aException.message + ".");
                } else
                    throw new YulupException(Editor.getStringbundleString("editorDocumentLoadError0.label") + " \"" + gEditorController.archive.loadURI.spec + "\".");
            }
        } catch (exception) {
            /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:controller.js:YulupEditController.archiveLoadFinished", exception);

            alert(Editor.getStringbundleString("editorDocumentLoadFailure.label") + "\n\n" + exception.message);

            gEditorController.editStateController.modelStateChanged("openfailed");
            return;
        }

    };

    /**
     * Register the downloaded widget in the WidgetManager
     *
     * @param  {nsIFile}   aResultFile the downloaded widget icon file
     * @param  {Exception} aException
     * @param  {Widget}    aWidget     the widget belonging to to aResultFile
     * @return {Undefined} does not have a return value
     */
    this.constructor.widgetLoadFinished = function (aResultFile, aException, aWidget) {
        /* DEBUG */ dump("Yulup:controller.js:YulupEditController.widgetLoadFinished() invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aResultFile ? aWidget != null : true);

        if (aResultFile) {
            gEditorController.widgetManager.installWidget(aWidget);
        } else {
            if (aException) {
                // TODO: Widget-loading exception handling needs some spec coverage
                UlyssedDebug.dumpExceptionToConsole(aException);
                Components.utils.reportError(aException);
            }
        }

        // arrive at widget barrier
        /* DEBUG */ dump("%%%%%%%%%%%%%%% Yulup:controller.js:YulupEditController.widgetLoadFinished: arrive at widget barrier (current thread count is \"" + gEditorController.widgetBarrier.noOfThreads + "\")\n");
        gEditorController.widgetBarrier.arrive();
    }

    /**
     * Sets the model associated with this controller to the passed document data. If you
     * pass it an exception, the exception will be shown.
     *
     * @param  {String}    aDocumentData the document
     * @param  {Error}     aException    an exception
     * @return {Undefined} does not have a return value
     */
    this.constructor.documentLoadFinished = function (aDocumentData, aException) {
        /* DEBUG */ dump("Yulup:controller.js:YulupEditController.documentLoadFinished() invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(gEditorController && gEditorController.editStateController);

        try {
            if (aDocumentData) {
                gEditorController.model.initDocument(aDocumentData);
                gEditorController.editStateController.modelStateChanged("opensucceeded");

                // arrive at load barrier
                /* DEBUG */ dump("%%%%%%%%%%%%%%% Yulup:controller.js:YulupEditController.documentLoadFinished: arrive at load barrier (current thread count is \"" + gEditorController.loadBarrier.noOfThreads + "\")\n");
                gEditorController.loadBarrier.arrive();
            } else {
                /* DEBUG */ dump("Yulup:controller.js:YulupEditController.documentLoadFinished: failed to load \"" + gEditorController.document.loadURI.spec + "\"). \"" + aException + "\"\n");

                if (aException && (aException instanceof NeutronProtocolException || aException instanceof NeutronAuthException)) {
                    // report error message retrieved from response
                    throw new YulupException(Editor.getStringbundleString("editorDocumentLoadError0.label") + " \"" + gEditorController.document.loadURI.spec + "\".\n" + Editor.getStringbundleString("editorDocumentLoadServerError.label") + ": " + aException.message + ".");
                } else
                    throw new YulupException(Editor.getStringbundleString("editorDocumentLoadError0.label") + " \"" + gEditorController.document.loadURI.spec + "\".");
            }
        } catch (exception) {
            /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:controller.js:YulupEditController.documentLoadFinished", exception);

            alert(Editor.getStringbundleString("editorDocumentLoadFailure.label") + "\n\n" + exception.message);

            gEditorController.editStateController.modelStateChanged("openfailed");
            return;
        }
    };

    this.constructor.widgetLoadingComplete = function () {
        /* DEBUG */ dump("Yulup:controller.js:YulupEditController.widgetLoadingComplete() invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(gEditorController != null);

        // arrive at load barrier
        /* DEBUG */ dump("%%%%%%%%%%%%%%% Yulup:controller.js:YulupEditController.widgetLoadingComplete: arrive at load barrier (current thread count is \"" + gEditorController.loadBarrier.noOfThreads + "\")\n");
        gEditorController.loadBarrier.arrive();
    };

    /**
     * Starts the editor with the specified neutron archive.
     *
     * @param  {NeutronArchive} aNeutronArchive the neutron archive, to be loaded
     * @return {Undefined} does not have a return value
     */
    this.constructor.enterStageNeutronArchiveLoad = function (aNeutronArchive) {
        /* DEBUG */ dump("Yulup:controller.js:YulupEditController.enterStageNeutronArchiveLoad() invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aNeutronArchive   != null);
        /* DEBUG */ YulupDebug.ASSERT(Editor            != null);
        /* DEBUG */ YulupDebug.ASSERT(gEditorController != null && gEditorController.editStateController);

        try {
            aNeutronArchive.loadNeutronArchive(YulupEditController.archiveLoadFinished);
        } catch (exception) {
            /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:controller.js:YulupEditController.enterStageNeutronArchiveLoad", exception);

            alert(Editor.getStringbundleString("editorDocumentLoadFailure.label") + "\n\n" + exception.message);

            gEditorController.editStateController.modelStateChanged("openfailed");
            return;
        }
    };

    /**
     * Starts the editor.
     *
     * @param  {Boolean}  aFromTemplate   defines wether the editor is started with a template
     * @param  {String}   aTemplateString the template body as a string
     * @return {Undefined} does not have a return value
     */
    this.constructor.enterStageTemplateLoad = function () {
        var templateArchiveURI = null;
        var context            = null;

        /* DEBUG */ dump("Yulup:controller.js:YulupEditController.enterStageTemplateLoad() invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(gEditorController != null && gEditorController.editStateController);

        /* DEBUG */ dump("Yulup:controller.js:YulupEditController.enterStageTemplateLoad: document type = \"" + gEditorController.editorParams.contentType + "\"\n");

        // get template nar file for this document type
        if ((templateArchiveURI = gEditorController.archiveRegistry.getArchiveURI(gEditorController.editorParams.contentType)) != null) {
            gEditorController.templateArchive = new NeutronArchive(templateArchiveURI);
            // load the local archive 
            gEditorController.templateArchive.loadNeutronArchive(null, true);
            gEditorController.templateArchive.extractNeutronArchive();
            gEditorController.editorParams.mergeIntrospectionParams(gEditorController.templateArchive.introspection);
        }

        YulupEditController.enterStageDocumentLoad();
    };

    this.constructor.enterStageDocumentLoad = function () {
        /* DEBUG */ dump("Yulup:controller.js:YulupEditController.enterStageDocumentLoad() invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(gEditorController != null && gEditorController.editStateController);

        // load widgets
        if (gEditorController.editorParams.widgets) {
            // init load barrier
            gEditorController.loadBarrier = new Barrier(2, YulupEditController.enterStageViewInitialisation, null);

            gEditorController.widgetManager.addWidgets(gEditorController.editorParams.widgets);

            // init widget barrier
            gEditorController.widgetBarrier = new Barrier(gEditorController.widgetManager.getWidgetCount(), YulupEditController.widgetLoadingComplete, null);

            gEditorController.widgetManager.loadWidgets(YulupEditController.widgetLoadFinished);
        } else {
            // init load barrier
            gEditorController.loadBarrier = new Barrier(1, YulupEditController.enterStageViewInitialisation, null);
        }

        // instantiate the document, depending on type
        switch (gEditorController.editorMode) {
            case EDITOR_MODE_NEUTRON:
                if (gEditorController.editorParams.loadStyle == "open") {
                    gEditorController.document = new NeutronDocument(gEditorController.editorParams.openURI,
                                                                     gEditorController.editorParams.openMethod,
                                                                     gEditorController.editorParams.saveURI,
                                                                     gEditorController.editorParams.saveMethod,
                                                                     gEditorController.editorParams.contentType,
                                                                     gEditorController.editorParams.screenName,
                                                                     gEditorController.editorParams.schemas,
                                                                     gEditorController.editorParams.styles,
                                                                     gEditorController.editorParams.styleTemplate,
                                                                     gEditorController.editorParams.loadStyle);
                } else {
                    gEditorController.document = new NeutronDocument(gEditorController.editorParams.checkoutURI,
                                                                     gEditorController.editorParams.checkoutMethod,
                                                                     gEditorController.editorParams.checkinURI,
                                                                     gEditorController.editorParams.checkinMethod,
                                                                     gEditorController.editorParams.contentType,
                                                                     gEditorController.editorParams.screenName,
                                                                     gEditorController.editorParams.schemas,
                                                                     gEditorController.editorParams.styles,
                                                                     gEditorController.editorParams.styleTemplate,
                                                                     gEditorController.editorParams.loadStyle);
                }
            break;

            case EDITOR_MODE_ATOM:
                gEditorController.document = new AtomDocument(gEditorController.editorParams.uri, gEditorController.editorParams.feedURI, gEditorController.editorParams.contentType, gEditorController.editorParams.schemas, gEditorController.editorParams.styles, gEditorController.editorParams.styleTemplate);
                break;

            default:
                gEditorController.document = new Document(gEditorController.editorParams.uri, gEditorController.editorParams.contentType, null, /* documentSuffix */ null, gEditorController.editorParams.schemas, gEditorController.editorParams.styles, gEditorController.editorParams.styleTemplate);
        }

        // instantiate the model
        gEditorController.model = new Model(gEditorController.editStateController, gEditorController.document);

        try {
            try {
                // note that the loadBarrier.arrive() is called in documentLoadFinshed
                gEditorController.document.loadDocument(YulupEditController.documentLoadFinished);
            } catch (exception) {
                /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:controller.js:YulupEditController", exception);
                throw new YulupEditorException(Editor.getStringbundleString("editorDocumentLoadError0.label") + " \"" + gEditorController.document.loadURI.spec + "\".\n" + Editor.getStringbundleString("editorDocumentLoadError1.label"));
            }
        } catch (exception) {
            /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:controller.js:YulupEditController", exception);

            alert(Editor.getStringbundleString("editorDocumentLoadFailure.label") + "\n\n" + exception.message);

            gEditorController.editStateController.modelStateChanged("openfailed");
            return;
        }
    };

    this.constructor.enterStageViewInitialisation = function () {
        /* DEBUG */ dump("Yulup:controller.js:YulupEditController.enterStageViewInitialisation() invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(gEditorController && gEditorController.editStateController);

        // initialise view barrier
        if (gEditorController.document.isContentHTML() || gEditorController.document.hasStyles()) {
            gEditorController.viewBarrier = new Barrier(3, YulupEditController.startEditor, null);
        } else {
            // no wysiwyg mode view
            gEditorController.viewBarrier = new Barrier(2, YulupEditController.startEditor, null);
        }

        // initialise the views
        if (gEditorController.document.isContentHTML()) {
            gEditorController.wysiwygModeView = new WYSIWYGModeView(gEditorController, gEditorController.model, YulupEditController.onCommandShowView, gEditorController.viewBarrier);
        } else if (gEditorController.document.hasStyles()) {
            // TODO: instantiate a view for every available style. At the moment, we only show the first associated style.
            gEditorController.wysiwygModeView = new WYSIWYGXSLTModeView(gEditorController, gEditorController.model, YulupEditController.onCommandShowView, gEditorController.viewBarrier, gEditorController.document.getAssociates().getStyle(0), gEditorController.document.getAssociates().getStyleTemplate(), gEditorController.document.getStyleTemplateMode());
        }

        gEditorController.sourceModeView  = new SourceModeView(gEditorController, gEditorController.model, YulupEditController.onCommandShowView, gEditorController.viewBarrier);

        /* DEBUG */ dump("%%%%%%%%%%%%%%% Yulup:controller.js:YulupEditController.enterStageViewInitialisation: arrive at view barrier (current thread count is \"" + gEditorController.viewBarrier.noOfThreads + "\")\n");
        gEditorController.viewBarrier.arrive();
    };

    /**
     * Starts the editor. Note that this is the second part
     * of the editor initialisation, and must not be called
     * without having finished the first part of the
     * initialisation before.
     *
     * @param  {YulupEditController} the editor controller
     * @return {Undefined}             does not have a return value
     */
    this.constructor.startEditor = function () {
        /* DEBUG */ dump("Yulup:controller.js:YulupEditController.startEditor() invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(gEditorController && gEditorController.editStateController);

        // startup completed
        gEditorController.initialised = true;

        // select the first tab
        document.getElementById("uiYulupEditorTabbox").selectedIndex = 0;

        /* Document load sucessful. Therefore, we can show the editor
         * since nothing should be able to fail from this point on which
         * would make us unable to have something to edit. */
        document.getElementById("uiYulupEditorContentDeck").selectedIndex = 1;

        // editor initialisation completed
        gEditorController.editStateController.modelStateChanged("editorinitialised");

        YulupEditController.updateView();

        // give information about the views
        /* DEBUG */ YulupEditController.viewInfo();
    };

    this.constructor.viewInfo = function () {
        if (gEditorController.sourceModeView) {
             dump("Yulup:controller.js:YulupEditController.startEditor: sourceModeView.view.contentsMIMEType = \"" + gEditorController.sourceModeView.view.contentsMIMEType + "\".\n");
             dump("Yulup:controller.js:YulupEditController.startEditor: sourceModeView.view.documentCharacterSet = \"" + gEditorController.sourceModeView.view.documentCharacterSet + "\".\n");
             dump("Yulup:controller.js:YulupEditController.startEditor: sourceModeView.view.document = \"" + gEditorController.sourceModeView.view.document + "\".\n");
             dump("Yulup:controller.js:YulupEditController.startEditor: sourceModeView.view.document.baseURI = \"" + gEditorController.sourceModeView.view.document.baseURI + "\".\n");
        }

        if (gEditorController.wysiwygModeView) {
             dump("Yulup:controller.js:YulupEditController.startEditor: wysiwygModeView.view.contentsMIMEType = \"" + gEditorController.wysiwygModeView.view.contentsMIMEType + "\".\n");
             dump("Yulup:controller.js:YulupEditController.startEditor: wysiwygModeView.view.documentCharacterSet = \"" + gEditorController.wysiwygModeView.view.documentCharacterSet + "\".\n");
             dump("Yulup:controller.js:YulupEditController.startEditor: wysiwygModeView.view.document = \"" + gEditorController.wysiwygModeView.view.document + "\".\n");
             dump("Yulup:controller.js:YulupEditController.startEditor: wysiwygModeView.view.document.baseURI = \"" + gEditorController.wysiwygModeView.view.document.baseURI + "\".\n");
        }
    };

    // public instance attributes
    this.initialised         = false;
    this.editorMode          = null;
    this.editorParams        = null;
    this.model               = null;
    this.document            = null;
    this.sourceModeView      = null;
    this.wysiwygModeView     = null;
    this.activeView          = null;
    this.editStateController = null;
    this.templateBarrier     = null;
    this.loadBarrier         = null;
    this.widgetBarrier       = null;
    this.viewBarrier         = null;
    this.widgetManager       = null;
    this.archiveRegistry     = null;
    this.archive             = null;
    this.templateArchive     = null;

    if (aParameterObject) {
        /* Parameters did reach us, therefore we can remove our
         * paramters object from the manager. */
        gMainBrowserWindow.yulup.instancesManager.removeInstance(aParameterObject.instanceID);

        this.editorParams    = aParameterObject.parameters;
        this.archiveRegistry = aParameterObject.archiveRegistry;

        buildNewMenu(this.archiveRegistry.getAvailableTemplates(), document.getElementById("uiYulupOperationNewFromTemplateLocalMenupopup"), document.getElementById("uiYulupOperationNewFromTemplateLocalMenu"), "Editor.createNew");

        switch (this.editorParams.type) {
            case "NeutronEditorParameters":
                /* DEBUG */ dump("Yulup:controller.js:YulupEditController: parameters are of type NeutronEditorParameters\n");
                this.editorMode = EDITOR_MODE_NEUTRON;
                break;
            case "AtomEditorParameters":
                /* DEBUG */ dump("Yulup:controller.js:YulupEditController: parameters are of type AtomEditorParameters\n");
                this.editorMode = EDITOR_MODE_ATOM;
                break;
            default:
                /* DEBUG */ dump("Yulup:controller.js:YulupEditController: parameters are of type EditorParameters\n");
                this.editorMode = EDITOR_MODE_REGULAR;
        }

        if (!this.editorParams.contentType) {
            /* TODO: either there is no introspection file available, or the content type was not defined in there. We now have to
             * somehow find out what content type the document has. Just set it to "text/html" for the moment as a workaround. */
            this.editorParams.contentType = "text/html";
        }

        // initialise the WidgetManager
        this.widgetManager = new WidgetManager(aParameterObject.instanceID);
    } else {
        this.editorParams = new EditorParameters(null, null, null, null, null, null, "blank");
    }

    // check if we have to load a Neutron archive
    if (this.editorMode == EDITOR_MODE_NEUTRON && this.editorParams.contentType == "application/neutron-archive") {
        if (this.editorParams.loadStyle == "open") {
            this.archive  = new NeutronArchive(this.editorParams.openURI);
        } else {
            this.archive  = new NeutronArchive(this.editorParams.checkoutURI);
        }
    }

    this.editStateController = new YulupEditStateController();

    gEditorController = this;

    if (this.archive) {
        this.constructor.enterStageNeutronArchiveLoad(this.archive);
    } else {
        this.constructor.enterStageTemplateLoad();
    }
}

function YulupEditStateController() {
    // set state variables
    this.STATE_SUPERIOR_UNITIALISED   =     1;
    this.STATE_UNINITIALISED          =     2 | this.STATE_SUPERIOR_UNITIALISED;
    this.STATE_DOCUMENTLOADED         =     4 | this.STATE_SUPERIOR_UNITIALISED;
    this.STATE_DOCUMENTNEW            =     8 | this.STATE_SUPERIOR_UNITIALISED;
    this.STATE_NODOCUMENT             =    16 | this.STATE_SUPERIOR_UNITIALISED;

    this.STATE_SUPERIOR_EDITORREADY   =   256;
    this.STATE_NODOCUMENT_READY       =   512 | this.STATE_SUPERIOR_EDITORREADY;

    this.STATE_SUPERIOR_DOCUMENTOK    =  4096 | this.STATE_SUPERIOR_EDITORREADY;
    this.STATE_DOCUMENTREADY_PRISTINE =  8192 | this.STATE_SUPERIOR_DOCUMENTOK;
    this.STATE_DOCUMENTREADY_MODIFIED = 16384 | this.STATE_SUPERIOR_DOCUMENTOK;

    this.currentState = this.STATE_UNINITIALISED;
}

YulupEditStateController.prototype = {
    currentState:   null,

    STATE_SUPERIOR_UNITIALISED:   0,
    STATE_UNINITIALISED:          0,
    STATE_DOCUMENTLOADED:         0,
    STATE_DOCUMENTNEW:            0,
    STATE_NODOCUMENT:             0,
    STATE_SUPERIOR_DOCUMENTOK:    0,
    STATE_DOCUMENTREADY_PRISTINE: 0,
    STATE_DOCUMENTREADY_MODIFIED: 0,
    STATE_SUPERIOR_EDITORREADY:   0,
    STATE_NODOCUMENT_READY:       0,

    isCurrentState: function (aState) {
        /* DEBUG */ dump("Yulup:controller.js:YulupEditStateController.isCurrentState(\"" + aState + "\") invoked\n");
        return (this.currentState & aState) == aState;
    },

    addStateString: function (aString, aStringToAdd) {
        if (aString == "") {
            aString += aStringToAdd;
        } else {
            aString += " " + aStringToAdd;
        }
        return aString;
    },

    translateState: function (aState) {
        var stateString = "";

        // translate state to human-readable string
        if ((aState & this.STATE_SUPERIOR_UNITIALISED) == this.STATE_SUPERIOR_UNITIALISED)
            stateString = this.addStateString(stateString, "STATE_SUPERIOR_UNITIALISED");
        if ((aState & this.STATE_UNINITIALISED) == this.STATE_UNINITIALISED)
            stateString = this.addStateString(stateString, "STATE_UNINITIALISED");
        if ((aState & this.STATE_DOCUMENTLOADED) == this.STATE_DOCUMENTLOADED)
            stateString = this.addStateString(stateString, "STATE_DOCUMENTLOADED");
        if ((aState & this.STATE_DOCUMENTNEW) == this.STATE_DOCUMENTNEW)
            stateString = this.addStateString(stateString, "STATE_DOCUMENTNEW");
        if ((aState & this.STATE_NODOCUMENT) == this.STATE_NODOCUMENT)
            stateString = this.addStateString(stateString, "STATE_NODOCUMENT");
        if ((aState & this.STATE_SUPERIOR_DOCUMENTOK) == this.STATE_SUPERIOR_DOCUMENTOK)
            stateString = this.addStateString(stateString, "STATE_SUPERIOR_DOCUMENTOK");
        if ((aState & this.STATE_DOCUMENTREADY_PRISTINE) == this.STATE_DOCUMENTREADY_PRISTINE)
            stateString = this.addStateString(stateString, "STATE_DOCUMENTREADY_PRISTINE");
        if ((aState & this.STATE_DOCUMENTREADY_MODIFIED) == this.STATE_DOCUMENTREADY_MODIFIED)
            stateString = this.addStateString(stateString, "STATE_DOCUMENTREADY_MODIFIED");
        if ((aState & this.STATE_SUPERIOR_EDITORREADY) == this.STATE_SUPERIOR_EDITORREADY)
            stateString = this.addStateString(stateString, "STATE_SUPERIOR_EDITORREADY");
        if ((aState & this.STATE_NODOCUMENT_READY) == this.STATE_NODOCUMENT_READY)
            stateString = this.addStateString(stateString, "STATE_NODOCUMENT_READY");

        return stateString;
    },

    illegalTransition: function (aTransition, aState) {
        /* DEBUG */ dump("Yulup:controller.js:YulupEditStateController.illegalTransition: transition \"" + aTransition + "\" not allowed on state \"" + aState + " (" + this.translateState(aState) + ")\"\n");

        throw new YulupEditorException("Illegal transition \"" + aTransition + "\" on state \"" + aState + " (" + this.translateState(aState) + ")\".");
    },

    modelStateChanged: function (aTransition) {
        var fileOperationSaveMenuActivate = false;

        /* DEBUG */ dump("********************* Yulup:controller.js:YulupEditStateController.modelStateChanged(\"" + aTransition + "\") invoked *********************\n");

        switch (aTransition) {
            case "opensucceeded":
                if (this.currentState == this.STATE_UNINITIALISED) {
                    this.currentState = this.STATE_DOCUMENTLOADED;
                } else {
                    this.illegalTransition(aTransition, this.currentState);
                    return;
                }
                break;
            case "newsucceeded":
                if (this.currentState == this.STATE_UNINITIALISED) {
                    this.currentState = this.STATE_DOCUMENTNEW;
                } else {
                    this.illegalTransition(aTransition, this.currentState);
                    return;
                }
                break;
            case "openfailed":
                if (this.currentState == this.STATE_UNINITIALISED) {
                    this.currentState = this.STATE_NODOCUMENT;
                } else {
                    this.illegalTransition(aTransition, this.currentState);
                    return;
                }

                document.getElementById("uiYulupEditorWaitDescription").setAttribute("hidden", true);
                document.getElementById("broadcaster_yulup_openfailed").setAttribute("disabled", false);

                break;
            case "editorinitialised":
                switch (this.currentState) {
                    case this.STATE_DOCUMENTLOADED:
                        this.currentState = this.STATE_DOCUMENTREADY_PRISTINE;
                        // check for introspection (save and checkin)
                        if (gEditorController.document instanceof NeutronDocument) {
                            if (gEditorController.document.getLoadStyle() == "open") {
                                // disable save operation
                                document.getElementById("uiFileOperationSaveCMSMenuitem").setAttribute("disabled", true);
                            }
                            if (gEditorController.document.getLoadStyle() == "checkout") {
                                // disable checkin operation
                                // TODO: at the moment, <save> == <checkin>
                                document.getElementById("uiFileOperationSaveCMSMenuitem").setAttribute("disabled", true);
                            }
                        }

                        if (gEditorController.document instanceof AtomDocument) {
                            document.getElementById("uiFileOperationSaveCMSMenuitem").setAttribute("disabled", true);
                            document.getElementById("uiFileOperationSaveCMSMenuitem").setAttribute("disabled", true);
                        }

                        // deactivate "save" menu
                        document.getElementById("uiFileOperationSave").setAttribute("disabled", true);

                        // activate widgets, if present
                        if (document.getElementById('uiYulupWidgetToolbarbuttons').hasChildNodes()) {
                            document.getElementById('uiYulupWidgetToolbarSeparator').removeAttribute("hidden");
                            document.getElementById('uiYulupWidgetToolbarbuttons').removeAttribute("hidden");
                        }
                        break;
                    case this.STATE_DOCUMENTNEW:
                        this.currentState = this.STATE_DOCUMENTREADY_MODIFIED;
                        break;
                    case this.STATE_NODOCUMENT:
                        this.currentState = this.STATE_NODOCUMENT_READY;
                        break;
                    default:
                        this.illegalTransition(aTransition, this.currentState);
                        return;
                }

                document.getElementById("broadcaster_yulup_editorinitialised").setAttribute("disabled", false);

                break;
            case "modified":
                if (this.currentState == this.STATE_DOCUMENTREADY_PRISTINE) {
                    this.currentState = this.STATE_DOCUMENTREADY_MODIFIED;
                    // check for introspection (save and checkin)
                    if (gEditorController.document instanceof NeutronDocument) {
                        if (gEditorController.document.getLoadStyle() == "open") {
                            // enable save operation
                            document.getElementById("uiFileOperationSaveCMSMenuitem").setAttribute("disabled", false);
                            fileOperationSaveMenuActivate = true;
                        }
                        if (gEditorController.document.getLoadStyle() == "checkout") {
                            // enable checkin operation
                            // TODO: at the moment, <save> == <checkin>
                            document.getElementById("uiFileOperationSaveCMSMenuitem").setAttribute("disabled", false);
                            fileOperationSaveMenuActivate = true;
                        }
                    }

                    if (gEditorController.document instanceof AtomDocument) {
                        document.getElementById("uiFileOperationSaveCMSMenuitem").setAttribute("disabled", false);
                        fileOperationSaveMenuActivate = true;
                    }

                    if (gEditorController.document.getLocalSavePath()) {
                        // activate "save file" menuitem
                        document.getElementById("uiFileOperationSaveLocalMenuitem").setAttribute("disabled", false);
                        fileOperationSaveMenuActivate = true;
                    }

                    // activate "save" menu
                    if (fileOperationSaveMenuActivate)
                        document.getElementById("uiFileOperationSave").setAttribute("disabled", false);
                } else {
                    this.illegalTransition(aTransition, this.currentState);
                    return;
                }
                break;
            case "saved":
                if (this.currentState == this.STATE_DOCUMENTREADY_MODIFIED) {
                    this.currentState = this.STATE_DOCUMENTREADY_PRISTINE;
                    // deactivate "save" menu
                    document.getElementById("uiFileOperationSave").setAttribute("disabled", true);

                    // check for introspection (save and checkin)
                    if (gEditorController.document instanceof NeutronDocument) {
                        if (gEditorController.document.getLoadStyle() == "open") {
                            // enable save operation
                            document.getElementById("uiFileOperationSaveCMSMenuitem").setAttribute("disabled", true);
                        }
                        if (gEditorController.document.getLoadStyle() == "checkout") {
                            // enable checkin operation
                            // TODO: at the moment, <save> == <checkin>
                            document.getElementById("uiFileOperationSaveCMSMenuitem").setAttribute("disabled", true);
                        }
                    }

                    if (gEditorController.document instanceof AtomDocument) {
                        document.getElementById("uiFileOperationSaveCMSMenuitem").setAttribute("disabled", true);
                    }

                    // deactivate "save file" menuitem
                    document.getElementById("uiFileOperationSaveLocalMenuitem").setAttribute("disabled", true);
                } else {
                    this.illegalTransition(aTransition, this.currentState);
                    return;
                }
                break;
            default:
                /* DEBUG */ dump("Yulup:controller.js:YulupEditStateController.modelStateChanged: unknown state transition \"" + aTransition + "\"\n");
                throw new YulupEditorException("Unknown state transition \"" + aTransition + "\".");
        }
    }
};
