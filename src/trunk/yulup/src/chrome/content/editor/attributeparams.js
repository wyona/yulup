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

const YULUP_PARAMS_DIALOG_CHROME_URI = "chrome://yulup/content/editor/attributeparamsdialog.xul";

//const DEFAULT_COLORPICKER_VALUE = "#FFFFFF";

var AttributeParamsDialog = {
    __attributes: null,

    uiOnDialogLoadHandler: function() {
        var attributes        = null;
        var editorController  = null;
        var dialogDescription = null;
        var attributeObject   = null;
        var paramsRows        = null;
        var description       = null;
        var label             = null;
        var elem              = null;
        var row               = null;
        var container         = null;
        var textbox           = null;

        /* DEBUG */ dump("Yulup:attributeparams.js:AttributeParamsDialog.uiOnDialogLoadHandler() invoked\n");

        attributes        = window.arguments[1];
        editorController  = window.arguments[2];
        dialogDescription = window.arguments[3];

        AttributeParamsDialog.__attributes = attributes;

        paramsRows = document.getElementById("uiYulupParamsRows");
        description = document.getElementById("uiYulupParamsDescription");

        // set the dialog top-label
        description.setAttribute("value", description.getAttribute("value") + " \"" + dialogDescription + "\"");

        for (var i = 0; i < attributes.length; i++) {

            attributeObject = attributes.getObject(i);

            if (!attributeObject)
                continue;

            row = document.createElement("row");
            row.setAttribute("id", "row" + i);
            row.setAttribute("align", "center");
            paramsRows.appendChild(row);

            elem = document.createElement("label");
            elem.setAttribute("control", attributeObject.name);
            elem.setAttribute("value", attributeObject.name);
            row.appendChild(elem);

            container = document.createElement("hbox");
            container.setAttribute("align", "center");
            row.appendChild(container);

            textbox = document.createElement("textbox");
            textbox.setAttribute("id", attributeObject.name);
            textbox.setAttribute("size", "30");
            textbox.setAttribute("flex", "1");

            // set the attribute default value
            if (attributeObject.currentValue) {
                textbox.setAttribute("value", attributeObject.currentValue);
            } else if (attributeObject.defaultValue) {
                textbox.setAttribute("value", attributeObject.defaultValue);
            }

            container.appendChild(textbox);

            // add a type specific action button
            switch (attributeObject.type) {
                case "resource":
                    elem = document.createElement("button");
                    elem.setAttribute("id", "button" + attributeObject.name);
                    elem.setAttribute("label", document.getElementById("uiYulupEditorStringbundle").getString("editorWidgetInsertSelect.label"));

                    // the resource attribute type needs a sitetree URI
                    // TODO: get sitetree from controller
                    if (sitetreeURI == null) {
                        elem.setAttribute("disabled", "true");
                    } else {
                        elem.setAttribute("oncommand", "ResourceSelectDialog.doSelectCommand(\"" + sitetreeURI.spec + "\", \"" + attributeObject.name + "\")");
                    }

                    container.appendChild(elem);

                    break;
                case "color":
                    elem = document.createElement("colorpicker");
                    elem.setAttribute("id", "colorpicker" + attributeObject.name);
                    elem.setAttribute("type", "button");
                    elem.setAttribute("onchange", "AttributeParamsDialog.updateColorTextbox(\"" + attributeObject.name + "\", this.color)");

                    container.appendChild(elem);

                    textbox.setAttribute("maxlength", "7");
                    textbox.setAttribute("onchange", "AttributeParamsDialog.updateColorPicker(\"colorpicker" + attributeObject.name + "\", \"" + attributeObject.name + "\", this.value)");

                    // fixup color if we have to
                    if (WidgetDialog.__isValidColorValue(textbox.getAttribute("value"))) {
                        textbox.value = textbox.value.toUpperCase();
                    } else {
                        textbox.value = DEFAULT_COLORPICKER_VALUE;
                    }

                    window.setTimeout("document.getElementById(\"colorpicker" + attributeObject.name + "\").color = \"" + textbox.value + "\"", 0);

                    break;
                default:
            }
        }
    },

    showAttributeParamsDialog: function(aAttributes, aController, aDescription) {
        var returnObject = null;

        /* DEBUG */ YulupDebug.ASSERT(aAttributes  != null);
        /* DEBUG */ YulupDebug.ASSERT(aController  != null);
        /* DEBUG */ YulupDebug.ASSERT(aDescription != null);

        /* DEBUG */ dump("Yulup:attributeparams.js:AttributeParamsDialog.showAttributeParamsDialog(\"" + aAttributes + "\", \"" + aController + "\", \"" + aDescription + "\") invoked\n");

        returnObject = new Object();

        if (window.openDialog(YULUP_PARAMS_DIALOG_CHROME_URI, "yulupEditorAttributeParamsDialog", "modal,resizable=no,centerscreen", returnObject, aAttributes, aController, aDescription)) {
            if (returnObject.returnValue) {
                return returnObject.returnValue;
            }
        }

        return null;
    },

    save: function () {
        var field = null;

        /* DEBUG */ dump("Yulup:attributeparams.js:AttributeParamsDialog.save() invoked\n");

        returnObject = window.arguments[0];

        returnObject.returnValue = new Array();

        for (var i = 0; i < AttributeParamsDialog.__attributes.length; i++) {
            attribute = AttributeParamsDialog.__attributes.getObject(i);
            valueElem = document.getElementById(attribute.name);

            returnObject.returnValue.push({ attribute: attribute, value: valueElem.value });
        }

        /* DEBUG */ dump("Yulup:attributeparams.js:AttributeParamsDialog.save: returnObject.returnValue.length = \"" + returnObject.returnValue.length + "\"\n");

        return true;
    },

    updateColorTextbox: function (aTextBoxID, aValue) {
        var textbox = null;

        /* DEBUG */ dump("Yulup:attributeparams.js:AttributeParamsDialog.updateColorTextbox(\"" + aTextBoxID + "\", \"" + aValue + "\") invoked\n");

        if ((textbox = document.getElementById(aTextBoxID)) != null) {
            textbox.value = aValue;
        }
    },

    updateColorPicker: function (aColorPickerID, aTextBoxID, aValue) {
        var colorpicker = null;
        var textbox     = null;

        /* DEBUG */ dump("Yulup:attributeparams.js:AttributeParamsDialog.updateColorPicker(\"" + aColorPickerID + "\", \"" + aValue + "\") invoked\n");

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

        /* DEBUG */ dump("Yulup:attributeparams.js:AttributeParamsDialog.__isValidColorValue(\"" + aColor + "\") invoked\n");

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
            /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:attributeparams.js:AttributeParamsDialog.__isValidColorValue", exception);
            /* DEBUG */ Components.utils.reportError(exception);
        }

        return retval;
    }
};
