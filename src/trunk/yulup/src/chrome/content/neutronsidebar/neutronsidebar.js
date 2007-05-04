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

const NeutronSidebar = {
    CURRENT_RESOURCES_VIEWID: 0,
    SITETREE_VIEWID         : 1,

    __mainBrowserWindow: null,
    __viewSelector     : null,
    __contentContainer : null,
    __resourceDeck     : null,
    __sitetreeDeck     : null,
    __stringBundle     : null,

    serverURI       : null,
    neutronResources: null,

    /**
     * Initialise the sidebar.
     *
     * @return {Undefined} does not have a return value
     */
    onLoadListener: function () {
        var currentViewID     = null;
        var me                = this;

        /* DEBUG */ dump("Yulup:neutronsidebar.js:NeutronSidebar.onLoadListener() invoked\n");

        // get a handle on the main browser window
        this.__mainBrowserWindow = YulupAppServices.getMainBrowserWindow();

        // cache various elements
        this.__viewSelector     = document.getElementById("uiYulupNeutronSidebarContentDeckSelector");
        this.__contentContainer = document.getElementById("uiYulupNeutronSidebarContentTreeDeck");

        this.__stringBundle = YulupLocalisationServices.getStringBundle("chrome://yulup/locale/neutronsidebar.properties");

        this.__initSources();

        // init views
        this.__resourceDeck = new NeutronSidebarResourceDeck();
        this.__sitetreeDeck = new NeutronSidebarSitetreeDeck();

        // determine our start view
        if (this.neutronResources)
            currentViewID = this.CURRENT_RESOURCES_VIEWID;
        else
            currentViewID = this.SITETREE_VIEWID;

        // update menulist
        this.__viewSelector.selectedIndex = currentViewID;

        // install menulist selection change listener
        this.__viewSelector.addEventListener("ValueChange", function (aEvent) { me.contentSelectorListener(aEvent); }, false);

        this.__viewSelectionChanged(currentViewID);
    },

    __initSources: function () {
        var serverURIString   = null;

        /* DEBUG */ dump("Yulup:neutronsidebar.js:NeutronSidebar.__initSources() invoked\n");

        // retrieve Neutron introspection data from Yulup, if any
        if (this.__mainBrowserWindow.yulup.currentNeutronIntrospection &&
            this.__mainBrowserWindow.yulup.currentNeutronIntrospection.hasSitetreeURI()) {
            this.serverURI = this.__mainBrowserWindow.yulup.currentNeutronIntrospection.getSitetreeURI();
        } else if ((serverURIString = YulupPreferences.getCharPref("neutron.", "defaultserver")) != null) {
            // get default URI from preferences
            if (serverURIString != "")
                this.serverURI = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService).newURI(serverURIString, null, null)
        }

        // get current resources
        this.neutronResources = (this.__mainBrowserWindow.yulup.currentNeutronIntrospection ? this.__mainBrowserWindow.yulup.currentNeutronIntrospection.fragments : null);
    },

    reInit: function () {
        var currentViewID = null;

        /* DEBUG */ dump("Yulup:neutronsidebar.js:NeutronSidebar.reInit() invoked\n");

        this.__initSources();

        // determine our new view
        if (this.neutronResources)
            currentViewID = this.CURRENT_RESOURCES_VIEWID;
        else
            currentViewID = this.SITETREE_VIEWID;

        // clear views
        this.__clearViews();

        // update menulist
        this.__viewSelector.selectedIndex = currentViewID;

        this.__viewSelectionChanged(currentViewID);
    },

    __clearViews: function () {
        /* DEBUG */ dump("Yulup:neutronsidebar.js:NeutronSidebar.__clearViews() invoked\n");

        this.__resourceDeck.clearView();
        this.__sitetreeDeck.clearView();
    },

    __viewSelectionChanged: function (aViewID) {
        var me = this;

        /* DEBUG */ dump("Yulup:neutronsidebar.js:NeutronSidebar.__viewSelectionChanged(\"" + aViewID + "\") invoked\n");

        switch (aViewID) {
            case NeutronSidebar.CURRENT_RESOURCES_VIEWID:
                // current resources view
                if (this.__resourceDeck.showView()) {
                    // show the view
                    this.__contentContainer.selectedIndex = NeutronSidebar.CURRENT_RESOURCES_VIEWID;
                } else {
                    // view could not be shown
                    this.__viewSelector.selectedIndex     = NeutronSidebar.SITETREE_VIEWID;
                    this.__contentContainer.selectedIndex = NeutronSidebar.SITETREE_VIEWID;
                }

                break;
            case NeutronSidebar.SITETREE_VIEWID:
                // sitetree view
                if (this.__sitetreeDeck.showView()) {
                    // show the view
                    this.__contentContainer.selectedIndex = NeutronSidebar.SITETREE_VIEWID;
                } else {
                    // view could not be shown
                    this.__viewSelector.selectedIndex     = NeutronSidebar.CURRENT_RESOURCES_VIEWID;
                    this.__contentContainer.selectedIndex = NeutronSidebar.CURRENT_RESOURCES_VIEWID;
                }

                break;
            default:
        }
    },

    contentSelectorListener: function (aEvent) {
        /* DEBUG */ dump("Yulup:neutronsidebar.js:NeutronSidebar.contentSelectorListener(\"" + aEvent + "\") invoked\n");

        if (aEvent.originalTarget.namespaceURI == "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul" &&
            aEvent.originalTarget.localName    == "menulist")
            this.__viewSelectionChanged(aEvent.originalTarget.selectedIndex);

        // we consumed this event
        aEvent.stopPropagation();
    },

    constructVersionsContextMenu: function (aEvent, aView, aPopup) {
        var version        = null;
        var transitions    = null;
        var elem           = null;
        var me             = this;
        var mainBrowserWin = null;

        /* DEBUG */ dump("Yulup:neutronsidebar.js:NeutronSidebar.constructVersionsContextMenu() invoked\n");

        // get current selection
        version = aView.getSelectedVersion();

        // don't show the context menu if nothing selected
        if (!version) {
            aEvent.preventDefault();
            return;
        }

        // clean up popup menu
        while (aPopup.hasChildNodes())
            aPopup.removeChild(aPopup.firstChild);

        transitions = version.getWorkflowTransitions();

        if (transitions && transitions.length > 0) {
            // add transitions to menu
            for (var i = 0; i < transitions.length; i++) {
                elem = document.createElement("menuitem");

                if (transitions[i].description)
                    elem.setAttribute("label", transitions[i].description);
                else
                    elem.setAttribute("label", transitions[i].to);

                elem.workflowTransition = transitions[i];
                elem.addEventListener("command", function (aEvent) { me.versionContextHandler(aEvent); }, false);

                aPopup.appendChild(elem);
            }

            elem = document.createElement("menuseparator");
            aPopup.appendChild(elem);
        }

        // add "More information..." menuitem
        elem = document.createElement("menuitem");
        elem.setAttribute("label", this.__stringBundle.GetStringFromName("neutronSidebarVersionsContextMoreInfo.label"));

        mainBrowserWin = this.__mainBrowserWindow;

        elem.addEventListener("command", function (aEvent) { new NeutronVersionInfoDialog(mainBrowserWin, version.resource.name, version); }, false);

        aPopup.appendChild(elem);

        // add "Open this revision in new tab" menuitem
        elem = document.createElement("menuitem");
        elem.setAttribute("label", this.__stringBundle.GetStringFromName("neutronSidebarVersionsContextOpenRevision.label"));
        elem.addEventListener("command", function () { me.openRevision(aView); }, false);

        aPopup.appendChild(elem);
    },

    versionContextHandler: function (aEvent) {
        var transition        = null;

        /* DEBUG */ dump("Yulup:neutronsidebar.js:NeutronSidebar.versionContextHandler() invoked\n");

        if (aEvent.originalTarget.namespaceURI == "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul" &&
            aEvent.originalTarget.localName    == "menuitem") {
            transition = aEvent.originalTarget.workflowTransition;
        }

        /* DEBUG */ dump("Yulup:neutronsidebar.js:NeutronSidebar.versionContextHandler: transition =\n" + transition + "\n");

        transition.execute();
    },

    constructVersionsTooltip: function (aEvent, aView, aPopup) {
        var version = null;

        /* DEBUG */ dump("Yulup:neutronsidebar.js:NeutronSidebar.constructVersionsTooltip() invoked\n");

        version = aView.getVersionForRow(aView.getRowAt(aEvent.clientY));

        // don't show the tooltip if no information available
        if (!version) {
            aEvent.preventDefault();
            return;
        }

        // add version information to tooltip popup
        aPopup.info.clearFields();

        aPopup.info.revision = version.revision;
        aPopup.info.date     = version.date;
        aPopup.info.comment  = version.comment;
        aPopup.info.user     = version.user;

        if (version.getWorkflowState()) {
            aPopup.info.wfState = version.getWorkflowState().state;
            aPopup.info.wfDate  = version.getWorkflowState().date;
        }
    },

    openRevision: function (aView) {
        var version = null;
        var tab     = null;

        /* DEBUG */ dump("Yulup:neutronsidebar.js:NeutronSidebar.openRevision() invoked\n");

        // get current selection
        version = aView.getSelectedVersion();

        // bail out if nothing selected or version does not have an associated URI
        if (!version || !version.url)
            return;

        try {
            /* DEBUG */ dump("Yulup:neutronsidebar.js:NeutronSidebar.openRevision: opening URI \"" + version.url.spec + "\" in new tab\n");

            tab = this.__mainBrowserWindow.getBrowser().addTab(version.url.spec);

            this.__mainBrowserWindow.getBrowser().selectedTab = tab;
        } catch (exception) {
            /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:neutronsidebar.js:NeutronSidebar.openRevision", exception);
            /* DEBUG */ Components.utils.reportError(exception);
        }
    },

    /**
     * Cleanup the sidebar.
     *
     * @return {Undefined} does not have a return value
     */
    onUnloadListener: function () {
        /* DEBUG */ dump("Yulup:neutronsidebar.js:NeutronSidebar.onUnloadListener() invoked\n");
    }
};


function NeutronSidebarDeck() {}

NeutronSidebarDeck.prototype = {
    __resourceTree  : null,
    __versionTree   : null,
    __versionContext: null,
    __versionTooltip: null,
    __deckSplitter  : null,

    clearView: function () {
        /* DEBUG */ dump("Yulup:neutronsidebar.js:NeutronSidebarDeck.clearView() invoked\n");

        this.__resourceTree.view = null;

        this.__blankVersionTree();
    },

    __blankVersionTree: function () {
        // hide version tree
        this.__deckSplitter.setAttribute("state", "collapsed");

        // remove previous tree view
        this.__versionTree.view  = null;
    },

    getSelectedVersion: function () {
        if (this.__versionTree.view.wrappedJSObject)
            return this.__versionTree.view.wrappedJSObject.getSelectedVersion();
    },

    getVersionForRow: function (aRow) {
        if (this.__versionTree.view.wrappedJSObject)
            return this.__versionTree.view.wrappedJSObject.getVersionForRow(aRow);
    },

    getRowAt: function (aClientY) {
        if (this.__versionTree && this.__versionTree.treeBoxObject)
            return this.__versionTree.treeBoxObject.getRowAt(0, aClientY);

        return null;
    }
};


function NeutronSidebarResourceDeck() {
    var me = this;

    /* DEBUG */ dump("Yulup:neutronsidebar.js:NeutronSidebarResourceDeck() invoked\n");

    NeutronSidebarDeck.call(this);

    this.__resourceTree   = document.getElementById("uiYulupNeutronSidebarResourceTree");
    this.__versionTree    = document.getElementById("uiYulupNeutronSidebarResourceVersionTree");
    this.__versionContext = document.getElementById("uiYulupNeutronSidebarResourceVersionsContextMenu");
    this.__versionTooltip = document.getElementById("uiYulupNeutronSidebarResourceVersionsTooltip");
    this.__deckSplitter   = document.getElementById("uiYulupNeutronSidebarResourceDeckSplitter");

    this.__versionContext.addEventListener("popupshowing", function (aEvent) { NeutronSidebar.constructVersionsContextMenu(aEvent, me, me.__versionContext); }, false);
    this.__versionTooltip.addEventListener("popupshowing", function (aEvent) { NeutronSidebar.constructVersionsTooltip(aEvent, me, me.__versionTooltip); }, false);

    document.getElementById("uiYulupNeutronSidebarResourceVersionTreeTreeChildren").addEventListener("dblclick", function () { NeutronSidebar.openRevision(me); }, false);
}

NeutronSidebarResourceDeck.prototype = {
    __proto__: NeutronSidebarDeck.prototype,

    showView: function () {
        var me = this;

        /* DEBUG */ dump("Yulup:neutronsidebar.js:NeutronSidebarResourceDeck.showView() invoked\n");

        if (!(this.__resourceTree.view.wrappedJSObject &&
              this.__resourceTree.view.wrappedJSObject instanceof NeutronResourceTreeView)) {
            // check if we have introspection data
            if (NeutronSidebar.neutronResources) {
                this.__resourceTree.view = new NeutronResourceTreeView(NeutronSidebar.neutronResources, function (aResource) { me.resourcetreeSelectionListener(aResource); });

                // blank the version tree
                this.__blankVersionTree();
            } else {
                // we can't switch because there is no introspection data
                return false;
            }
        }

        this.__resourceTree.view.selection.select(0);

        return true;
    },

    resourcetreeSelectionListener: function (aResource) {
        var versions = null;

        /* DEBUG */ dump("Yulup:neutronsidebar.js:NeutronSidebarResourceDeck.resourcetreeSelectionListener(\"" + aResource + "\") invoked\n");

        // feed resource version information to the version tree
        versions = aResource.versions;

        if (versions && versions.length > 0) {
            this.__versionTree.view = new NeutronVersionTreeView(versions);

            // show version tree
            this.__deckSplitter.setAttribute("state", "open");
        }
    }
};


function NeutronSidebarSitetreeDeck() {
    var me = this;

    /* DEBUG */ dump("Yulup:neutronsidebar.js:NeutronSidebarSitetreeDeck() invoked\n");

    NeutronSidebarDeck.call(this);

    this.__resourceTree   = document.getElementById("uiYulupNeutronSidebarSitetreeTree");
    this.__versionTree    = document.getElementById("uiYulupNeutronSidebarSitetreeVersionTree");
    this.__versionContext = document.getElementById("uiYulupNeutronSidebarSitetreeVersionsContextMenu");
    this.__versionTooltip = document.getElementById("uiYulupNeutronSidebarSitetreeVersionsTooltip");
    this.__deckSplitter   = document.getElementById("uiYulupNeutronSidebarSitetreeDeckSplitter");

    this.__versionContext.addEventListener("popupshowing", function (aEvent) { NeutronSidebar.constructVersionsContextMenu(aEvent, me, me.__versionContext); }, false);
    this.__versionTooltip.addEventListener("popupshowing", function (aEvent) { NeutronSidebar.constructVersionsTooltip(aEvent, me, me.__versionTooltip); }, false);

    document.getElementById("uiYulupNeutronSidebarSitetreeVersionTreeTreeChildren").addEventListener("dblclick", function () { NeutronSidebar.openRevision(me); }, false);
}

NeutronSidebarSitetreeDeck.prototype = {
    __proto__: NeutronSidebarDeck.prototype,

    showView: function () {
        var me = this;

        /* DEBUG */ dump("Yulup:neutronsidebar.js:NeutronSidebarSitetreeDeck.showView() invoked\n");

        if (!(this.__resourceTree.view.wrappedJSObject &&
              this.__resourceTree.view.wrappedJSObject instanceof SitetreeView)) {
            // check if we have a server URI
            if (NeutronSidebar.serverURI) {
                this.__resourceTree.view = new SitetreeView(NeutronSidebar.serverURI, this.sitetreeErrorListener, function (aNode) { me.sitetreeSelectionListener(aNode); });

                // blank the version tree
                this.__blankVersionTree();
            } else {
                // we can't switch because there is no server URI
                return false;
            }
        }

        return true;
    },

    sitetreeErrorListener: function () {
        /* DEBUG */ dump("Yulup:neutronsidebar.js:NeutronSidebarSitetreeDeck.sitetreeErrorListener() invoked\n");
    },

    sitetreeSelectionListener: function (aNode) {
        var resource = null;

        /* DEBUG */ dump("Yulup:neutronsidebar.js:NeutronSidebarSitetreeDeck.sitetreeSelectionListener(\"" + aNode + "\") invoked\n");

        // TODO: get selected resource

        // TODO: get the introspection data for this resource

        // TODO: feed resource version information to the version tree
    }
};


/**
 * NeutronResourceTreeView constructor. Instantiates a new object of
 * type NeutronResourceTreeView.
 *
 * Implementes the nsITreeView interface.
 *
 * @constructor
 * @param  {Array} aNeutronResources  an array of NeutronResource objects
 * @return {NeutronResourceTreeView} a new NeutronResourceTreeView object
 */
function NeutronResourceTreeView(aNeutronResources, aSelectionChangeObserver) {
    /* DEBUG */ dump("Yulup:neutronsidebar.js:NeutronResourceTreeView() invoked\n");

    /* DEBUG */ YulupDebug.ASSERT(aNeutronResources != null);

    // call super constructor
    YulupTreeViewBase.call(this);

    this.__treeSource              = aNeutronResources;
    this.__selectionChangeObserver = aSelectionChangeObserver;
    this.rowCount                  = this.__treeSource.length;

    this.wrappedJSObject = this;

    /* DEBUG */ dump("Yulup:neutronsidebar.js:NeutronResourceTreeView: this.rowCount = \"" + this.rowCount + "\"\n");
}

NeutronResourceTreeView.prototype = {
    __proto__: YulupTreeViewBase.prototype,

    __treeSource             : null,
    __selectionChangeObserver: null,

    wrappedJSObject: null,

    /**
     * Get the text for a given cell.
     *
     * @param  {Number}        aRow    the row
     * @param  {nsITreeColumn} aColumn the column
     * @return {String}
     */
    getCellText: function (aRow, aColumn) {
        /* DEBUG */ dump("Yulup:neutronsidebar.js:NeutronResourceTreeView.getCellText(\"" + aRow + "\", \"" + aColumn + "\") invoked\n");

        return this.__treeSource[aRow].name;
    },

    selectionChanged: function() {
        var resource = null;

        /* DEBUG */ dump("Yulup:neutronsidebar.js:NeutronResourceTreeView.selectionChanged() invoked\n");

        if (this.__selectionChangeObserver) {
            try {
                this.__selectionChangeObserver(this.__treeSource[this.selection.currentIndex]);
            } catch (exception) {
                // we don't want to fail here
                /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:neutronsidebar.js:NeutronResourceTreeView.selectionChanged", exception);
                /* DEBUG */ Components.utils.reportError(exception);
            }
        }
    }
};


/**
 * NeutronVersionTreeView constructor. Instantiates a new object of
 * type NeutronVersionTreeView.
 *
 * Implementes the nsITreeView interface.
 *
 * @constructor
 * @param  {Array} aNeutronResourceVersions  an array of NeutronResourceVersion objects
 * @return {NeutronVersionTreeView} a new NeutronVersionTreeView object
 */
function NeutronVersionTreeView(aNeutronResourceVersions) {
    /* DEBUG */ dump("Yulup:neutronsidebar.js:NeutronVersionTreeView() invoked\n");

    /* DEBUG */ YulupDebug.ASSERT(aNeutronResourceVersions != null);

    // call super constructor
    YulupTreeViewBase.call(this);

    this.__treeSource = aNeutronResourceVersions;
    this.rowCount     = this.__treeSource.length;

    this.wrappedJSObject = this;

    /* DEBUG */ dump("Yulup:neutronsidebar.js:NeutronVersionTreeView: this.rowCount = \"" + this.rowCount + "\"\n");
}

NeutronVersionTreeView.prototype = {
    __proto__: YulupTreeViewBase.prototype,

    __treeSource: null,

    wrappedJSObject: null,

    /**
     * Returns the currently selected version or null, if no
     * selection.
     *
     * @return {NeutronResourceVersion}  returns the currently selected version, or null if nothing is selected
     */
    getSelectedVersion: function () {
        var selection = null;

        selection = this.selection.currentIndex;

        // return null if nothing selected
        if (selection < 0)
            return null;

        return this.__treeSource[selection];
    },

    getVersionForRow: function (aRow) {
        /* DEBUG */ YulupDebug.ASSERT(aRow != null);

        // return null if row out of bounds
        if (aRow < 0)
            return null;

        return this.__treeSource[aRow];
    },

    /**
     * Get the text for a given cell.
     *
     * @param  {Number}        aRow    the row
     * @param  {nsITreeColumn} aColumn the column
     * @return {String}
     */
    getCellText: function (aRow, aColumn) {
        var workflowState = null;

        /* DEBUG */ dump("Yulup:neutronsidebar.js:NeutronVersionTreeView.getCellText(\"" + aRow + "\", \"" + aColumn + "\") invoked\n");

        switch (aColumn.element.getAttribute("name")) {
            case "revision":
                return this.__treeSource[aRow].revision;
                break;
            case "date":
                return this.__treeSource[aRow].date;
                break;
            case "wf-state":
                if (workflowState = this.__treeSource[aRow].getWorkflowState())
                    return workflowState.state;
                break;
            case "wf-date":
                if (workflowState = this.__treeSource[aRow].getWorkflowState())
                    return workflowState.date;
                break;
        }

        return "";
    }
};
