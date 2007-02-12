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
 * @author Gregor Imboden
 *
 */

const WIDGET_TMP_DIR = "yulup-widgets";

const YULUP_WIDGET_INSERT_CHROME_URI   = "chrome://yulup/content/widgetparamsdialog.xul";
const YULUP_RESOURCE_SELECT_CHROME_URI = "chrome://yulup/content/resourceselectdialog.xul";
const TIDYWIDGETFRAGMENT_CHROME_URI    = "chrome://yulup/content/tidywidgetfragment.xsl";

const DEFAULT_COLORPICKER_VALUE = "#FFFFFF";

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

    this.surroundCommandList = {};
}

WidgetManager.prototype = {
    instanceID         : null,
    widgets            : null,
    tmpDir             : null,
    surroundCommandList: null,

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
     * Registers an array of widgets.
     *
     * Registers the widget commands and copies the icon into the
     * yulup uri-space.
     *
     * @param  {Array}     aWidgets array containing the widgets to be registered
     * @return {Undefined} does not have a return value
     */
    addWidgets: function(aWidgets) {
        var widget                 = null;
        var widgetDir              = null;
        var iconFile               = null;
        var ioService              = null;
        var commandSet             = null;
        var widgetCommand          = null;
        var toolbarButtons         = null;
        var widgetButton           = null;
        var surroundingElementName = null;

        /* DEBUG */ dump("Yulup:widget.js:WidgetManager.addWidgets(\"" + aWidgets + "\") invoked\n");

        ioService = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);

        commandSet     = document.getElementById('uiYulupEditorWidgetCommandset');
        toolbarButtons = document.getElementById('uiYulupWidgetToolbarbuttons');

        for (var i = 0; i < aWidgets.length; i++) {
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

            // add command to editor.xul
            widgetCommand = document.createElement('command');
            widgetCommand.setAttribute('id', 'cmd_' + widget.attributes["name"]);
            widgetCommand.setAttribute('disabled', 'false');
            widgetCommand.setAttribute('oncommand', "WidgetHandler.doWidgetCommand(this, \"" + widget.attributes["name"] + "\")");
            commandSet.appendChild(widgetCommand);

            // get top-level element name
            if (widget.attributes["type"] === "surround") {
                surroundingElementName = widget.fragment.documentElement;

                if (surroundingElementName && surroundingElementName.localName) {
                    /* DEBUG */ dump("Yulup:widget.js:WidgetManager.addWidgets: registering surrounding action for element name \"" + widget.fragment.documentElement.localName.toLowerCase() + "\"\n");

                    this.surroundCommandList[widget.fragment.documentElement.localName.toLowerCase()] = widgetCommand;
                }

                surroundingElementName = null;
            }

            // add toolbarbutton to editor.xul
            widgetButton = document.createElement('canvasbutton');
            widgetButton.setAttribute('id', 'uiWidget' + widget.attributes["name"]);
            widgetButton.setAttribute('label', widget.attributes["name"]);
            widgetButton.setAttribute('style', '-moz-box-orient: vertical;');
            widgetButton.setAttribute('tooltiptext', widget.attributes["description"]);
            widgetButton.setAttribute('command', 'cmd_' + widget.attributes["name"]);
            toolbarButtons.appendChild(widgetButton);
        }
    },

    /**
     * Loads all registered widgets.
     *
     * @param  {Function}  aLoadFinishedCallback this function gets called for each widget after it was loaded
     * @return {Undefined} does not have a return value
     */
    loadWidgets: function(aLoadFinishedCallback) {
        var contextObj = null;

        /* DEBUG */ dump("Yulup:widget.js:WidgetManager.addWidget(\"" + aLoadFinishedCallback + "\") invoked\n");

        for (var i = 0; i < this.widgets.length; i++) {
            switch (this.widgets[i].attributes["type"]) {
                case "surround":
                case "insert":
                    contextObj = {
                        widget: this.widgets[i],
                        callback: aLoadFinishedCallback
                    };

                    NetworkService.httpFetchToFile(this.widgets[i].iconURI.spec, this.widgets[i].tmpIconFile, this.requestFinishedHandler, contextObj, true);
                break;
            }
        }
    },

    /**
     * Sets the newly loaded widget image.
     *
     * @param  {Widget}    aWidget the widget that will be installed
     * @return {Undefined} does not have a return value
     */
     installWidget: function(aWidget) {
        var widgetButton = null;

        /* DEBUG */ dump("Yulup:widget.js:WidgetManager.WidgetManager.installWidget() invoked\n");

        // set widget image
        widgetButton = document.getElementById('uiWidget' + aWidget.attributes["name"]);

        if (widgetButton)
            widgetButton.setAttribute('image', aWidget.tmpIconURI.spec);
    },

    requestFinishedHandler: function(aResultFile, aResponseStatusCode, aContext) {
        ///* DEBUG */ dump("Yulup:widget.js:WidgetManager.requestFinishedHandler(\"" + aResultFile.path + "\", \"" + aResponseStatusCode + "\", \"" + aContext + "\") invoked\n");

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
        var widget      = null;
        var nsResolver  = null;
        var sitetreeURI = null;
        var widgetRows  = null;
        var label       = null;
        var elem        = null;
        var row         = null;
        var container   = null;
        var textbox     = null;

        /* DEBUG */ dump("Yulup:widget.js:WidgetDialogHandler.uiYulupEditorWidgetInsertOnDialogLoadHandler() invoked\n");

        widget      = window.arguments[1];
        nsResolver  = window.arguments[2];
        sitetreeURI = window.arguments[3];

        gWidgetFragmentAttributes = widget.fragmentAttributes;

        widgetRows = document.getElementById("uiYulupEditorWidgetInsertRows");
        label      = document.getElementById("uiYulupWidgetInsertAuthenticationLabel");

        // set the dialog top-label
        label.setAttribute("value", label.getAttribute("value") + " \"" +widget.attributes["name"] + "\"");

        for (var i=0; i < widget.fragmentAttributes.length; i++) {
            row = document.createElement("row");
            row.setAttribute("id", "row" + i);
            row.setAttribute("align", "center");
            widgetRows.appendChild(row);

            elem = document.createElement("label");
            elem.setAttribute("control", widget.fragmentAttributes[i].name);
            elem.setAttribute("value", widget.fragmentAttributes[i].name);
            row.appendChild(elem);

            container = document.createElement("hbox");
            container.setAttribute("align", "center");
            row.appendChild(container);

            textbox = document.createElement("textbox");
            textbox.setAttribute("id", widget.fragmentAttributes[i].name);
            textbox.setAttribute("size", "30");
            textbox.setAttribute("flex", "1");

            // set the attribute default value
            textbox.setAttribute("value", widget.fragment.evaluate(widget.fragmentAttributes[i].xpath, widget.fragment, nsResolver, XPathResult.STRING_TYPE, null).stringValue);
            container.appendChild(textbox);

            // add a type specific action button
            switch (widget.fragmentAttributes[i].type) {
                case "resource":
                    elem = document.createElement("button");
                    elem.setAttribute("id", "button" + widget.fragmentAttributes[i].name);
                    elem.setAttribute("label", document.getElementById("uiYulupEditorStringbundle").getString("editorWidgetInsertSelect.label"));

                    // the resource attribute type needs a sitetree URI
                    if (sitetreeURI == null) {
                        elem.setAttribute("disabled", "true");
                    } else {
                        elem.setAttribute("oncommand", "ResourceSelectDialogHandler.doSelectCommand(\"" + sitetreeURI.spec + "\", \"" + widget.fragmentAttributes[i].name + "\")");
                    }

                    container.appendChild(elem);

                    break;
                case "color":
                    elem = document.createElement("colorpicker");
                    elem.setAttribute("id", "colorpicker" + widget.fragmentAttributes[i].name);
                    elem.setAttribute("type", "button");
                    elem.setAttribute("onchange", "WidgetDialogHandler.updateColorTextbox(\"" + widget.fragmentAttributes[i].name + "\", this.color)");

                    container.appendChild(elem);

                    textbox.setAttribute("maxlength", "7");
                    textbox.setAttribute("onchange", "WidgetDialogHandler.updateColorPicker(\"colorpicker" + widget.fragmentAttributes[i].name + "\", \"" + widget.fragmentAttributes[i].name + "\", this.value)");

                    // fixup color if we have to
                    if (WidgetDialogHandler.__isValidColorValue(textbox.getAttribute("value"))) {
                        textbox.value = textbox.value.toUpperCase();
                    } else {
                        textbox.value = DEFAULT_COLORPICKER_VALUE;
                    }

                    window.setTimeout("document.getElementById(\"colorpicker" + widget.fragmentAttributes[i].name + "\").color = \"" + textbox.value + "\"", 0);

                    break;
                default:
            }
        }
    },

    showWidgetInsertDialog: function(aWidget, aNSResolver, aSitetreeURI) {
        returnObject    = new Object();

        if (window.openDialog(YULUP_WIDGET_INSERT_CHROME_URI, "yulupWidgetInsertDialog", "modal,resizable=no,centerscreen", returnObject, aWidget, aNSResolver, aSitetreeURI)) {
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
    },

    updateColorTextbox: function (aTextBoxID, aValue) {
        var textbox = null;

        /* DEBUG */ dump("Yulup:widget.js:WidgetDialogHandler.updateColorTextbox(\"" + aTextBoxID + "\", \"" + aValue + "\") invoked\n");

        if ((textbox = document.getElementById(aTextBoxID)) != null) {
            textbox.value = aValue;
        }
    },

    updateColorPicker: function (aColorPickerID, aTextBoxID, aValue) {
        var colorpicker = null;
        var textbox     = null;

        /* DEBUG */ dump("Yulup:widget.js:WidgetDialogHandler.updateColorPicker(\"" + aColorPickerID + "\", \"" + aValue + "\") invoked\n");

        if ((colorpicker = document.getElementById(aColorPickerID)) != null &&
            (textbox     = document.getElementById(aTextBoxID))     != null) {
            // check color value validity
            if (WidgetDialogHandler.__isValidColorValue(aValue)) {
                colorpicker.color = aValue.toUpperCase();
            } else {
                colorpicker.color = DEFAULT_COLORPICKER_VALUE;
            }

            // propagate modified color back to textbox
            textbox.value = colorpicker.color;
        }
    },

    __isValidColorValue: function (aColor) {
        var retval = false;
        var color  = null;

        /* DEBUG */ dump("Yulup:widget.js:WidgetDialogHandler.__isValidColorValue(\"" + aColor + "\") invoked\n");

        try {
            color = aColor.toUpperCase();

            if (color.length = 7 && color[0] === "#") {
                retval = true;

                for (var i = 1; i < 7; i++) {
                    switch (color[i]) {
                        case "0": case "1": case "2": case "3": case "4": case "5": case "6": case "7": case "8": case "9":
                        case "A": case "B": case "C": case "D": case "E": case "F":
                            break;
                        default:
                            retval = false;
                            break;
                    }
                }
            }
        } catch (exception) {
            /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:widget.js:WidgetDialogHandler.__isValidColorValue", exception);
            /* DEBUG */ Components.utils.reportError(exception);
        }

        return retval;
    }
};

var ResourceSelectDialogHandler = {
    uiYulupEditorResourceSelectOnDialogLoadHandler: function() {
        var tree          = null;
        var sitetreeURI   = null;

        /* DEBUG */ dump("Yulup:widget.js:ResourceSelectDialogHandler.uiYulupEditorResourceSelectOnDialogLoadHandler() invoked\n");

        tree = document.getElementById("uiYulupResourceSelectTree");

        sitetreeURI = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService).newURI(window.arguments[0], null, null);

        tree.view = new SitetreeView(sitetreeURI, ResourceSelectDialogHandler.sitetreeErrorListener);
    },

    sitetreeErrorListener: function () {
        returnObject = null;

        if (window.arguments[1]) {
            returnObject = window.arguments[1];

            returnObject.error = true;
        }

        // close the dialog
        document.getElementById("uiYulupEditorResourceSelectDialog").cancelDialog();
    },

    save: function () {
        var tree        = null;
        var resourceURI = null;

        /* DEBUG */ dump("Yulup:widget.js:ResourceSelectDialogHandler.save() invoked\n");

        returnObject = window.arguments[1];

        tree = document.getElementById("uiYulupResourceSelectTree");

        // fetch tree selection
        resourceURI = tree.view.wrappedJSObject.getCurrentResourceURI();

        if (!resourceURI) {
            alert(document.getElementById("uiYulupEditorStringbundle").getString("yulupResourceSelectionNoResourceProvided.label"));

            document.getElementById("uiYulupResourceSelectTree").focus();

            return false;
        }

        // write tree selection to the returnObject
        returnObject.returnValue = resourceURI;

        /* DEBUG */ dump("Yulup:widget.js:ResourceSelectDialogHandler.save: URI to return is \"" + returnObject.returnValue + "\"\n");

        return true;
    },

    doSelectCommand: function(aURI, aTextBoxId) {
        var returnObject = null;

        /* DEBUG */ YulupDebug.ASSERT(aURI       != null);
        /* DEBUG */ YulupDebug.ASSERT(aTextBoxId != null);

        /* DEBUG */ dump("Yulup:widet.js:ResourceSelectDialogHandler.doSelectCommand() invoked\n");

        returnObject = {
            error: null,
            returnValue: null
        };

        if (window.openDialog(YULUP_RESOURCE_SELECT_CHROME_URI, "yulupWidgetResourceSelectDialog", "modal,resizable=no,centerscreen", aURI, returnObject)) {
            if (returnObject.returnValue) {
                /* DEBUG */ dump("Yulup:widet.js:ResourceSelectDialogHandler.doSelectCommand: inserting URI \"" + returnObject.returnValue.spec + "\"\n");
                document.getElementById(aTextBoxId).setAttribute("value", returnObject.returnValue.spec);
            }
        }
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
        var customAttrValue  = null;
        var attrXpath        = null;
        var attrIterator     = null;
        var attrElement      = null;
        var newFragment      = null;
        var namespaces       = null;
        var nsResolver       = null;
        var resolverFunction = null;
        var sitetreeURI      = null;

        /* DEBUG */ dump("Yulup:widget.js:WidgetHandler.getParametrizedWidgetFragment() invoked\n");

        nsResolver = new ConfigurableNsResolver(aWidget.fragment);

        if (gEditorController.editorParams.navigation && gEditorController.editorParams.navigation.sitetree) {
            sitetreeURI = gEditorController.editorParams.navigation.sitetree.uri;
        }

        if ((attributes = WidgetDialogHandler.showWidgetInsertDialog(aWidget, nsResolver, sitetreeURI)) != null) {
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

            return true;
        }

        return false;
    },

    /**
     * Removes superflous null-namespace declarations from the
     * widget fragment.
     *
     * @param  {nsIDOMXMLDocument}  aDocument the xml document that will be cleaned
     * @return {nsIDOMXMLDocument}            the cleaned xml document
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

    doContentWidgetCommand: function(aCommand, aWidget, aView, aViewMode) {
        var widget          = null;
        var xmlSerializer   = null;
        var fragmentData    = null;
        var tidyedFragment  = null;
        var xPath           = null;
        var modelDOM        = null;
        var modelNode       = null;
        var scrollX         = null;
        var scrollY         = null;

        /* DEBUG */ YulupDebug.ASSERT(aWidget   != null);
        /* DEBUG */ YulupDebug.ASSERT(aView     != null);
        /* DEBUG */ YulupDebug.ASSERT(aViewMode != null);

        /* DEBUG */ dump("Yulup:widget.js:WidgetHandler.doContentWidgetCommand() invoked\n");

        xmlSerializer = Components.classes["@mozilla.org/xmlextras/xmlserializer;1"].getService(Components.interfaces.nsIDOMSerializer);

        if (aWidget.fragmentAttributes && aWidget.fragment) {
            if (!WidgetHandler.getParametrizedWidgetFragment(aWidget)) {
                return;
            }
        }

        if (aWidget.fragment) {
            tidyedFragment = this.tidyWidgetFragment(aWidget.fragment);
        }

        switch (aWidget.attributes["type"]) {
            // TODO: move this code with a unified API into the individual views, since each view should know how to insert and surround
            case "insert":
                fragmentData = xmlSerializer.serializeToString(tidyedFragment);

                if (aViewMode == 1) {
                    aView.doInsertCommand(aCommand, tidyedFragment);
                } else if (aViewMode == 3) {
                    aView.doInsertCommand(aCommand, tidyedFragment);
                } else if (aViewMode == 2) {
                    xPath = aView.getSourceXPathForXHTMLNode(aView.currentXHTMLNode, aView.isNamespaceAware);

                    /* DEBUG */ dump("Yulup:widget.js:WidgetHandler.doContentWidgetCommand: insert XPath " + xPath + "\n");

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
                // TODO: find out if we should insert or remove
                if (true) {
                    // we insert
                    if (aViewMode == 1) {
                        aView.doSurroundCommand(aCommand, tidyedFragment);
                    } else if (aViewMode == 3) {
                        aView.doSurroundCommand(aCommand, tidyedFragment);
                    } else if (aViewMode == 2) {
                        // xslt mode view
                        xPath = aView.getSourceXPathForXHTMLNode(aView.currentXHTMLNode, aView.isNamespaceAware);

                        /* DEBUG */ dump("Yulup:widget.js:WidgetHandler.doContentWidgetCommand: surround XPath " + xPath + "\n");

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
                }
            break;
        }
    },

    doWidgetCommand: function(aCommand, aWidgetName) {
        var widget          = null;
        var view            = null;
        var viewMode        = null;

        /* DEBUG */ YulupDebug.ASSERT(aWidgetName != null);

        widget = gEditorController.widgetManager.getWidgetByName(aWidgetName);
        view   = gEditorController.activeView;

        if (gEditorController.activeView instanceof SourceModeView) {
            viewMode = 1;
        } else if (gEditorController.activeView instanceof WYSIWYGXSLTModeView) {
            viewMode = 2;
        } else if (gEditorController.activeView instanceof WYSIWYGModeView) {
            viewMode = 3;
        }

        /* DEBUG */ dump("Yulup:widget.js:WidgetHandler.doWidgetCommand: view mode " + viewMode + "\n");

        switch (widget.attributes["type"]) {
            case "insert":
            case "surround":
                WidgetHandler.doContentWidgetCommand(aCommand, widget, view, viewMode);
                break;
        }
    },

    __surroundSelection: function (aEditor, aSelection, aNewParent) {
        var xmlSerializer = null;
        var node          = null;
        var newParent     = null;

        /* DEBUG */ dump("Yulup:widget.js:WidgetHandler.__surroundSelection(\"" + aEditor + "\", \"" + aSelection + "\", \"" + aNewParent + "\") invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aEditor    != null);
        /* DEBUG */ YulupDebug.ASSERT(aSelection != null);
        /* DEBUG */ YulupDebug.ASSERT(aNewParent != null);

        var xmlSerializer = Components.classes["@mozilla.org/xmlextras/xmlserializer;1"].getService(Components.interfaces.nsIDOMSerializer);

        /* DEBUG */ dump("Yulup:widget.js:WidgetHandler.__surroundSelection: new parent = \"" + aNewParent + "\" (\"" + xmlSerializer.serializeToString(aNewParent) + "\")\n");

        // clone contents of selected range
        node = aSelection.getRangeAt(0).cloneContents();

        /* DEBUG */ dump("Yulup:widget.js:WidgetHandler.__surroundSelection: selected range = \"" + node + "\" (\"" + xmlSerializer.serializeToString(node) + "\")\n");

        // surround cloned selection
        newParent = node.ownerDocument.importNode(aNewParent, true);
        newParent.appendChild(node);

        /* DEBUG */ dump("Yulup:widget.js:WidgetHandler.__surroundSelection: surrounded stub = \"" + newParent + "\" (\"" + xmlSerializer.serializeToString(newParent) + "\")\n");

        // insert cloned selection at current selection
        aEditor.insertHTML(xmlSerializer.serializeToString(newParent));
    },

    activateCommand: function (aCommand) {
        /* DEBUG */ YulupDebug.ASSERT(aCommand != null);

        // hack to refire command update
        aCommand.removeAttribute("active");
        aCommand.setAttribute("active", "true");
    },

    deactivateCommand: function (aCommand) {
        /* DEBUG */ YulupDebug.ASSERT(aCommand != null);

        aCommand.removeAttribute("active");
    },

    updateCommandActiveStates: function (aWidgetCommandList, aSelection) {
        var elemNameMap = null;
        var node        = null;

        /* DEBUG */ YulupDebug.ASSERT(aWidgetCommandList != null);
        /* DEBUG */ YulupDebug.ASSERT(aSelection         != null);

        /* DEBUG */ dump("Yulup:widget.js:WidgetHandler.updateCommandActiveStates() invoked\n");

        if (aSelection.isCollapsed) {
            elemNameMap = {};

            /* Add all element names on the path from the current selection anchor
             * to the element names map. */
            node = aSelection.anchorNode;

            while (node) {
                if (node.localName)
                    elemNameMap[node.localName.toLowerCase()] = true;

                node = node.parentNode;
            }

            // check all commands
            for (var elemName in aWidgetCommandList) {
                if (elemNameMap[elemName]) {
                    WidgetHandler.activateCommand(aWidgetCommandList[elemName]);
                } else {
                    WidgetHandler.deactivateCommand(aWidgetCommandList[elemName]);
                }
            }
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

function WidgetUpdateSelectionListener(aWidgetCommandList) {
    /* DEBUG */ YulupDebug.ASSERT(aWidgetCommandList != null);

    /* DEBUG */ dump("Yulup:widget.js:WidgetUpdateSelectionListener() invoked\n");

    this.__widgetCommandList = aWidgetCommandList;
}

WidgetUpdateSelectionListener.prototype = {
    __widgetCommandList: null,

    notifySelectionChanged: function (aDocument, aSelection, aReason) {
        /* DEBUG */ dump("Yulup:widget.js:WidgetUpdateSelectionListener.notifySelectionChanged() invoked\n");

        WidgetHandler.updateCommandActiveStates(this.__widgetCommandList, aSelection);
    }
};
