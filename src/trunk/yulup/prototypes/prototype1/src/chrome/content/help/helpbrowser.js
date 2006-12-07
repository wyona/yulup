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

const YULUP_HELP_URI = "chrome://yulup/content/help/user-manual/user_manual.xhtml";

var YulupHelpBrowser = {
    __browser            : null,
    __webProgressListener: null,

    onLoadListener: function () {
        var browser         = null;
        var browserInstance = null;

        /* DEBUG */ dump("Yulup:helpbrowser.js:YulupHelpBrowser.onLoadListener() invoked\n");

        browser = document.getElementById("uiYulupHelpBrowserBrowser");

        browserInstance = Components.classes["@mozilla.org/appshell/component/browser/instance;1"].createInstance(Components.interfaces.nsIBrowserInstance);
        browserInstance.setWebShellWindow(window);

        window.XULBrowserWindow = new YulupHelpBrowserWindow();

        YulupHelpBrowser.__webProgressListener = new YulupHelpBrowserWebProgressListener();

        browser.docShell.QueryInterface(Components.interfaces.nsIInterfaceRequestor).getInterface(Components.interfaces.nsIWebProgress).addProgressListener(YulupHelpBrowser.__webProgressListener, Components.interfaces.nsIWebProgress.NOTIFY_ALL);

        browser.webNavigation.loadURI(YULUP_HELP_URI, Components.interfaces.nsIWebNavigation.LOAD_FLAGS_NONE, null, null, null);

        YulupHelpBrowser.__browser = browser;
    },

    updateNavigation: function () {
        /* DEBUG */ dump("Yulup:helpbrowser.js:YulupHelpBrowser.updateNavigation() invoked\n");

        if (YulupHelpBrowser.__browser) {
            if (YulupHelpBrowser.__browser.webNavigation.canGoBack) {
                document.getElementById("cmd_yulup_goback").setAttribute("disabled", false);
            } else {
                document.getElementById("cmd_yulup_goback").setAttribute("disabled", true);
            }

            if (YulupHelpBrowser.__browser.webNavigation.canGoForward) {
                document.getElementById("cmd_yulup_goforward").setAttribute("disabled", false);
            } else {
                document.getElementById("cmd_yulup_goforward").setAttribute("disabled", true);
            }
        }
    },

    goBack: function () {
        /* DEBUG */ dump("Yulup:helpbrowser.js:YulupHelpBrowser.goBack() invoked\n");

        if (YulupHelpBrowser.__browser && YulupHelpBrowser.__browser.webNavigation.canGoBack)
            YulupHelpBrowser.__browser.webNavigation.goBack();
    },

    goForward: function () {
        /* DEBUG */ dump("Yulup:helpbrowser.js:YulupHelpBrowser.goForward() invoked\n");

        if (YulupHelpBrowser.__browser && YulupHelpBrowser.__browser.webNavigation.canGoForward)
            YulupHelpBrowser.__browser.webNavigation.goForward();
    }
};


function YulupHelpBrowserWindow() {
    /* DEBUG */ dump("Yulup:helpbrowser.js:YulupHelpBrowserWindow() invoked\n");
}

YulupHelpBrowserWindow.prototype = {
    QueryInterface: function (aUUID) {
        /* DEBUG */ dump("Yulup:helpbrowser.js:YulupHelpBrowserWindow.QueryInterface(\"" + aUUID + "\") invoked\n");

        if (aUUID.equals(Components.interfaces.nsISupports)              ||
            aUUID.equals(Components.interfaces.nsISupportsWeakReference) ||
            aUUID.equals(Components.interfaces.nsIXULBrowserWindow)) {
            return this;
        } else {
            throw Components.results.NS_NOINTERFACE;
        }
    },

    setJSDefaultStatus: function (aStatus) {
        /* DEBUG */ dump("Yulup:helpbrowser.js:YulupHelpBrowserWindow.setJSDefaultStatus() invoked\n");

        return;
    },

    setJSStatus: function (aStatus) {
        /* DEBUG */ dump("Yulup:helpbrowser.js:YulupHelpBrowserWindow.setJSStatus() invoked\n");

        return;
    },

    setOverLink: function (aLink) {
        /* DEBUG */ dump("Yulup:helpbrowser.js:YulupHelpBrowserWindow.setOverLink() invoked\n");

        return;
    }
};


function YulupHelpBrowserWebProgressListener() {
    /* DEBUG */ dump("Yulup:helpbrowser.js:YulupHelpBrowserWebProgressListener() invoked\n");
}

YulupHelpBrowserWebProgressListener.prototype = {
    QueryInterface: function (aUUID) {
        /* DEBUG */ dump("Yulup:helpbrowser.js:YulupHelpBrowserWebProgressListener.QueryInterface(\"" + aUUID + "\") invoked\n");

        if (aUUID.equals(Components.interfaces.nsISupports)              ||
            aUUID.equals(Components.interfaces.nsISupportsWeakReference) ||
            aUUID.equals(Components.interfaces.nsIWebProgressListener)) {
            return this;
        } else {
            throw Components.results.NS_NOINTERFACE;
        }
    },

    onLocationChange: function (aWebProgress, aRequest, aLocation) {
        /* DEBUG */ dump("Yulup:helpbrowser.js:YulupHelpBrowserWebProgressListener.onLocationChange() invoked\n");

        YulupHelpBrowser.updateNavigation();
    },

    onProgressChange: function () {
        /* DEBUG */ dump("Yulup:helpbrowser.js:YulupHelpBrowserWebProgressListener.onProgressChange() invoked\n");

        return;
    },

    onSecurityChange: function () {
        /* DEBUG */ dump("Yulup:helpbrowser.js:YulupHelpBrowserWebProgressListener.onSecurityChange() invoked\n");

        return;
    },

    onStateChange: function () {
        /* DEBUG */ dump("Yulup:helpbrowser.js:YulupHelpBrowserWebProgressListener.onStateChange() invoked\n");

        return;
    },

    onStatusChange: function () {
        /* DEBUG */ dump("Yulup:helpbrowser.js:YulupHelpBrowserWebProgressListener.onStatusChange() invoked\n");

        return;
    }
};
