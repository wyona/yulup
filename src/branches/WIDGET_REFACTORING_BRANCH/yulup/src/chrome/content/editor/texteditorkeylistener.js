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

function TextEditorKeyListener(aEditor, aUseSpaces, aNoOfSpaces) {
    dump("Yulup:texteditorkeylistener.js:TextEditorKeyListener() invoked\n");

    /* DEBUG */ YulupDebug.ASSERT(aEditor != null);
    /* DEBUG */ YulupDebug.ASSERT(aUseSpaces != null);
    /* DEBUG */ YulupDebug.ASSERT(typeof(aUseSpaces)  == "boolean");
    /* DEBUG */ YulupDebug.ASSERT(aUseSpaces ? aNoOfSpaces != null : true);
    /* DEBUG */ YulupDebug.ASSERT(aUseSpaces ? typeof(aNoOfSpaces) == "number" : true);
    /* DEBUG */ YulupDebug.ASSERT(aUseSpaces ? aNoOfSpaces >= 0 : true);

    this.__editor    = aEditor;
    this.__useSpaces = aUseSpaces;
    this.__spaces    = "";

    if (aUseSpaces) {
        for (var i = 0; i < aNoOfSpaces; i++) {
            this.__spaces += " ";
        }
    }
}

TextEditorKeyListener.prototype = {
    __editor   : null,
    __useSpaces: null,
    __spaces   : null,

    handleEvent: function (aKeyEvent) {
        var isAnyModifierKeyButShift = null;

        dump("Yulup:texteditorkeylistener.js:TextEditorKeyListener:handleEvent() invoked\n");

        if (0 != aKeyEvent.keyCode) {
            isAnyModifierKeyButShift = aKeyEvent.altKey;

            if (!isAnyModifierKeyButShift) {
                isAnyModifierKeyButShift = aKeyEvent.metaKey;

                if (!isAnyModifierKeyButShift) {
                    isAnyModifierKeyButShift = aKeyEvent.ctrlKey;
                }
            }

            switch (aKeyEvent.keyCode) {
            case Components.interfaces.nsIDOMKeyEvent.DOM_VK_TAB:
                dump("key event = DOM_VK_TAB\n");

                if (this.__useSpaces) {
                    if (isAnyModifierKeyButShift)
                        return true;

                    // else we insert the tab straight through
                    this.__editor.QueryInterface(Components.interfaces.nsIPlaintextEditor);
                    this.__editor.insertText(this.__spaces);

                    // we consumed this event
                    aKeyEvent.preventDefault();
                    return true;
                }
                break;
            }
        }

        return true;
    }
};
