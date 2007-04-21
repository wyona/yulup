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

const YULUP_WIDGET_INSERT_CHROME_URI   = "chrome://yulup/content/editor/widgets/widgetparamsdialog.xul";

const DEFAULT_COLORPICKER_VALUE = "#FFFFFF";

var WidgetDialog = {
    __fragmentAttributes: null,
    __sitetreeURI       : null,
    __editorController  : null,
    __topWindow         : null,

    uiYulupEditorWidgetInsertOnDialogLoadHandler: function() {
        var widget           = null;
        var widgetAction     = null;
        var nsResolver       = null;
        var widgetRows       = null;
        var label            = null;
        var elem             = null;
        var messageProxy     = null;
        var row              = null;
        var container        = null;
        var textbox          = null;
        var stringBundle     = null;

        /* DEBUG */ dump("Yulup:widgetparams.js:WidgetDialog.uiYulupEditorWidgetInsertOnDialogLoadHandler() invoked\n");

        widget                  = window.arguments[1];
        widgetAction            = window.arguments[2]
        nsResolver              = window.arguments[3];
        this.__editorController = window.arguments[4];
        this.__topWindow        = window.arguments[5];

        if (this.__editorController.editorParams.navigation && this.__editorController.editorParams.navigation.sitetree) {
            this.__sitetreeURI = this.__editorController.editorParams.navigation.sitetree.uri;
        }

        WidgetDialog.__fragmentAttributes = widgetAction.parameters;

        widgetRows = document.getElementById("uiYulupEditorWidgetInsertRows");
        label      = document.getElementById("uiYulupWidgetInsertAuthenticationLabel");

        // set the dialog top-label
        label.setAttribute("value", label.getAttribute("value") + " \"" + widget.name + "\"");

        stringBundle = YulupLocalisationServices.getStringBundle("chrome://yulup/locale/parameterisation.properties");

        for (var i=0; i < widgetAction.parameters.length; i++) {
            row = document.createElement("row");
            row.setAttribute("id", "row" + i);
            row.setAttribute("align", "center");
            widgetRows.appendChild(row);

            elem = document.createElement("label");
            elem.setAttribute("control", widgetAction.parameters[i].id);
            elem.setAttribute("value", widgetAction.parameters[i].name);
            row.appendChild(elem);

            container = document.createElement("hbox");
            container.setAttribute("align", "center");
            row.appendChild(container);

            textbox = document.createElement("textbox");
            textbox.setAttribute("id", widgetAction.parameters[i].id);
            textbox.setAttribute("size", "30");
            textbox.setAttribute("flex", "1");

            // set the attribute default value
            textbox.setAttribute("value", widgetAction.fragment.evaluate(widgetAction.parameters[i].xpath, widgetAction.fragment, nsResolver, XPathResult.STRING_TYPE, null).stringValue);
            container.appendChild(textbox);

            // add a type specific action button
            switch (widgetAction.parameters[i].type) {
                case "resource":
                    elem = document.createElement("resourceselector");
                    elem.setAttribute("label", stringBundle.GetStringFromName("resourceSelector.label"));

                    if (this.__sitetreeURI == null) {
                        elem.setAttribute("disabled", "true");
                    } else {
                        messageProxy = new YulupMessageProxy(elem);
                        elem.proxy = messageProxy;

                        messageProxy.dispatchMessage("addItem", [stringBundle.GetStringFromName("localSelector.label"), "WidgetDialog.doSelectCommandProxy(0, " + widgetAction.parameters[i].id + ")"]);
                        messageProxy.dispatchMessage("addItem", [stringBundle.GetStringFromName("remoteSelector.label"), "WidgetDialog.doSelectCommandProxy(1, " + widgetAction.parameters[i].id + ")"]);
                    }

                    container.appendChild(elem);

                    break;
                case "color":
                    elem = document.createElement("colorpicker");
                    elem.setAttribute("id", "colorpicker" + widgetAction.parameters[i].id);
                    elem.setAttribute("type", "button");
                    elem.setAttribute("onchange", "WidgetDialog.updateColorTextbox(\"" + widgetAction.parameters[i].id + "\", this.color)");

                    container.appendChild(elem);

                    textbox.setAttribute("maxlength", "7");
                    textbox.setAttribute("onchange", "WidgetDialog.updateColorPicker(\"colorpicker" + widgetAction.parameters[i].id + "\", \"" + widgetAction.parameters[i].id + "\", this.value)");

                    // fixup color if we have to
                    if (WidgetDialog.__isValidColorValue(textbox.getAttribute("value"))) {
                        textbox.value = textbox.value.toUpperCase();
                    } else {
                        textbox.value = DEFAULT_COLORPICKER_VALUE;
                    }

                    window.setTimeout("document.getElementById(\"colorpicker" + widgetAction.parameters[i].id + "\").color = \"" + textbox.value + "\"", 0);

                    break;
                default:
            }
        }
    },

    /**
     * Shows the widget parameterisation dialog.
     *
     * @param  {NeutronWidget}         aWidget            the widget to parameterise
     * @param  {NeutronWidgetAction}   aWidgetAction      the widget action
     * @param  {nsIDOMXPathNSResolver} aNSResolver        a namespace resolver for this widget
     * @param  {YulupEditController}   aEditorController  an editor controller
     * @param  {nsIDOMWindow}          aWindow            a handle to a non-modal window
     * @return {Undefined}  does not have a return value
     */
    showWidgetInsertDialog: function(aWidget, aWidgetAction, aNSResolver, aEditorController, aWindow) {
        var returnObject = null;

        returnObject = new Object();

        if (window.openDialog(YULUP_WIDGET_INSERT_CHROME_URI, "yulupWidgetInsertDialog", "modal,resizable=no,centerscreen", returnObject, aWidget, aWidgetAction, aNSResolver, aEditorController, aWindow)) {
            if (returnObject.returnValue) {
                return returnObject.returnValue;
            }
        }

        return null;
    },

    save: function () {
        var field = null;

        /* DEBUG */ dump("Yulup:widgetparams.js:WidgetDialog.save() invoked\n");

        returnObject = window.arguments[0];

        returnObject.returnValue = new Array();

        for (var i=0; i < WidgetDialog.__fragmentAttributes.length; i++) {
            returnObject.returnValue[WidgetDialog.__fragmentAttributes[i].id] = document.getElementById(WidgetDialog.__fragmentAttributes[i].id).value;

            /* DEBUG */ dump("Yulup:widgetparams.js:WidgetDialog.save: " + WidgetDialog.__fragmentAttributes[i].id + " " + returnObject.returnValue[WidgetDialog.__fragmentAttributes[i].id] + "\n");
        }

        return true;
    },

    updateColorTextbox: function (aTextBoxID, aValue) {
        var textbox = null;

        /* DEBUG */ dump("Yulup:widgetparams.js:WidgetDialog.updateColorTextbox(\"" + aTextBoxID + "\", \"" + aValue + "\") invoked\n");

        if ((textbox = document.getElementById(aTextBoxID)) != null) {
            textbox.value = aValue;
        }
    },

    updateColorPicker: function (aColorPickerID, aTextBoxID, aValue) {
        var colorpicker = null;
        var textbox     = null;

        /* DEBUG */ dump("Yulup:widgetparams.js:WidgetDialog.updateColorPicker(\"" + aColorPickerID + "\", \"" + aValue + "\") invoked\n");

        if ((colorpicker = document.getElementById(aColorPickerID)) != null &&
            (textbox     = document.getElementById(aTextBoxID))     != null) {
            // check color value validity
            if (WidgetDialog.__isValidColorValue(aValue)) {
                colorpicker.color = aValue.toUpperCase();
            } else {
                colorpicker.color = DEFAULT_COLORPICKER_VALUE;
            }

            // propagate modified color back to textbox
            textbox.value = colorpicker.color;
        }
    },

    restoreDefaults: function () {
        // not implemented yet
    },

    __isValidColorValue: function (aColor) {
        var retval = false;
        var color  = null;

        /* DEBUG */ dump("Yulup:widgetparams.js:WidgetDialog.__isValidColorValue(\"" + aColor + "\") invoked\n");

        try {
            color = aColor.toUpperCase();

            if (color.length == 7 && color[0] === "#") {
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
            /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:widgetparams.js:WidgetDialog.__isValidColorValue", exception);
            /* DEBUG */ Components.utils.reportError(exception);
        }

        return retval;
    },

    doSelectCommandProxy: function (aAction, aFieldID) {
        var documentURI = null;
        var value       = null;
        var uri         = null;

        documentURI = this.__editorController.document.loadURI;

        switch (aAction) {
            case 0:
                value = this.doSelectFromLocal(this.__sitetreeURI, this.__topWindow, documentURI);
                break;
            case 1:
                value = this.doSelectFromRemote(this.__sitetreeURI);
                break;
            default:
        }

        if (value) {
            try {
                // try to make the returned URI relative to the document URI
                if (documentURI) {
                    uri = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService).newURI(value, null, null);

                    value = YulupURIServices.makeRelative(uri, documentURI);
                }
            } catch (exception) {
                /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:widgetparams.js:WidgetDialog.doSelectCommandProxy", exception);
                /* DEBUG */ Components.utils.reportError(exception);
            }

            document.getElementById(aFieldID).setAttribute("value", value);
        }
    },

    /**
     * Selects a local asset and performs upload if needed.
     *
     * @param  {nsIURI}       aSitetreeURI  the URI of the sitetree
     * @param  {nsIDOMWindow} aWindow       a handle to a non-modal window
     * @param  {nsIURI}       aDocumentURI  the URI which an upload should potentially be made relative against
     * @return {String}  returns the URI of the selected asset or null if the selection was aborted
     */
    doSelectFromLocal: function (aSitetreeURI, aWindow, aDocumentURI) {
        var localFileURI   = null;
        var stringBundle   = null;
        var enumLabels     = null;
        var objectTarget   = null;
        var progressDialog = null;
        var mimeType       = null;
        var sourceFile     = null;
        var uploadURI      = null;

        /* DEBUG */ dump("Yulup:widgetparams.js:WidgetDialog.doSelectFromLocal() invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aSitetreeURI != null);
        /* DEBUG */ YulupDebug.ASSERT(aWindow      != null);

        // select from local
        localFileURI = PersistenceService.queryOpenFileURI(PersistenceService.FILETYPE_BINARY);

        if (!localFileURI)
            return null;

        stringBundle = YulupLocalisationServices.getStringBundle("chrome://yulup/locale/parameterisation.properties");

        // find out where to place the local resource
        if (aDocumentURI) {
            enumLabels = [stringBundle.GetStringFromName("nearDocument.label"),
                          stringBundle.GetStringFromName("selectManually.label")];

            if ((objectTarget = YulupDialogService.openEnumDialog(stringBundle.GetStringFromName("selectTarget.label"), stringBundle.GetStringFromName("selectTargetDescription.label"), enumLabels, 0)) == null)
                return null;
        } else {
            // we don't have a document URI, so we have to find the upload location manually anyways
            objectTarget = 1;
        }

        switch (objectTarget) {
            case 0:
                // upload the object relative to the document URI
                uploadURI = YulupURIServices.resolveRelative(aDocumentURI, localFileURI.file.leafName);

                break;
            case 1:
                // query for the upload location
                uploadURI = ResourceUploadDialog.showDocumentUploadDialog(aSitetreeURI, localFileURI.file.leafName);

                if (!uploadURI)
                    return null;

                break;
           default:
               return null;
        }

        // upload the object
        // TODO: perform i18n via stringbundle loader
        progressDialog = new ProgressDialog(aWindow, document.getElementById("uiYulupOverlayStringbundle").getString("yulupResourceUploadProgressDialogTitle.label"), uploadURI);

        // figure out MIME type
        mimeType = YulupContentServices.getContentTypeFromURI(localFileURI);

        sourceFile = PersistenceService.getFileDescriptor(localFileURI.path);

        // TODO: after closing the dialog, the download dies
        NetworkService.httpRequestUploadFile(uploadURI, sourceFile, null, mimeType, ResourceUploadDialog.__uploadRequestFinishedHandler, ResourceUploadDialog.__resourceUploadFinished, false, true, progressDialog);

        /* DEBUG */ dump("Yulup:widgetparams.js:WidgetDialog.doSelectFromLocal: asset URI is \"" + uploadURI + "\"\n");

        return uploadURI;
    },

    /**
     * Selects a remote asset.
     *
     * @param  {nsIURI} aSitetreeURI  the URI of the sitetree
     * @return {String}  returns the URI of the selected asset or null if the selection was aborted
     */
    doSelectFromRemote: function (aSitetreeURI) {
        var targetURI = null;

        /* DEBUG */ dump("Yulup:widgetparams.js:WidgetDialog.doSelectFromRemote() invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aSitetreeURI != null);

        // select from remote
        targetURI = ResourceSelectDialog.showResourceSelectDialog(aSitetreeURI);

        if (!targetURI)
            return null;

        /* DEBUG */ dump("Yulup:widgetparams.js:WidgetDialog.doSelectFromRemote: asset URI is \"" + targetURI.spec + "\"\n");

        return targetURI.spec;
    }
};
