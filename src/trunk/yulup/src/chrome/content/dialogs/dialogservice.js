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

const YULUP_ENUM_DIALOG_CHROME_URI = "chrome://yulup/content/dialogs/enumselectdialog.xul";

const YulupDialogService = {
    openEnumDialog: function (aTitle, aDescription, aEnumLabels, aPreselect) {
        var returnObject = null;

        /* DEBUG */ dump("Yulup:dialogservice.js:YulupDialogService.openEnumDialog() invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aTitle       != null);
        /* DEBUG */ YulupDebug.ASSERT(aDescription != null);
        /* DEBUG */ YulupDebug.ASSERT(aEnumLabels  != null);
        /* DEBUG */ YulupDebug.ASSERT(aPreselect   != null);
        /* DEBUG */ YulupDebug.ASSERT(aPreselect   <= aEnumLabels.length);

        returnObject = {
            returnValue: null
        };

        window.openDialog(YULUP_ENUM_DIALOG_CHROME_URI, "yulupEnumSelectDialog", "modal,resizable=no,centerscreen",
                          returnObject, aTitle, aDescription, aEnumLabels, aPreselect);

        return returnObject.returnValue;
    },

    enumDialogOnLoad: function () {
        var title       = null;
        var description = null;
        var labels      = null;
        var preselect   = null;
        var radioGroup  = null;

        /* DEBUG */ dump("Yulup:dialogservice.js:YulupDialogService.enumDialogOnLoad() invoked\n");

        title       = window.arguments[1];
        description = window.arguments[2];
        labels      = window.arguments[3];
        preselect   = window.arguments[4];

        // set the dialog title
        document.documentElement.setAttribute("title", title);

        // set the description
        document.getElementById("uiEnumDescription").value = description;

        // construct the radiogroup
        radioGroup = document.getElementById("uiEnumSelectRadiogroup");

        for (var i = 0; i < labels.length; i++)
            radioGroup.appendItem(labels[i]);

        // select one of the radiobuttons
        radioGroup.selectedIndex = preselect;
    },

    enumDialogOnAccept: function () {
        var returnObject = null;

        /* DEBUG */ dump("Yulup:dialogservice.js:YulupDialogService.enumDialogOnAccept() invoked\n");

        returnObject = window.arguments[0];

        returnObject.returnValue = document.getElementById("uiEnumSelectRadiogroup").selectedIndex;
    }
};
