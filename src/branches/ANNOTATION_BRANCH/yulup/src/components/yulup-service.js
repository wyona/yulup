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

// UUID uniquely identifying our component
const CLASS_ID = Components.ID("{4B5FBF75-D225-46B2-A86D-356C2D2260DB}");

// description
const CLASS_NAME = "YulupService XPCOM Component";

// textual unique identifier
const CONTRACT_ID = "@wyona.com/yulup/yulup-service;1";

//class constructor
function YulupService() {
    this.__protocolRegistry = new Array();
};

// class definition
YulupService.prototype = {
    __init            : false,
    __protocolRegistry: null,

    init: function () {
        this.__init = true;
    },

    registerProtocol: function (aYulupProtocol) {
        // don't add twice
        if (this.__protocolRegistry.indexOf(aYulupProtocol) != -1) {
            this.__protocolRegistry.push(aYulupProtocol);
        }
    },

    QueryInterface: function (aIID) {
        if (!aIID.equals(Components.interfaces.wyIYulupService) &&
            !aIID.equals(Components.interfaces.nsISupports))
            throw Components.results.NS_ERROR_NO_INTERFACE;

        return this;
    }
};

// class factory
var YulupServiceFactory = {
    createInstance: function (aOuter, aIID) {
        if (aOuter != null)
            throw Components.results.NS_ERROR_NO_AGGREGATION;

        return (new YulupService()).QueryInterface(aIID);
    }
};

// module definition (xpcom registration)
var YulupServiceModule = {
    _firstTime: true,

    registerSelf: function (aCompMgr, aFileSpec, aLocation, aType) {
        aCompMgr = aCompMgr.QueryInterface(Components.interfaces.nsIComponentRegistrar);
        aCompMgr.registerFactoryLocation(CLASS_ID, CLASS_NAME, CONTRACT_ID, aFileSpec, aLocation, aType);
    },

    unregisterSelf: function (aCompMgr, aLocation, aType) {
        aCompMgr = aCompMgr.QueryInterface(Components.interfaces.nsIComponentRegistrar);
        aCompMgr.unregisterFactoryLocation(CLASS_ID, aLocation);
    },

    getClassObject: function (aCompMgr, aCID, aIID) {
        if (!aIID.equals(Components.interfaces.nsIFactory))
            throw Components.results.NS_ERROR_NOT_IMPLEMENTED;

        if (aCID.equals(CLASS_ID))
            return YulupServiceFactory;

        throw Components.results.NS_ERROR_NO_INTERFACE;
    },

    canUnload: function (aCompMgr) {
        return true;
    }
};

/**
 * Initialise the module.
 */
function NSGetModule(aCompMgr, aFileSpec) {
    return YulupServiceModule;
}
