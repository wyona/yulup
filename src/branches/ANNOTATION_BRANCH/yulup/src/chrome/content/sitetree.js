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
 * @author Gregor Imboden
 *
 */


/**
 * Instantiates a new object of the type SitetreeDocument.
 *
 * @param  {nsIURI}           aURI the sitetree URI
 * @return {SitetreeDocument}
 */
function SitetreeDocument(aURI) {
    /* DEBUG */ YulupDebug.ASSERT(aURI != null);

    /* DEBUG */ dump("Yulup:sitetree.js:SitetreeDocument() invoked\n");

    this.name            = null;
    this.uri             = aURI;
    this.level           = 0;
    this.isOpen          = false;
    this.isContainer     = false;
    this.parentNode      = null;
    this.firstChild      = null;
    this.childNodes      = new Array();

    //this.__proto__.__proto__.constructor.call();
}

SitetreeDocument.prototype = {
    __proto__: SitetreeNode.prototype,

    /**
     * Appends a childnode to this SitetreeDocument.
     *
     * @param  {SitetreeNode} aNode the node
     * @return {Undefined}    does not have a return value
     */
    appendChild: function(aNode) {
        /* DEBUG */ YulupDebug.ASSERT(aNode != null);

        /* DEBUG */ dump("Yulup:sitetree.js:SitetreeDocument.appendChild() invoked\n");

        aNode.parentNode = this;

        if (this.childNodes.length == 0) {
            this.firstChild = aNode;
        }

        this.level = 0;
        this.childNodes[this.childNodes.length] = aNode;
        this.isContainer = true;
    },

    /**
     * Creates a new SitetreeNode element.
     *
     * @param  {String} aName the emenent's name
     * @param  {nsIURI} aURI  the element's uri
     * @return {SitetreeNode}
     */
    createElement: function(aName, aURI) {
        var elem = null;

        /* DEBUG */ YulupDebug.ASSERT(aName != null);
        /* DEBUG */ YulupDebug.ASSERT(aURI  != null);

        /* DEBUG */ dump("Yulup:sitetree.js:SitetreeDocument.createElement() invoked\n");

        elem = new SitetreeNode(aName, aURI);
        elem.parentNode = this;

        return elem;
    }
};


/**
 * Instantiates a new object of the type SitetreeNode.
 *
 * @param  {String}       aName the name of the node
 * @param  {nsIURI}       aURI  the sitetree URI
 * @return {SitetreeNode}
 */
function SitetreeNode(aName, aURI) {
    /* DEBUG */ YulupDebug.ASSERT(aName != null);
    /* DEBUG */ YulupDebug.ASSERT(aURI  != null);

    /* DEBUG */ dump("Yulup:sitetree.js:SitetreeNode() invoked\n");

    this.name            = aName;
    this.uri             = aURI;
    this.level           = 0;
    this.isOpen          = false;
    this.isContainer     = false;
    this.parentNode      = null;
    this.firstChild      = null;
    this.childNodes      = new Array();
    this.unavailable     = false;
}

SitetreeNode.prototype = {
    name            : null,
    uri             : null,
    level           : null,
    isOpen          : null,
    isContainer     : null,
    firstChild      : null,
    parentNode      : null,
    childNodes      : null,
    unavailable     : null,

    /**
     * Appends a childnode to this SitetreeNode.
     *
     * @param  {SitetreeNode} aNode the node
     * @return {Undefined}    does not have a return value
     */
    appendChild: function(aNode) {
        /* DEBUG */ YulupDebug.ASSERT(aNode != null);

        /* DEBUG */ dump("Yulup:sitetree.js:SitetreeNode.appendChild() invoked\n");

        aNode.parentNode = this;

        if (this.childNodes.length == 0) {
            this.firstChild = aNode;
        }

        aNode.level = this.level + 1;
        this.childNodes[this.childNodes.length] = aNode;
        this.isContainer = true;
    },

    removeChild: function(aOldChild) {
        /* DEBUG */ YulupDebug.ASSERT(aOldChild != null);

        /* DEBUG */ dump("Yulup:sitetree.js:SitetreeNode.removeChild() invoked\n");
    },

    replaceChild: function(aNewChild, aOldChild) {
        /* DEBUG */ YulupDebug.ASSERT(aNewChild != null);
        /* DEBUG */ YulupDebug.ASSERT(aOldChild != null);

        /* DEBUG */ dump("Yulup:sitetree.js:SitetreeNode.replaceChild() invoked\n");
    }
};


/**
  * Instantiates an object of the type SitetreeView.
  *
  * @param  {nsIURI}           aURI           the sitetree URI
  * @param  {Function}         aErrorListener an error listener which is called if the root node fails to load
  * @return {nsITreeSelection} aSelection the tree selection object
  */
function SitetreeView(aURI, aErrorListener) {
    var elem = null;

    /* DEBUG */ YulupDebug.ASSERT(aURI           != null);
    /* DEBUG */ YulupDebug.ASSERT(aErrorListener != null);
    /* DEBUG */ YulupDebug.ASSERT(typeof(aErrorListener) == "function");

    /* DEBUG */ dump("Yulup:sitetree.js:SitetreeView(\"" + aURI + "\") invoked\n");

    this.uri             = aURI;
    this.rowCount        = 0;
    this.sitetreeDOM     = new SitetreeDocument(this.uri);
    this.rowNodeMap      = new Array();
    this.wrappedJSObject = this;

    this.__errorListener = aErrorListener;

    this.__atomService = Components.classes["@mozilla.org/atom-service;1"].getService(Components.interfaces.nsIAtomService);

    // load the sitetree XML
    this.loadSitetreeXML(this.uri, -1);
}

SitetreeView.prototype = {
    __atomService          : null,
    __errorListener        : null,
    uri                    : null,
    selection              : null,
    treeBox                : null,
    rowCount               : null,
    sitetreeDOM            : null,
    rowNodeMap             : null,
    selectionChangeObserver: null,
    wrappedJSObject        : null,

    /**
     * Load the sitetree XML file over the network.
     *
     * @param  {nsIURI}    aURI       the URI of the sitetree document
     * @param  {Number}    aParentRow the row where new sitetree nodes get appended.
     * @return {Undefined}            does not have a return value
     */
    loadSitetreeXML: function(aURI, aParentRow) {
        var context = null;

        /* DEBUG */ YulupDebug.ASSERT(aURI       != null);
        /* DEBUG */ YulupDebug.ASSERT(aParentRow != null);

        /* DEBUG */ dump("Yulup:sitetree.js:SitetreeView.loadSitetreeXML() invoked\n");

        context = {
            uri             : aURI.spec,
            baseURI         : aURI,
            parentRow       : aParentRow,
            callbackFunction: this.sitetreeLoadFinished,
            view            : this,
            errorListener   : this.__errorListener
        };

        // fetch the sitetree XML file
        WebDAVService.propfind(aURI.spec, "1", this.__requestFinishedHandler, context, null);
    },

    /**
     * Callback function that gets called when the sitetree xml load
     * request finished.
     *
     * @param  {String}   aDocumentData            the data returned by the request
     * @param  {Long}     aResponseStatusCode      the status code of the response
     * @param  {Object}   aContext                 context object containing the callback function and it's parameters
     * @param  {Array}    aResponseHeaders         the response headers
     * @param  {Error}    aException               an exception, or null if everything went well
     * @return {Undefined} does not have a return value
     */
    __requestFinishedHandler: function(aDocumentData, aResponseStatusCode, aContext, aResponseHeaders) {
        /* DEBUG */ YulupDebug.ASSERT(aResponseStatusCode != null);
        /* DEBUG */ YulupDebug.ASSERT(aContext            != null);

        /* DEBUG */ dump("Yulup:sitetree.js:SitetreeView.__requestFinishedHandler() invoked\n");

        if (aResponseStatusCode == 200 || aResponseStatusCode == 207) {
            // success, call back to original caller
            aContext.callbackFunction(aDocumentData, null, aContext);
        } else {
            try {
                // parse error message (throws an exeception)
                Neutron.response(aDocumentData);
            } catch (exception) {
                aContext.callbackFunction(null, exception, aContext);
                return;
            }
        }
    },

    /**
     * Callback function that gets called when the sitetree request
     * finished and after parsing a possible exception.
     *
     * @param  {String}    aDocumentData the document data retrieved by the request
     * @param  {Exception} aException    the exception
     * @param  {Object}    aContext      context object containing the function parameters
     * @return {Undefined}               does not have a return value
     */
    sitetreeLoadFinished: function(aDocumentData, aException, aContext) {
        var aURI        = null;
        var aBaseURI    = null;
        var domParser   = null;
        var domDocument = null;
        var sitetree    = null;

        /* DEBUG */ YulupDebug.ASSERT(aContext != null);

        /* DEBUG */ dump("Yulup:sitetree.js:SitetreeView.sitetreeLoadFinished() invoked\n");

        aURI     = aContext.uri;
        aBaseURI = aContext.baseURI;

        try {
            if (aDocumentData) {
                /* DEBUG */ dump("Yulup:sitetree.js:SitetreeView.sitetreeLoadFinished(): loading sitetree file \"" + aURI + "\" succeeded\n");

                domParser = Components.classes["@mozilla.org/xmlextras/domparser;1"].createInstance(Components.interfaces.nsIDOMParser);

                domDocument  = domParser.parseFromString(aDocumentData, "text/xml");

                // instantiate the parser for this version and parse the file
                sitetree = new WebDAVParser10(domDocument, aBaseURI).parse();

                // update the model
                aContext.view.updateSitetreeDOM(aContext.parentRow, sitetree);

            } else {
                /* DEBUG */ dump("Yulup:sitetree.js:SitetreeView.sitetreeLoadFinished: failed to load \"" + aURI + "\"). \"" + aException + "\"\n");

                if (aException && (aException instanceof NeutronProtocolException || aException instanceof NeutronAuthException)) {
                    // report error message retrieved from response
                    throw new YulupException(document.getElementById("uiYulupEditorStringbundle").getString("editorDocumentLoadError0.label") + " \"" + aURI + "\".\n" + document.getElementById("uiYulupEditorStringbundle").getString("editorDocumentLoadServerError.label") + ": " + aException.message + ".");
                } else
                    throw new YulupException(document.getElementById("uiYulupEditorStringbundle").getString("editorDocumentLoadError0.label") + " \"" + aURI + "\".");
            }
        } catch (exception) {
            /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:sitetree.js:SitetreeView.sitetreeLoadFinished", exception);

            //alert(document.getElementById("uiYulupEditorStringbundle").getString("editorDocumentLoadFailure.label") + "\n\n" + exception.message);

            // update the model
            aContext.view.updateSitetreeDOM(aContext.parentRow, null);

            if (aContext.parentRow == -1) {
                // the root node failed to load, this is really bad
                try {
                    aContext.errorListener();
                } catch (exception) {
                    // we don't want to fail here
                    /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:sitetree.js:SitetreeView.sitetreeLoadFinished", exception);
                    /* DEBUG */ Components.utils.reportError(exception);
                }
            }
        }
    },

    /**
     * Update the DOM for this SitetreeView.
     *
     * @param  {Integer}   aParentRow the row where new nodes will be apenden
     * @param  {Sitetree}  aSitetree  the sitetree, or null, if not available
     * @return {Undefined}
     */
    updateSitetreeDOM: function(aParentRow, aSitetree) {
        var parentNode = null;

        /* DEBUG */ YulupDebug.ASSERT(aParentRow != null);

        /* DEBUG */ dump("Yulup:sitetree.js:SitetreeView.updateSitetreeDOM() invoked\n");

        if (aParentRow == -1) {
            // append directly to the document
            parentNode = this.sitetreeDOM;
        } else {
            parentNode = this.getSitetreeNodeAtRow(aParentRow);
        }

        if (aSitetree) {
            parentNode.unavailable = false;

            for (var i=0; i<aSitetree.resources.length; i++) {
                elem = this.sitetreeDOM.createElement(aSitetree.resources[i].properties.displayname, aSitetree.resources[i].href);
                if (aSitetree.resources[i].properties.resourcetype == "collection") {
                    elem.isContainer = true;
                }
                parentNode.appendChild(elem);
            }
        } else {
            parentNode.isOpen      = false;
            parentNode.unavailable = true;
        }

        this.notifyRowChanged(aParentRow);

    },

    /**
     * Get the collection URI of the currently selected node.
     *
     * @return {nsIURI} the collection uri or null if not available
     */
    getCurrentCollectionURI: function() {
        var node = null;

        /* DEBUG */ dump("Yulup:sitetree.js:SitetreeView.getCurrentCollectionURI() invoked\n");

        node = this.getSitetreeNodeAtRow(this.selection.currentIndex);

        /* DEBUG */ dump("Yulup:sitetree.js:SitetreeView.getCurrentCollectionURI: currently selected node = \"" + node + "\"\n");

        if (node != null) {
            if (node.isContainer == true) {
                return node.uri;
            } else if (node.parentNode != null) {
                return node.parentNode.uri;
            }
        } else {
            return this.sitetreeDOM.uri;
        }

        return null;
    },

    /**
     * Get the resource URI of the currently selected node.
     *
     * @return {nsIURI} the collection uri
     */
    getCurrentResourceURI: function() {
        var node = null;

        /* DEBUG */ dump("Yulup:sitetree.js:SitetreeView.getCurrentResourceURI() invoked\n");

        node = this.getSitetreeNodeAtRow(this.selection.currentIndex);

        if (node != null) {
            return node.uri;
        }

        return null;
    },


    /**
     * Updates the SitetreeNode to row mappings.
     *
     * @return {Undefined} does not have a return value
     */
    updateRowNodeMap: function() {

        ///* DEBUG */ dump("Yulup:sitetree.js:SitetreeView.updateRowNodeMap() invoked\n");

        this.rowNodeMap = new Array();

        this.__buildRowNodeMap({row: 0}, this.sitetreeDOM.childNodes);

        // update the rowCount
        this.rowCount = this.rowNodeMap.length;
    },

    /**
     * Returns the SitetreeNode corresponding to the specified row.
     *
     * @param {Object}  aCurrentRow the current row
     * @param {Number}  aRow        the specified row
     */
    __buildRowNodeMap: function(aCurrentRow, aChildNodes) {
        var node = null;

        /* DEBUG */ YulupDebug.ASSERT(aCurrentRow != null);
        /* DEBUG */ YulupDebug.ASSERT(aChildNodes != null);

        ///* DEBUG */ dump("Yulup:sitetree.js:SitetreeView.__buildRowNodeMap(\"" + aCurrentRow.row + "\")invoked\n");

        for (var i=0; i<aChildNodes.length; i++) {

            this.rowNodeMap[aCurrentRow.row++] = aChildNodes[i];

            if (aChildNodes[i].isOpen == true) {
                // descend into branch
                this.__buildRowNodeMap(aCurrentRow, aChildNodes[i].childNodes)
            }
        }
    },

    /**
     * Get the sitetree node at the specified row.
     *
     * @param  {Integer}      aRow the specified row
     * @return {SitetreeNode}      the SitetreeNode
     */
    getSitetreeNodeAtRow: function(aRow) {
        /* DEBUG */ YulupDebug.ASSERT(aRow != null);

        ///* DEBUG */ dump("Yulup:sitetree.js:SitetreeView.getSitetreeNodeAtRow(\"" + aRow + "\") invoked\n");

        return this.rowNodeMap[aRow];
    },

    /**
     * Get the row of the specified sitetree node
     *
     * @param  {SitetreeNode} aNode the SitetreeNode
     * @return {Integer}            the row index of this node or -1
     */
    getRowOfSitetreeNode: function(aNode) {
        /* DEBUG */ YulupDebug.ASSERT(aNode != null);

        ///* DEBUG */ dump("Yulup:sitetree.js:SitetreeView.getRowOfSitetreeNode(\"" + aRow + "\") invoked\n");

        for (var i=0; i<this.rowNodeMap.length; i++) {
            if (this.rowNodeMap[i] == aNode) {
                return i;
            }
        }

        return -1;
    },

    canDrop: function(aIndex, aOrientation) {
        /* DEBUG */ dump("Yulup:sitetree.js:SitetreeView.canDrop() invoked\n");
    },

    cycleCell: function(aRow, aCol) {
        /* DEBUG */ dump("Yulup:sitetree.js:SitetreeView.cycleCell() invoked\n");
    },

    cycleHeader: function(aCol) {
        /* DEBUG */ dump("Yulup:sitetree.js:SitetreeView.cycleHeader() invoked\n");
    },

    drop: function(aRow, aOriantation) {
        /* DEBUG */ dump("Yulup:sitetree.js:SitetreeView.drop() invoked\n");
    },

    getCellProperties: function(aRow, aCol, aProperties) {
        var node = null;

        ///* DEBUG */ dump("Yulup:sitetree.js:SitetreeView.getCellProperties() invoked\n");

        node = this.getSitetreeNodeAtRow(aRow);

        if (node != null && node.isContainer) {
            if (!node.unavailable) {
                aProperties.AppendElement(this.__atomService.getAtom("collection"));
            } else {
                aProperties.AppendElement(this.__atomService.getAtom("collection-unavailable"));
            }
        }
    },

    getCellValue: function(aRow, aCol) {
        ///* DEBUG */ dump("Yulup:sitetree.js:SitetreeView.getCellValue() invoked\n");
    },

    getCellText: function(aRow, aCol) {
        var node = null;

        /* DEBUG */ YulupDebug.ASSERT(aRow != null);
        /* DEBUG */ YulupDebug.ASSERT(aCol != null);

        ///* DEBUG */ dump("Yulup:sitetree.js:SitetreeView.getCellText() invoked\n");

        node = this.getSitetreeNodeAtRow(aRow);

        if (node != null) {
            return node.name;
        } else {
            return null;
        }
    },

    getColumnProperties: function(aCol, aProperties) {
        ///* DEBUG */ dump("Yulup:sitetree.js:SitetreeView.getColumnProperties() invoked\n");
    },

    getImageSrc: function(aRow, aCol) {
        ///* DEBUG */ dump("Yulup:sitetree.js:SitetreeView.getImageSrc() invoked\n");

        return null;
    },

    getLevel: function(aIndex) {
        var node = null;

        /* DEBUG */ YulupDebug.ASSERT(aIndex != null);

        ///* DEBUG */ dump("Yulup:sitetree.js:SitetreeView.getLevel() invoked\n");

        node = this.getSitetreeNodeAtRow(aIndex);

        if (node != null) {
            return node.level;
        } else {
            return 0;
        }
    },

    /**
     * Methods used by the tree to draw thread lines in the tree.
     *
     * @param {Number} aRowIndex the current row
     * @param {Number}           the row index of the parrent node belonging to aRowIndex
     */
    getParentIndex: function(aRowIndex) {
        var node = null;

        /* DEBUG */ YulupDebug.ASSERT(aRowIndex != null);

        ///* DEBUG */ dump("Yulup:sitetree.js:getParentIndex() invoked\n");

        node = this.getSitetreeNodeAtRow(aRowIndex);

        if (node != null) {
            return this.getRowOfSitetreeNode(node.parentNode);
        } else {
            return -1;
        }
    },

    getProgressMode: function(aRow, aCol) {
        /* DEBUG */ dump("Yulup:sitetree.js:SitetreeView.getProgressMode() invoked\n");
    },

    getRowProperties: function(aIndex, aProperties) {
        ///* DEBUG */ dump("Yulup:sitetree.js:SitetreeView.getRowProperties() invoked\n");
    },

    hasNextSibling: function(aRowIndex, aAfterIndex) {
        var node = null;

        /* DEBUG */ YulupDebug.ASSERT(aRowIndex   != null);
        /* DEBUG */ YulupDebug.ASSERT(aAfterIndex != null);

        /* DEBUG */ dump("Yulup:sitetree.js:SitetreeView.hasNextSibling() invoked\n");

        node = this.getSitetreeNodeAtRow(aRowIndex);

        for (var i=0; i<node.parentNode.childNodes.length; i++) {
            if (node.parentNode.childNodes[i] == node && i < node.parentNode.childNodes.length - 1) {
                return true;
            }
        }

        return false;
    },

    isContainer: function(aIndex) {
        var node = null;

        /* DEBUG */ YulupDebug.ASSERT(aIndex != null);

        ///* DEBUG */ dump("Yulup:sitetree.js:SitetreeView.isContainer() invoked\n");

        node = this.getSitetreeNodeAtRow(aIndex);

        if (node != null) {
            return node.isContainer;
        } else {
            return false;
        }
    },

    isContainerEmpty: function(aIndex) {
        ///* DEBUG */ dump("Yulup:sitetree.js:SitetreeView.isContainerEmpty() invoked\n");

        return false;
    },

    isContainerOpen: function(aIndex) {
        var node = null;

        /* DEBUG */ YulupDebug.ASSERT(aIndex != null);

        ///* DEBUG */ dump("Yulup:sitetree.js:SitetreeView.isContainerOpen() invoked\n");

        node = this.getSitetreeNodeAtRow(aIndex);

        if (node && node.isOpen == true) {
            return true;
        } else {
            return false;
        }
    },

    isEditable: function(aRow, aCol) {
        /* DEBUG */ dump("Yulup:sitetree.js:SitetreeView.isEditable() invoked\n");

        return false;
    },

    isSeparator: function(aIndex, aCol) {
        ///* DEBUG */ dump("Yulup:sitetree.js:SitetreeView.isSeparator() invoked\n");

        return false;
    },

    isSorted: function(aIndex, aCol) {
        ///* DEBUG */ dump("Yulup:sitetree.js:SitetreeView.isSorted() invoked\n");

        return false;
    },

    performAction: function(aAction) {
        /* DEBUG */ dump("Yulup:sitetree.js:SitetreeView.isSeparator() invoked\n");
    },

    performActionOnCell: function(aAction, aRow, aCol) {
        /* DEBUG */ dump("Yulup:sitetree.js:SitetreeView.performActionOnCell() invoked\n");
    },

    performActionOnRow: function(aAction, aRow) {
        /* DEBUG */ dump("Yulup:sitetree.js:SitetreeView.performActionOnRow() invoked\n");
    },

    selectionChanged: function() {
        var node = null;

        /* DEBUG */ dump("Yulup:sitetree.js:SitetreeView.selectionChanged() invoked\n");

        if (this.selectionChangeObserver) {
            node = this.getSitetreeNodeAtRow(this.selection.currentIndex);

            if (node != null) {
                this.selectionChangeObserver(node);
            }
        }
    },

    setCellText: function(aRow, aCol, aValue) {
        /* DEBUG */ dump("Yulup:sitetree.js:SitetreeView.setCellText() invoked\n");
    },

    setCellValue: function(aRow, aCol, aValue) {
        /* DEBUG */ dump("Yulup:sitetree.js:SitetreeView.setCellValue() invoked\n");
    },

    setTree: function(aTree) {
        /* DEBUG */ dump("Yulup:sitetree.js:SitetreeView.setTree() invoked\n");

        this.treeBox = aTree;
    },

    notifyRowChanged: function(aRow) {
        /* DEBUG */ YulupDebug.ASSERT(aRow != null);

        /* DEBUG */ dump("Yulup:sitetree.js:SitetreeView.notifyRowChanged() invoked\n");

        // update the node map
        this.updateRowNodeMap();

        // notify the box
        this.treeBox.beginUpdateBatch();
        this.treeBox.invalidateRow(aRow);
        this.treeBox.endUpdateBatch();
    },

    /**
     * Toggles the open state of a node.
     *
     * @param  {Number}    aIndex the row index
     * @return {Undefined} does not have a return value
     */
    toggleOpenState: function(aIndex) {
        var node = null;

        /* DEBUG */ YulupDebug.ASSERT(aIndex != null);

        /* DEBUG */ dump("Yulup:sitetree.js:SitetreeView.toggleOpenState() invoked\n");

        // update the tree selection
        this.selection.select(aIndex);

        node = this.getSitetreeNodeAtRow(aIndex);

        if (node) {
            if (node.isOpen == true) {
                node.isOpen = false;

                // collapse the tree at aIndex
                this.notifyRowChanged(aIndex);
            } else {
                node.isOpen = true;

                if (node.firstChild == null) {
                    // load the sitetree XML
                    this.loadSitetreeXML(node.uri, aIndex);
                } else {
                    // expand the tree at aIndex
                    this.notifyRowChanged(aIndex);
                }
            }
        }
    }
};
