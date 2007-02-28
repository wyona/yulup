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
 * @author Florian Fricker
 *
 * This file implements the AnnotationSidebar class. The
 * AnnotationSidebar class, receive the annotation from
 * the server and add them to the sidebar.
 *
 */

var AnnotationSidebar = {
    __init: false,

    sidebar          : null,
    mainBrowserWindow: null,
    currentSelection : null,
    annotationContent: null,

    /**
     * Initialize the sidebar.
     *
     * @return {Undefined} does not have a return value
     */
    onLoadListener: function () {
        var appIntrospection  = null;

        AnnotationSidebar.__init = true;

        // Create new Array for pushing the AnnotationContent objects
        AnnotationSidebar.annotationContent = new Array();

        // Get the event handler for the tree view
        document.getElementById("uiYulupAnnotationSidebarFeedEntriesTree").addEventListener("select", AnnotationSidebar.treeChangeEventListener, false);

        /* DEBUG */ dump("Yulup:annotationsidebar.js:AnnotationSidebar.onLoadListener() invoked\n");

        // Get a handle on the main browser window
        AnnotationSidebar.mainBrowserWindow = window.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
        .getInterface(Components.interfaces.nsIWebNavigation)
        .QueryInterface(Components.interfaces.nsIDocShellTreeItem)
        .rootTreeItem
        .QueryInterface(Components.interfaces.nsIInterfaceRequestor)
        .getInterface(Components.interfaces.nsIDOMWindow);

        // Retrieve neutron introspection document from Yulup, if available
        neutronIntrospection = AnnotationSidebar.mainBrowserWindow.yulup.currentNeutronIntrospection;

        // Get the sidebar element
        AnnotationSidebar.sidebar = document.getElementById("uiYulupAnnotationSidebarPage");

        // Check if introspection is available
        if(neutronIntrospection) {

            // Create the final URI for receiving the Annotation metadata
            var annotationQueryURI = neutronIntrospection.annotation.uri.spec + "?w3c_annotates=" + neutronIntrospection.associatedWithURI.spec;

            // Create context object for the network-service process
            var context = { uri: Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService).newURI(annotationQueryURI, null, null) };

            // Start the http request to get the Annotation metadata
            NetworkService.httpRequestGET(annotationQueryURI, null, this.__requestFinishedHandler, context, false, true, null);

        }

    },

    /*
     * This function implements the finish handler for
     * the http request, which receive the metadata
     * from the server.
     *
     * @return {Undefined} does not have a return value
     */
    __requestFinishedHandler: function (aDocumentData, aResponseStatusCode, aContext, aResponseHeaders, aException) {

        /* DEBUG */ dump("Yulup:document.js:Document.__requestFinishedHandler() invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aResponseStatusCode != null);

        // Check if the status code was successful
        if (aResponseStatusCode == 200) {

            /* DEBUG */ dump("Single Annotation: " + aDocumentData);

            // Create a DOM parser element
            domParser = Components.classes["@mozilla.org/xmlextras/domparser;1"].createInstance(Components.interfaces.nsIDOMParser);

            // Create a DOM document
            domDocument  = domParser.parseFromString(aDocumentData, "text/xml");

            // Parse the metadata document
            var annotationList = (new AnnotationParser10(domDocument, aContext.uri)).parse();

            // Create a new tree view object with the metadata elements (We just use the title element)
            var annotationTreeView = new AnnotationTreeView(annotationList);

            // Get the tree element
            document.getElementById("uiYulupAnnotationSidebarFeedEntriesTree").view = annotationTreeView;

            // Select a index of the tree element
            document.getElementById("uiYulupAnnotationSidebarContentDeck").selectedIndex = 0;

            // Create a counter for the iteration process
            var counter = 0;

            // Start a new http request for each single Annotation in the metadata file
            while(annotationList.description.length != counter)
                {
                    if(annotationList.description[counter].uri) {
                        // Create a new context for the network service (Note: Each request needs a own context object)
                        var context = { uri: Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService).newURI(annotationList.description[counter].uri.spec, null, null), index: counter };

                        // Start the http get request with the uri out of the metadata file
                        NetworkService.httpRequestGET(annotationList.description[counter].uri.spec, null, AnnotationSidebar.__requestFinishedHandlerContent, context, false, true, null);
                    }

                    // Counter needs to be pushed up that we can check how many request are necessary
                    counter++;
                }


        }
        else
            {
                // A popup appears if the request for the metadata failed
                alert("Annotation could not be received. Pleas check your internet settings!");
            }

    },

    /*
     * This function implements the finish handler for
     * the http request, which receive the singe Annotation
     * from the server.
     *
     * @return {Undefined} does not have a return value
     */
    __requestFinishedHandlerContent: function (aDocumentData, aResponseStatusCode, aContext, aResponseHeaders, aException) {
        aResponseStatusCode
        // Check if the status code was successful
        if (aResponseStatusCode == 200) {

            // Create a new DOM parser element
            domParser = Components.classes["@mozilla.org/xmlextras/domparser;1"].createInstance(Components.interfaces.nsIDOMParser);

            // Create a new DOM document
            domDocument = domParser.parseFromString(aDocumentData, "text/xml");

            // Parse the single Annotation content
            AnnotationSidebar.annotationContent[aContext.index] = ((new AnnotationParser10(domDocument, aContext.uri)).parseContent());

        }
        else
            {
                // A popup appears if the request for the metadata failed
                alert("Annotation could not be received. Pleas check your internet settings!");
            }
    },


    /*
     * This function implements the event listener for
     * the tree element. Every time the user select a
     * new element in the tree, the Annotation should
     * be changed.
     *
     * @return {Undefined} does not have a return value
     */
    treeChangeEventListener: function (annotationContent) {

        // Get the current tree index
        var index = document.getElementById("uiYulupAnnotationSidebarFeedEntriesTree").currentIndex;

        // Check if a index is selected and a Annotation on selected index available
        if(index != -1 && AnnotationSidebar.annotationContent[index])
            {
                // Check if properties are ovailable on selected annotationContent object
                if(AnnotationSidebar.annotationContent[index].description[0].name && AnnotationSidebar.annotationContent[index].description[0].title &&
                   AnnotationSidebar.annotationContent[index].description[0].date && AnnotationSidebar.annotationContent[index].description[0].body) {

                    // Set the label to the current Annotation. The tree index has the same value as the position of the Annotation in the array.
                    document.getElementById("uiYulupAnnotationSidebarDeckName").value = AnnotationSidebar.annotationContent[index].description[0].name;
                    document.getElementById("uiYulupAnnotationSidebarDeckTitle").value = AnnotationSidebar.annotationContent[index].description[0].title;
                    document.getElementById("uiYulupAnnotationSidebarDeckDate").value = AnnotationSidebar.annotationContent[index].description[0].date;
                    document.getElementById("uiYulupAnnotationSidebarDeckBody").value = AnnotationSidebar.annotationContent[index].description[0].body;
                }
            }

        // Remove old range on browser window
        AnnotationSidebar.mainBrowserWindow.getBrowser().contentWindow.getSelection().removeAllRanges();

        // Get the Xpointer
        var xpointer = AnnotationSidebar.annotationContent[index].description[0].pointer;

        // Fetch the content of the browser window
        var pageContent = AnnotationSidebar.mainBrowserWindow.getBrowser().contentDocument;

        // Create a new range object
        var pageRange = pageContent.createRange();

        // Set the root element of the page content
        pageRange.selectNodeContents(pageContent.documentElement);

        // Create new instance of NsIfind
        rangeFind = Components.classes["@mozilla.org/embedcomp/rangefind;1"].createInstance().QueryInterface(Components.interfaces.nsIFind);

        // Set the start range
        var startRange = pageContent.createRange();
        startRange.setStart(pageRange.startContainer, pageRange.startOffset);
        startRange.setEnd(pageRange.startContainer, pageRange.startOffset);

        // Set the end range
        var endRange = pageContent.createRange();
        endRange.setStart(pageRange.endContainer, pageRange.endOffset);
        endRange.setEnd(pageRange.endContainer, pageRange.endOffset);

        // Split the Xpointer to get the string element
        xpointer = xpointer.split('"');
        xpointer = xpointer[1].split('"')[0];

        // Check if the xpointer can be solved on the current document
        if((findRange = rangeFind.Find(xpointer, pageRange, startRange, endRange)) == null)
            {
                // Show a alert popup when the xpointer points to the wrong place
                alert("Xpointer could not point into document");
            }

        // Add the range to the browser window
        AnnotationSidebar.mainBrowserWindow.getBrowser().contentWindow.getSelection().addRange(findRange);

    },

    /**
     * Cleanup the sidebar.
     *
     * @return {Undefined} does not have a return value
     */
    onUnloadListener: function () {
        // Unload actions can be implemented in this functions
    }
};



/*
 * AnnotationTreeView constructor. Instantiates a new object of
 * type AnnotationTreeView.
 *
 * @constructor
 * @param  {AnnotationList} aAnnotationList the Annotation list to show in this view
 *
 */
function AnnotationTreeView(aAnnotationList) {

    /* DEBUG */ dump("Yulup:annotationsidebar.js:AnnotationTreeView(\"" + aAnnotationList + "\") invoked\n");

    // Create and initialize the tree view
    this.annotationList = aAnnotationList;
    this.rowCount = aAnnotationList.description.length;

    /* DEBUG */ dump("Yulup:annotationsidebar.js:AnnotationTreeView: this.rowCount = \"" + this.rowCount + "\"\n");
}

/*
 * AnnotationTreeView prototype operates the
 * tree view element with different features.
 *
 */
AnnotationTreeView.prototype = {
    annotationList   : null,
    treeBoxObject    : null,
    rowCount         : null,

    /*
     * Get the text for a given cell.
     *
     * @return {null} return the null statement
     */
    getCellText: function (aRow, aColumn) {

        // Check if ColumnID matched witch the title Column
        if (aColumn.id == "titleColumn")
            return this.annotationList.description[aRow].title;
        else
            return null;
    },

    /*
     * Link the view to the front end box object.
     *
     * @return {Undefined} does not have a return value
     */
    setTree: function (aTreeBoxObject) {

        this.treeBoxObject = aTreeBoxObject;
    },

    /*
     * Those function needs to be implemented for the tree view
     * interface. We don't need them to display the Annotations.
     * (http://www.xulplanet.com/references/xpcomref/ifaces/nsITreeView.html)
     */
    canDrop: function (aRow, aOrientation) {

    },

    cycleCell: function (aRow, aColumn) {

    },

    cycleHeader: function (aColumn) {

    },

    drop: function (aRow, aOrientation) {

    },

    getCellProperties: function (aRow, aColumn, aProperties) {

    },

    getCellValue: function (aRow, aColumn) {

        return null;
    },

    getColumnProperties: function (aColumn, aProperties) {

    },

    getImageSrc: function (aRow, aColumn) {

        return null;
    },

    getLevel: function (aRow) {

        return 0;
    },

    getParentIndex: function (aRow) {

        return -1;
    },

    getProgressMode: function (aRow, aColumn) {

        return Components.interfaces.nsITreeView.PROGRESS_UNDETERMINED;
    },

    getRowProperties: function (aRow, aProperties) {

    },

    hasNextSibling: function (aRow, aAfterRowIndex) {

    },

    isContainer: function (aRow) {

        return false;
    },

    isContainerEmpty: function (aRow) {

        return false;
    },

    isContainerOpen: function (aRow) {

        return false;
    },

    isEditable: function (aRow, aColumn) {

        return false;
    },

    isSeparator: function (aRow) {

        return false;
    },

    isSorted: function () {

        return false;
    },

    performAction: function (aAction) {

    },

    performActionOnCell: function (aAction, aRow, aColumn) {

    },

    performActionOnRow: function (aAction, aRow, aColumn) {

    },

    selectionChanged: function () {

    },

    setCellText: function (aRow, aColumn, aText) {

    },

    setCellValue: function (aRow, aColumn, aValue) {

    },

    toggleOpenState: function (aRow) {

    }
};
