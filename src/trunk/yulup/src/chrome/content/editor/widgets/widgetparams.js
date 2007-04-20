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
    __topWindow         : null,

    uiYulupEditorWidgetInsertOnDialogLoadHandler: function() {
        var widget           = null;
        var widgetAction     = null;
        var nsResolver       = null;
        var editorController = null;
        var widgetRows       = null;
        var label            = null;
        var elem             = null;
        var row              = null;
        var container        = null;
        var textbox          = null;

        /* DEBUG */ dump("Yulup:widgetparams.js:WidgetDialog.uiYulupEditorWidgetInsertOnDialogLoadHandler() invoked\n");

        widget           = window.arguments[1];
        widgetAction     = window.arguments[2]
        nsResolver       = window.arguments[3];
        editorController = window.arguments[4];
        this.__topWindow = window.arguments[5];

        if (editorController.editorParams.navigation && editorController.editorParams.navigation.sitetree) {
            this.__sitetreeURI = editorController.editorParams.navigation.sitetree.uri;
        }

        WidgetDialog.__fragmentAttributes = widgetAction.parameters;

        widgetRows = document.getElementById("uiYulupEditorWidgetInsertRows");
        label      = document.getElementById("uiYulupWidgetInsertAuthenticationLabel");

        // set the dialog top-label
        label.setAttribute("value", label.getAttribute("value") + " \"" + widget.name + "\"");

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
                    elem = document.createElement("button");
                    elem.setAttribute("id", "button" + widgetAction.parameters[i].id);
                    elem.setAttribute("label", document.getElementById("uiYulupEditorStringbundle").getString("editorWidgetInsertSelect.label"));
                    elem.setAttribute("name", widgetAction.parameters[i].id);

                    // the resource attribute type needs a sitetree URI
                    if (this.__sitetreeURI == null) {
                        elem.setAttribute("disabled", "true");
                    } else {
                        elem.setAttribute("oncommand", "WidgetDialog.doSelectCommandProxy(this)");
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

    doSelectCommandProxy: function (aElement) {
        ResourceSelectDialog.doSelectCommand(this.__sitetreeURI, aElement.getAttribute("name"), this.__topWindow);
    }
};
