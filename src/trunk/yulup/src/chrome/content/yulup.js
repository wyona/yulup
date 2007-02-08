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

const YULUP_EDITOR_CHROME_URI      = "chrome://yulup/content/editor/editor.xul";
const YULUP_ABOUT_CHROME_URI       = "chrome://yulup/content/about.xul";
const YULUP_PREFERENCES_CHROME_URI = "chrome://yulup/content/preferences/preferences.xul";
const YULUP_WS_WIZARD_CHROME_URI   = "chrome://yulup/content/wizards/workspacewizard.xul";
const YULUP_HELP_URI               = "chrome://yulup/content/help/user-manual/user_manual.xhtml";
const YULUP_DEMO_SITE_URI          = "http://demo.yulup.org/";
const YULUP_WEB_SITE_URI           = "http://www.yulup.org/";

const INTROSPECTION_TYPE_NEUTRON = 0;
const INTROSPECTION_TYPE_APP     = 1;

var gMainBrowserWindow           = null;
var gCurrentNeutronIntrospection = null;
var gInstancesManager            = null;

/* Registers our init code to be run (see
 * http://developer.mozilla.org/en/docs/Extension_FAQ#Why_doesn.27t_my_script_run_properly.3F) */
window.addEventListener('load', yulupInitYulup, false);

/**
 * Event handler for setting up Yulup for the active browser window.
 *
 * @return {Undefined}
 */
function yulupInitYulup() {
    /* DEBUG */ dump("Yulup:yulup.js:yulupInitYulup() invoked\n");

    gMainBrowserWindow = window;

    initialCleanUp(NAR_TMP_DIR, WIDGET_TMP_DIR);

    // initialize the template registry
    YulupNeutronArchiveRegistry.loadLocalTemplates();

    /*
    // check if workspace is configured
    if (!WorkspaceService.getWorkspacePath()) {
        // launch workspace wizard
        window.openDialog(YULUP_WS_WIZARD_CHROME_URI, "yulupWorkspaceWizard", "resizable=no")
    }
    */

    new Yulup();
}

/**
 * Create a new editor instance.
 *
 * @param  {EditorParameters} aEditorParameters the editor parameters object
 * @return {Undefined} does not have a return value
 */
function yulupCreateNewEditor(aEditorParameters, aTriggerURI) {
    var openInNewTab       = null;
    var currentTab         = null;
    var yulupTab           = null;
    var sessionHistory     = null;
    var sessionHistoryList = null;
    var historyEntries     = null;
    var instanceID         = null;
    var targetURI          = null;
    var tabBrowser         = null;

    /* DEBUG */ dump("Yulup:yulup.js:yulupCreateNewEditor(\"" + aEditorParameters + "\", \"" + aTriggerURI + "\") invoked\n");

    try {
        // get the currently selected tab (getBrowser() (defined in browser.js) returns a reference to the Tabbrowser element)
        currentTab = self.getBrowser().selectedTab;

        // never open in a new tab if no trigger URI is available
        if (aTriggerURI) {
            // check if we should open in a new tab or in the current tab
            if ((openInNewTab = YulupPreferences.getBoolPref("editor.", "openinnewtab")) != null) {
                if (!openInNewTab && !currentTab) {
                    openInNewTab = true;
                }
            } else {
                // fall back to opening in new tab
                openInNewTab = true;
            }
        } else {
            openInNewTab = true;
        }

        // create a new tab
        yulupTab = self.getBrowser().addTab("");

        // copy session history
        try {
            sessionHistory = self.getBrowser().getBrowserForTab(currentTab).webNavigation.sessionHistory;

            // iterate over all history entries in aSessionHistory and add them to the new tab's session history
            historyEntries = sessionHistory.SHistoryEnumerator;

            sessionHistoryList = new Array();

            while (historyEntries.hasMoreElements()) {
                sessionHistoryList.push(historyEntries.getNext());
            }
        } catch (exception) {
            /* DEBUG */ dump("Yulup:yulup.js:yulupCreateNewEditor: " + exception + "\n");
            /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:yulup.js:yulupCreateNewEditor", exception);

            sessionHistoryList = null;
        }

        // prepare parameters for pick-up
        instanceID = gInstancesManager.addInstance(yulupTab, aEditorParameters, aTriggerURI, sessionHistoryList);

        // construct target URI
        targetURI = YULUP_EDITOR_CHROME_URI + "?" + instanceID;

        // load editor
        self.getBrowser().getBrowserForTab(yulupTab).loadURIWithFlags(targetURI, Components.interfaces.nsIWebNavigation.LOAD_FLAGS_BYPASS_HISTORY, null, null);

        // switch ui to newly created tab
        self.getBrowser().selectedTab = yulupTab;

        if (!openInNewTab) {
            // remove current tab
            tabBrowser = self.getBrowser();
            window.setTimeout(function() { tabBrowser.removeTab(currentTab); }, 0);
        }
    } catch (exception) {
        dump("Yulup:yulup.js:yulupCreateNewEditor: failed to open new editor tab: " + exception.toString() + "\n");

        // clean up
        if (instanceID)
            gInstancesManager.removeInstance(instanceID);

        return;
    }

    /* DEBUG */ dump("Yulup:yulup.js:yulupCreateNewEditor: new tab created\n");
}


/**
 * YulupEditorInstancesManager constructor. Instantiates a new object of
 * type YulupEditorInstancesManager.
 *
 * The editor instance manager manages all currently open editors
 * for a given browser window. Before opening a new editor,
 * create a new instance in the instance manager, and add parameters
 * to pass to the new editor.
 *
 * Once added to the instance manager, you can retrieve the object
 * holding the instance information by means of the retrieveInstance()
 * method. You can also delete the instance once you do not need the
 * information held by the instance object anymore by using the
 * removeInstance() method.
 *
 * Note that no part of Yulup actually depends on having the
 * instance object around any longer than the editor has retrieved
 * its parameters from it. Therefore it is save for the editor to delete
 * the instance object form the manager as soon as it has read the
 * information it needed.
 *
 * @constructor
 * @return {YulupEditorInstancesManager}
 */

function YulupEditorInstancesManager() {
    /* DEBUG */ dump("Yulup:yulup.js:YulupEditorInstancesManager() invoked\n");

    this.instanceHashtable = new Object();
}

YulupEditorInstancesManager.prototype = {
    instanceHashtable: null,

    /**
     * Create a new management object to manage the editor instance
     * associated with this management object.
     *
     * @param  {nsIDOMNode}       aTab              a XUL <tab> node
     * @param  {EditorParameters} aEditorParameters the editor parameters object
     * @param  {String}           aTriggerURI       the URI of the document from which this new instance was triggered
     * @param  {Array}            aSessionHistory   the session history of the browser contained in aTab
     * @return {String} returns an instance ID of the newly created management instance
     */
    addInstance: function (aTab, aEditorParameters, aTriggerURI, aSessionHistory) {
        var editorInstance = null;
        var instanceID     = null;

        // create an instance ID for this instance
        instanceID = Date.now();

        editorInstance = new Object();
        editorInstance.instanceID      = instanceID;
        editorInstance.tab             = aTab;
        editorInstance.parameters      = aEditorParameters;
        editorInstance.triggerURI      = aTriggerURI;
        editorInstance.sessionHistory  = aSessionHistory;
        editorInstance.archiveRegistry = YulupNeutronArchiveRegistry;

        // add instance to the hash table
        this.instanceHashtable[instanceID] = editorInstance;

        return instanceID;
    },

    /**
     * Remove the instance identified by the passed instance ID
     * from the instance manager.
     *
     * Not that after removing an instance, you cannot retrieve it
     * anymoare.
     *
     * @param  {Integer}   aInstanceID the ID of the instance to remove
     * @return {Undefined} does not have a return value
     */
    removeInstance: function (aInstanceID) {
        delete this.instanceHashtable[aInstanceID];
    },

    /**
     * Return the instance indentified by the passed instance ID.
     *
     * @param  {Integer} aInstanceID the ID of the instance to return
     * @return {Object}  returns the instance object requested by the passed instance ID
     */
    retrieveInstance: function (aInstanceID) {
        return this.instanceHashtable[aInstanceID];
    }
};


/**
 * Create a new editor instance starting with a built-in
 * document template.
 *
 * @param  {String}  aTemplateName a template identifier
 * @return {Boolean} return true on success, false otherwise
 */
function yulupCreateNew(aTemplateName) {
    var editorParameters = null;
    var template         = null;

    /* DEBUG */ dump("Yulup:yulup.js:yulupCreateNew(\"" + aTemplateName + "\") invoked\n");

    template = YulupNeutronArchiveRegistry.getTemplateByName(aTemplateName);

    if (template.mimeType == "application/atom+xml") {
        // create a new context aware atom entry
        if (yulupCreateNewAtomEntry()) {
            return true;
        }
    }

    // set editor parameters according to NAR template
    editorParameters = new EditorParameters(template.uri, template.mimeType, null, null, null, null);

    yulupCreateNewEditor(editorParameters, null);

    return true;
}

/**
 * Create a new editor instance starting with a built-in
 * Atom entry template. Upon saving, the entry is attached
 * to the feed selected at the time this method was called.
 *
 * @return {Boolean} return true on success, false otherwise
 */
function yulupCreateNewAtomEntry() {
    var editorParameters = null;
    var feedURI          = null;
    var template         = null;

    /* DEBUG */ dump("Yulup:yulup.js:yulupCreateNewAtomEntry() invoked\n");

    // get feed URI
    if (document.getElementById("sidebar").docShell && document.getElementById("sidebar").contentDocument.getElementById("uiYulupAtomSidebarPage")) {
        feedURI = document.getElementById("sidebar").contentDocument.getElementById("uiYulupAtomSidebarPage").currentFeed.feedURI;
    }

    if (feedURI) {
        /* DEBUG */ dump("Yulup:yulup.js:yulupCreateNewAtomEntry: feed URI = \"" + feedURI.spec + "\"\n");

        // get the first atom template
        template = YulupNeutronArchiveRegistry.getTemplatesByMimeType("application/atom+xml")[0];

        editorParameters = new AtomEditorParameters(template.uri, feedURI,  "application/atom+xml");
        yulupCreateNewEditor(editorParameters, null);

        return true;
    }

    return false;
}

/**
 * Create a new editor instance starting with a document
 * loaded from the local file system.
 *
 * @return {Boolean} return true on success, false otherwise
 */
function yulupOpenFromFile() {
    var editorParameters = null;
    var documentURI      = null;

    /* DEBUG */ dump("Yulup:yulup.js:yulupOpenFromFile() invoked\n");

    if (documentURI = PersistenceService.queryOpenFileURI()) {
        editorParameters = new EditorParameters(documentURI, null, null, null, null, null, null);

        // replace the current editor
        yulupCreateNewEditor(editorParameters, null);

        return true;
    }

    // user aborted
    return false;
}

/**
 * Create a new editor instance starting with a document
 * loaded from a remote host.
 *
 * @return {Boolean} return true on success, false otherwise
 */
function yulupOpenFromCMS() {
    /* DEBUG */ dump("Yulup:yulup.js:yulupOpenFromCMS() invoked\n");

    throw new YulupEditorException("Yulup:yulup.js:yulupOpenFromCMS: method not implemented.");
}

/**
 * Create a new editor instance starting with a document
 * loaded from a remote host, using the Neutron "open"
 * operation.
 *
 * @return {Undefined} does not have a return value
 */
function yulupCheckoutNoLockFromCMS(aFragment) {
    var editorParameters = null;

    /* DEBUG */ dump("Yulup:yulup.js:yulupCheckoutNoLockFromCMS(\"" + aFragment + "\") invoked\n");

    if (gCurrentNeutronIntrospection) {
        editorParameters = new NeutronEditorParameters(gCurrentNeutronIntrospection.queryFragmentOpenURI(aFragment), gCurrentNeutronIntrospection, aFragment, "open");

        yulupCreateNewEditor(editorParameters,  (gCurrentNeutronIntrospection.associatedWithURI ? gCurrentNeutronIntrospection.associatedWithURI.spec : null));
    } else {
        /* We should never have no introspection object when
         * we reach this function. */
    }
}

/**
 * Create a new editor instance starting with a document
 * loaded from a remote host, using the Neutron "checkout"
 * operation.
 *
 * @return {Undefined} does not have a return value
 */
function yulupCheckoutFromCMS(aFragment) {
    var editorParameters = null;

    /* DEBUG */ dump("Yulup:yulup.js:yulupCheckoutFromCMS(\"" + aFragment + "\") invoked\n");

    if (gCurrentNeutronIntrospection) {
        editorParameters = new NeutronEditorParameters(gCurrentNeutronIntrospection.queryFragmentCheckoutURI(aFragment), gCurrentNeutronIntrospection, aFragment, "checkout");

        yulupCreateNewEditor(editorParameters, (gCurrentNeutronIntrospection.associatedWithURI ? gCurrentNeutronIntrospection.associatedWithURI.spec : null));
    } else {
        /* We should never have no introspection object when
         * we reach this function. */
    }
}

function yulupResourceUpload() {
    var sitetreeURI     = null;
    var serverURIString = null;
    var ioService       = null;

    // check for sitetree URI
    if (gCurrentNeutronIntrospection                            &&
        gCurrentNeutronIntrospection.queryNavigation()          &&
        gCurrentNeutronIntrospection.queryNavigation().sitetree &&
        gCurrentNeutronIntrospection.queryNavigation().sitetree.uri) {
        sitetreeURI = gCurrentNeutronIntrospection.queryNavigation().sitetree.uri;
    } else {
        // query for server address
        serverURIString = ServerURIPrompt.showServerURIDialog();

        if (!serverURIString) {
            // user cancelled
            return true;
        } else if (serverURIString == "") {
            return false;
        }

        ioService = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);

        try {
            sitetreeURI = ioService.newURI(serverURIString, null, null);
        } catch (exception) {
            /* DEBUG */ dump("Yulup:yulup.js:yulupResourceUpload: server URI \"" + serverURIString + "\" is not a valid URI: " + exception + "\n");
            /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:yulup.js:yulupResourceUpload", exception);

            alert(document.getElementById("uiYulupEditorStringbundle").getString("editorURINotValidFailure.label") + ": \"" + serverURIString + "\".");
            return false;
        }
    }

    // open dialog
    ResourceUploadDialog.showResourceUploadDialog(sitetreeURI);

    return true;
}

function yulupOpenYulupPreferences() {
    var instantApply = null;
    var features     = null;

    try {
        instantApply = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch).getBoolPref("browser.preferences.instantApply");
        features = "chrome,titlebar,toolbar" + (instantApply ? ",dialog=no" : ",modal");
    } catch (exception) {
        features = "chrome,titlebar,toolbar,modal";
    }

    window.openDialog(YULUP_PREFERENCES_CHROME_URI, "yulupPreferencesWindow", features);
}

/**
 * Load the Yulup help into a new browser window.
 *
 * @return {Undefined} does not have a return value
 */
function yulupShowHelp() {
    var helpWindow = null;

    helpWindow = window.open("chrome://yulup/content/help/helpbrowser.xul", "yulupHelpBrowserWindow", "chrome,menubar=no,resizable=yes,centerscreen");

    /* If the window was already open, the content gets reloaded. In order
     * to bring such a window to the front we have to focus it. */
    if (helpWindow)
        helpWindow.focus();
}

/**
 * Load the Yulup demosite into the currently active tab.
 *
 * @return {Undefined} does not have a return value
 */
function yulupShowDemoSite() {
    self.getBrowser().selectedBrowser.loadURI(YULUP_DEMO_SITE_URI, null, null);
}

/**
 * Load the Yulup website into the currently active tab.
 *
 * @return {Undefined} does not have a return value
 */
function yulupShowAboutYulup() {
    self.getBrowser().selectedBrowser.loadURI(YULUP_WEB_SITE_URI, null, null);
}

/**
 * Walk through a DOM tree on the sibling axes until a DOM node
 * named aNodeName is found.
 *
 * Note that this method does not recursively inspect children
 * elements.
 *
 * @param  {nsIDOMTreeWalker} aTreeWalker the tree walker to use
 * @param  {String}           aNodeName   the name of the node to find
 * @return {nsIDOMNode}       returns the node if found, null otherwise
 */
function yulupWalkTo(aTreeWalker, aNodeName) {
    var domElem = null;

    /* DEBUG */ dump("Yulup:yulup.js:yulupWalkTo(\"" + aTreeWalker + "\", \"" + aNodeName + "\") invoked\n");

    for (domElem = aTreeWalker.firstChild(); domElem != null && domElem.nodeName != aNodeName && domElem.nodeName != aNodeName.toUpperCase(); domElem = aTreeWalker.nextSibling()) {
        /* DEBUG */ dump("Yulup:yulup.js:yulupWalkTo: current node = \"" + domElem.nodeName + "\"\n");
    }

    /* DEBUG */ dump("Yulup:yulup.js:yulupWalkTo: resulting node = \"" + (domElem ? domElem.nodeName : domElem) + "\"\n");

    return domElem;
}


/**
 * Yulup constructor. Instantiates a new object of
 * type Yulup.
 *
 * @constructor
 * @return {Yulup} a new Yulup object
 */
function Yulup() {
    /* DEBUG */ dump("Yulup:yulup.js:Yulup() invoked\n");

    /* Initialise introspection state controller. We initialise
     * it to "undefined" so one of the state actions always gets
     * executed when we hit a webpage for the first time. */
    this.currentState = "undefined";

    // cache element requests for often used elements
    this.yulupEditMenu                               = document.getElementById("uiYulupEditToolbarbutton");
    this.yulupEditMenuEditMenuitem                   = document.getElementById("uiYulupEditMenuitem");
    this.yulupEditMenuCheckoutMenuitem               = document.getElementById("uiYulupEditCheckoutMenuitem");
    this.yulupEditMenuCheckoutNoLockMenuitem         = document.getElementById("uiYulupEditCheckoutNoLockMenuitem");
    this.yulupEditMenuCheckoutMenuitemLabel          = document.getElementById("uiYulupEditCheckoutMenuitem").getAttribute("label");
    this.yulupEditMenuCheckoutNoLockMenuitemLabel    = document.getElementById("uiYulupEditCheckoutNoLockMenuitem").getAttribute("label");
    this.yulupEditMenuCheckoutMenu                   = document.getElementById("uiYulupEditCheckoutMenu");
    this.yulupEditMenuCheckoutNoLockMenu             = document.getElementById("uiYulupEditCheckoutNoLockMenu");
    this.yulupEditMenuCheckoutMenupopup              = document.getElementById("uiYulupEditCheckoutMenupopup");
    this.yulupEditMenuCheckoutNoLockMenupopup        = document.getElementById("uiYulupEditCheckoutNoLockMenupopup");
    this.yulupEditMenuResourceUploadMenuitem         = document.getElementById("uiYulupUploadMenuitem");
    this.yulupEditMenuRealmSeparator                 = document.getElementById("uiYulupRealmSeparator");
    this.yulupEditMenuExtrasSeparator                = document.getElementById("uiYulupExtrasSeparator");
    this.yulupOperationNewFromTemplateLocalMenu      = document.getElementById("uiYulupOperationNewFromTemplateLocalMenu");
    this.yulupOperationNewFromTemplateLocalMenupopup = document.getElementById("uiYulupOperationNewFromTemplateLocalMenupopup");
    this.uiYulupEditMenupopup                        = document.getElementById("uiYulupEditMenupopup");
    this.yulupOpenAtomSidebarObserver                = document.getElementById("uiOpenYulupAtomSidebar");
    this.yulupDocument                               = document;

    this.yulupEditMenu.setAttribute("disabled", "false");

    // create an editor instance manager
    this.instancesManager = new YulupEditorInstancesManager();
    gInstancesManager = this.instancesManager;

    // install tab switch listener to capture tab switches
    self.getBrowser().tabContainer.addEventListener("select", new YulupTabSwitchListener(this), false);

    /* Install a progress listener to catch document loading on tabbrowser.
     * This listener will only get called if a state change occurs on the
     * currently active tab (which is good, since we are not interested on
     * what is going on in the other tabs).
     *
     * Note that the listener throws lots of NS_ERROR_NOT_IMPLEMENTED ex-
     * ceptions due to a bug that tabbrowser.xml does not honor the event
     * filter mask (see https://bugzilla.mozilla.org/show_bug.cgi?id=320663). */
    this.installWebProgressListener(self.getBrowser());


    buildNewMenu(YulupNeutronArchiveRegistry.getAvailableTemplates(), this.yulupOperationNewFromTemplateLocalMenupopup, this.yulupOperationNewFromTemplateLocalMenu, "yulupCreateNew");


    /* Call the introspection detector since we may have missed a STATE_STOP
     * of the current tab during initial handler installation. */
    this.introspectionDetector();

    // add ourself to the window
    window.yulup = this;

    /* DEBUG */ dump("Yulup:yulup.js:Yulup: initialisation completed\n");
}

Yulup.prototype = {
    __currentNeutronIntrospection              : null,
    yulupEditMenu                              : null,
    yulupEditMenuEditMenuitem                  : null,
    yulupEditMenuCheckoutMenuitem              : null,
    yulupEditMenuCheckoutMenu                  : null,
    yulupEditMenuCheckoutMenupopup             : null,
    yulupEditMenuCheckoutNoLockMenuitem        : null,
    yulupEditMenuCheckoutNoLockMenu            : null,
    yulupEditMenuCheckoutNoLockMenupopup       : null,
    yulupEditMenuCheckoutMenuitemLabel         : null,
    yulupEditMenuCheckoutNoLockMenuitemLabel   : null,
    yulupEditMenuResourceUploadMenuitem        : null,
    yulupOperationNewFromTemplateLocalMenu     : null,
    yulupOperationNewFromTemplateLocalMenupopup: null,
    yulupOpenAtomSidebarObserver               : null,
    instancesManager                           : null,
    activeWebProgressListener                  : null,
    currentState                               : null,

    get currentNeutronIntrospection() {
        return this.__currentNeutronIntrospection;
    },

    set currentNeutronIntrospection(aValue) {
        this.__currentNeutronIntrospection = aValue;
        gCurrentNeutronIntrospection       = aValue;
    },

    /**
     * Install a webprogress listener in the tabbrowser.
     *
     * @param  {XULElement} aTabBrowser the <tabbrowser> element
     * @return {Undefined}  does not have a return value
     */
    installWebProgressListener: function (aTabBrowser) {
        var webProgressListener = null;

        /* DEBUG */ dump("Yulup:yulup.js:Yulup.installWebProgressListener() invoked\n");

        webProgressListener = new YulupWebProgressListener(this);

        aTabBrowser.addProgressListener(webProgressListener, Components.interfaces.nsIWebProgress.NOTIFY_STATE_ALL);
        this.activeWebProgressListener = webProgressListener;
    },

    uninstallWebProgressListener: function (aTabBrowser) {
        /* DEBUG */ dump("Yulup:yulup.js:Yulup.uninstallWebProgressListener() invoked\n");

        aTabBrowser.removeProgressListener(this.activeWebProgressListener);
        this.removeWebProgressListener = null;
    },

    introspectionDetector: function () {
        var currentBrowser     = null;
        var currentDocument    = null;
        var documentURI        = null;
        //var nsResolver         = null;
        //var introspection      = null;
        var elemWalker         = null;
        var domElem            = null;
        var introspectionLinks = null;

        /* DEBUG */ dump("Yulup:yulup.js:Yulup.introspectionDetector() invoked\n");

        gCurrentNeutronIntrospection = null;
        this.currentAPPIntrospection = null;
        introspectionLinks           = new Array();

        /* Get the current browser. We could pass this in from the web
         * progress listener, but if the user switches tabs between the
         * progress event firing and this method being called, or the tab
         * gets closed, we wouldn't want to execute. Therefore, make sure
         * we are up-to-date with the latest tab. */
        currentBrowser = self.getBrowser().selectedBrowser;

        /* Make sure the current browser is not in the middle of
         * a page load. */
        if (!currentBrowser.webProgress.isLoadingDocument) {
            currentDocument = currentBrowser.contentDocument;
            documentURI     = currentBrowser.currentURI;

            try {
                //nsResolver = currentDocument.createNSResolver(currentDocument.ownerDocument == null ? currentDocument.documentElement : currentDocument.ownerDocument.documentElement);
                //introspection = currentDocument.evaluate('html/head/link[@rel="cms.client"]/attribute::href', currentDocument, nsResolver, XPathResult.STRING_TYPE, null);
                ///* DEBUG */ dump("Yulup:yulup.js:Yulup.introspectionDetector: introspection = \"" + introspection.stringValue + "\"\n");

                // create a tree walker to find the introspection link
                elemWalker = currentDocument.createTreeWalker(currentDocument, NodeFilter.SHOW_ELEMENT, null, false);

                /* Since Mozilla converts element names to all UPPERCASE when parsing
                 * non-XML documents (i.e. like traditional HTML documents), but represents
                 * them in all lowercase when parsing XML files, we have to test against
                 * both cases each time we look at a node name. */
                if (yulupWalkTo(elemWalker, "html")) {
                    // element <html> found, find <head>
                    if (yulupWalkTo(elemWalker, "head")) {
                        // element <head> found, find <link>s
                        for (domElem = elemWalker.firstChild(); domElem; domElem = elemWalker.nextSibling()) {
                            if (domElem.nodeName == "link" || domElem.nodeName == "LINK") {
                                // found a <link> element, look at its attributes
                                if (domElem.rel && domElem.rel == "neutron-introspection" && domElem.type && domElem.type == "application/neutron+xml") {
                                    /* DEBUG */ dump("Yulup:yulup.js:Yulup.introspectionDetector: Neutron introspection = \"" + domElem.href + "\"\n");

                                    // found a Neutron introspection link
                                    introspectionLinks.push(new YulupIntrospectionLink(domElem.href, INTROSPECTION_TYPE_NEUTRON));
                                } else if (domElem.rel && domElem.rel == "introspection" && domElem.type && domElem.type == "application/atomserv+xml") {
                                    /* See http://bitworking.org/projects/atom/draft-ietf-atompub-protocol-08.html#iana
                                     * and http://www-128.ibm.com/developerworks/xml/library/x-matters45.html. */

                                    /* DEBUG */ dump("Yulup:yulup.js:Yulup.introspectionDetector: APP introspection = \"" + domElem.href + "\"\n");

                                    // found an APP introspection link
                                    introspectionLinks.push(new YulupIntrospectionLink(domElem.href, INTROSPECTION_TYPE_APP));
                                }
                            }
                        }
                    }
                }

            } catch (exception) {
                // there was a problem walking the document
                this.introspectionStateChanged("none");

                /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:yulup.js:Yulup.introspectionDetector", exception);
                Components.utils.reportError(exception);

                return;
            }

            // load the introspection documents
            if (introspectionLinks.length > 0) {
                try {
                    for (var i = 0; i < introspectionLinks.length; i++) {
                        switch (introspectionLinks[i].type) {
                        case INTROSPECTION_TYPE_NEUTRON:
                            Neutron.introspection(introspectionLinks[i].uri, documentURI, this);
                            break;
                        case INTROSPECTION_TYPE_APP:
                            APP.fetchIntrospection(introspectionLinks[i].uri, documentURI, this);
                            break;
                        }
                    }
                } catch (exception) {
                    // there was a problem with an introspection document
                    this.introspectionStateChanged("failed");

                    /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:yulup.js:Yulup.introspectionDetector", exception);
                    Components.utils.reportError(exception);

                    return;
                }
            } else {
                // no introspection file associated
                this.introspectionStateChanged("none");
            }
        } else {
            /* If we are indeed in the middle of a page load, silently
             * return, the web progress listener will call us back
             * anyway. */
            return;
        }
    },

    isTabEditor: function (aURI) {
        /* DEBUG */ dump("Yulup:yulup.js:Yulup.isTabEditor() invoked\n");

        if (aURI && !aURI.schemeIs("chrome") && (aURI.spec != "about:blank")) {
            /* DEBUG */ dump("Yulup:yulup.js:Yulup.isTabEditor: we are in a normal tab (\"" + (aURI ? aURI.spec : aURI) + "\")\n");

            // we are in a normal tab with content
            this.yulupEditMenuEditMenuitem.setAttribute("disabled", false);

            return false;
        } else {
            /* DEBUG */ dump("Yulup:yulup.js:Yulup.isTabEditor: we are in a special tab (\"" + (aURI ? aURI.spec : aURI) + "\")\n");

            /* We are in a tab with chrome content, or the tab is empty,
             * or we are in a blank document. Therefore, disable the editor menu. */
            this.yulupEditMenuEditMenuitem.setAttribute("disabled", true);

            // special tabs don't have an introspection file associated
            this.introspectionStateChanged("none");

            return true;
        }
    },

    buildFragmentsMenu: function (aFragmentsArray, aMenuitem, aMenu, aMenupopup, aCommand) {
        var menuItem          = null;

        /* DEBUG */ dump("Yulup:yulup.js:Yulup.buildFragmentsMenu() invoked\n");

        if (aFragmentsArray.length > 0) {
            if (aFragmentsArray.length == 1) {
                // show single fragment menu item
                aMenu.setAttribute("hidden", "true");
                aMenu.setAttribute("disabled", "true");

                if (aFragmentsArray[0][0] != "")
                    aMenuitem.setAttribute("label", aMenuitem.getAttribute("label") + " \"" + aFragmentsArray[0][0] + "\"");
                aMenuitem.setAttribute("disabled", "false");
                aMenuitem.removeAttribute("hidden");
            } else {
                // replace single fragment menu item by a submenu
                aMenuitem.setAttribute("hidden", "true");
                aMenuitem.setAttribute("disabled", "true");

                // remove all previous entries
                while(aMenupopup.hasChildNodes())
                    aMenupopup.removeChild(aMenupopup.firstChild);

                // add a new menuitem per fragment
                for (var i = 0; i < aFragmentsArray.length; i++) {
                    menuItem = document.createElementNS(NAMESPACE_XUL, "menuitem");
                    menuItem.setAttribute("label", aFragmentsArray[i][0]);
                    menuItem.setAttribute("tooltiptext", aMenuitem.getAttribute("tooltiptext"));
                    menuItem.setAttribute("value", i);
                    menuItem.setAttribute("oncommand", aCommand + "(this.value)");
                    aMenupopup.appendChild(menuItem);
                }

                aMenu.setAttribute("disabled", "false");
                aMenu.removeAttribute("hidden");
            }
        } else {
            // no fragments at all
            aMenu.setAttribute("hidden", "true");
            aMenu.setAttribute("disabled", "true");

            aMenuitem.setAttribute("disabled", "true");
        }
    },

    introspectionStateChanged: function (aStateChange) {
        var fragments    = null;
        var atomAutoOpen = null;

        /* DEBUG */ dump("Yulup:yulup.js:Yulup.introspectionStateChanged(\"" + aStateChange + "\") invoked\n");

        /* Note that this state controller is rather ad-hoc. Especially all
         * the attribute setting should once be managed via observers. */
        switch (aStateChange) {
            case "none":
                /* Check if previous state was already none. If yes,
                 * nothing has to be done. (This is the regular case
                 * when you are just surfing the web.) */
                if (this.currentState != "none") {
                    gCurrentNeutronIntrospection = null;

                    // restore menu item labels
                    this.yulupEditMenuCheckoutMenuitem.setAttribute("label", this.yulupEditMenuCheckoutMenuitemLabel);
                    this.yulupEditMenuCheckoutNoLockMenuitem.setAttribute("label", this.yulupEditMenuCheckoutNoLockMenuitemLabel);

                    this.yulupEditMenuCheckoutMenu.setAttribute("hidden", "true");
                    this.yulupEditMenuCheckoutMenu.setAttribute("disabled", "true");
                    this.yulupEditMenuCheckoutNoLockMenu.setAttribute("hidden", "true");
                    this.yulupEditMenuCheckoutNoLockMenu.setAttribute("disabled", "true");

                    this.yulupEditMenuCheckoutMenuitem.setAttribute("disabled", "true");
                    this.yulupEditMenuCheckoutNoLockMenuitem.setAttribute("disabled", "true");

                    this.yulupEditMenuCheckoutMenuitem.removeAttribute("hidden");
                    this.yulupEditMenuCheckoutNoLockMenuitem.removeAttribute("hidden");

                    this.yulupEditMenu.setAttribute("introspection", "no");
                    this.yulupEditMenu.removeAttribute("tooltip");
                    this.yulupEditMenu.setAttribute("tooltiptext", document.getElementById("uiYulupOverlayStringbundle").getString("editToolbarbutton.tooltip"));

                    // no Atom content available, disable sidebar opening
                    if (this.yulupOpenAtomSidebarObserver)
                        this.yulupOpenAtomSidebarObserver.setAttribute("disabled", true);

                    this.currentState = "none";
                }
                break;
            case "success":
                // restore menu item labels
                this.yulupEditMenuCheckoutMenuitem.setAttribute("label", this.yulupEditMenuCheckoutMenuitemLabel);
                this.yulupEditMenuCheckoutNoLockMenuitem.setAttribute("label", this.yulupEditMenuCheckoutNoLockMenuitemLabel);

                if (gCurrentNeutronIntrospection) {
                    this.buildFragmentsMenu(gCurrentNeutronIntrospection.queryOpenFragments(), this.yulupEditMenuCheckoutNoLockMenuitem, this.yulupEditMenuCheckoutNoLockMenu, this.yulupEditMenuCheckoutNoLockMenupopup, "yulupCheckoutNoLockFromCMS");
                    this.buildFragmentsMenu(gCurrentNeutronIntrospection.queryCheckoutFragments(), this.yulupEditMenuCheckoutMenuitem, this.yulupEditMenuCheckoutMenu, this.yulupEditMenuCheckoutMenupopup, "yulupCheckoutFromCMS");
                }

                if (this.currentAPPIntrospection) {
                    try {
                        // Atom content available, enable user to open the sidebar
                        if (this.yulupOpenAtomSidebarObserver)
                            this.yulupOpenAtomSidebarObserver.setAttribute("disabled", false);

                        // check if the Atom sidebar should be opened automatically
                        if ((atomAutoOpen = YulupPreferences.getBoolPref("atom.", "autoopensidebar")) != null) {
                            if (atomAutoOpen) {
                                // check if the Atom sidebar is already open
                                if (document.getElementById("sidebar").docShell && document.getElementById("sidebar").contentDocument.getElementById("uiYulupAtomSidebarPage")) {
                                    // load new feed into the sidebar
                                    document.getElementById("sidebar").contentDocument.getElementById("uiYulupAtomSidebarPage").reload();
                                } else {
                                    /* Force open the sidebar (i.e. keep it open if it already is). The
                                     * onload handler will pick uf the introspection document and load
                                     * the feed. */
                                    toggleSidebar("uiOpenYulupAtomSidebar", true);
                                }
                            }
                        }
                    } catch (exception) {
                        /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:yulup.js:Yulup.introspectionStateChanged", exception);
                        /* DEBUG */ Components.utils.reportError(exception);
                    }
                } else {
                    // no Atom content available, disable sidebar opening
                    if (this.yulupOpenAtomSidebarObserver)
                        this.yulupOpenAtomSidebarObserver.setAttribute("disabled", true);
                }

                this.yulupEditMenu.setAttribute("introspection", "ok");
                this.yulupEditMenu.removeAttribute("tooltip");
                this.yulupEditMenu.setAttribute("tooltiptext", document.getElementById("uiYulupOverlayStringbundle").getString("editToolbarbutton.tooltip"));

                this.currentState = "success";

                break;
            case "failed":
                gCurrentNeutronIntrospection = null;

                // restore menu item labels
                this.yulupEditMenuCheckoutMenuitem.setAttribute("label", this.yulupEditMenuCheckoutMenuitemLabel);
                this.yulupEditMenuCheckoutNoLockMenuitem.setAttribute("label", this.yulupEditMenuCheckoutNoLockMenuitemLabel);

                this.yulupEditMenuCheckoutMenu.setAttribute("hidden", "true");
                this.yulupEditMenuCheckoutMenu.setAttribute("disabled", "true");
                this.yulupEditMenuCheckoutNoLockMenu.setAttribute("hidden", "true");
                this.yulupEditMenuCheckoutNoLockMenu.setAttribute("disabled", "true");

                this.yulupEditMenuCheckoutMenuitem.setAttribute("disabled", "true");
                this.yulupEditMenuCheckoutNoLockMenuitem.setAttribute("disabled", "true");

                this.yulupEditMenuCheckoutMenuitem.removeAttribute("hidden");
                this.yulupEditMenuCheckoutNoLockMenuitem.removeAttribute("hidden");

                this.yulupEditMenu.setAttribute("introspection", "warn");
                this.yulupEditMenu.removeAttribute("tooltiptext");
                this.yulupEditMenu.setAttribute("tooltip", "uiYulupEditToolbarbuttonWarnTooltip");

                // no Atom content available, disable sidebar opening
                if (this.yulupOpenAtomSidebarObserver)
                    this.yulupOpenAtomSidebarObserver.setAttribute("disabled", true);

                this.currentState = "failed";

                break;
            default:
                /* DEBUG */ dump("Yulup:yulup.js:Yulup.introspectionStateChanged: unknown state \"" + aStateChange + "\"\n");
                throw new YulupEditorException("Unknown state \"" + aStateChange + "\".");
        }
    },

    editAtomEntryProxy: function (aURI) {
        var editorParameters = null;

        /* DEBUG */ dump("Yulup:yulup.js:Yulup.editAtomEntryProxy(\"" + aURI + "\") invoked\n");

        editorParameters = new AtomEditorParameters(aURI, null, "application/atom+xml", null);

        // replace the current editor
        yulupCreateNewEditor(editorParameters, null);

        return true;
    },

    getPrefs: function (aPref) {
        var prefBranch = null;

        /* DEBUG */ dump("Yulup:yulup.js:Yulup.getPrefs() invoked\n");

        prefBranch = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);
        prefBranch = pref.getBranch("extensions.yulup.");

        return prefBranch.aPref;
    },

    /**
     * Replace the given tab with the given URI.
     *
     * @param  {Tab}         aOldTab         the tab to replace
     * @param  {String}      aURI            the URI to load
     * @param  {Array}       aSessionHistory the session history of the original calling tab
     * @return {Undefined} does not have a return value
     */
    replaceTab: function (aOldTab, aURI, aSessionHistory) {
        var newTab     = null;
        var tabBrowser = null;

        /* DEBUG */ dump("Yulup:yulup.js:Yulup.replaceTab() invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aOldTab != null);

        // if aURI is given, replace the tab, else close it
        if (aURI) {
            newTab = self.getBrowser().addTab(aURI);

            // attach caller's session history to the newly created tab
            if (newTab && aSessionHistory)
                this.__attachSessionHistory(newTab, aSessionHistory, aURI);

            // switch to newly created tab
            self.getBrowser().selectedTab = newTab;
        } else {
            // if only one browser is left, open a new empty browser tab first and close this one
            if (self.getBrowser().browsers.length == 1) {
                newTab = self.getBrowser().addTab("about:blank");

                // attach caller's session history to the newly created tab
                if (newTab && aSessionHistory)
                    this.__attachSessionHistory(newTab, aSessionHistory, null);
            }
        }

        // close old tab, we have a new one
        tabBrowser = self.getBrowser();
        window.setTimeout(function () { tabBrowser.removeTab(aOldTab); }, 0);
    },

    /**
     * Add session history entries to a tab. Does not add the last history
     * entry from the given list if its URI matches the passed in URI.
     *
     * @param  {Tab}    aTab            the tab to add the history entries to
     * @param  {Array}  aSessionHistory the list of session history entries
     * @param  {String} aURI            a URI to compare the last history entry to, may be null
     * @return {Undefined} does not have a return value
     */
    __attachSessionHistory: function (aTab, aSessionHistory, aURI) {
        var sessionHistory = null;

        /* DEBUG */ dump("Yulup:yulup.js:Yulup.__attachSessionHistory() invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aTab            != null);
        /* DEBUG */ YulupDebug.ASSERT(aSessionHistory != null);

        try {
            sessionHistory = self.getBrowser().getBrowserForTab(aTab).webNavigation.sessionHistory.QueryInterface(Components.interfaces.nsISHistoryInternal);

            // loop over all history entries in aSessionHistory and add them to the new tab's session history
            for (var i = 0; i < aSessionHistory.length; i++) {
                // skip last entry if it is the same as the given URI
                if (!(i == (aSessionHistory.length - 1) &&
                      aURI &&
                      aSessionHistory[i].QueryInterface(Components.interfaces.nsIHistoryEntry).URI &&
                      aSessionHistory[i].QueryInterface(Components.interfaces.nsIHistoryEntry).URI.spec == aURI))
                    sessionHistory.addEntry(aSessionHistory[i], true);
            }
        } catch (exception) {
            /* DEBUG */ dump("Yulup:yulup.js:Yulup.__attachSessionHistory: " + exception + "\n");
            /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:yulup.js:Yulup.__attachSessionHistory", exception);
        }
    }
};


function YulupIntrospectionLink(aURI, aType) {
    this.uri  = aURI;
    this.type = aType;
}

YulupIntrospectionLink.prototype = {
    uri : null,
    type: null
}

function YulupTabSwitchListener(aYulup) {
    /* DEBUG */ dump("Yulup:yulup.js:YulupTabSwitchListener() invoked\n");

    this.yulup    = aYulup;
}

/**
 * Event handler for handling tab switch events. When this
 * event triggers, this means that we have switched to a
 * different tab.
 *
 * @return {Undefined} does not have a return value
 */
YulupTabSwitchListener.prototype.handleEvent = function (aEvent) {
    /* DEBUG */ dump("Yulup:yulup.js:YulupTabSwitchListener.handleEvent() invoked\n");

    /* We have switched to a different tab. Make sure we are not in one
     * of our editor tabs. */
    if (!this.yulup.isTabEditor(self.getBrowser().selectedBrowser.currentURI)) {
        /* Call the introspection detector, since
         * this tab may have already finished loading, so the introspection
         * detector would not get called by the progress listener callback. */
        this.yulup.introspectionDetector();
    }

    /* DEBUG */ dump("Yulup:yulup.js:YulupTabSwitchListener.handleEvent completed\n");
};


function YulupWebProgressListener(aYulup) {
    /* DEBUG */ dump("Yulup:yulup.js:YulupWebProgressListener() invoked\n");

    this.yulup = aYulup;
}

YulupWebProgressListener.prototype = {
    QueryInterface: function (aUUID) {
        if (aUUID.equals(Components.interfaces.nsISupports) ||
            aUUID.equals(Components.interfaces.nsISupportsWeakReference) ||
            aUUID.equals(Components.interfaces.nsIWebProgressListener)) {
            return this;
        } else {
            throw Components.results.NS_NOINTERFACE;
        }
    },

    GetWeakReference: function () {
        throw Components.results.NS_ERROR_NOT_IMPLEMENTED;
    },

    onLocationChange: function () {
        //throw Components.results.NS_ERROR_NOT_IMPLEMENTED;
        return;

    },

    onStateChange: function (aWebProgress, aRequest, aStateFlags, aStatus) {
        var transState = "";
        var stateType  = "";

        /* DEBUG */ dump("Yulup:yulup.js:YulupWebProgressListener.onStateChange(\"" + aWebProgress + "\", \"" + aRequest + "\", \"" + aStateFlags + "\", \"" + aStatus + "\") invoked\n");

        // get transition state of request
        if (aStateFlags & Components.interfaces.nsIWebProgressListener.STATE_START) transState += "STATE_START ";
        if (aStateFlags & Components.interfaces.nsIWebProgressListener.STATE_REDIRECTING) transState += "STATE_REDIRECTING ";
        if (aStateFlags & Components.interfaces.nsIWebProgressListener.STATE_TRANSFERRING) transState += "STATE_TRANSFERRING ";
        if (aStateFlags & Components.interfaces.nsIWebProgressListener.STATE_NEGOTIATING) transState += "STATE_NEGOTIATING ";
        if (aStateFlags & Components.interfaces.nsIWebProgressListener.STATE_STOP) transState += "STATE_STOP";

        // get state type of request
        if (aStateFlags & Components.interfaces.nsIWebProgressListener.STATE_IS_REQUEST) stateType += "STATE_IS_REQUEST ";
        if (aStateFlags & Components.interfaces.nsIWebProgressListener.STATE_IS_DOCUMENT) stateType += "STATE_IS_DOCUMENT ";
        if (aStateFlags & Components.interfaces.nsIWebProgressListener.STATE_IS_NETWORK) stateType += "STATE_IS_NETWORK ";
        if (aStateFlags & Components.interfaces.nsIWebProgressListener.STATE_IS_WINDOW) stateType += "STATE_IS_WINDOW";

        /* DEBUG */ dump("Yulup:yulup.js:YulupWebProgressListener.onStateChange: state type = \"" + stateType + "\", status is = \"" + transState + "\", is loading document = \"" + aWebProgress.isLoadingDocument + "\"\n");

        if ((aStateFlags & Components.interfaces.nsIWebProgressListener.STATE_IS_WINDOW) && (aStateFlags & Components.interfaces.nsIWebProgressListener.STATE_STOP)) {
            /* Document has finished loading. Make sure we are not in a
             * chrome tab. */
            if (!this.yulup.isTabEditor(self.getBrowser().selectedBrowser.currentURI)) {
                this.yulup.introspectionDetector();
            }
        }

        // crude hack to stop the throbber from turning upon XUL interaction
        if (transState == "STATE_START " && stateType == "STATE_IS_REQUEST " && !aWebProgress.isLoadingDocument) {
            /* DEBUG */ dump("Yulup:yulup.js:YulupWebProgressListener.onStateChange: stop the throb\n");

            window.setTimeout(function() {
                                  var progressPanel = null;
                                  var throbber      = null;
                                  var stopButton    = null;

                                  if ((progressPanel = document.getElementById("statusbar-progresspanel")) != null)
                                      progressPanel.collapsed = true;
                                  if ((throbber      = document.getElementById("navigator-throbber")) != null)
                                      throbber.removeAttribute("busy");
                                  if ((stopButton    = document.getElementById("Browser:Stop")) != null)
                                      stopButton.setAttribute("disabled", "true");
                              }, 0);
        }
    },

    onProgressChange: function () {
        //throw Components.results.NS_ERROR_NOT_IMPLEMENTED;
        return;
    },

    onSecurityChange: function () {
        //throw Components.results.NS_ERROR_NOT_IMPLEMENTED;
        return;
    },

    onStatusChange: function () {
        //throw Components.results.NS_ERROR_NOT_IMPLEMENTED;
        return;
    }
}

/**
 * Registry which holds mime-type to template nar file mappings.
 *
 * Mime-Types that should have some default widgets, styles, schemas,
 * navigation elements or templates should be registered in the
 * mimeTypeMap with the appropriate nar file.
 */
var YulupNeutronArchiveRegistry = {
    // registered templates
    templates: new Array(),

    // registered mime-types
    mimeTypeMap: {
        "text/plain"            : "empty.nar",
        "application/xml"       : "xml.nar",
        "application/xhtml+xml" : "xhtml.nar",
        "application/atom+xml"  : "atom.nar"
    },

    /**
     * Returns the URI of the NAR file with the matching mime-type.
     *
     * @param  {String} aMimeType the mime-type of the NAR
     * @return {nsIURI}           the URI pointing to the NAR file or null if no NAR file is registered for this mime-type
     */
    getArchiveURI: function(aMimeType) {
        var narDir           = null;
        var narFile          = null;
        var narURI           = null;
        var installDir       = null;

        /* DEBUG */ dump("Yulup:neutronarchive.js:YulupNeutronArchiveRegistry.getArchiveURI(\"" + aMimeType + "\") invoked\n");

        narFile = YulupNeutronArchiveRegistry.mimeTypeMap[aMimeType];

        if (!narFile) {
            /* DEBUG */ dump("Yulup:neutronarchive.js:YulupNeutronArchiveRegistry.getArchiveURI: no template NAR for this mime-type\n");
            return null;
        }

        // get the extension installation directory
        installDir = Components.classes["@mozilla.org/extensions/manager;1"]. getService(Components.interfaces.nsIExtensionManager).getInstallLocation(YULUP_EXTENSION_ID).getItemLocation(YULUP_EXTENSION_ID);

        installDir.append(NAR_TEMPLATE_DIR);
        installDir.append(narFile);

        // create a nsIFileURI pointing to the template NAR file
        narURI = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService).newFileURI(installDir);

        /* DEBUG */ dump("Yulup:neutronarchive.js:YulupNeutronArchiveRegistry.getArchiveURI: narURI = \"" + narURI.spec + "\"\n");

        return narURI;
    },

    /**
     * Returns an array with all templates in this registry.
     *
     * @return {Array} array of templates
     */
    getAvailableTemplates: function() {
        /* DEBUG */ dump("Yulup:neutronarchive.js:YulupNeutronArchiveRegistry.getAvailableTemplates() invoked\n");

        return YulupNeutronArchiveRegistry.templates;
    },

    /**
     * Return a template object belonging to the specified name.
     *
     * @param  {String} aName the name of the template
     * @return {Object}       the template object
     */
    getTemplateByName: function(aName) {
        /* DEBUG */ dump("Yulup:neutronarchive.js:YulupNeutronArchiveRegistry.getTemplateByName() invoked\n");

        for (var i=0; i<YulupNeutronArchiveRegistry.templates.length; i++) {
            if (YulupNeutronArchiveRegistry.templates[i].name == aName) {
                return YulupNeutronArchiveRegistry.templates[i];
            }
        }
        return null;
    },

    /**
     * Return template objects belonging to the specified mime-type.
     *
     * @param  {String} aMimeType the mime-type of the template
     * @return {Array}            array of matching templates
     */
    getTemplatesByMimeType: function(aMimeType) {
        var templates = new Array();
        var index     = 0;

        /* DEBUG */ dump("Yulup:neutronarchive.js:YulupNeutronArchiveRegistry.getTemplatesByMimeType(\"" + aMimeType + "\") invoked\n");

        for (var i=0; i<YulupNeutronArchiveRegistry.templates.length; i++) {
            if (YulupNeutronArchiveRegistry.templates[i].mimeType == aMimeType) {
                templates[index++] = YulupNeutronArchiveRegistry.templates[i];
            }
        }

        return (templates.length > 0 ? templates : null);
    },

    /**
     * Register a template.
     *
     * @param  {nsIURI}  aURI      the template's fragment URI
     * @param  {String}  aMimeType the template's mime-type
     * @param  {String}  aName     the template's name
     * @return {Boolean}           true if the template was registered otherwise false
     */
    registerTemplate: function(aURI, aMimeType, aName) {
        /* DEBUG */ dump("Yulup:neutronarchive.js:YulupNeutronArchiveRegistry.registerTemplate(\"" + aURI.spec + "\", \"" + aMimeType + "\", \"" + aName + "\") invoked\n");

        if (!YulupNeutronArchiveRegistry.getTemplateByName(aName)) {

            YulupNeutronArchiveRegistry.templates[YulupNeutronArchiveRegistry.templates.length] = {
                name:     aName,
                uri:      aURI,
                mimeType: aMimeType
            };
            return true
        }

        return false;
    },

    /**
     * Load all templates from the local NAR file storage.
     *
     * @return {Undefined} does not have a return value
     */
    loadLocalTemplates: function() {
        var archiveURI = null;
        var archive    = null;

        /* DEBUG */ dump("Yulup:neutronarchive.js:YulupNeutronArchiveRegistry.loadLocalTemplates() invoked\n");

        // iterate over all registered NAR files
        for (var archiveName in YulupNeutronArchiveRegistry.mimeTypeMap) {
            archiveURI = YulupNeutronArchiveRegistry.getArchiveURI(archiveName);
            archive    = new NeutronArchive(archiveURI);

            archive.loadNeutronArchive(null, true);
            archive.extractNeutronArchive();

            if (archive.introspection.newTemplates && archive.introspection.newTemplates.templates) {
                for (var i=0; i<archive.introspection.newTemplates.templates.length; i++) {

                    if (!YulupNeutronArchiveRegistry.registerTemplate(archive.introspection.newTemplates.templates[i].uri, archive.introspection.newTemplates.templates[i].mimeType, archive.introspection.newTemplates.templates[i].name)) {

                        /* DEBUG */ dump("Yulup:neutronarchive.js:YulupNeutronArchiveRegistry.loadLocalTemplates() template already registered under name " + archive.introspection.newTemplates.templates[i].name + "\n");
                    }
                }
            }
        }
    }
}
