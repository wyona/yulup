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

const WIDGET_TMP_DIR = "yulup-widgets";

const YULUP_WIDGET_INSERT_CHROME_URI = "chrome://yulup/content/widget.xul";

const YULUP_RESOURCE_UPLOAD_CHROME_URI = "chrome://yulup/content/resourceupload.xul";

const TIDYWIDGETFRAGMENT_CHROME_URI = "chrome://yulup/content/tidywidgetfragment.xsl";

/**
  * Instantiates a new Object of the type Widget
  *
  * @return {Widget}
  */
function Widget() {
    /* DEBUG */ dump("Yulup:widget.js:Widget.Widget() invoked\n");
}

Widget.prototype = {
    attributes:         null,
    icon:               null,
    iconURI:            null,
    tmpIconFile:        null,
    tmpIconURI:         null,
    fragment:           null,
    fragmentAttributes: null
};


/**
  * Manages all widgets for an editor instance
  *
  * @param  {Integer}   aInstanceId the instance id of the editor
  * @return {Undefined}             does not have a return value
  */
function WidgetManager(aInstanceID) {

    /* DEBUG */ dump("Yulup:widget.js:WidgetManager(\"" + aInstanceID  + "\") invoked\n");

    this.instanceID   = aInstanceID;
    this.widgets      = new Array();
    this.tmpDir       = null;

    // create the tmp dir for this instance
    this.tmpDir = this.getTemporaryDirectory();
    this.tmpDir.append(this.instanceID);
    this.tmpDir.create(Components.interfaces.nsIFile.DIRECTORY_TYPE, 0755);

    /* DEBUG */ dump("Yulup:widget.js:WidgetManager: temp dir = \"" + this.tmpDir.path +"\"\n");
}

WidgetManager.prototype = {
    instanceID:   null,
    widgets:      null,
    tmpDir:       null,

    /**
     * Removes all temporary directories.
     *
     * This method should be called when the editor is closed.
     *
     * @return {Undefined} does not have a return value
     */
    cleanUp: function() {

        /* DEBUG */ dump("Yulup:widget.js:WidgetManager.WidgetManager.cleanUp() invoked\n");

        // remove the temp directory
        this.tmpDir.remove(true);
    },

    /**
     * Get the temporary directory for downloaded widgets.
     *
     * @return {nsIFile} file object pointing to the temporary directory
     */
    getTemporaryDirectory: function() {
        var tmpDir = null;

        /* DEBUG */ dump("Yulup:widget.js:WidgetManager.WidgetManager.getTemporaryDirectory() invoked\n");

        tmpDir = Components.classes["@mozilla.org/file/directory_service;1"].getService(Components.interfaces.nsIProperties).get("TmpD", Components.interfaces.nsIFile);

        tmpDir.append(WIDGET_TMP_DIR);

        return tmpDir;
    },

    /**
     * Installs the widget into the current editor.
     *
     * Registers the widget commands and copys the icon into the
     * yulup uri-space
     *
     * @param  {Widget}    aWidget the widget that will be installed
     * @return {Undefined}         does not have a return value
     */
     installWidget: function(aWidget) {
        var commandSet       = null;
        var widgetCommand    = null;
        var toolbarButtons   = null;
        var widgetButton     = null;

        /* DEBUG */ dump("Yulup:widget.js:WidgetManager.WidgetManager.installWidget() invoked\n");

        // add command to editor.xul
        commandSet = document.getElementById('uiYulupEditorWidgetCommandset');
        widgetCommand = document.createElement('command');
        widgetCommand.setAttribute('id', 'cmd_' + aWidget.attributes["name"]);
        widgetCommand.setAttribute('disabled', 'false');
        widgetCommand.setAttribute('oncommand', "WidgetHandler.doWidgetCommand(\"" + aWidget.attributes["name"] + "\")");
        commandSet.appendChild(widgetCommand);

        // add toolbarbutton to editor.xul
        toolbarButtons = document.getElementById('uiYulupWidgetToolbarbuttons');
        widgetButton = document.createElement('toolbarbutton');
        widgetButton.setAttribute('id', 'uiWidget' + aWidget.attributes["name"]);
        widgetButton.setAttribute('label', aWidget.attributes["name"]);
        widgetButton.setAttribute('style', '-moz-box-orient: vertical;');
        widgetButton.setAttribute('image', aWidget.tmpIconURI.spec);
        widgetButton.setAttribute('tooltiptext', aWidget.attributes["description"]);
        widgetButton.setAttribute('command', 'cmd_' + aWidget.attributes["name"]);
        toolbarButtons.appendChild(widgetButton);
     },

    /**
     * Loads the widgets.
     *
     * @param {Array}    aWidgets              array containing the to be loaded widgets
     * @param {Function} aLoadFinishedCallback this function gets called for each widget after it was loaded
     */
    addWidgets: function(aWidgets) {
        var widget    = null;
        var widgetDir = null;
        var iconFile  = null;
        var ioService = null;

        /* DEBUG */ dump("Yulup:widget.js:WidgetManager.addWidgets(\"" + aWidgets + "\") invoked\n");

        ioService = Components.classes["@mozilla.org/network/io-service;1"]. getService(Components.interfaces.nsIIOService);

        for (var i=0; i<aWidgets.length; i++) {

            if (this.getWidgetByName(aWidgets[i].attributes["name"])) {
                // skip duplicate widgets
                continue;
            }

            widget = new Widget();

            widget.attributes         = aWidgets[i].attributes;
            widget.fragment           = aWidgets[i].fragment;
            widget.fragmentAttributes = aWidgets[i].fragmentAttributes;
            widget.icon               = aWidgets[i].icon;
            widget.iconURI            = aWidgets[i].iconURI;

            switch (widget.attributes["type"]) {
                case "surround":
                case "insert":
                case "upload":
                    // create the widget directory
                    widgetDir = this.tmpDir.clone();
                    widgetDir.append(widget.attributes["name"]);
                    widgetDir.create(Components.interfaces.nsIFile.DIRECTORY_TYPE, 0755);

                    // create the widget icon file
                    iconFile = widgetDir.clone();
                    iconFile.append(widget.icon);
                    iconFile.create(Components.interfaces.nsIFile.NORMAL_FILE_TYPE, 0755);

                    /* DEBUG */ dump("Yulup:widget.js:WidgetManager.addWidget: tmp icon file = \"" + iconFile.path + "\"\n");

                    widget.tmpIconFile = iconFile;
                    widget.tmpIconURI  = ioService.newFileURI(widget.tmpIconFile);
                break;
            }

            this.widgets[this.widgets.length] = widget;
        }
    },

    requestFinishedHandler: function(aResultFile, aResponseStatusCode, aContext) {

        /* DEBUG */ dump("Yulup:widget.js:WidgetManager.requestFinishedHandler(\"" + aResultFile.path + "\", \"" + aResponseStatusCode + "\", \"" + aContext + "\") invoked\n");

        if (aResponseStatusCode == 200) {
            aContext.callback(aResultFile, null, aContext.widget);
        } else {
            // get an nsIURI object for the response file
            fileURI = Components.classes["@mozilla.org/network/io-service;1"]. getService(Components.interfaces.nsIIOService).newFileURI(aResultFile);

            xmlDoc = new XMLDocument(fileURI);
            xmlDoc.loadDocument();
            try {
                // parse the neutron exception
                Neutron.response(xmlDoc.documentData);
            } catch (exception) {
                aContext.callback(null, exception, aContext.widget);
            }

            aContext.callback(null, null, null);
        }
    },

    loadWidgets: function(aLoadFinishedCallback) {
        var contextObj = null;

        /* DEBUG */ dump("Yulup:widget.js:WidgetManager.addWidget(\"" + aLoadFinishedCallback + "\") invoked\n");

        for (var i=0; i < this.widgets.length; i++) {
            switch (this.widgets[i].attributes["type"]) {
                case "surround":
                case "insert":
                case "upload":
                    contextObj = {
                        widget: this.widgets[i],
                        callback: aLoadFinishedCallback
                    };

                    NetworkService.httpFetchToFile(this.widgets[i].iconURI.spec, this.widgets[i].tmpIconFile, this.requestFinishedHandler, contextObj, true);
                break;
            }
        }
    },

    getWidgetByName: function(aWidgetName) {

        for (var i=0; i < this.widgets.length; i++) {
            if (this.widgets[i].attributes["name"] == aWidgetName) {
                return this.widgets[i];
            }
        }

        return null;
    },

    getWidgetCount: function () {
        /* DEBUG */ dump("Yulup:widget.js:WidgetManager.getWidgetCount() invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(this.widgets != null && this.widgets.length != null);

        return this.widgets.length;
    }
};

var gWidgetFragmentAttributes = null;

var WidgetDialogHandler = {

    uiYulupEditorWidgetInsertOnDialogLoadHandler: function() {
        var widget     = null;
        var nsResolver = null;
        var widgetRows = null;
        var label      = null;
        var elem       = null;

        /* DEBUG */ dump("Yulup:widget.js:WidgetDialogHandler.uiYulupEditorWidgetInsertOnDialogLoadHandler() invoked\n");

        widget     = window.arguments[1];
        nsResolver = window.arguments[2];

        gWidgetFragmentAttributes = widget.fragmentAttributes;

        widgetRows = document.getElementById("uiYulupEditorWidgetInsertRows");
        label = document.getElementById("uiYulupWidgetInsertAuthenticationLabel");

        // set the dialog top-label
        label.setAttribute("value", label.getAttribute("value") + "\"" +widget.attributes["name"] + "\"");

        for (var i=0; i < widget.fragmentAttributes.length; i++) {

            elem = document.createElement("row");
            elem.setAttribute("id", "row" + i);
            widgetRows.appendChild(elem);

            elem = document.createElement("label");
            elem.setAttribute("control", widget.fragmentAttributes[i].name);
            elem.setAttribute("value", widget.fragmentAttributes[i].name);
            elem.setAttribute("flex", "1");
            document.getElementById("row" + i).appendChild(elem);

            elem = document.createElement("textbox");
            elem.setAttribute("id", widget.fragmentAttributes[i].name);
            elem.setAttribute("size", "30");
            elem.setAttribute("flex", "2");

            // set the attribute default value
            elem.setAttribute("value", widget.fragment.evaluate(widget.fragmentAttributes[i].xpath, widget.fragment, nsResolver, XPathResult.STRING_TYPE, null).stringValue);

            document.getElementById("row" + i).appendChild(elem);
        }
    },

    showWidgetInsertDialog: function(aWidget, aNSResolver) {
        returnObject    = new Object();

        if (window.openDialog(YULUP_WIDGET_INSERT_CHROME_URI, "yulupWidgetInsertDialog", "modal,resizable=no", returnObject, aWidget, aNSResolver)) {
            if (returnObject.returnValue) {
                return returnObject.returnValue;
            }
        }

        return null;
    },

    save: function () {
        var field = null;

        /* DEBUG */ dump("Yulup:widget.js:WidgetDialogHandler.save() invoked\n");

        returnObject = window.arguments[0];

        returnObject.returnValue = new Array();

        for (var i=0; i < gWidgetFragmentAttributes.length; i++) {
            returnObject.returnValue[gWidgetFragmentAttributes[i].name] = document.getElementById(gWidgetFragmentAttributes[i].name).value;

            /* DEBUG */ dump("Yulup:widget.js:WidgetDialogHandler.save: " + gWidgetFragmentAttributes[i].name + " " + returnObject.returnValue[gWidgetFragmentAttributes[i].name] + "\n");
        }

        return true;
    }
};

var gSelection        = null;
var gMouseSelection   = null;

var ResourceUploadDialogHandler = {

    updateTreeView: function(aSitetree, aTreeParent) {
        var uid          = null;
        var nodeUid      = null;
        var treeChildren = null;
        var treeItem     = null;
        var treeRoe      = null;

        /* DEBUG */ dump("Yulup:widget.js:ResourceUploadDialogHandler.updateTreeView() invoked\n");

        uid = Date.now();

        elem = document.createElement("treechildren");
        elem.setAttribute("id", "children" + uid);
        aTreeParent.appendChild(elem);
        treeChildren = document.getElementById("children" + uid);

        // initialise the tree view
        for (var i=0; i<aSitetree.resources.length; i++) {

            // generate an UID for this resource node
            nodeUid = uid + i;

            //treeitem
            elem = document.createElement("treeitem");
            if (aSitetree.resources[i].properties.resourcetype == "collection") {
                elem.setAttribute("container", "true");
            } else {
                elem.setAttribute("container", "false");
            }
            elem.setAttribute("open", "false");
            elem.setAttribute("id", "item" + nodeUid);
            treeChildren.appendChild(elem);

            //treerow
            treeItem = document.getElementById("item" + nodeUid);
            elem = document.createElement("treerow");
            elem.setAttribute("id", "row" + nodeUid);
            treeItem.appendChild(elem);

            //treecell
            treeRow = document.getElementById("row" + nodeUid);
            elem = document.createElement("treecell");
            elem.setAttribute("id", "cell" + nodeUid);
            elem.setAttribute("label", aSitetree.resources[i].properties.displayname);
            elem.setAttribute("href", aSitetree.resources[i].href.spec);
            elem.setAttribute("resourcetype", aSitetree.resources[i].properties.resourcetype);

            treeRow.appendChild(elem);
        }
    },

    showFilePicker: function() {
        var filePicker = null;
        var ret        = null;
        var textBox    = null;

        /* DEBUG */ dump("Yulup:widget.js:ResourceUploadDialogHandler.showFilePicker() invoked\n");

        filePicker = Components.classes["@mozilla.org/filepicker;1"].createInstance(Components.interfaces.nsIFilePicker);

        filePicker.init(window, "Select a File", Components.interfaces.nsIFilePicker.modeOpen);
        ret = filePicker.show();

        if (ret == Components.interfaces.nsIFilePicker.returnOK) {
            textBox = document.getElementById("uiYulupResourceUploadTextBox");
            textBox.setAttribute("value", filePicker.fileURL.filePath);

            // TODO upload the resource to the server
        }
    },

    updateSelection: function() {
        var tree = null;

        /* DEBUG */ dump("Yulup.widget.js:ResourceUploadDialogHandler.updateSelection() invoked\n");

        tree = document.getElementById("uiYulupResourceUploadTree");

        gSelection = tree.currentIndex;
    },

    handleKeyUpEvent: function(aEvent) {
        var treeItem = null;

        /* DEBUG */ dump("Yulup.widget.js:ResourceUploadDialogHandler.handleKeyDownEvent() invoked\n");

        treeCell = ResourceUploadDialogHandler.getCellAtRow(gSelection);
        treeItem = treeCell.parentNode.parentNode;

        // left direction key was pressed
        if (aEvent.keyCode == 39) {

            // make shure we don't load the sitetree twice
            if (!treeItem.getElementsByTagName("treechildren").length) {
                ResourceUploadDialogHandler.updateResourceUploadDialog(treeCell.getAttribute("href"), treeItem);
            }
        }
    },

    handleMouseClickEvent: function(aEvent) {
        var treeItem = null;
        var treeCell = null;

        /* DEBUG */ dump("Yulup.widget.js:ResourceUploadDialogHandler.handleMouseClickEvent() invoked\n");

        // only expand the tree if the twisty was clicked
        if (gMouseSelection.pseudo == "twisty") {

            treeCell = gMouseSelection.cell;
            treeItem = treeCell.parentNode.parentNode;

            // set the tree selection
            document.getElementById("uiYulupResourceUploadTree").view.selection.select(gMouseSelection.row);

            // make shure we don't load the sitetree twice
            if (!treeItem.getElementsByTagName("treechildren").length) {
                ResourceUploadDialogHandler.updateResourceUploadDialog(treeCell.getAttribute("href"), treeItem);
            }
        }
    },

    handleMouseDoubleClickEvent: function(aEvent) {
        var treeItem = null;
        var treeCell = null;

        /* DEBUG */ dump("Yulup.widget.js:ResourceUploadDialogHandler.handleMouseDoubleClickEvent() invoked\n");

        // only expand the tree if the text was clicked
        if (gMouseSelection.pseudo == "text") {

            treeCell = gMouseSelection.cell;
            treeItem = treeCell.parentNode.parentNode;

            // make shure we don't load the sitetree twice
            if (!treeItem.getElementsByTagName("treechildren").length) {
                ResourceUploadDialogHandler.updateResourceUploadDialog(treeCell.getAttribute("href"), treeItem);
            }
        }
    },

    /**
     * Gets the cells XULElement at the specified row.
     *
     * If we want to get the XULElement corresponding to a certain
     * Tree-cell we have to translate the tree.currentIndex property
     * since the value does point to the n'th cell in the tree but not
     * in the XUL file aka. getElementsByTagName("treecell")[tree.currentIndex]
     * does not work.
     *
     * @param  {Integer}       aRow the row value returned by the tree implementation
     * @return {nsIDOMElement}      the corresponding element in the document DOM
     */
    getCellAtRow: function(aRow) {
        var treeItems = null;
        var cell      = null;
        var row       = null;

        treeItems = document.getElementsByTagName("treechildren")[0].childNodes;

        // wrap into an object for a call by reference
        row = {
            row: 0
        };

        return ResourceUploadDialogHandler.__getCellAtRow(aRow, row, treeItems);
    },

    __getCellAtRow: function(aRow, aCurrentRow, aChildNodes) {
        var cell = null;

        for (var i=0; i<aChildNodes.length; i++) {
            if (aChildNodes[i].getAttribute("open") == "true") {
                if (aCurrentRow.row++ == aRow) {
                    return aChildNodes[i].firstChild.firstChild;
                }
                if (aChildNodes[i].childNodes.length >= 2) {
                    if ((cell = ResourceUploadDialogHandler.__getCellAtRow(aRow, aCurrentRow, aChildNodes[i].childNodes[1].childNodes)) != null) {
                    return cell;
                    };
                }
            } else {
                if (aCurrentRow.row++ == aRow) {
                    return aChildNodes[i].firstChild.firstChild;
                }
            }
        }
        return null;
    },

    updateCurrentCell: function(aEvent) {
        var tree   = null;
        var box    = null;
        var row    = null;
        var col    = null;
        var pseudo = null;

        /* DEBUG */ dump("Yulup.widget.js:ResourceUploadDialogHandler.updateCurrentCell() invoked\n");

        tree = document.getElementById("uiYulupResourceUploadTree");

        row    = {};
        col    = {};
        pseudo = {};

        box = tree.boxObject;
        box.QueryInterface(Components.interfaces.nsITreeBoxObject);
        box.getCellAt(aEvent.clientX, aEvent.clientY, row, col, pseudo);

        // update the global selection object
        gMouseSelection = {
            cell: ResourceUploadDialogHandler.getCellAtRow(row.value),
            pseudo: pseudo.value,
        };
    },

    initResourceUploadDialog: function() {
        var context = null;

        /* DEBUG */ dump("Yulup:widget.js:ResourceUploadDialogHandler.initResourceUploadDialog() invoked\n");

        if (gEditorController.editorParams.navigation && gEditorController.editorParams.navigation.sitetree.uri) {

            context = {
                uri: gEditorController.editorParams.navigation.sitetree.uri.spec,
                baseURI: gEditorController.editorParams.navigation.sitetree.uri,
                parentNode: null,
                callbackFunction: ResourceUploadDialogHandler.sitetreeLoadFinished
            };

            // fetch the sitetree XML file
            NetworkService.httpRequestGET(gEditorController.editorParams.navigation.sitetree.uri.spec, null, ResourceUploadDialogHandler.__requestFinishedHandler, context, false, true);
        }

    },

    updateResourceUploadDialog: function(aURI, aParentNode) {
        var context = null;
        var uri     = null;

        /* DEBUG */ dump("Yulup:widget.js:ResourceUploadDialogHandler.updateResourceUploadDialog() invoked\n");

        // resolve the resource uri relative to the sitetree base uri
        baseURI = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService).newURI(aURI, null, null);

        context = {
            uri: aURI,
            baseURI: baseURI,
            parentNode: aParentNode,
            callbackFunction: ResourceUploadDialogHandler.sitetreeLoadFinished
        };

        // fetch the sitetree XML file
        NetworkService.httpRequestGET(aURI, null, ResourceUploadDialogHandler.__requestFinishedHandler, context, false, true);
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

        /* DEBUG */ dump("Yulup:widget.js:ResourceUploadDialogHandler.__requestFinishedHandler() invoked\n");

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
     * Callback function that gets called when the introspection request
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

        /* DEBUG */ dump("Yulup:widet.js:ResourceUploadDialogHandler.sitetreeLoadFinished() invoked\n");

        aURI     = aContext.uri;
        aBaseURI = aContext.baseURI;

        try {
            if (aDocumentData) {
                /* DEBUG */ dump("Yulup:widet.js:ResourceUploadDialogHandler.sitetreeLoadFinished(): loading sitetree file \"" + aURI + "\" succeeded\n");

                domParser = Components.classes["@mozilla.org/xmlextras/domparser;1"].createInstance(Components.interfaces.nsIDOMParser);

                domDocument  = domParser.parseFromString(aDocumentData, "text/xml");

                // instantiate the parser for this version and parse the file
                sitetree = Neutron.parserFactory(domDocument, aBaseURI).parseSitetree();

                if (aContext.parentNode) {
                    // update an existing view
                    ResourceUploadDialogHandler.updateTreeView(sitetree, aContext.parentNode);
                } else {
                    // show the resource upload dialog
                    ResourceUploadDialogHandler.showResourceUploadDialog(sitetree);
                }
            } else {
                /* DEBUG */ dump("Yulup:neutron.js:ResourceUploadDialogHandler.sitetreeLoadFinished: failed to load \"" + aURI + "\"). \"" + aException + "\"\n");

                if (aException && (aException instanceof NeutronProtocolException || aException instanceof NeutronAuthException)) {
                    // report error message retrieved from response
                    throw new YulupException(document.getElementById("uiYulupEditorStringbundle").getString("editorDocumentLoadError0.label") + " \"" + aURI + "\".\n" + document.getElementById("uiYulupEditorStringbundle").getString("editorDocumentLoadServerError.label") + ": " + aException.message + ".");
                } else
                    throw new YulupException(document.getElementById("uiYulupEditorStringbundle").getString("editorDocumentLoadError0.label") + " \"" + aURI + "\".");
            }
        } catch (exception) {
            /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:neutron.js:ResourceUploadDialogHandler.sitetreeLoadFinished:", exception);

            alert(document.getElementById("uiYulupEditorStringbundle").getString("editorDocumentLoadFailure.label") + "\n\n" + exception.message);
        }
    },

    uiYulupEditorResourceUploadOnDialogLoadHandler: function() {
        var sitetree      = null;
        var tree          = null;

        /* DEBUG */ dump("Yulup:widget.js:ResourceUploadDialogHandler.uiYulupEditorWidgetInsertOnDialogLoadHandler() invoked\n");

        sitetree = window.arguments[0];
        tree     = document.getElementById("uiYulupResourceUploadTree");

        ResourceUploadDialogHandler.updateTreeView(sitetree, tree);
    },

    showResourceUploadDialog: function(aSitetree) {

        /* DEBUG */ dump("Yulup:widet.js:ResourceUploadDialogHandler.showResourceUploadDialog() invoked\n");

        window.openDialog(YULUP_RESOURCE_UPLOAD_CHROME_URI, "yulupWidgetResourceUploadDialog", "modal,resizable=no", aSitetree);
    }
};


var WidgetHandler = {

    /**
     * Update the widgets xml-fragment with the user defined attribute
     * values.
     *
     * @param  {Widget}    aWidget the widget whose fragment will be parametrized
     * @return {Undefined}         does not have a return value
     */
    getParametrizedWidgetFragment: function(aWidget) {
        var customAttrValue = null;
        var attrXpath       = null;
        var attrIterator    = null;
        var attrElement     = null;
        var newFragment     = null;
        var namespaces      = null;
        var nsResolver      = null;
        var resolverFunction = null;

        /* DEBUG */ dump("Yulup:widget.js:WidgetHandler.getParametrizedWidgetFragment() invoked\n");

        nsResolver = new ConfigurableNsResolver(aWidget.fragment);

        if ((attributes = WidgetDialogHandler.showWidgetInsertDialog(aWidget, nsResolver)) != null) {
            for (var i=0; i < aWidget.fragmentAttributes.length; i++) {

                // get the user defined attribute value
                customAttrValue = attributes[aWidget.fragmentAttributes[i].name];
                attrXpath       = aWidget.fragmentAttributes[i].xpath;

                /* DEBUG */ dump("Yulup:widget.js:WidgetHandler.getParametrizedWidgetFragment: " + customAttrValue + " " + attrXpath + " " + aWidget.fragmentAttributes[i].name + "\n");

                // get the attribute in the fragment
                attrIterator = aWidget.fragment.evaluate(attrXpath, aWidget.fragment, nsResolver, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);

                attrElement = attrIterator.iterateNext();

                // set the custom attribute value
                if (attrElement) {
                    attrElement.nodeValue = customAttrValue;
                }
            }
        }
    },

    /**
     * Removes superflous null-namespace declarations from the
     * widget fragment.
     *
     * @param  {nsIXMLDocument}  aDocument the xml document that will be cleaned
     * @return {nsIXMLDocument}            the cleaned xml document
     */
    tidyWidgetFragment: function(aDocument) {
        var tidyWidgetFragmentXSL = null;
        var xsltProcessor         = null;

        /* DEBUG */ dump("Yulup:widget.js:WidgetHandler.tidyWidgetFragment() invoked\n");

        tidyWidgetFragmentXSL = Components.classes["@mozilla.org/xml/xml-document;1"].createInstance(Components.interfaces.nsIDOMXMLDocument);

        tidyWidgetFragmentXSL.async = false;

        if (!tidyWidgetFragmentXSL.load(TIDYWIDGETFRAGMENT_CHROME_URI)) {
            throw new YulupEditorException("Could not load XSLT from URI: " + TIDYWIDGETFRAGMENT_CHROME_URI);
        }

        xsltProcessor = new XSLTProcessor();
        xsltProcessor.importStylesheet(tidyWidgetFragmentXSL);

        return xsltProcessor.transformToDocument(aDocument);
    },

    doContentWidgetCommand: function(aWidget, aView, aViewMode) {
        var widget          = null;
        var xmlSerializer   = null;
        var fragmentData    = null;
        var tidyedFragment  = null;
        var xPath           = null;
        var modelDOM        = null;
        var modelNode       = null;
        var scrollX         = null;
        var scrollY         = null;

        /* DEBUG */ dump("Yulup:widget.js:WidgetHandler.doContentWidgetCommand() invoked\n");

        xmlSerializer = Components.classes["@mozilla.org/xmlextras/xmlserializer;1"].getService(Components.interfaces.nsIDOMSerializer);

        if (aWidget.fragmentAttributes && aWidget.fragment) {
            WidgetHandler.getParametrizedWidgetFragment(aWidget);
        }

        if (aWidget.fragment) {
            tidyedFragment = this.tidyWidgetFragment(aWidget.fragment);
        }

        switch (aWidget.attributes["type"]) {
            case "insert":
                fragmentData = xmlSerializer.serializeToString(tidyedFragment);

                if (aViewMode == 1) {
                    aView.view.insertText(fragmentData);
                } else if (aViewMode == 3) {
                    aView.view.insertHTML(fragmentData);
                } else if (aViewMode == 2) {
                    xPath = aView.getSourceXPathForXHTMLNode(aView.currentXHTMLNode, aView.isNamespaceAware);

                    /* DEBUG */ dump("Yulup:widget.js:WidgetHandler.doWidgetCommand() insert XPath " + xPath + "\n");

                    modelDOM = gEditorController.activeView.model.getDocumentDOM();

                    modelNode = modelDOM.evaluate(xPath, modelDOM, this.nsResolver, XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null);

                    modelNode = modelNode.iterateNext();

                    // insert the widget fragment into the model
                    modelNode.appendChild(tidyedFragment.firstChild);

                    //DOMSerialiser.serialiseDOMTree(dom);

                    // preserve scroll position
                    scrollX = aView.editor.contentWindow.scrollX;
                    scrollY = aView.editor.contentWindow.scrollY;

                    // TODO find a better way to sync the view with the model
                    aView.fillView();

                    // restore scroll position
                    aView.editor.contentWindow.scrollTo(scrollX, scrollY);

                    aView.view.incrementModificationCount(1);
                    aView.model.setDirty();
                }
            break;
            case "surround":
                if (aViewMode == 1) {
                    tidyedFragment.firstChild.appendChild(tidyedFragment.createTextNode(aView.view.selection));
                    fragmentData = xmlSerializer.serializeToString(tidyedFragment);
                    aView.view.insertText(fragmentData);
                } else if (aViewMode == 3) {
                    tidyedFragment.firstChild.appendChild(tidyedFragment.createTextNode(aView.view.selection));
                    fragmentData = xmlSerializer.serializeToString(tidyedFragment);
                    aView.view.insertHTML(fragmentData);
                } else if (aViewMode == 2) {
                    xPath = aView.getSourceXPathForXHTMLNode(aView.currentXHTMLNode, aView.isNamespaceAware);

                    /* DEBUG */ dump("Yulup:widget.js:WidgetHandler.doWidgetCommand() surround XPath " + xPath + "\n");

                    modelDOM = aView.model.getDocumentDOM();

                    modelNode = modelDOM.evaluate(xPath, modelDOM, this.nsResolver, XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null);

                    modelNode = modelNode.iterateNext();

                    if (modelNode.nodeType != 1 && modelNode.nodeType != 3) {
                        // only element and text nodes shall be surrounded
                        return;
                    }

                    tidyedFragment.firstChild.appendChild(modelNode.cloneNode(true));

                    // insert the widget fragment into the model
                    modelNode.parentNode.replaceChild(tidyedFragment.firstChild, modelNode);

                    //DOMSerialiser.serialiseDOMTree(dom);

                    // preserve scroll position
                    scrollX = aView.editor.contentWindow.scrollX;
                    scrollY = aView.editor.contentWindow.scrollY;

                    // TODO find a better way to sync the view with the model
                    aView.fillView();

                    // restore scroll position
                    aView.editor.contentWindow.scrollTo(scrollX, scrollY);

                    aView.view.incrementModificationCount(1);
                    aView.model.setDirty();
                }
            break;
        }
    },

    doWidgetCommand: function(aWidgetName) {
        var widget          = null;
        var view            = null;
        var viewMode        = null;

        widget = gEditorController.widgetManager.getWidgetByName(aWidgetName);
        view   = gEditorController.activeView;

        if (gEditorController.activeView instanceof SourceModeView) {
            viewMode = 1;
        } else if (gEditorController.activeView instanceof WYSIWYGXSLTModeView) {
            viewMode = 2;
        } else if (gEditorController.activeView instanceof WYSIWYGModeView) {
            viewMode = 3;
        }

        /* DEBUG */ dump("Yulup:widget.js:WidgetHandler.doWidgetCommand() view mode " + viewMode + "\n");

        switch (widget.attributes["type"]) {
            case "insert":
            case "surround":
                WidgetHandler.doContentWidgetCommand(widget, view, viewMode);
            break;
            case "upload":
                ResourceUploadDialogHandler.initResourceUploadDialog();
            break;
        }
    }
};


/**
  * Remove all temporary directories.
  *
  * This method should be called when yulup is started to
  * clean up lost widgets incase of a browser crash, kill, ...
  * This function takes an arbitrary number of arguments whereas
  * each argument denotes a temporary storage directory that will be
  * cleaned.
  *
  * @param  {String}    aDir directory unter TmpD which contains temporary files
  * @return {Undefined} does not have a return value
  */
function initialCleanUp(aDir) {
    var tmpDir        = null;
    var currentTmpDir = null;
    var widgetDir     = null;

    /* DEBUG */ dump("Yulup:widget.js:initialCleanUp() invoked\n");

    // get the temp directory
    tmpDir = Components.classes["@mozilla.org/file/directory_service;1"].getService(Components.interfaces.nsIProperties).get("TmpD", Components.interfaces.nsIFile);

    // clean up the temp directories
    for (var i=0; i < arguments.length; i++) {
        currentTmpDir = tmpDir.clone();
        currentTmpDir.append(arguments[i]);

        /* DEBUG */ dump("Yulup:widget.js:initialCleanUp: cleaning \"" + currentTmpDir.path + "\"\n");

        try {
            if (currentTmpDir.exists()) {
                currentTmpDir.remove(true);
            }
        } catch (exception) {
            /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:widget.js:initialCleanUp", exception);
            /* DEBUG */ Components.utils.reportError(exception);
        }
    }
}
