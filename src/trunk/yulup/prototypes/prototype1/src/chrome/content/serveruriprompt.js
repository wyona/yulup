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

const YULUP_SERVER_URI_DIALOG_CHROME_URI = "chrome://yulup/content/serveruriprompt.xul";

const SERVERURIPROMPT_FORM_HISTORY_ID = "yulup-serveruriprompt";

var ServerURIPrompt = {
    onLoadHandler: function () {
        /* DEBUG */ dump("Yulup:serveruriprompt.js:ServerURIPrompt.onLoadHandler() invoked\n");
    },

    /**
     * Show the server URI prompt dialog.
     *
     * @return {String} the server URI entered by the user (not checked for validity)
     */
    showServerURIDialog: function () {
        var returnObject   = null;

        /* DEBUG */ dump("Yulup:serveruriprompt.js:ServerURIPrompt.showServerURIDialog() invoked\n");

        returnObject = {
            serverURI: null
        };

        window.openDialog(YULUP_SERVER_URI_DIALOG_CHROME_URI, "yulupServerURIDialog", "modal,resizable=no", returnObject);

        return returnObject.serverURI;
    },

    returnServerURI: function () {
        var returnObject = null;

        returnObject = window.arguments[0];

        if (returnObject) {
            returnObject.serverURI = document.getElementById("uiYulupServerURIPromptTextBox").value;

            ServerURIPrompt.addToFormHistory(returnObject.serverURI);
        }

        return true;
    },

    cancelDialog: function () {
        var returnObject = null;

        returnObject = returnObject = window.arguments[0];

        if (returnObject) {
            returnObject.serverURI = null;
        }

        return true;
    },

    /**
    * Add the textbox value to the form-history
    *
    * @param  {String}    aValue the value to store on the form history
    * @return {Undefined} does not have a return value
    */
    addToFormHistory: function (aValue) {
        var formHistory = null;

        /* DEBUG */ dump("Yulup:serveruriprompt.js:ServerURIPrompt.addToFormHistory(\"" + aValue + "\") invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aValue != null);

        if (aValue && aValue != "") {
            // get a handle on the form-history component
            formHistory = Components.classes["@mozilla.org/satchel/form-history;1"].getService(Components.interfaces.nsIFormHistory);

            formHistory.addEntry(SERVERURIPROMPT_FORM_HISTORY_ID, aValue);
        }
    }
};
