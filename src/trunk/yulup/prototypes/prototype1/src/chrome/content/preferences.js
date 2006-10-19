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

const YULUP_THEME_CHROME_URI = "chrome://yulup/skin/icons/themes";

var PreferencesDialog = {
    /**
     * Initialise the dialog.
     *
     * @return {Undefined} does not have a return value
     */
    onLoadHandler: function () {
        var menulist         = null;
        var ioService        = null;
        var chromeRegistry   = null;
        var fileURI          = null;
        var file             = null;
        var dirEntries       = null;
        var themeDirectory   = null;
        var themeID          = null;
        var themeValue       = null;
        var selectedItem     = null;

        /* DEBUG */ dump("Yulup:preferences.js:PreferencesDialog.onLoadHandler() invoked\n");

        menulist = document.getElementById("uiEditorThemeMenulist");

        // discover all available themes
        try {
            ioService      = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);
            chromeRegistry = Components.classes["@mozilla.org/chrome/chrome-registry;1"].getService(Components.interfaces.nsIChromeRegistry);

            fileURI = chromeRegistry.convertChromeURL(ioService.newURI(YULUP_THEME_CHROME_URI, null, null));

            /* DEBUG */ dump("Yulup:preferences.js:PreferencesDialog.onLoadHandler: fileURI.spec = \"" + fileURI.spec + "\"\n");

            file = fileURI.QueryInterface(Components.interfaces.nsIFileURL).file;

            /* DEBUG */ dump("Yulup:preferences.js:PreferencesDialog.onLoadHandler: file = \"" + file + "\"\n");

            if (file.isDirectory()) {
                dirEntries = file.directoryEntries;

                while (dirEntries.hasMoreElements()) {
                    themeDirectory = dirEntries.getNext().QueryInterface(Components.interfaces.nsIFile);

                    /* DEBUG */ dump("Yulup:preferences.js:PreferencesDialog.onLoadHandler: theme dir entry = \"" + themeDirectory.leafName + "\"\n");

                    if (themeDirectory.isDirectory) {
                        menulist.appendItem(themeDirectory.leafName, themeDirectory.leafName.toLowerCase(), null);
                    }
                }
            }
        } catch (exception) {
            /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:preferences.js:PreferencesDialog.onLoadHandler", exception);
            /* DEBUG */ Components.utils.reportError(exception);
        }

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

        // install preference connectors
        menulist.setAttribute("preference", "pref_theme");

        // enable preferences
        menulist.removeAttribute("disabled");
    }
};
