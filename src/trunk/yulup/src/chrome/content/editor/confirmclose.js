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
 * @author Andreas Wuest
 *
 */

var gSelectedItem = null;

var ConfirmClose = {
    uiYulupEditorConfirmCloseOnDialogLoadHandler: function () {
        var uiSaveMenulist  = null;
        var applicableItems = null;

        /* DEBUG */ dump("Yulup:confirmclose.js:ConfirmClose.uiYulupEditorConfirmCloseOnDialogLoadHandler.save() invoked\n");

        // retrieve applicable items list
        applicableItems = window.arguments[1];

        // get a handle on the menulist
        uiSaveMenulist = document.getElementById('uiYulupEditorConfirmCloseMenulist');

        // set default item
        uiSaveMenulist.value = "saveaslocal";
        gSelectedItem = uiSaveMenulist.value;

        // activate the menu items which are applicable to the current doucment
        for (var i = 0; i < applicableItems.length; i++) {
            switch (applicableItems[i]) {
                case "save":
                    document.getElementById('uiYulupEditorConfirmCloseMenulist').removeAttribute("disabled");
                    break;
                case "savetemp":
                    document.getElementById('uiYulupEditorConfirmCloseSaveTempMenuitem').removeAttribute("disabled");
                    break;
                case "savecms":
                    document.getElementById('uiYulupEditorConfirmCloseSaveCMSMenuitem').removeAttribute("disabled");
                    break;
                case "checkincms":
                    document.getElementById('uiYulupEditorConfirmCloseCheckinCMSMenuitem').removeAttribute("disabled");
                    break;
                case "saveascms":
                    document.getElementById('uiYulupEditorConfirmCloseSaveAsCMSMenuitem').removeAttribute("disabled");
                    break;
                default:
                    /* DEBUG */ dump("Yulup:confirmclose.js:ConfirmClose.uiYulupEditorConfirmCloseOnDialogLoadHandler.save: \"" + applicableItems[i] + "\" is not an applicable item\n");
                    throw new YulupEditorException("Yulup:confirmclose.js:ConfirmClose.uiYulupEditorConfirmCloseOnDialogLoadHandler.save: \"" + applicableItems[i] + "\" is not an applicable item.");
            }
        }
    },

    onMenulistCommandListener: function () {
        var uiSaveMenulist = null;

        /* DEBUG */ dump("Yulup:confirmclose.js:ConfirmClose.onMenulistCommandListener.save() invoked\n");

        uiSaveMenulist = document.getElementById('uiYulupEditorConfirmCloseMenulist');
        gSelectedItem = uiSaveMenulist.value;
    },

    save: function () {
        /* DEBUG */ dump("Yulup:confirmclose.js:ConfirmClose.save() invoked\n");

        returnObject = window.arguments[0];
        returnObject.returnValue = gSelectedItem;

        /* DEBUG */ dump("Yulup:confirmclose.js:ConfirmClose.save: returnObject.returnValue: \"" + returnObject.returnValue + "\"\n");

        return true;
    }
};
