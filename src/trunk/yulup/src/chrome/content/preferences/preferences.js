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
        /* DEBUG */ dump("Yulup:preferences.js:PreferencesDialog.onLoadHandler() invoked\n");

        // populate the charset list
        this.__populateCharsetList(document.getElementById("uiGeneralDefaultCharsetMenulist"), document.getElementById("pref_general_defaultcharset").value);

        // install keypress handler for input validation
        document.getElementById("uiEditorTabspacesTextbox").inputField.addEventListener("keypress", PreferencesDialog.spacesTextboxKeypressHandler, false);
    },

    selectDirectory: function () {
        var target     = null;
        var filePicker = null;

        /* DEBUG */ dump("Yulup:preferences.js:PreferencesDialog.selectFolder() invoked\n");

        // open file picker dialog for local file system
        filePicker = Components.classes["@mozilla.org/filepicker;1"].createInstance(Components.interfaces.nsIFilePicker);

        filePicker.init(window, document.getElementById("uiYulupPrefWindowStringbundle").getString("generalWorkspaceFilePicker.title"), Components.interfaces.nsIFilePicker.modeGetFolder);

        if (filePicker.show() == Components.interfaces.nsIFilePicker.returnOK) {
            // cast nsIFileURL to nsIURI
            target = filePicker.fileURL;
            target.QueryInterface(Components.interfaces.nsIURI);

            /* DEBUG */ dump("Yulup:preferences.js:PreferencesDialog.selectFolder: selected target: \"" + target.spec + "\"\n");

            document.getElementById("pref_general_workspace_location").value = target.spec;
        }
    },

    spacesTextboxKeypressHandler: function (aEvent) {
        /* DEBUG */ dump("Yulup:preferences.js:PreferencesDialog.spacesTextboxKeypressHandler(\"" + aEvent + "\") invoked\n");

        if (aEvent.keyCode == 0) {
            switch (String.fromCharCode(aEvent.charCode)) {
                case "0": case "1": case "2": case "3": case "4": case "5": case "6": case "7": case "8": case "9":
                    // allow
                    break;
                default:
                    // cancel the keypress
                    aEvent.preventDefault();
            }
        }
    },

    __populateCharsetList: function (aMenuList, aCurrentCharset) {
        var charsetArray = [];
        var charsetStringBundle = YulupLocalisationServices.getStringBundle("chrome://global/locale/charsetTitles.properties");

        var charsets = charsetStringBundle.getSimpleEnumeration();

        while (charsets.hasMoreElements()) {
            var elem = charsets.getNext().QueryInterface(Components.interfaces.nsIPropertyElement);

            if (elem.key.indexOf("chardet.") == 0 || elem.key.indexOf("x-user-defined") == 0)
                continue;

            charsetArray.push(elem);
        }

        // sort charsets by value
        var localeService = Components.classes["@mozilla.org/intl/nslocaleservice;1"].getService(Components.interfaces.nsILocaleService);
        var locale = localeService.newLocale(YulupAppServices.getAppLocale());

        var collationFactory = Components.classes["@mozilla.org/intl/collation-factory;1"].getService(Components.interfaces.nsICollationFactory);
        var collation = collationFactory.CreateCollation(locale);
        collation.initialize(locale);

        charsetArray.sort(function (aItemA, aItemB) {
                return collation.compareString(Components.interfaces.nsICollation.kCollationStrengthDefault, aItemA.value, aItemB.value);
            });

        for (var i = 0; i < charsetArray.length; i++) {
            aMenuList.appendItem(charsetArray[i].value, charsetArray[i].key.substring(0, charsetArray[i].key.indexOf(".")), null);
        }

        // select menuitem per current pref
        aMenuList.value = aCurrentCharset;
    }
};
