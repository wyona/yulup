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

var NeutronSidebar = {
    /**
     * Initialise the sidebar.
     *
     * @return {Undefined} does not have a return value
     */
    onLoadListener: function () {
        var mainBrowserWindow = null;
        var serverURIString   = null;
        var serverURI         = null;
        var tree              = null;

        /* DEBUG */ dump("Yulup:neutronsidebar.js:NeutronSidebar.onLoadListener() invoked\n");

        // get a handle on the main browser window
        mainBrowserWindow = window.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
            .getInterface(Components.interfaces.nsIWebNavigation)
            .QueryInterface(Components.interfaces.nsIDocShellTreeItem)
            .rootTreeItem
            .QueryInterface(Components.interfaces.nsIInterfaceRequestor)
            .getInterface(Components.interfaces.nsIDOMWindow);

        // retrieve APP introspection document from Yulup, if any
        if (mainBrowserWindow.yulup.currentNeutronIntrospection                            &&
            mainBrowserWindow.yulup.currentNeutronIntrospection.queryNavigation()          &&
            mainBrowserWindow.yulup.currentNeutronIntrospection.queryNavigation().sitetree &&
            mainBrowserWindow.yulup.currentNeutronIntrospection.queryNavigation().sitetree.uri) {
            serverURI = mainBrowserWindow.yulup.currentNeutronIntrospection.queryNavigation().sitetree.uri;
        } else if ((serverURIString = YulupPreferences.getCharPref("neutron.", "defaultserver")) == null) {
            // get default URI from preferences
            return false;
        }

        if (serverURIString != "") {
            serverURI = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService).newURI(serverURIString, null, null)
        } else
            return false;

        tree = document.getElementById("uiYulupNeutronSidebarSiteTree");
        tree.view = new SitetreeView(serverURI, NeutronSidebar.sitetreeErrorListener);
    },

    /**
     * Cleanup the sidebar.
     *
     * @return {Undefined} does not have a return value
     */
    onUnloadListener: function () {
        /* DEBUG */ dump("Yulup:neutronsidebar.js:NeutronSidebar.onUnloadListener() invoked\n");
    },

    sitetreeErrorListener: function () {
        /* DEBUG */ dump("Yulup:neutronsidebar.js:NeutronSidebar.sitetreeErrorListener() invoked\n");
    },
}
