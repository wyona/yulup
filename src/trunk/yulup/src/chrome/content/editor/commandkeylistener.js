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

function CommandKeyListener() {
    var prefAccelKey = null;

    /* DEBUG */ dump("Yulup:commandkeylistener.js:CommandKeyListener() invoked\n");

    /* Detect platform to set accel key correctly. This is a
     * workaround until https://bugzilla.mozilla.org/show_bug.cgi?id=180840
     * gets fixed. */

    // try to retrieve pref (cf. http://lxr.mozilla.org/mozilla1.8.0/source/content/xbl/src/nsXBLPrototypeHandler.cpp#188)
    if ((prefAccelKey = YulupPreferences.getAnyPref("ui.key.", "accelKey", "int")) != null) {
        /* DEBUG */ dump("Yulup:commandkeylistener.js:CommandKeyListener: prefAccelKey = \"" + prefAccelKey + "\"\n");

        switch (prefAccelKey) {
            case Components.interfaces.nsIDOMKeyEvent.DOM_VK_ALT:
            case Components.interfaces.nsIDOMKeyEvent.DOM_VK_CONTROL:
            case Components.interfaces.nsIDOMKeyEvent.DOM_VK_META:
                this.__accelKey = prefAccelKey;
                break;
            default:
        }
    }

    if (!this.__accelKey) {
        if ((new RegExp("Mac")).test(navigator.platform)) {
            this.__accelKey = Components.interfaces.nsIDOMKeyEvent.DOM_VK_META;
        } else {
            this.__accelKey = Components.interfaces.nsIDOMKeyEvent.DOM_VK_CONTROL;
        }
    }

    /* DEBUG */ dump("Yulup:commandkeylistener.js:CommandKeyListener: this.__accelKey = \"" + this.__accelKey + "\"\n");
}

CommandKeyListener.prototype = {
    __accelKey: null,

    __isAccelKey: function (aKeyEvent) {
        switch (this.__accelKey) {
            case Components.interfaces.nsIDOMKeyEvent.DOM_VK_ALT:
                return aKeyEvent.altKey;
            case Components.interfaces.nsIDOMKeyEvent.DOM_VK_CONTROL:
                return aKeyEvent.ctrlKey;
            case Components.interfaces.nsIDOMKeyEvent.DOM_VK_META:
                return aKeyEvent.metaKey;
            default:
                return false;
        }
    },

    handleEvent: function (aKeyEvent) {
        var controller = null;

        /* DEBUG */ dump("Yulup:commandkeylistener.js:CommandKeyListener.handleEvent() invoked\n");

        if (this.__isAccelKey(aKeyEvent)) {
            /* DEBUG */ dump("Yulup:commandkeylistener.js:CommandKeyListener.handleEvent: char code = " + String.fromCharCode(aKeyEvent.charCode) + "\n");

            switch (String.fromCharCode(aKeyEvent.charCode)) {
                case "e":
                case "E":
                    if (aKeyEvent.shiftKey) {
                        Editor.exitEditor();

                        // we consumed this event
                        aKeyEvent.preventDefault();
                        return true;
                    }

                    break;
                case "t":
                case "T":
                    if (aKeyEvent.shiftKey) {
                        Editor.goDoFileOperationsCommand("cmd_yulup_savetemp");

                        // we consumed this event
                        aKeyEvent.preventDefault();
                        return true;
                    }

                    break;
                case "s":
                case "S":
                    if (aKeyEvent.shiftKey) {
                        Editor.goDoFileOperationsCommand("cmd_yulup_savecms");

                        // we consumed this event
                        aKeyEvent.preventDefault();
                        return true;
                    }

                    break;
                case "c":
                case "C":
                    if (aKeyEvent.shiftKey) {
                        Editor.goDoFileOperationsCommand("cmd_yulup_checkincms");

                        // we consumed this event
                        aKeyEvent.preventDefault();
                        return true;
                    }

                    break;
                case "u":
                case "U":
                    if (aKeyEvent.shiftKey) {
                        Editor.goDoFileOperationsCommand("cmd_yulup_upload");

                        // we consumed this event
                        aKeyEvent.preventDefault();
                        return true;
                    }

                    break;
                case "f":
                case "F":
                    if (aKeyEvent.shiftKey) {
                        Editor.goDoFileOperationsCommand("cmd_yulup_find");

                        // we consumed this event
                        aKeyEvent.preventDefault();
                        return true;
                    }

                    break;
                case "r":
                case "R":
                    if (aKeyEvent.shiftKey) {
                        Editor.goDoFileOperationsCommand("cmd_yulup_replace");

                        // we consumed this event
                        aKeyEvent.preventDefault();
                        return true;
                    }

                    break;
                default:
            }
        }
    }
};
