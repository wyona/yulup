/*
 * ***** BEGIN LICENSE BLOCK *****
 * Copyright 2007 Wyona AG Zurich
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

/**
 * YulupTreeViewBase constructor. Instantiates a new object of
 * type YulupTreeViewBase.
 *
 * Base type for tree views.
 *
 * Implementes the nsITreeView interface.
 *
 * @constructor
 * @return {YulupTreeViewBase} a new YulupTreeViewBase object
 */
function YulupTreeViewBase(aAtomFeed) {
    /* DEBUG */ dump("Yulup:treeviewbase.js:YulupTreeViewBase() invoked\n");

    this.rowCount = 0;
}

YulupTreeViewBase.prototype = {
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
        ///* DEBUG */ dump("Yulup:treeviewbase.js:YulupTreeViewBase.canDrop(\"" + aRow + "\", \"" + aOrientation + "\") invoked\n");

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
        ///* DEBUG */ dump("Yulup:treeviewbase.js:YulupTreeViewBase.cycleCell(\"" + aRow + "\", \"" + aColumn + "\") invoked\n");

        // we don't support cycling of cells
    },

    /**
     * Cycle the given column header.
     *
     * @param  {nsITreeColumn} aColumn the column
     * @return {Undefined} does not have a return value
     */
    cycleHeader: function (aColumn) {
        ///* DEBUG */ dump("Yulup:treeviewbase.js:YulupTreeViewBase.cycleHeader(\"" + aColumn + "\") invoked\n");

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
        ///* DEBUG */ dump("Yulup:treeviewbase.js:YulupTreeViewBase.drop(\"" + aRow + "\", \"" + aOrientation + "\") invoked\n");

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
        ///* DEBUG */ dump("Yulup:treeviewbase.js:YulupTreeViewBase.getCellProperties(\"" + aRow + "\", \"" + aColumn + "\", \"" + aProperties + "\") invoked\n");

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
        ///* DEBUG */ dump("Yulup:treeviewbase.js:YulupTreeViewBase.getCellText(\"" + aRow + "\", \"" + aColumn + "\") invoked\n");

        return null;
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
        ///* DEBUG */ dump("Yulup:treeviewbase.js:YulupTreeViewBase.getCellValue(\"" + aRow + "\", \"" + aColumn + "\") invoked\n");

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
        ///* DEBUG */ dump("Yulup:treeviewbase.js:YulupTreeViewBase.getColumnProperties(\"" + aColumn + "\", \"" + aProperties + "\") invoked\n");

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
        ///* DEBUG */ dump("Yulup:treeviewbase.js:YulupTreeViewBase.getImageSrc(\"" + aRow + "\", \"" + aColumn + "\") invoked\n");

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
        ///* DEBUG */ dump("Yulup:treeviewbase.js:YulupTreeViewBase.getLevel(\"" + aRow + "\") invoked\n");

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
        ///* DEBUG */ dump("Yulup:treeviewbase.js:YulupTreeViewBase.getParentIndex(\"" + aRow + "\") invoked\n");

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
        ///* DEBUG */ dump("Yulup:treeviewbase.js:YulupTreeViewBase.getProgressMode(\"" + aRow + "\", \"" + aColumn + "\") invoked\n");

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
        ///* DEBUG */ dump("Yulup:treeviewbase.js:YulupTreeViewBase.getRowProperties(\"" + aRow + "\", \"" + aProperties + "\") invoked\n");

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
        ///* DEBUG */ dump("Yulup:treeviewbase.js:YulupTreeViewBase.hasNextSibling(\"" + aRow + "\", \"" + aAfterRowIndex + "\") invoked\n");

        // we don't do this
    },

    /**
     * Determine if a given row is a container.
     *
     * @param  {Number}  aRow the row to test
     * @return {Boolean} returns true if aRow is a container
     */
    isContainer: function (aRow) {
        ///* DEBUG */ dump("Yulup:treeviewbase.js:YulupTreeViewBase.isContainer(\"" + aRow + "\") invoked\n");

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
        ///* DEBUG */ dump("Yulup:treeviewbase.js:YulupTreeViewBase.isContainerEmpty(\"" + aRow + "\") invoked\n");

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
        ///* DEBUG */ dump("Yulup:treeviewbase.js:YulupTreeViewBase.isContainerOpen(\"" + aRow + "\") invoked\n");

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
        ///* DEBUG */ dump("Yulup:treeviewbase.js:YulupTreeViewBase.isEditable(\"" + aRow + "\", \"" + aColumn + "\") invoked\n");

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
        ///* DEBUG */ dump("Yulup:treeviewbase.js:YulupTreeViewBase.isSeparator(\"" + aRow + "\") invoked\n");

        // we don't have any separator rows
        return false;
    },

    /**
     * Test if currently one of the columns is sorted.
     *
     * @return {Boolean} returns true if one of the columns is currently sorted
     */
    isSorted: function () {
        ///* DEBUG */ dump("Yulup:treeviewbase.js:YulupTreeViewBase.isSorted() invoked\n");

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
        ///* DEBUG */ dump("Yulup:treeviewbase.js:YulupTreeViewBase.performAction(\"" + aAction + "\") invoked\n");

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
        ///* DEBUG */ dump("Yulup:treeviewbase.js:YulupTreeViewBase.performActionOnCell(\"" + aAction + "\", \"" + aRow + "\", \"" + aColumn + "\") invoked\n");

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
        ///* DEBUG */ dump("Yulup:treeviewbase.js:YulupTreeViewBase.performActionOnRow(\"" + aAction + "\", \"" + aRow + "\", \"" + aColumn + "\") invoked\n");

        // we don't support any actions
    },

    /**
     * The current selection has changed.
     *
     * @return {Undefined} does not have a return value
     */
    selectionChanged: function () {
        ///* DEBUG */ dump("Yulup:treeviewbase.js:YulupTreeViewBase.selectionChanged() invoked\n");

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
        ///* DEBUG */ dump("Yulup:treeviewbase.js:YulupTreeViewBase.setCellText(\"" + aRow + "\", \"" + aColumn + "\", \"" + aText + "\") invoked\n");

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
        ///* DEBUG */ dump("Yulup:treeviewbase.js:YulupTreeViewBase.setCellValue(\"" + aRow + "\", \"" + aColumn + "\", \"" + aValue + "\") invoked\n");

        // we don't support changing cell values
    },

    /**
     * Link the view to the front end box object.
     *
     * @param  {nsITreeBoxObject} aTreeBoxObject the treebox object
     * @return {Undefined} does not have a return value
     */
    setTree: function (aTreeBoxObject) {
        ///* DEBUG */ dump("Yulup:treeviewbase.js:YulupTreeViewBase.setTree(\"" + aTreeBoxObject + "\") invoked\n");

        this.treeBoxObject = aTreeBoxObject;
    },

    /**
     * The given item was opened or closed.
     *
     * @param  {Number}    aRow the row
     * @return {Undefined} does not have a return value
     */
    toggleOpenState: function (aRow) {
        ///* DEBUG */ dump("Yulup:treeviewbase.js:YulupTreeViewBase.toggleOpenState(\"" + aRow + "\") invoked\n");

        // we don't support toggling items
    }
};
