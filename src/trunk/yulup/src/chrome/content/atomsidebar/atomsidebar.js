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

var AtomSidebar = {
    __init: false,

    sidebar          : null,
    mainBrowserWindow: null,
    currentSelection : null,

    /**
     * Initialise the sidebar.
     *
     * @return {Undefined} does not have a return value
     */
    onLoadListener: function () {
        var appIntrospection  = null;

        AtomSidebar.__init = true;

        /* DEBUG */ dump("Yulup:atomsidebar.js:AtomSidebar.onLoadListener() invoked\n");

        // get a handle on the main browser window
        AtomSidebar.mainBrowserWindow = window.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
            .getInterface(Components.interfaces.nsIWebNavigation)
            .QueryInterface(Components.interfaces.nsIDocShellTreeItem)
            .rootTreeItem
            .QueryInterface(Components.interfaces.nsIInterfaceRequestor)
            .getInterface(Components.interfaces.nsIDOMWindow);

        // retrieve APP introspection document from Yulup, if any
        appIntrospection = AtomSidebar.mainBrowserWindow.yulup.currentAPPIntrospection;

        // get a handle on this sidebar
        AtomSidebar.sidebar = document.getElementById("uiYulupAtomSidebarPage");

        // set up the feed info deck
        AtomSidebar.__feedInfoDeckSetUp();

        // fill the sidebar
        AtomSidebar.sidebar.fillSidebar(appIntrospection);

        document.getElementById("uiYulupAtomSidebarWorkspaceMenulist").addEventListener("ValueChange", AtomSidebar.workspaceChanged, false);
        document.getElementById("uiYulupAtomSidebarCollectionMenulist").addEventListener("ValueChange", AtomSidebar.collectionChanged, false);
    },

    /**
     * Cleanup the sidebar.
     *
     * @return {Undefined} does not have a return value
     */
    onUnloadListener: function () {
        /* DEBUG */ dump("Yulup:atomsidebar.js:AtomSidebar.onUnloadListener() invoked\n");

        // inform Yulup menu that we don't have a feed anymore
        AtomSidebar.sidebar.feedSelected(false);

        // remove event listeners
        document.getElementById("uiYulupAtomSidebarWorkspaceMenulist").removeEventListener("ValueChange", AtomSidebar.workspaceChanged, false);
        document.getElementById("uiYulupAtomSidebarCollectionMenulist").removeEventListener("ValueChange", AtomSidebar.collectionChanged, false);
    },

    reInit: function () {
        var appIntrospection  = null;

        if (AtomSidebar.__init) {
            // retrieve APP introspection document from Yulup, if any
            appIntrospection = AtomSidebar.mainBrowserWindow.yulup.currentAPPIntrospection;

            // remove event listeners
            document.getElementById("uiYulupAtomSidebarWorkspaceMenulist").removeEventListener("ValueChange", AtomSidebar.workspaceChanged, false);
            document.getElementById("uiYulupAtomSidebarCollectionMenulist").removeEventListener("ValueChange", AtomSidebar.collectionChanged, false);

            // fill the sidebar
            AtomSidebar.sidebar.fillSidebar(appIntrospection);

            // add event listeners
            document.getElementById("uiYulupAtomSidebarWorkspaceMenulist").addEventListener("ValueChange", AtomSidebar.workspaceChanged, false);
            document.getElementById("uiYulupAtomSidebarCollectionMenulist").addEventListener("ValueChange", AtomSidebar.collectionChanged, false);
        } else {
            // remove event listeners
            document.getElementById("uiYulupAtomSidebarWorkspaceMenulist").removeEventListener("ValueChange", AtomSidebar.workspaceChanged, false);
            document.getElementById("uiYulupAtomSidebarCollectionMenulist").removeEventListener("ValueChange", AtomSidebar.collectionChanged, false);

            AtomSidebar.onLoadListener();
        }
    },

    workspaceChanged: function (aEvent) {
        /* DEBUG */ dump("Yulup:atomsidebar.js:AtomSidebar.workspaceChanged(\"" + aEvent + "\") invoked\n");

        AtomSidebar.sidebar.updateCollections(document.getElementById("uiYulupAtomSidebarWorkspaceMenulist").selectedIndex);

        // we consumed this event
        aEvent.stopPropagation();
    },

    collectionChanged: function (aEvent) {
        /* DEBUG */ dump("Yulup:atomsidebar.js:AtomSidebar.collectionChanged(\"" + aEvent + "\") invoked\n");

        AtomSidebar.sidebar.updateFeed(document.getElementById("uiYulupAtomSidebarCollectionMenulist").selectedIndex);

        // we consumed this event
        aEvent.stopPropagation();
    },

    editCurrentEntry: function () {
        var selectedEntries = null;
        var editURI         = null;
        var introspection   = null;
        var fragment        = null;

        /* DEBUG */ dump("Yulup:atomsidebar.js:AtomSidebar.editCurrentEntry() invoked\n");

        // get the entries scheduled for editing
        selectedEntries = AtomSidebar.currentSelection;

        for (var i = 0; i < selectedEntries.length; i++) {
            // retrieve rel="edit" link from selected entry
            if (editURI = selectedEntries[i].getEditURI()) {
                /* DEBUG */ dump("Yulup:atomsidebar.js:AtomSidebar.editCurrentEntry: edit link \"" + editURI + "\" found. Calling editor.\n");

                // call Yulup to create a new editor
                AtomSidebar.mainBrowserWindow.yulup.editAtomEntryProxy(editURI);
            } else {
                /* DEBUG */ dump("Yulup:atomsidebar.js:AtomSidebar.editCurrentEntry: no edit link found. Aborting.\n");
            }
        }
    },

    deleteCurrentEntry: function () {
        var selectedEntries = null;

        /* DEBUG */ dump("Yulup:atomsidebar.js:AtomSidebar.deleteCurrentEntry() invoked\n");

        // get the entries scheduled for deletion
        selectedEntries = AtomSidebar.currentSelection;

        for (var i = 0; i < selectedEntries.length; i++) {
            // delete the entry
            try {
                selectedEntries[i].deleteEntry(AtomSidebar.__deleteFinishedCallback);
            } catch (exception) {
                /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:atomsidebar.js:AtomSidebar.deleteCurrentEntry", exception);
                Components.utils.reportError(exception);

                alert(document.getElementById("uiYulupAtomSidebarStringbundle").getString("atomSidebarDeleteFailed.label"));
            }
        }
    },

    constructFeedEntriesMenu: function () {
        var treeView      = null;
        var flatSelection = null;
        var rangeCount    = null;
        var rangeMin      = null;
        var rangeMax      = null;

        /* DEBUG */ dump("Yulup:atomsidebar.js:AtomSidebar.constructFeedEntriesMenu() invoked\n");

        // flatten out selection
        treeView = document.getElementById("uiYulupAtomSidebarFeedEntriesTree").view;

        flatSelection = new Array();
        rangeCount    = treeView.selection.getRangeCount();

        // workaround for bug https://bugzilla.mozilla.org/show_bug.cgi?id=171547
        if (treeView.rowCount > 0) {
            // for every range
            for (var i = 0; i < rangeCount; i++) {
                rangeMin = new Object();
                rangeMax = new Object();

                treeView.selection.getRangeAt(i, rangeMin, rangeMax);

                // for every selection in range
                for (var j = rangeMin.value; j <= rangeMax.value; j++) {
                    if (AtomSidebar.sidebar.currentFeed.getEntry(j).isEditable()) {
                        flatSelection.push(AtomSidebar.sidebar.currentFeed.getEntry(j));
                    }
                }
            }
        }

        if (flatSelection.length > 0) {
            /* DEBUG */ dump("Yulup:atomsidebar.js:AtomSidebar.constructFeedEntriesMenu: enable edit operations\n");

            document.getElementById("uiYulupAtomSidebarFeedEntriesContextMenuEditEntry").removeAttribute("disabled");
            document.getElementById("uiYulupAtomSidebarFeedEntriesContextMenuDeleteEntry").removeAttribute("disabled");
        } else {
            /* DEBUG */ dump("Yulup:atomsidebar.js:AtomSidebar.constructFeedEntriesMenu: disable edit operations\n");

            document.getElementById("uiYulupAtomSidebarFeedEntriesContextMenuEditEntry").setAttribute("disabled", "true");
            document.getElementById("uiYulupAtomSidebarFeedEntriesContextMenuDeleteEntry").setAttribute("disabled", "true");
        }

        AtomSidebar.currentSelection = flatSelection;
    },

    __feedInfoDeckSetUp: function () {
        /* DEBUG */ dump("Yulup:atomsidebar.js:AtomSidebar.__feedInfoDeckSetUp() invoked\n");

        // TODO: we might have to load the content after these flags are set; verify with a testcase
        document.getElementById("uiYulupAtomSidebarFeedInfoBox").docShell.allowJavascript    = false;
        document.getElementById("uiYulupAtomSidebarFeedInfoBox").docShell.allowPlugins       = false;
        document.getElementById("uiYulupAtomSidebarFeedInfoBox").docShell.allowMetaRedirects = false;
        document.getElementById("uiYulupAtomSidebarFeedInfoBox").docShell.allowSubframes     = false;
    },

    __deleteFinishedCallback: function (aDocumentData, aException) {
        if (!aException) {
            alert(document.getElementById("uiYulupAtomSidebarStringbundle").getString("atomSidebarDeleteSuccess.label"));
        } else {
            alert(document.getElementById("uiYulupAtomSidebarStringbundle").getString("atomSidebarDeleteFailed.label") + "\n\n" + aException.message);
        }
    }
}

/**
 * AtomTreeView constructor. Instantiates a new object of
 * type AtomTreeView.
 *
 * Implementes the nsITreeView interface.
 *
 * @constructor
 * @param  {AtomFeed}     aAtomFeed the Atom feed to show in this view
 * @return {AtomTreeView} a new AtomTreeView object
 */
function AtomTreeView(aAtomFeed) {
    /* DEBUG */ dump("Yulup:atomsidebar.js:AtomTreeView(\"" + aAtomFeed + "\") invoked\n");

    // call super constructor
    YulupTreeViewBase.call(this);

    this.atomFeed = aAtomFeed;
    this.rowCount = this.atomFeed.getNumberOfEntries();

    /* DEBUG */ dump("Yulup:atomsidebar.js:AtomTreeView: this.rowCount = \"" + this.rowCount + "\"\n");
}

AtomTreeView.prototype = {
    __proto__: YulupTreeViewBase.prototype,

    atomFeed: null,

    /**
     * Get the text for a given cell.
     *
     * @param  {Number}        aRow    the row
     * @param  {nsITreeColumn} aColumn the column
     * @return {String}
     */
    getCellText: function (aRow, aColumn) {
        ///* DEBUG */ dump("Yulup:atomsidebar.js:AtomTreeView.getCellText(\"" + aRow + "\", \"" + aColumn + "\") invoked\n");

        if (aColumn.id == "titleColumn")
            return this.atomFeed.getEntry(aRow).getTitle();
        else
            return null;
    }
};
