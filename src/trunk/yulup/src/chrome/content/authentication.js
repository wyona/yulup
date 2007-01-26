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
 * @author Gregor Imboden
 *
 */

const YULUP_AUTHENTICATION_CHROME_URI = "chrome://yulup/content/authentication.xul";

const AUTHENTICATION_PASSWORD_FIELD_IDENTIFIER = "password";
const AUTHENTICATION_FORM_HISTORY_ID           = "yulup";

var gAuthException = null;
var gResponseFlag  = null;

var Authentication = {
    uiYulupEditorAuthenticationOnDialogLoadHandler: function () {
        var authException         = null;
        var uiAuthenticationLabel = null;
        var uiAuthenticationRows  = null;
        var elem                  = null;
        var field                 = null;

        gAuthException = window.arguments[1];

        /* DEBUG */ dump("Yulup:authentication.js:Authentication.uiYulupEditorAuthenticationOnDialogLoadHandler() invoked: " + gAuthException + "\n");

        uiAuthenticationLabel = document.getElementById('uiYulupEditorAuthenticationLabel');

        if (gAuthException.infoMessage) {
            uiAuthenticationLabel.setAttribute("value", gAuthException.infoMessage);
        }

        uiAuthenticationRows = document.getElementById('uiYulupEditorAuthenticationRows');

        // extend authentication.xul with the fields from the exception
        for (field in gAuthException.params) {
            elem = document.createElement("row");
            elem.setAttribute("id", "row" + field);
            elem.setAttribute("align", "center");
            uiAuthenticationRows.appendChild(elem);

            elem = document.createElement("label");
            elem.setAttribute("control", field);
            elem.setAttribute("value", gAuthException.params[field]);
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
    * @param  {String}    aField the id of the textbox element in authentication.xul
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
        for (field in gAuthException.params) {
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

        if (window.openDialog(YULUP_AUTHENTICATION_CHROME_URI, "yulupEditorAuthenticationDialog", "modal,resizable=no", returnObject, aException)) {
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
    * @param {String}            aRealm       Realm on the server
    * @param {nsIDOMXULDocument} aXULDocument the XUL document which contains the Yulup menu
    */
    authenticationLogout: function (aURI, aRealm, aXULDocument) {
        var context = null;

        /* DEBUG */ dump("Yulup:authentication.js:Authentication.authenticationLogout() invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aURI         != null);
        /* DEBUG */ YulupDebug.ASSERT(aRealm       != null);
        /* DEBUG */ YulupDebug.ASSERT(aXULDocument != null);

        /* DEBUG */ dump("Yulup:authentication.js:Authentication.authenticationLogout: logoutUrl = \"" + aURI + "\"\n");

        context = { realm: aRealm, document: aXULDocument };

        try {
            NetworkService.httpRequestGET(aURI, null, Authentication.__logoutFinished, context, false, false);
        } catch (exception) {
            // TODO: fix yanel or introduce sort of relative URI resolving
            YulupDebug.dumpExceptionToConsole("Yulup:authentication.js:Authentication.authenticationLogout()", exception);
            alert("Yulup:authentication.js:Authentication.authenticationLogout():\n" + exception.message);
        }

    },

    __logoutFinished: function (aDocumentData, aResponseStatusCode, aContext) {
        /* DEBUG */ dump("Yulup:authentication.js:Authentication.__logoutFinished() invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aResponseStatusCode                                           != null);
        /* DEBUG */ YulupDebug.ASSERT(aContext                                                      != null);
        /* DEBUG */ YulupDebug.ASSERT(aContext.realm                                                != null);
        /* DEBUG */ YulupDebug.ASSERT(aContext.document                                             != null);
        /* DEBUG */ YulupDebug.ASSERT(aContext.document.getElementById("uiYulupAuthStringbundle") != null);

        if (aResponseStatusCode && aResponseStatusCode == 200) {
            alert(aContext.document.getElementById("uiYulupAuthStringbundle").getString("yulupLogoutSuccess.label") + " \"" + aContext.realm + "\".");

            Authentication.removeRealmFromYulupMenu(aContext.realm, aContext.document);
        } else if (aResponseStatusCode) {
            alert(aContext.document.getElementById("uiYulupAuthStringbundle").getString("yulupLogoutFailed.label") + " \""+ aContext.realm + "\".");
        }
    },

    // move realm menuitem addition code into yulup.js (or, ultimately, into a binding)
    addRealmToYulupMenu: function (aRealm, aLogoutURI) {
        var uiYulupEditRealm = null;

        /* DEBUG */ YulupDebug.ASSERT(aRealm             != null);
        /* DEBUG */ YulupDebug.ASSERT(aLogoutURI         != null);
        /* DEBUG */ YulupDebug.ASSERT(gMainBrowserWindow != null);

        // add realm to yulup menu
        uiYulupEditRealm = gMainBrowserWindow.yulup.yulupDocument.getElementById("uiYulupEditRealm" + aRealm +"Menuitem");

        // check if such a menu item already exists
        if (!uiYulupEditRealm) {
            elem = gMainBrowserWindow.yulup.yulupDocument.createElement("menuitem");
            elem.setAttribute("id", "uiYulupEditRealm" + aRealm +"Menuitem");
            elem.setAttribute("label", gMainBrowserWindow.yulup.yulupDocument.getElementById("uiYulupOverlayStringbundle").getString("editToolbarbuttonLogoutFrom.label") + " \"" + aRealm + "\"");
            elem.setAttribute("tooltiptext", gMainBrowserWindow.yulup.yulupDocument.getElementById("uiYulupOverlayStringbundle").getString("editToolbarbuttonLogoutFrom.tooltip"));
            elem.setAttribute("oncommand", "Authentication.authenticationLogout('" + aLogoutURI + "','" + aRealm + "', document)");

            // go to the extras separator
            insertTargetElem = gMainBrowserWindow.yulup.yulupEditMenuExtrasSeparator;

            /* If the left sibling of our insert target is the realm separator, we are the
             * only logout item, and therefore we have to unhide the separator. */
            if (insertTargetElem.previousSibling == gMainBrowserWindow.yulup.yulupEditMenuRealmSeparator) {
                gMainBrowserWindow.yulup.yulupEditMenuRealmSeparator.removeAttribute("hidden");
            }

            gMainBrowserWindow.yulup.uiYulupEditMenupopup.insertBefore(elem, insertTargetElem);
        }
    },

    // move realm menuitem removal code into yulup.js (or, ultimately, into a binding)
    removeRealmFromYulupMenu: function (aRealm, aXULDocument) {
        var uiYulupEditRealm          = null;
        var uiYulupEditRealmSeparator = null;

        /* DEBUG */ YulupDebug.ASSERT(aRealm       != null);
        /* DEBUG */ YulupDebug.ASSERT(aXULDocument != null);

        uiYulupEditRealm          = aXULDocument.getElementById("uiYulupEditRealm" + aRealm + "Menuitem");
        uiYulupEditRealmSeparator = aXULDocument.getElementById("uiYulupRealmSeparator");

        // remove realm menuitem from yulup.xul
        uiYulupEditRealm.parentNode.removeChild(uiYulupEditRealm);

        // if there are no more logout entries, hide the realm separator
        if (uiYulupEditRealmSeparator.nextSibling == aXULDocument.getElementById("uiYulupExtrasSeparator"))
            uiYulupEditRealmSeparator.setAttribute("hidden", "true");
    }
};
