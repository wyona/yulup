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

var PreferencesDialog = {
    /**
     * Initialise the dialog.
     *
     * @return {Undefined} does not have a return value
     */
    onLoadHandler: function () {
        var menulist         = null;
        var fileProtoHandler = null;
        var file             = null;
        var themeID          = null;
        var themeValue       = null;
        var selectedItem     = null;

        /* DEBUG */ dump("Yulup:preferences.js:PreferencesDialog.onLoadHandler() invoked\n");

        menulist = document.getElementById("uiEditorThemeMenulist");

        // get all available themes
        //fileProtoHandler = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService).getProtocolHandler("file").QueryInterface(Components.interfaces.nsIFileProtocolHandler);
        //file = fileProtoHandler.getFileFromURLSpec(YULUP_THEME_CHROME_URI);

        // get current theme
        if ((themeID = YulupPreferences.getCharPref("editor.", "theme")) != null) {
            themeValue = themeID.toLowerCase();
        } else {
            themeValue = "default";
        }

        // select current theme
        for (var i = 0; i < menulist.firstChild.childNodes.length; i++) {
            if (menulist.firstChild.childNodes[i].value == themeValue) {
                selectedItem = menulist.firstChild.childNodes[i];
                break;
            }
        }

        if (selectedItem) {
            menulist.selectedItem = selectedItem;
        } else {
            menulist.selectedIndex = 0;
        }

        // install theme menulist change handler
        menulist.addEventListener("ValueChange", PreferencesDialog.themeChangedHandler, false);

        // enable preferences
        menulist.removeAttribute("disabled");
    },

    themeChangedHandler: function (aEvent) {
        var value = null;

        /* DEBUG */ dump("Yulup:preferences.js:PreferencesDialog.themeChangedHandler(\"" + aEvent + "\") invoked\n");

        // get selected value
        value = document.getElementById("uiEditorThemeMenulist").selectedItem.value;

        // presist new value
        YulupPreferences.setCharPref("editor.", "theme", value);

        // we consumed this event
        aEvent.stopPropagation();
    }
};
