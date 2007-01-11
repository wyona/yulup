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

function ReadlineKeyBindingsListener(aEditorElem) {
    /* DEBUG */ dump("Yulup:readlinekeybindingslistener.js:ReadlineKeyBindingsListener() invoked\n");

    /* DEBUG */ YulupDebug.ASSERT(aEditorElem != null);

    this.editorElem = aEditorElem;
}

ReadlineKeyBindingsListener.prototype = {
    editorElem: null,

    handleEvent: function (aKeyEvent) {
        var controller = null;

        /* DEBUG */ dump("Yulup:readlinekeybindingslistener.js:ReadlineKeyBindingsListener.handleEvent() invoked\n");

        switch (String.fromCharCode(aKeyEvent.charCode)) {
        case "a":
        case "A":
            /* DEBUG */ dump("Yulup:readlinekeybindingslistener.js:ReadlineKeyBindingsListener.handleEvent: char code = a\n");
            if (!aKeyEvent.ctrlKey) {
                break;
            } else {
                if (aKeyEvent.shiftKey) {
                    controller = this.editorElem.contentWindow.controllers.getControllerForCommand("cmd_selectBeginLine");
                    controller.doCommand("cmd_selectBeginLine");
                } else {
                    controller = this.editorElem.contentWindow.controllers.getControllerForCommand("cmd_beginLine");
                    controller.doCommand("cmd_beginLine");
                }

                // we consumed this event
                aKeyEvent.preventDefault();
                return true;
                break;
            }
        case "b":
        case "B":
            /* DEBUG */ dump("Yulup:readlinekeybindingslistener.js:ReadlineKeyBindingsListener.handleEvent: char code = b\n");
            if (!aKeyEvent.ctrlKey) {
                break;
            } else {
                if (aKeyEvent.shiftKey) {
                    controller = this.editorElem.contentWindow.controllers.getControllerForCommand("cmd_selectCharPrevious");
                    controller.doCommand("cmd_selectCharPrevious");
                } else {
                    controller = this.editorElem.contentWindow.controllers.getControllerForCommand("cmd_charPrevious");
                    controller.doCommand("cmd_charPrevious");
                }

                // we consumed this event
                aKeyEvent.preventDefault();
                return true;
                break;
            }
        case "d":
            /* DEBUG */ dump("Yulup:readlinekeybindingslistener.js:ReadlineKeyBindingsListener.handleEvent: char code = d\n");
            if (!aKeyEvent.ctrlKey) {
                break;
            } else {
                controller = this.editorElem.contentWindow.controllers.getControllerForCommand("cmd_deleteCharForward");
                controller.doCommand("cmd_deleteCharForward");

                // we consumed this event
                aKeyEvent.preventDefault();
                return true;
                break;
            }
        case "e":
        case "E":
            /* DEBUG */ dump("Yulup:readlinekeybindingslistener.js:ReadlineKeyBindingsListener.handleEvent: char code = e\n");
            if (!aKeyEvent.ctrlKey) {
                break;
            } else {
                if (aKeyEvent.shiftKey) {
                    controller = this.editorElem.contentWindow.controllers.getControllerForCommand("cmd_selectEndLine");
                    controller.doCommand("cmd_selectEndLine");
                } else {
                    controller = this.editorElem.contentWindow.controllers.getControllerForCommand("cmd_endLine");
                    controller.doCommand("cmd_endLine");
                }

                // we consumed this event
                aKeyEvent.preventDefault();
                return true;
                break;
            }
        case "f":
        case "F":
            /* DEBUG */ dump("Yulup:readlinekeybindingslistener.js:ReadlineKeyBindingsListener.handleEvent: char code = f\n");
            if (!aKeyEvent.ctrlKey) {
                break;
            } else {
                if (aKeyEvent.shiftKey) {
                    controller = this.editorElem.contentWindow.controllers.getControllerForCommand("cmd_selectCharPrevious");
                    controller.doCommand("cmd_selectCharNext");
                } else {
                    controller = this.editorElem.contentWindow.controllers.getControllerForCommand("cmd_charNext");
                    controller.doCommand("cmd_charNext");
                }

                // we consumed this event
                aKeyEvent.preventDefault();
                return true;
                break;
            }
        case "h":
            /* DEBUG */ dump("Yulup:readlinekeybindingslistener.js:ReadlineKeyBindingsListener.handleEvent: char code = h\n");
            if (!aKeyEvent.ctrlKey) {
                break;
            } else {
                controller = this.editorElem.contentWindow.controllers.getControllerForCommand("cmd_deleteCharBackward");
                controller.doCommand("cmd_deleteCharBackward");

                // we consumed this event
                aKeyEvent.preventDefault();
                return true;
                break;
            }
        case "k":
            /* DEBUG */ dump("Yulup:readlinekeybindingslistener.js:ReadlineKeyBindingsListener.handleEvent: char code = k\n");
            if (!aKeyEvent.ctrlKey) {
                break;
            } else {
                controller = this.editorElem.contentWindow.controllers.getControllerForCommand("cmd_deleteToEndOfLine");
                controller.doCommand("cmd_deleteToEndOfLine");

                // we consumed this event
                aKeyEvent.preventDefault();
                return true;
                break;
            }
        case "n":
        case "N":
            /* DEBUG */ dump("Yulup:readlinekeybindingslistener.js:ReadlineKeyBindingsListener.handleEvent: char code = n\n");
            if (!aKeyEvent.ctrlKey) {
                break;
            } else {
                if (aKeyEvent.shiftKey) {
                    controller = this.editorElem.contentWindow.controllers.getControllerForCommand("cmd_selectLineNext");
                    controller.doCommand("cmd_selectLineNext");
                } else {
                    controller = this.editorElem.contentWindow.controllers.getControllerForCommand("cmd_lineNext");
                    controller.doCommand("cmd_lineNext");
                }

                // we consumed this event
                aKeyEvent.preventDefault();
                return true;
                break;
            }
        case "p":
        case "P":
            /* DEBUG */ dump("Yulup:readlinekeybindingslistener.js:ReadlineKeyBindingsListener.handleEvent: char code = p\n");
            if (!aKeyEvent.ctrlKey) {
                break;
            } else {
                if (aKeyEvent.shiftKey) {
                    controller = this.editorElem.contentWindow.controllers.getControllerForCommand("cmd_selectLinePrevious");
                    controller.doCommand("cmd_selectLinePrevious");
                } else {
                    controller = this.editorElem.contentWindow.controllers.getControllerForCommand("cmd_linePrevious");
                    controller.doCommand("cmd_linePrevious");
                }

                // we consumed this event
                aKeyEvent.preventDefault();
                return true;
                break;
            }
        case "u":
            /* DEBUG */ dump("Yulup:readlinekeybindingslistener.js:ReadlineKeyBindingsListener.handleEvent: char code = u\n");
            if (!aKeyEvent.ctrlKey) {
                break;
            } else {
                controller = this.editorElem.contentWindow.controllers.getControllerForCommand("cmd_deleteToBeginningOfLine");
                controller.doCommand("cmd_deleteToBeginningOfLine");

                // we consumed this event
                aKeyEvent.preventDefault();
                return true;
                break;
            }
        case "w":
        case "W":
            /* DEBUG */ dump("Yulup:readlinekeybindingslistener.js:ReadlineKeyBindingsListener.handleEvent: char code = w\n");
            if (!aKeyEvent.ctrlKey) {
                break;
            } else {
                if (aKeyEvent.shiftKey) {
                    controller = this.editorElem.contentWindow.controllers.getControllerForCommand("cmd_deleteWordForward");
                    controller.doCommand("cmd_deleteWordForward");
                } else {
                    controller = this.editorElem.contentWindow.controllers.getControllerForCommand("cmd_deleteWordBackward");
                    controller.doCommand("cmd_deleteWordBackward");
                }

                // we consumed this event
                aKeyEvent.preventDefault();
                return true;
                break;
            }
        case "_":
            /* DEBUG */ dump("Yulup:readlinekeybindingslistener.js:ReadlineKeyBindingsListener.handleEvent: char code = _\n");
            if (!aKeyEvent.ctrlKey) {
                break;
            } else {
                controller = this.editorElem.contentWindow.controllers.getControllerForCommand("cmd_undo");
                controller.doCommand("cmd_undo");

                // we consumed this event
                aKeyEvent.preventDefault();
                return true;
                break;
            }
        }

        return true;
    }
};
