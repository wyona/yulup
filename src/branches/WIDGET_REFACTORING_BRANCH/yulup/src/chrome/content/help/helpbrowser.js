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

const YulupHelpBrowser = {
    __browser            : null,
    __webProgressListener: null,
    __contentListener    : null,

    onLoadListener: function () {
        var browser         = null;
        var browserInstance = null;

        /* DEBUG */ dump("Yulup:helpbrowser.js:YulupHelpBrowser.onLoadListener() invoked\n");

        browser = document.getElementById("uiYulupHelpBrowserBrowser");

        browserInstance = Components.classes["@mozilla.org/appshell/component/browser/instance;1"].createInstance(Components.interfaces.nsIBrowserInstance);

        YulupHelpBrowser.__contentListener = new YulupHelpBrowserContentListener(browser);
        browser.contentWindow.browserContentListener = YulupHelpBrowser.__contentListener;

        YulupHelpBrowser.__webProgressListener = new YulupHelpBrowserWebProgressListener();
        browser.docShell.QueryInterface(Components.interfaces.nsIInterfaceRequestor).getInterface(Components.interfaces.nsIWebProgress).addProgressListener(YulupHelpBrowser.__webProgressListener, Components.interfaces.nsIWebProgress.NOTIFY_ALL);

        browserInstance.setWebShellWindow(window);

        YulupHelpBrowser.__browser = browser;

        YulupHelpBrowser.__loadMainHelpPage();
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

    __loadMainHelpPage: function () {
        /* DEBUG */ dump("Yulup:helpbrowser.js:YulupHelpBrowser.__loadMainHelpPage() invoked\n");

        if (YulupHelpBrowser.__browser && YulupHelpBrowser.__browser.webNavigation)
            YulupHelpBrowser.__browser.webNavigation.loadURI(YULUP_HELP_URI, Components.interfaces.nsIWebNavigation.LOAD_FLAGS_NONE, null, null, null);
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
    },

    goHome: function () {
        /* DEBUG */ dump("Yulup:helpbrowser.js:YulupHelpBrowser.goHome() invoked\n");

        YulupHelpBrowser.__loadMainHelpPage();
    }
};


/**
 * YulupHelpBrowserWebProgressListener constructor. Instantiates a new object of
 * type YulupHelpBrowserWebProgressListener.
 *
 * Implements the nsIWebProgressListener interface.
 *
 * @constructor
 * @return {YulupHelpBrowserWebProgressListener} a new YulupHelpBrowserWebProgressListener object
 */
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


/**
 * YulupHelpBrowserContentListener constructor. Instantiates a new object of
 * type YulupHelpBrowserContentListener.
 *
 * Implements the nsIURIContentListener interface.
 *
 * @constructor
 * @param  {Window} aContentWindow the browser content window
 * @return {YulupHelpBrowserContentListener} a new YulupHelpBrowserContentListener object
 */
function YulupHelpBrowserContentListener(aContentWindow) {
    /* DEBUG */ dump("Yulup:helpbrowser.js:YulupHelpBrowserContentListener(\"" + aContentWindow + "\") invoked\n");

    this.__contentWindow  = aContentWindow;

    aContentWindow.docShell.QueryInterface(Components.interfaces.nsIInterfaceRequestor).getInterface(Components.interfaces.nsIURIContentListener).parentContentListener = this;
}

YulupHelpBrowserContentListener.prototype = {
    __contentWindow: null,

    loadCookie           : null,
    parentContentListener: null,

    QueryInterface: function (aUUID) {
        /* DEBUG */ dump("Yulup:helpbrowser.js:YulupHelpBrowserContentListener.QueryInterface(\"" + aUUID + "\") invoked\n");

        if (aUUID.equals(Components.interfaces.nsISupports)              ||
            aUUID.equals(Components.interfaces.nsISupportsWeakReference) ||
            aUUID.equals(Components.interfaces.nsIURIContentListener)) {
            return this;
        } else {
            throw Components.results.NS_NOINTERFACE;
        }
    },

    close: function () {
        /* DEBUG */ dump("Yulup:helpbrowser.js:YulupHelpBrowserContentListener.close() invoked\n");

        this.__contentWindow = null;
    },

    onStartURIOpen: function (aURI) {
        var retval = true;

        /* DEBUG */ dump("Yulup:helpbrowser.js:YulupHelpBrowserContentListener.onStartURIOpen(\"" + aURI + "\") invoked\n");

        // intercept all loads that don't have a chrome URI
        try {
            /* DEBUG */ dump("Yulup:helpbrowser.js:YulupHelpBrowserContentListener.onStartURIOpen: URI scheme = \"" + aURI.scheme + "\"\n");

            // check if target is chrome URI
            if (aURI && !aURI.schemeIs("file") && !aURI.schemeIs("jar")) {
                /* DEBUG */ dump("Yulup:helpbrowser.js:YulupHelpBrowserContentListener.onStartURIOpen: load intercepted for URI \"" + aURI.spec + "\"\n");

                // open new browser window with indicated location
                window.open(aURI.spec);
            } else {
                // go ahead with the load
                retval = false;
            }
        } catch (exception) {
            /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:helpbrowser.js:YulupHelpBrowserContentListener.onStartURIOpen", exception);
            Components.utils.reportError(exception);
        }

        return retval;
    },

    doContent: function (aContentType, aIsContentPreferred, aRequest, aContentHandler) {
        /* DEBUG */ dump("Yulup:helpbrowser.js:YulupHelpBrowserContentListener.doContent(\"" + aContentType + "\", \"" + aIsContentPreferred + "\", \"" + aRequest + "\", \"" + aContentHandler + "\") invoked\n");

        return false;
    },

    isPreferred: function (aContentType, aDesiredContentType) {
        /* DEBUG */ dump("Yulup:helpbrowser.js:YulupHelpBrowserContentListener.isPreferred(\"" + aContentType + "\", \"" + aDesiredContentType + "\") invoked\n");

        return true;
    },

    canHandleContent: function (aContentType, aIsContentPreferred, aDesiredContentType) {
        /* DEBUG */ dump("Yulup:helpbrowser.js:YulupHelpBrowserContentListener.canHandleContent(\"" + aContentType + "\", \"" + aIsContentPreferred + "\", \"" + aDesiredContentType + "\") invoked\n");

        return false;
    }
};
