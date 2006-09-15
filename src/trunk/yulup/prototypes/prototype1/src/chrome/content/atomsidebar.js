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

    this.atomFeed = aAtomFeed;
    this.rowCount = this.atomFeed.getNumberOfEntries();

    /* DEBUG */ dump("Yulup:atomsidebar.js:AtomTreeView: this.rowCount = \"" + this.rowCount + "\"\n");
}

AtomTreeView.prototype = {
    atomFeed     : null,
    treeBoxObject: null,
    rowCount     : null,

    /**
     * Determine if drop is allowed at the current location.
     *
     * @param  {Number}  aRow         the row to drop
     * @param  {Number}  aOrientation the orientation specifiecs to drop before/on/after the given row
     * @return {Boolean} returns true if drop is allowed at current location
     */
    canDrop: function (aRow, aOrientation) {
        ///* DEBUG */ dump("Yulup:atomsidebar.js:AtomTreeView.canDrop(\"" + aRow + "\", \"" + aOrientation + "\") invoked\n");

        // nothing to drop on a feed
        return false;
    },

    /**
     * Cycle the given cell.
     *
     * @param  {Number}        aRow    the row
     * @param  {nsITreeColumn} aColumn the column
     * @return {Undefined} does not have a return value
     */
    cycleCell: function (aRow, aColumn) {
        ///* DEBUG */ dump("Yulup:atomsidebar.js:AtomTreeView.cycleCell(\"" + aRow + "\", \"" + aColumn + "\") invoked\n");

        // we don't support cycling of cells
    },

    /**
     * Cycle the given column header.
     *
     * @param  {nsITreeColumn} aColumn the column
     * @return {Undefined} does not have a return value
     */
    cycleHeader: function (aColumn) {
        ///* DEBUG */ dump("Yulup:atomsidebar.js:AtomTreeView.cycleHeader(\"" + aColumn + "\") invoked\n");

        // we don't support cycling of headers
    },

    /**
     * Drop at the current location.
     *
     * @param  {Number}  aRow         the row to drop
     * @param  {Number}  aOrientation the orientation specifiecs to drop before/on/after the given row
     * @return {Undefined} does not have a return value
     */
    drop: function (aRow, aOrientation) {
        ///* DEBUG */ dump("Yulup:atomsidebar.js:AtomTreeView.drop(\"" + aRow + "\", \"" + aOrientation + "\") invoked\n");

        // we don't support dropping
    },

    /**
     * Get the properties for a given cell.
     *
     * @param  {Number}           aRow        the row
     * @param  {nsITreeColumn}    aColumn     the column
     * @param  {nsISupportsArray} aProperties the properties
     * @return {Undefined} does not have a return value
     */
    getCellProperties: function (aRow, aColumn, aProperties) {
        ///* DEBUG */ dump("Yulup:atomsidebar.js:AtomTreeView.getCellProperties(\"" + aRow + "\", \"" + aColumn + "\", \"" + aProperties + "\") invoked\n");

        // we don't care about properties
    },

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
    },

    /**
     * Get the value for a given cell in a column
     * of a different type than text.
     *
     * @param  {Number}        aRow    the row
     * @param  {nsITreeColumn} aColumn the column
     * @return {String}
     */
    getCellValue: function (aRow, aColumn) {
        ///* DEBUG */ dump("Yulup:atomsidebar.js:AtomTreeView.getCellValue(\"" + aRow + "\", \"" + aColumn + "\") invoked\n");

        // we only have text columns
        return null;
    },

    /**
     * Get the properties for a given column.
     *
     * @param  {nsITreeColumn}    aColumn     the column
     * @param  {nsISupportsArray} aProperties the properties
     * @return {Undefined} does not have a return value
     */
    getColumnProperties: function (aColumn, aProperties) {
        ///* DEBUG */ dump("Yulup:atomsidebar.js:AtomTreeView.getColumnProperties(\"" + aColumn + "\", \"" + aProperties + "\") invoked\n");

        // we don't care about properties
    },

    /**
     * Get the image path for a given cell.
     *
     * @param  {Number}        aRow    the row
     * @param  {nsITreeColumn} aColumn the column
     * @return {String}        path to the image for the given cell
     */
    getImageSrc: function (aRow, aColumn) {
        ///* DEBUG */ dump("Yulup:atomsidebar.js:AtomTreeView.getImageSrc(\"" + aRow + "\", \"" + aColumn + "\") invoked\n");

        // we don't show any images
        return null;
    },

    /**
     * Return the indentation level of the given row.
     *
     * @param  {Number} aRow the row to test
     * @return {Number} returns the indentation level of the given row
     */
    getLevel: function (aRow) {
        ///* DEBUG */ dump("Yulup:atomsidebar.js:AtomTreeView.getLevel(\"" + aRow + "\") invoked\n");

        // we don't use indentation
        return 0;
    },

    /**
     * Return the index of the parent row.
     *
     * @param  {Number} aRow the row
     * @return {Number} returns the index of the parent row
     */
    getParentIndex: function (aRow) {
        ///* DEBUG */ dump("Yulup:atomsidebar.js:AtomTreeView.getParentIndex(\"" + aRow + "\") invoked\n");

        // we don't have a threaded view
        return -1;
    },

    /**
     * Get the progress mode for the given cell.
     *
     * @param  {Number}        aRow    the row
     * @param  {nsITreeColumn} aColumn the column
     * @return {Number}        returns the progress mode of the given cell
     */
    getProgressMode: function (aRow, aColumn) {
        ///* DEBUG */ dump("Yulup:atomsidebar.js:AtomTreeView.getProgressMode(\"" + aRow + "\", \"" + aColumn + "\") invoked\n");

        // we don't have columns of type progressmeter
        return Components.interfaces.nsITreeView.PROGRESS_UNDETERMINED;
    },

    /**
     * Get the properties for a given row.
     *
     * @param  {Number}           aRow        the row
     * @param  {nsISupportsArray} aProperties the properties
     * @return {Undefined} does not have a return value
     */
    getRowProperties: function (aRow, aProperties) {
        ///* DEBUG */ dump("Yulup:atomsidebar.js:AtomTreeView.getRowProperties(\"" + aRow + "\", \"" + aProperties + "\") invoked\n");

        // we don't care about properties
    },

    /**
     * Determine if the row has a next sibling that
     * occurs after the index specified by aAfterRowIndex.
     *
     * @param  {Number}  aRow           the row
     * @param  {Number}  aAfterRowIndex the after row index
     * @return {Boolean} returns true if aRow has a next sibling after row aAfterRowIndex
     */
    hasNextSibling: function (aRow, aAfterRowIndex) {
        ///* DEBUG */ dump("Yulup:atomsidebar.js:AtomTreeView.hasNextSibling(\"" + aRow + "\", \"" + aAfterRowIndex + "\") invoked\n");

        // we don't do this
    },

    /**
     * Determine if a given row is a container.
     *
     * @param  {Number}  aRow the row to test
     * @return {Boolean} returns true if aRow is a container
     */
    isContainer: function (aRow) {
        ///* DEBUG */ dump("Yulup:atomsidebar.js:AtomTreeView.isContainer(\"" + aRow + "\") invoked\n");

        // we don't have any containers
        return false;
    },

    /**
     * Determine if the container at the given row is empty.
     *
     * @param  {Number}  aRow the row to test
     * @return {Boolean} returns true if aRow is an empty container
     */
    isContainerEmpty: function (aRow) {
        ///* DEBUG */ dump("Yulup:atomsidebar.js:AtomTreeView.isContainerEmpty(\"" + aRow + "\") invoked\n");

        // we don't have any containers
        return false;
    },

    /**
     * Determine if the container at the given row is open.
     *
     * @param  {Number}  aRow the row to test
     * @return {Boolean} returns true if aRow is an open container
     */
    isContainerOpen: function (aRow) {
        ///* DEBUG */ dump("Yulup:atomsidebar.js:AtomTreeView.isContainerOpen(\"" + aRow + "\") invoked\n");

        // we don't have any containers
        return false;
    },

    /**
     * Determine if the given cell is editable.
     *
     * @param  {Number}        aRow    the row
     * @param  {nsITreeColumn} aColumn the column
     * @return {Booelan}       returns true if the given cell is editable
     */
    isEditable: function (aRow, aColumn) {
        ///* DEBUG */ dump("Yulup:atomsidebar.js:AtomTreeView.isEditable(\"" + aRow + "\", \"" + aColumn + "\") invoked\n");

        // we don't have any editable cells
        return false;
    },

    /**
     * Test if the given row is a separator.
     *
     * @param  {Number}  aRow the row to test
     * @return {Boolean} returns true if aRow is a separator
     */
    isSeparator: function (aRow) {
        ///* DEBUG */ dump("Yulup:atomsidebar.js:AtomTreeView.isSeparator(\"" + aRow + "\") invoked\n");

        // we don't have any separator rows
        return false;
    },

    /**
     * Test if currently one of the columns is sorted.
     *
     * @return {Boolean} returns true if one of the columns is currently sorted
     */
    isSorted: function () {
        ///* DEBUG */ dump("Yulup:atomsidebar.js:AtomTreeView.isSorted() invoked\n");

        // we don't sort any columns, we show the entries as specified by the feed
        return false;
    },

    /**
     * Perform a specific action on the current selection.
     *
     * @param  {String}    aAction the name of the action to perform on the current selection
     * @return {Undefined} does not have a return value
     */
    performAction: function (aAction) {
        ///* DEBUG */ dump("Yulup:atomsidebar.js:AtomTreeView.performAction(\"" + aAction + "\") invoked\n");

        // we don't support any actions
    },

    /**
     * Perform a specific action on the given cell.
     *
     * @param  {String}        aAction the name of the action to perform on the given cell
     * @param  {Number}        aRow    the row
     * @param  {nsITreeColumn} aColumn the column
     * @return {Undefined} does not have a return value
     */
    performActionOnCell: function (aAction, aRow, aColumn) {
        ///* DEBUG */ dump("Yulup:atomsidebar.js:AtomTreeView.performActionOnCell(\"" + aAction + "\", \"" + aRow + "\", \"" + aColumn + "\") invoked\n");

        // we don't support any actions
    },

    /**
     * Perform a specific action on the given row.
     *
     * @param  {String}        aAction the name of the action to perform on the given row
     * @param  {Number}        aRow    the row
     * @return {Undefined} does not have a return value
     */
    performActionOnRow: function (aAction, aRow, aColumn) {
        ///* DEBUG */ dump("Yulup:atomsidebar.js:AtomTreeView.performActionOnRow(\"" + aAction + "\", \"" + aRow + "\", \"" + aColumn + "\") invoked\n");

        // we don't support any actions
    },

    /**
     * The current selection has changed.
     *
     * @return {Undefined} does not have a return value
     */
    selectionChanged: function () {
        ///* DEBUG */ dump("Yulup:atomsidebar.js:AtomTreeView.selectionChanged() invoked\n");

        // we are not interested in selection changes
    },

    /**
     * Set the text of the given cell.
     *
     * @param  {Number}        aRow    the row
     * @param  {nsITreeColumn} aColumn the column
     * @param  {String}        aText   the text to set
     * @return {Undefined} does not have a return value
     */
    setCellText: function (aRow, aColumn, aText) {
        ///* DEBUG */ dump("Yulup:atomsidebar.js:AtomTreeView.setCellText(\"" + aRow + "\", \"" + aColumn + "\", \"" + aText + "\") invoked\n");

        // we don't support changing cell text
    },

    /**
     * Set the value of the given cell.
     *
     * @param  {Number}        aRow    the row
     * @param  {nsITreeColumn} aColumn the column
     * @param  {String}        aValue  the value to set
     * @return {Undefined} does not have a return value
     */
    setCellValue: function (aRow, aColumn, aValue) {
        ///* DEBUG */ dump("Yulup:atomsidebar.js:AtomTreeView.setCellValue(\"" + aRow + "\", \"" + aColumn + "\", \"" + aValue + "\") invoked\n");

        // we don't support changing cell values
    },

    /**
     * Link the view to the front end box object.
     *
     * @param  {nsITreeBoxObject} aTreeBoxObject the treebox object
     * @return {Undefined} does not have a return value
     */
    setTree: function (aTreeBoxObject) {
        ///* DEBUG */ dump("Yulup:atomsidebar.js:AtomTreeView.setTree(\"" + aTreeBoxObject + "\") invoked\n");

        this.treeBoxObject = aTreeBoxObject;
    },

    /**
     * The given item was opened or closed.
     *
     * @param  {Number}    aRow the row
     * @return {Undefined} does not have a return value
     */
    toggleOpenState: function (aRow) {
        ///* DEBUG */ dump("Yulup:atomsidebar.js:AtomTreeView.toggleOpenState(\"" + aRow + "\") invoked\n");

        // we don't support toggling items
    }
};
