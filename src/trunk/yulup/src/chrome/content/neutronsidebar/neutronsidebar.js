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
    __contentTreeDeck  : null,
    __resourceTree     : null,
    __sitetreeTree     : null,
    __versionTree      : null,
    __serverURI        : null,
    __neutronResources : null,

    /**
     * Initialise the sidebar.
     *
     * @return {Undefined} does not have a return value
     */
    onLoadListener: function () {
        var mainBrowserWindow = null;
        var serverURIString   = null;
        var currentViewID     = null;
        var menulist          = null;
        var me                = this;

        /* DEBUG */ dump("Yulup:neutronsidebar.js:NeutronSidebar.onLoadListener() invoked\n");

        // get a handle on the main browser window
        this.__mainBrowserWindow = YulupAppServices.getMainBrowserWindow();

        // retrieve Neutron introspection document from Yulup, if any
        if (this.__mainBrowserWindow.yulup.currentNeutronIntrospection && this.__mainBrowserWindow.yulup.currentNeutronIntrospection.hasSitetreeURI()) {
            this.__serverURI = this.__mainBrowserWindow.yulup.currentNeutronIntrospection.getSitetreeURI();

            /* DEBUG */ dump("Yulup:neutronsidebar.js:NeutronSidebar.onLoadListener: use sitetree uri (\"" + this.__serverURI + "\") from Neutron introspection\n");
        } else if ((serverURIString = YulupPreferences.getCharPref("neutron.", "defaultserver")) != null) {
            // get default URI from preferences
            if (serverURIString != "") {
                this.__serverURI = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService).newURI(serverURIString, null, null)
            } else
                return false;
        } else {
            return false;
        }

        // cache various elements
        this.__viewSelector    = document.getElementById("uiYulupNeutronSidebarContentDeckSelector");
        this.__contentTreeDeck = document.getElementById("uiYulupNeutronSidebarContentTreeDeck");
        this.__resourceTree    = document.getElementById("uiYulupNeutronSidebarResourceTree");
        this.__sitetreeTree    = document.getElementById("uiYulupNeutronSidebarSiteTree");
        this.__versionTree     = document.getElementById("uiYulupNeutronSidebarVersionTree");

        // get current resources
        this.__neutronResources = (this.__mainBrowserWindow.yulup.currentNeutronIntrospection ? this.__mainBrowserWindow.yulup.currentNeutronIntrospection.fragments : null);

        // determine our start view
        if (this.__neutronResources)
            currentViewID = this.CURRENT_RESOURCES_VIEWID;
        else
            currentViewID = this.SITETREE_VIEWID;

        // update menulist
        this.__viewSelector.selectedIndex = currentViewID;

        // install menulist selection change listener
        this.__viewSelector.addEventListener("ValueChange", function (aEvent) { me.contentSelectorListener(aEvent); }, false);

        this.viewSelectionChanged(currentViewID);
    },

    setNeutronResources: function (aNeutronResources) {
        /* DEBUG */ dump("Yulup:neutronsidebar.js:NeutronSidebar.setNeutronResources() invoked\n");

        this.__neutronResources = aNeutronResources;

        // update the resource tree
        if (this.__neutronResources)
            this.__resourceTree.view = new NeutronResourceTreeView(this.__neutronResources, this.resourcetreeSelectionListener);
        else
            this.__resourceTree.view = null;

        // blank the version tree
        this.__versionTree.view = null;
    },

    viewSelectionChanged: function (aViewID) {
        var me = this;

        /* DEBUG */ dump("Yulup:neutronsidebar.js:NeutronSidebar.viewSelectionChanged(\"" + aViewID + "\") invoked\n");

        switch (aViewID) {
            case NeutronSidebar.CURRENT_RESOURCES_VIEWID:
                // current resources view
                if (!(this.__resourceTree.view.wrappedJSObject &&
                      this.__resourceTree.view.wrappedJSObject instanceof NeutronResourceTreeView)) {
                    // check if we have introspection data
                    if (this.__neutronResources) {
                        this.__resourceTree.view = new NeutronResourceTreeView(this.__neutronResources, function (aResource) { me.resourcetreeSelectionListener(aResource); });

                        // blank the version tree
                        this.__versionTree.view = null;

                        // show the view
                        this.__contentTreeDeck.selectedIndex = NeutronSidebar.CURRENT_RESOURCES_VIEWID;
                    } else {
                        // we can't switch because there is no introspection data
                        this.__viewSelector.selectedIndex = NeutronSidebar.SITETREE_VIEWID;
                    }
                } else {
                    // show the view
                    this.__contentTreeDeck.selectedIndex = NeutronSidebar.CURRENT_RESOURCES_VIEWID;
                }

                break;
            case NeutronSidebar.SITETREE_VIEWID:
                // sitetree view
                if (!(this.__sitetreeTree.view.wrappedJSObject &&
                      this.__sitetreeTree.view.wrappedJSObject instanceof SitetreeView)) {
                    this.__sitetreeTree.view = new SitetreeView(this.__serverURI, this.sitetreeErrorListener, function (aNode) { me.sitetreeSelectionListener(aNode); });

                    // blank the version tree
                    this.__versionTree.view = null;
                }

                // show the view
                this.__contentTreeDeck.selectedIndex = NeutronSidebar.SITETREE_VIEWID;

                break;
            default:
        }
    },

    contentSelectorListener: function (aEvent) {
        /* DEBUG */ dump("Yulup:neutronsidebar.js:NeutronSidebar.contentSelectorListener(\"" + aEvent + "\") invoked\n");

        if (aEvent.originalTarget.namespaceURI == "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul" &&
            aEvent.originalTarget.localName    == "menulist")
            this.viewSelectionChanged(aEvent.originalTarget.selectedIndex);

        // we consumed this event
        aEvent.stopPropagation();
    },

    sitetreeSelectionListener: function (aNode) {
        var resource = null;

        /* DEBUG */ dump("Yulup:neutronsidebar.js:NeutronSidebar.sitetreeSelectionListener(\"" + aNode + "\") invoked\n");

        // TODO: get selected resource

        // TODO: get the introspection data for this resource

        // TODO: feed resource version information to the version tree
    },

    resourcetreeSelectionListener: function (aResource) {
        var versions = null;

        /* DEBUG */ dump("Yulup:neutronsidebar.js:NeutronSidebar.resourcetreeSelectionListener(\"" + aResource + "\") invoked\n");

        // feed resource version information to the version tree
        versions = aResource.versions;

        if (versions && versions.length > 0)
            this.__versionTree.view = new NeutronVersionTreeView(versions);
    },

    constructVersionsContextMenu: function (aPopup) {
        var version     = null;
        var transitions = null;
        var elem        = null;
        var me          = this;

        /* DEBUG */ dump("Yulup:neutronsidebar.js:NeutronSidebar.constructVersionsContextMenu() invoked\n");

        // get current selection
        version = this.__versionTree.view.wrappedJSObject.getSelectedVersion()

        // don't show the context menu if nothing selected
        if (!version)
            return false;

        transitions = version.getWorkflowTransitions();

        // don't show the context menu if no transitions available
        if (!transitions)
            return false;

        // clean up popup menu
        while (aPopup.hasChildNodes())
            aPopup.removeChild(aPopup.firstChild);

        // add transitions to menu
        for (var i = 0; i < transitions.length; i++) {
            elem = document.createElement("menuitem");
            elem.setAttribute("label", transitions[i].to);
            elem.workflowTransition = transitions[i];
            elem.addEventListener("command", function (aEvent) { me.versionContextHandler(aEvent); }, false);

            aPopup.appendChild(elem);
        }
    },

    versionContextHandler: function (aEvent) {
        var transition = null;

        /* DEBUG */ dump("Yulup:neutronsidebar.js:NeutronSidebar.versionContextHandler() invoked\n");

        if (aEvent.originalTarget.namespaceURI == "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul" &&
            aEvent.originalTarget.localName    == "menuitem")
            transition = aEvent.originalTarget.workflowTransition;

        dump(transition);

        this.__mainBrowserWindow.Neutron.performWorkflowTransition(transition);
    },

    /**
     * Cleanup the sidebar.
     *
     * @return {Undefined} does not have a return value
     */
    onUnloadListener: function () {
        /* DEBUG */ dump("Yulup:neutronsidebar.js:NeutronSidebar.onUnloadListener() invoked\n");
    },

    sitetreeErrorListener: function () {
        /* DEBUG */ dump("Yulup:neutronsidebar.js:NeutronSidebar.sitetreeErrorListener() invoked\n");
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

        if (aColumn.id == "uiYulupNeutronSidebarResourceNameTreeCol")
            return this.__treeSource[aRow].name;
        else
            return null;
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
    },
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

        // don't show the context menu if nothing selected
        if (selection < 0)
            return null;

        return this.__treeSource[selection];
    },

    /**
     * Get the text for a given cell.
     *
     * @param  {Number}        aRow    the row
     * @param  {nsITreeColumn} aColumn the column
     * @return {String}
     */
    getCellText: function (aRow, aColumn) {
        /* DEBUG */ dump("Yulup:neutronsidebar.js:NeutronVersionTreeView.getCellText(\"" + aRow + "\", \"" + aColumn + "\") invoked\n");

        if (aColumn.id == "uiYulupNeutronSidebarVersionTreeCol")
            return this.__treeSource[aRow].revision;
        else
            return null;
    }
};
