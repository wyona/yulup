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

const YULUP_AUTHENTICATION_CHROME_URI = "chrome://yulup/content/authenticationdialog.xul";

const AUTHENTICATION_PASSWORD_FIELD_IDENTIFIER = "password";
const AUTHENTICATION_FORM_HISTORY_ID           = "yulup";

const Authentication = {
    __authException: null,

    uiYulupEditorAuthenticationOnDialogLoadHandler: function () {
        var authException         = null;
        var uiAuthenticationLabel = null;
        var uiAuthenticationRows  = null;
        var elem                  = null;
        var field                 = null;

        Authentication.__authException = window.arguments[1];

        /* DEBUG */ dump("Yulup:authentication.js:Authentication.uiYulupEditorAuthenticationOnDialogLoadHandler() invoked: " + Authentication.__authException + "\n");

        uiAuthenticationLabel = document.getElementById('uiYulupEditorAuthenticationLabel');

        if (Authentication.__authException.infoMessage) {
            uiAuthenticationLabel.setAttribute("value", Authentication.__authException.infoMessage);
        }

        uiAuthenticationRows = document.getElementById('uiYulupEditorAuthenticationRows');

        // extend authenticationdialog.xul with the fields from the exception
        for (field in Authentication.__authException.params) {
            elem = document.createElement("row");
            elem.setAttribute("id", "row" + field);
            elem.setAttribute("align", "center");
            uiAuthenticationRows.appendChild(elem);

            elem = document.createElement("label");
            elem.setAttribute("control", field);
            elem.setAttribute("value", Authentication.__authException.params[field]);
            elem.setAttribute("flex", "1");
            document.getElementById("row" + field).appendChild(elem);

            elem = document.createElement("textbox");

            if (field.toLowerCase().indexOf(AUTHENTICATION_PASSWORD_FIELD_IDENTIFIER) > -1) {
                elem.setAttribute("type", "password");
            } else {
                // enable autocompletion for the non-password fields
                elem.setAttribute("type", "autocomplete");
                elem.setAttribute("autocompletesearchparam", AUTHENTICATION_FORM_HISTORY_ID);
                elem.setAttribute("autocompletesearch", "form-history");
                elem.setAttribute("completedefaultindex", "true");
                elem.setAttribute("forcecomplete", "true");
                elem.setAttribute("onchange", "Authentication.addToFormHistory('"+field+"')");
            }

            elem.setAttribute("id", field);
            elem.setAttribute("size", "30");
            elem.setAttribute("flex", "2")
            document.getElementById("row" + field).appendChild(elem);
        }
    },

   /**
    * Add the textbox value to the form-history
    *
    * @param  {String}    aField the id of the textbox element in authenticationdialog.xul
    * @return {Undefined} does not have a return value
    */
    addToFormHistory: function (aField) {
        var fieldValue  = null;
        var formHistory = null;

        /* DEBUG */ dump("Yulup:Authentication.js:Authentication.addToFormHistory(): invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aField != null);

        // get the value of the textbox element
        fieldValue = document.getElementById(aField).value;

        // get a handle on the form-history component
        formHistory = Components.classes["@mozilla.org/satchel/form-history;1"].getService(Components.interfaces.nsIFormHistory ? Components.interfaces.nsIFormHistory : Components.interfaces.nsIFormHistory2);

        formHistory.addEntry(AUTHENTICATION_FORM_HISTORY_ID, fieldValue);
    },

    save: function () {
        var returnObject = null;
        var field        = null;

        /* DEBUG */ dump("Yulup:authentication.js:Authentication.save() invoked\n");

        returnObject = window.arguments[0];
        returnObject.returnValue = new Array();

        /* DEBUG */ dump("Yulup:authentication.js:Authentication.save: returnObject.returnValue:\n" );
        for (field in Authentication.__authException.params) {
            returnObject.returnValue[field] = document.getElementById(field).value;
            /* DEBUG */ dump(field + " " + returnObject.returnValue[field] + "\n");
        }

        return true;
    },

   /**
    * Show the authentication dialog
    *
    * @param  {NeutronAuthException} aException
    * @return {Array} associative array with the dialog fields or null if cancel was selected
    */
    showAuthenticationDialog: function (aException) {
        returnObject = new Object();

        /* DEBUG */ YulupDebug.ASSERT(aException != null);

        if (window.openDialog(YULUP_AUTHENTICATION_CHROME_URI, "yulupEditorAuthenticationDialog", "modal,resizable=no,centerscreen", returnObject, aException)) {
            if (returnObject.returnValue) {
                return returnObject.returnValue;
            }
        }

        return null;
    },

    reportAuthenticationFailure: function (aRealm, aMessage) {
        if (aMessage) {
            alert("Realm \"" + aRealm + "\":\n" + aMessage);
        } else {
            alert(document.getElementById("uiYulupAuthStringbundle").getString("yulupAuthenticationFailed.label") + " \"" + aRealm + "\".");
        }
    },

   /**
    * Invoke the Logout URI
    *
    * @param {String}            aURI         URI for the logout action
    * @param {String}            aRealm       the realm on the server
    * @param {Yulup}             aYulup       the Yulup object
    * @param {nsIDOMXULDocument} aXULDocument the XUL document which contains the Yulup menu
    */
    authenticationLogout: function (aURI, aRealm, aYulup, aXULDocument) {
        var context = null;

        /* DEBUG */ dump("Yulup:authentication.js:Authentication.authenticationLogout() invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aURI         != null);
        /* DEBUG */ YulupDebug.ASSERT(aRealm       != null);
        /* DEBUG */ YulupDebug.ASSERT(aYulup       != null);
        /* DEBUG */ YulupDebug.ASSERT(aXULDocument != null);

        /* DEBUG */ dump("Yulup:authentication.js:Authentication.authenticationLogout: logoutUrl = \"" + aURI + "\"\n");

        context = { realm: aRealm, yulup: aYulup, document: aXULDocument };

        try {
            NetworkService.httpRequestGET(aURI, null, Authentication.__logoutFinished, context, false, false);
        } catch (exception) {
            // TODO: fix yanel or introduce sort of relative URI resolving
            YulupDebug.dumpExceptionToConsole("Yulup:authentication.js:Authentication.authenticationLogout()", exception);
            // TODO: don't show an alert!
            alert("Yulup:authentication.js:Authentication.authenticationLogout():\n" + exception.message);
        }

    },

    __logoutFinished: function (aDocumentData, aResponseStatusCode, aContext) {
        /* DEBUG */ dump("Yulup:authentication.js:Authentication.__logoutFinished() invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aResponseStatusCode                                           != null);
        /* DEBUG */ YulupDebug.ASSERT(aContext                                                      != null);
        /* DEBUG */ YulupDebug.ASSERT(aContext.realm                                                != null);
        /* DEBUG */ YulupDebug.ASSERT(aContext.yulup                                                != null);
        /* DEBUG */ YulupDebug.ASSERT(aContext.document                                             != null);
        /* DEBUG */ YulupDebug.ASSERT(aContext.document.getElementById("uiYulupAuthStringbundle")   != null);

        // TODO: load stringbundle (lazily) dynamically

        if (aResponseStatusCode && aResponseStatusCode == 200) {
            alert(aContext.document.getElementById("uiYulupAuthStringbundle").getString("yulupLogoutSuccess.label") + " \"" + aContext.realm + "\".");

            aContext.yulup.removeRealmFromYulupMenu(aContext.realm);
        } else if (aResponseStatusCode) {
            alert(aContext.document.getElementById("uiYulupAuthStringbundle").getString("yulupLogoutFailed.label") + " \""+ aContext.realm + "\".");
        }
    }
};
