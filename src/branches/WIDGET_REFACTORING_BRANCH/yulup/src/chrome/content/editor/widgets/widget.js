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
 * @author Andreas Wuest
 *
 */

const WIDGET_TMP_DIR = "yulup-widgets";

const TIDYWIDGETFRAGMENT_CHROME_URI = "chrome://yulup/content/editor/widgets/tidywidgetfragment.xsl";

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
  * @param  {YulupEditController} aController the editor controller
  * @param  {Integer}             aInstanceId the instance id of the editor
  * @return {Undefined} does not have a return value
  */
function WidgetManager(aController, aInstanceID) {
    /* DEBUG */ dump("Yulup:widget.js:WidgetManager(\"" + aInstanceID  + "\") invoked\n");

    this.instanceID   = aInstanceID;
    this.widgets      = new Array();
    this.tmpDir       = null;

    // create the tmp dir for this instance
    this.tmpDir = this.getTemporaryDirectory();
    this.tmpDir.append(this.instanceID);
    this.tmpDir.create(Components.interfaces.nsIFile.DIRECTORY_TYPE, 0755);

    /* DEBUG */ dump("Yulup:widget.js:WidgetManager: temp dir = \"" + this.tmpDir.path +"\"\n");

    // register a view change listener
    aController.addViewChangedListener(WidgetHandler.viewChangedHandler);

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
        var ioService              = null;
        var commandSet             = null;
        var toolbarButtons         = null;
        var surroundMenu           = null;
        var insertMenu             = null;
        var widget                 = null;
        var widgetDir              = null;
        var iconFile               = null;
        var widgetButton           = null;
        var widgetCommand          = null;
        var surroundingElementName = null;
        var menuItem               = null;

        /* DEBUG */ dump("Yulup:widget.js:WidgetManager.addWidgets(\"" + aWidgets + "\") invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aWidgets != null);

        ioService = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);

        commandSet     = document.getElementById("uiYulupEditorWidgetCommandset");
        toolbarButtons = document.getElementById("uiYulupWidgetToolbarbuttons");
        surroundMenu   = document.getElementById("uiYulupEditorEditorContextMenuSurroundMenupopup");
        insertMenu     = document.getElementById("uiYulupEditorEditorContextMenuInsertMenupopup");

        for (var i = 0; i < aWidgets.length; i++) {
            widget = aWidgets[i];

            if (widget instanceof NeutronWidget) {
                /* DEBUG */ dump("Yulup:widget.js:WidgetManager.addWidget: widget id \"" + widget.id + "\" is of type NeutronWidget\n");

                /* DEBUG */ dump("Yulup:widget.js:WidgetManager.addWidget: widget.icon = \"" + widget.icon + "\"\n");

                if (widget.icon) {
                    // create the widget directory
                    widgetDir = this.tmpDir.clone();
                    widgetDir.append(widget.id);
                    widgetDir.create(Components.interfaces.nsIFile.DIRECTORY_TYPE, 0755);

                    // create the widget icon file
                    iconFile = widgetDir.clone();
                    iconFile.append(widget.icon);
                    iconFile.create(Components.interfaces.nsIFile.NORMAL_FILE_TYPE, 0755);

                    /* DEBUG */ dump("Yulup:widget.js:WidgetManager.addWidget: tmp icon file = \"" + iconFile.path + "\"\n");

                    widget.tmpIconFile = iconFile;
                    widget.tmpIconURI  = ioService.newFileURI(widget.tmpIconFile);
                }

                commandID = this.__setUpCommand(widget, commandSet, this.surroundCommandList, surroundMenu, insertMenu);

                // add widget button
                if (widget.icon) {
                    widgetButton = document.createElement("canvasbutton");
                    widgetButton.setAttribute("id", "uiWidget" + widget.id);
                    widgetButton.setAttribute("style", "-moz-box-orient: vertical;");
                    widgetButton.setAttribute("command", commandID);
                    toolbarButtons.appendChild(widgetButton);
                }

                this.widgets.push(widget);
            }

            if (widget instanceof NeutronWidgetGroup) {
                /* DEBUG */ dump("Yulup:widget.js:WidgetManager.addWidget: widget id \"" + widget.id + "\" is of type NeutronWidgetGroup\n");

                for (var j = 0; j < widget.widgets.length; j++) {
                    /* DEBUG */ dump("Yulup:widget.js:WidgetManager.addWidget: widget id \"" + widget.widgets[j].id + "\" contained in group is of type NeutronWidget\n");

                    commandID = this.__setUpCommand(widget.widgets[j], commandSet, this.surroundCommandList, surroundMenu, insertMenu);

                    // TODO: add widgetgroup button

                    this.widgets.push(widget.widgets[j]);
                }
            }
        }
    },

    __setUpCommand: function (aWidget, aCommandSet, aSurroundCommandList, aSurroundMenu, aInsertMenu) {
        var commandID              = null;
        var widgetCommand          = null;
        var surroundingElementName = null;
        var menuItem               = null;

        /* DEBUG */ YulupDebug.ASSERT(aWidget              != null);
        /* DEBUG */ YulupDebug.ASSERT(aCommandSet          != null);
        /* DEBUG */ YulupDebug.ASSERT(aSurroundCommandList != null);
        /* DEBUG */ YulupDebug.ASSERT(aSurroundMenu        != null);
        /* DEBUG */ YulupDebug.ASSERT(aInsertMenu          != null);

        commandID = "cmd_yulup_widget_" + aWidget.id;

        widgetCommand = document.createElement("command");
        widgetCommand.setAttribute("id", commandID);
        widgetCommand.setAttribute("disabled", "false");
        widgetCommand.setAttribute("label", aWidget.name);
        widgetCommand.setAttribute("tooltiptext", aWidget.description);
        widgetCommand.setAttribute("oncommand", "WidgetHandler.doWidgetCommand(this, \"" + aWidget.id + "\")");
        aCommandSet.appendChild(widgetCommand);

        if (aWidget.supportsActionSurround()) {
            surroundingElementName = aWidget.getSurroundActionFragment().documentElement;

            if (surroundingElementName && surroundingElementName.localName) {
                /* DEBUG */ dump("Yulup:widget.js:WidgetManager.addWidget: registering surrounding action for element name \"" + aWidget.getSurroundActionFragment().documentElement.localName.toLowerCase() + "\"\n");

                aSurroundCommandList[aWidget.getSurroundActionFragment().documentElement.localName.toLowerCase()] = widgetCommand;
            }
        }

        // add command to context menu
        menuItem = document.createElement("menuitem");
        menuItem.setAttribute("command", commandID);

        if (aWidget.supportsActionSurround()) {
            menuItem.setAttribute("autocheck", "false");
            menuItem.setAttribute("type", "checkbox");

            aSurroundMenu.appendChild(menuItem);

            if (aSurroundMenu.parentNode.hasAttribute("disabled"))
                aSurroundMenu.parentNode.removeAttribute("disabled");
        }

        if (aWidget.supportsActionInsert()) {
            aInsertMenu.appendChild(menuItem);

            if (aInsertMenu.parentNode.hasAttribute("disabled"))
                aInsertMenu.parentNode.removeAttribute("disabled");
        }

        return commandID;
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
            if (this.widgets[i].icon) {
                contextObj = {
                    widget: this.widgets[i],
                    callback: aLoadFinishedCallback
                };

                NetworkService.httpFetchToFile(this.widgets[i].iconURI.spec, this.widgets[i].tmpIconFile, this.requestFinishedHandler, contextObj, true);
            } else {
                aLoadFinishedCallback(null, null, null);
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
        widgetButton = document.getElementById("uiWidget" + aWidget.id);

        if (widgetButton)
            widgetButton.setAttribute("image", aWidget.tmpIconURI.spec);
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
            if (this.widgets[i].id == aWidgetName) {
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


var WidgetHandler = {
    ACTION_SURROUND: 0,
    ACTION_INSERT  : 1,

    /**
     * Update the widgets xml-fragment with the user defined attribute
     * values.
     *
     * @param  {NeutronWidget}       aWidget        the widget corresponding to the widget action
     * @param  {NeutronWidgetAction} aWidgetAction  the widget action whose fragment will be parametrized
     * @return {nsIDOMDocumentFragment} returns the parameterised fragment, or null if potential user interaction was canceled
     */
    getParametrizedWidgetFragment: function(aWidget, aWidgetAction) {
        var customAttrValue  = null;
        var attrXpath        = null;
        var attrIterator     = null;
        var attrElement      = null;
        var paramFragment    = null;
        var namespaces       = null;
        var nsResolver       = null;
        var resolverFunction = null;

        /* DEBUG */ dump("Yulup:widget.js:WidgetHandler.getParametrizedWidgetFragment() invoked\n");

        nsResolver = new ConfigurableNsResolver(aWidgetAction.fragment);

        if ((attributes = WidgetDialog.showWidgetInsertDialog(aWidget, aWidgetAction, nsResolver, gEditorController, window)) != null) {
            paramFragment = aWidgetAction.fragment.cloneNode(true);

            for (var i = 0; i < aWidgetAction.parameters.length; i++) {
                // get the user defined attribute value
                customAttrValue = attributes[aWidgetAction.parameters[i].id];
                attrXpath       = aWidgetAction.parameters[i].xpath;

                /* DEBUG */ dump("Yulup:widget.js:WidgetHandler.getParametrizedWidgetFragment: value = \"" + customAttrValue + "\", xpath = \"" + attrXpath + "\", id = \"" + aWidgetAction.parameters[i].id + "\"\n");

                // get the attribute in the fragment
                attrIterator = paramFragment.evaluate(attrXpath, paramFragment, nsResolver, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);

                attrElement = attrIterator.iterateNext();

                // set the custom attribute value
                if (attrElement) {
                    attrElement.nodeValue = customAttrValue;
                }
            }
        }

        return paramFragment;
    },

    /**
     * Removes superflous null-namespace declarations from the
     * widget fragment.
     *
     * @param  {nsIDOMXMLDocument} aDocument the xml document that will be cleaned
     * @return {nsIDOMXMLDocument} the cleaned xml document
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

    doWidgetCommand: function(aCommand, aWidgetName) {
        var widget   = null;
        var view     = null;
        var prefersSurround = null;
        var action          = null;
        var fragment = null;

        /* DEBUG */ YulupDebug.ASSERT(aCommand    != null);
        /* DEBUG */ YulupDebug.ASSERT(aWidgetName != null);

        /* DEBUG */ dump("Yulup:widget.js:WidgetHandler.doWidgetCommand(\"" + aCommand + "\", \"" + aWidgetName + "\") invoked\n");

        widget = gEditorController.widgetManager.getWidgetByName(aWidgetName);
        view   = gEditorController.activeView;

        /* DEBUG */ dump("Yulup:widget.js:WidgetHandler.doWidgetCommand: command name = \"" + widget.name + "\"\n");

        /* DEBUG */ dump("Yulup:widget.js:WidgetHandler.doWidgetCommand: widget supports surround = \"" + widget.supportsActionSurround() + "\"\n");
        /* DEBUG */ dump("Yulup:widget.js:WidgetHandler.doWidgetCommand: widget supports insert = \"" + widget.supportsActionInsert() + "\"\n");

        // find out if the view wants surrounding or insertion
        prefersSurround = view.prefersSurround();

        if (prefersSurround) {
            /* DEBUG */ dump("Yulup:widget.js:WidgetHandler.doWidgetCommand: view prefers surround\n");

            if (widget.supportsActionSurround()) {
                action = WidgetHandler.ACTION_SURROUND;
            } else {
                action = WidgetHandler.ACTION_INSERT;
            }
        } else {
            /* DEBUG */ dump("Yulup:widget.js:WidgetHandler.doWidgetCommand: view prefers insert\n");

            if (widget.supportsActionInsert()) {
                action = WidgetHandler.ACTION_INSERT;
            } else {
                action = WidgetHandler.ACTION_SURROUND;
            }
        }

        /* DEBUG */ dump("Yulup:widget.js:WidgetHandler.doWidgetCommand: decided action = \"" + action + "\"\n");

        switch (action) {
            case WidgetHandler.ACTION_INSERT:
                /* DEBUG */ dump("Yulup:widget.js:WidgetHandler.doWidgetCommand: insert\n");

                fragment = this.__getWidgetFragment(widget, widget.insert);

                if (fragment)
                    view.doInsertCommand(aCommand, fragment);

                break;
            case WidgetHandler.ACTION_SURROUND:
                /* DEBUG */ dump("Yulup:widget.js:WidgetHandler.doWidgetCommand: surround\n");

                if (view.isUnsurround(widget.surround.fragment)) {
                    view.doUnsurroundCommand(aCommand, widget.surround.fragment);
                } else {
                    fragment = this.__getWidgetFragment(widget, widget.surround);

                    if (fragment)
                        view.doSurroundCommand(aCommand, fragment);
                }

                break;
            default:
        }
    },

    /**
     * Get the fragment for the given widget. If neccessary,
     * the user is first asked to configure the fragment.
     *
     * Note that this method returns null if the user cancels
     * the fragment configuration.
     *
     * @param  {NeutronWidgetAction} aWidgetAction  the widget for which the fragment should be retrieved
     * @return {nsIDOMDocumentFragment} returns the parameterised fragment or null if potential user interaction was canceled
     */
    __getWidgetFragment: function (aWidget, aWidgetAction) {
        var origFragment = null;
        var fragment     = null;

        /* DEBUG */ YulupDebug.ASSERT(aWidgetAction != null);

        /* DEBUG */ dump("Yulup:widget.js:WidgetHandler.__getWidgetFragment() invoked\n");

        if (aWidgetAction.parameters && aWidgetAction.fragment) {
            if ((fragment = WidgetHandler.getParametrizedWidgetFragment(aWidget, aWidgetAction)) == null) {
                return null;
            } else {
                return this.tidyWidgetFragment(fragment);
            }
        } else {
            if (aWidgetAction.fragment) {
                return this.tidyWidgetFragment(aWidgetAction.fragment);
            } else {
                return null;
            }
        }
    },

    activateCommand: function (aCommand) {
        /* DEBUG */ YulupDebug.ASSERT(aCommand != null);

        /* DEBUG */ dump("Yulup:widget.js:WidgetHandler.activateCommand(\"" + aCommand.getAttribute("id") + "\") invoked\n");

        // hack to refire command update
        aCommand.removeAttribute("active");

        // mark command as enabled
        aCommand.setAttribute("active", "true");
        aCommand.setAttribute("checked", "true");
    },

    deactivateCommand: function (aCommand) {
        /* DEBUG */ YulupDebug.ASSERT(aCommand != null);

        /* DEBUG */ dump("Yulup:widget.js:WidgetHandler.deactivateCommand(\"" + aCommand.getAttribute("id") + "\") invoked\n");

        aCommand.removeAttribute("active");
        aCommand.setAttribute("checked", "false");
    },

    updateCommandActiveStates: function (aWidgetCommandList, aElemNameList) {
        var elemNameMap = null;

        /* DEBUG */ YulupDebug.ASSERT(aWidgetCommandList != null);
        /* DEBUG */ YulupDebug.ASSERT(aElemNameList      != null);

        /* DEBUG */ dump("Yulup:widget.js:WidgetHandler.updateCommandActiveStates() invoked\n");

        elemNameMap = {};

        for (var i = 0; i < aElemNameList.length; i++) {
            elemNameMap[aElemNameList[i].name] = true;
        }

        // check all commands
        for (var elemName in aWidgetCommandList) {
            if (elemNameMap.hasOwnProperty(elemName)) {
                WidgetHandler.activateCommand(aWidgetCommandList[elemName]);
            } else {
                WidgetHandler.deactivateCommand(aWidgetCommandList[elemName]);
            }
        }
    },

    viewChangedHandler: function (aView) {
        var commandList = null;

        /* DEBUG */ YulupDebug.ASSERT(aView != null);

        /* DEBUG */ dump("Yulup:widget.js:WidgetHandler.viewChangedHandler() invoked\n");

        commandList = aView.controller.widgetManager.surroundCommandList;

        // deselect all widgets
        for (var elemName in commandList) {
            WidgetHandler.deactivateCommand(commandList[elemName]);
        }

        // update all widgets if the view supports reading the DOM
        if ("getNodesToRoot" in aView)
            WidgetHandler.updateCommandActiveStates(commandList, aView.getNodesToRoot(aView.view.selection));
    }
};
