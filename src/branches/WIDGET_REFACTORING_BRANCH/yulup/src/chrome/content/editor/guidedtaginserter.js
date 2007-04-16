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

function GuidedTagInserterKeyListener(aView) {
    /* DEBUG */ dump("Yulup:guidedtaginserter.js:GuidedTagInserterKeyListener() invoked\n");

    /* DEBUG */ YulupDebug.ASSERT(aView != null);

    this.view = aView;
}

GuidedTagInserterKeyListener.prototype = {
    editor: null,

    handleEvent: function (aKeyEvent) {
        var controller = null;

        /* DEBUG */ dump("Yulup:guidedtaginserter.js:GuidedTagInserterKeyListener.handleEvent() invoked\n");

        if (String.fromCharCode(aKeyEvent.charCode) == "i") {
            /* DEBUG */ dump("Yulup:guidedtaginserter.js:GuidedTagInserterKeyListener.handleEvent: char code = i\n");

            if (aKeyEvent.ctrlKey) {
                this.view.guidedTagInserter.startTagPrompting();

                // we consumed this event
                aKeyEvent.preventDefault();
                return true;
            }
        }
    }
};

function GuidedTagInserter(aView, aXULDocument, aPromptContainer) {
    /* DEBUG */ YulupDebug.ASSERT(aView            != null);
    /* DEBUG */ YulupDebug.ASSERT(aXULDocument     != null);
    /* DEBUG */ YulupDebug.ASSERT(aPromptContainer != null);

    this.view            = aView;
    this.xulDocument     = aXULDocument;
    this.promptContainer = aPromptContainer;
    this.promptStage     = this.PROMPT_STAGE_UNITIALISED;
}

GuidedTagInserter.prototype = {
    PROMPT_STAGE_UNITIALISED: 0,
    PROMPT_STAGE_TAGNAME    : 1,
    PROMPT_STAGE_ATTRNAME   : 2,
    PROMPT_STAGE_ATTRVALUE  : 3,
    PROMPT_STAGE_EMPTYTAG   : 4,

    view           : null,
    xulDocument    : null,
    promptContainer: null,
    promptTextBox  : null,
    promptStage    : null,
    tagName        : null,
    newTag         : null,

    startTagPrompting: function () {
        var promptLabel   = null;
        var promptTextBox = null;

        /* DEBUG */ dump("Yulup:guidedtaginserter.js:GuidedTagInserter:startTagPrompting() invoked\n");

        this.promptTextBox = null;
        this.tagName       = "";
        this.newTag        = "";

        if (this.promptStage != this.PROMPT_STAGE_UNITIALISED) {
            // something must have gone wrong during the last time, do some cleanup
            this.clearPromptBox();
        } else {
            // everything ok, let's go
            this.promptStage = this.PROMPT_STAGE_TAGNAME;
        }

        // prompt for tag name
        promptLabel = this.xulDocument.createElementNS(XUL_NAMESPACE_URI, "label");
        promptLabel.setAttribute("value", Editor.getStringbundleString("editorGuidedTagInserterElementName.label") + ":");
        promptLabel.setAttribute("style", "font-weight: bolder;");
        promptLabel.setAttribute("control", "uiPromptBoxTextbox");

        promptTextBox = this.xulDocument.createElementNS(XUL_NAMESPACE_URI, "textbox");
        promptTextBox.setAttribute("id", "uiPromptBoxTextbox");
        promptTextBox.setAttribute("flex", "1");
        promptTextBox.addEventListener("keypress", this, true);

        this.promptTextBox = promptTextBox;

        this.promptContainer.appendChild(this.createAbortButton());
        this.promptContainer.appendChild(promptLabel);
        this.promptContainer.appendChild(promptTextBox);
        this.promptContainer.removeAttribute("hidden");

        this.promptTextBox.focus();
        /* The promptTextBox may need some time be inserted, but we
         * can't catch the DOMNodeInserted event for some reason, so
         * we just have to wait for a reasonable amount of time. */
        window.setTimeout(function () { promptTextBox.focus(); }, 100);
    },

    promptAttributeName: function () {
        var promptLabel   = null;
        var promptTextBox = null;

        /* DEBUG */ dump("Yulup:guidedtaginserter.js:GuidedTagInserter:promptAttributeName() invoked\n");

        this.clearPromptBox();

        this.promptTextBox = null;
        this.promptStage = this.PROMPT_STAGE_ATTRNAME;

        // prompt for attribute name
        promptLabel = this.xulDocument.createElementNS(XUL_NAMESPACE_URI, "label");
        promptLabel.setAttribute("value", Editor.getStringbundleString("editorGuidedTagInserterAttributeName.label") + ":");
        promptLabel.setAttribute("style", "font-weight: bolder;");
        promptLabel.setAttribute("control", "uiPromptBoxTextbox");

        promptTextBox = this.xulDocument.createElementNS(XUL_NAMESPACE_URI, "textbox");
        promptTextBox.setAttribute("id", "uiPromptBoxTextbox");
        promptTextBox.setAttribute("flex", "1");
        promptTextBox.addEventListener("keypress", this, true);

        this.promptTextBox = promptTextBox;

        this.promptContainer.appendChild(this.createAbortButton());
        this.promptContainer.appendChild(promptLabel);
        this.promptContainer.appendChild(promptTextBox);
        this.promptContainer.removeAttribute("hidden");

        this.promptTextBox.focus();
    },

    promptAttributeValue: function () {
        var promptLabel   = null;
        var promptTextBox = null;

        /* DEBUG */ dump("Yulup:guidedtaginserter.js:GuidedTagInserter:promptAttributeValue() invoked\n");

        this.clearPromptBox();

        this.promptTextBox = null;
        this.promptStage = this.PROMPT_STAGE_ATTRVALUE;

        // prompt for attribute value
        promptLabel = this.xulDocument.createElementNS(XUL_NAMESPACE_URI, "label");
        promptLabel.setAttribute("value", Editor.getStringbundleString("editorGuidedTagInserterAttributeValue.label") + ":");
        promptLabel.setAttribute("style", "font-weight: bolder;");
        promptLabel.setAttribute("control", "uiPromptBoxTextbox");

        promptTextBox = this.xulDocument.createElementNS(XUL_NAMESPACE_URI, "textbox");
        promptTextBox.setAttribute("id", "uiPromptBoxTextbox");
        promptTextBox.setAttribute("flex", "1");
        promptTextBox.addEventListener("keypress", this, true);

        this.promptTextBox = promptTextBox;

        this.promptContainer.appendChild(this.createAbortButton());
        this.promptContainer.appendChild(promptLabel);
        this.promptContainer.appendChild(promptTextBox);
        this.promptContainer.removeAttribute("hidden");

        this.promptTextBox.focus();
    },

    promptEmptyTag: function () {
        var promptLabel               = null;
        var promptEmptyTagFalseButton = null;
        var promptEmptyTagTrueButton  = null;

        /* DEBUG */ dump("Yulup:guidedtaginserter.js:GuidedTagInserter:promptEmptyTag() invoked\n");

        this.clearPromptBox();

        this.promptTextBox = null;
        this.promptStage = this.PROMPT_STAGE_EMPTYTAG;

        // prompt for empty tag
        promptLabel = this.xulDocument.createElementNS(XUL_NAMESPACE_URI, "label");
        promptLabel.setAttribute("value", Editor.getStringbundleString("editorGuidedTagInserterCreate.label") + ":");
        promptLabel.setAttribute("style", "font-weight: bolder;");

        promptEmptyTagFalseButton = this.xulDocument.createElementNS(XUL_NAMESPACE_URI, "button");
        promptEmptyTagFalseButton.setAttribute("label", Editor.getStringbundleString("editorGuidedTagInserterNonEmptyButton.label"));
        promptEmptyTagFalseButton.setAttribute("tooltiptext", Editor.getStringbundleString("editorGuidedTagInserterNonEmptyButton.tooltip"));
        promptEmptyTagFalseButton.setAttribute("id", "uiPromptBoxNonEmptyButton");
        promptEmptyTagFalseButton.setAttribute("default", "true");
        promptEmptyTagFalseButton.addEventListener("command", this, true);
        promptEmptyTagFalseButton.addEventListener("keypress", this, true);

        promptEmptyTagTrueButton = this.xulDocument.createElementNS(XUL_NAMESPACE_URI, "button");
        promptEmptyTagTrueButton.setAttribute("label", Editor.getStringbundleString("editorGuidedTagInserterEmptyButton.label"));
        promptEmptyTagTrueButton.setAttribute("tooltiptext", Editor.getStringbundleString("editorGuidedTagInserterEmptyButton.tooltip"));
        promptEmptyTagTrueButton.setAttribute("id", "uiPromptBoxEmptyButton");
        promptEmptyTagTrueButton.addEventListener("command", this, true);

        this.promptContainer.appendChild(this.createAbortButton());
        this.promptContainer.appendChild(promptLabel);
        this.promptContainer.appendChild(promptEmptyTagFalseButton);
        this.promptContainer.appendChild(promptEmptyTagTrueButton);
        this.promptContainer.removeAttribute("hidden");

        promptEmptyTagFalseButton.focus();
    },

    /**
     * Insert the passed tag into the current editor.
     *
     * If aOpeningTagString is null, we do not insert anything.
     * If aOpeningTagString contains data but aClosingTagString
     * is null, we assume an empty-tag is to be inserted. If
     * aOpeningTagString as well as aClosingTagString are non-null,
     * we assume a non-empty tag is to inserted.
     *
     * If the associated editor contains a collapsed selection, empty
     * as well as non-empty tags are simply inserted at this location.
     * If the associated editor contain a non-collapes selection,
     * empty tags simply overwrite that selection. Non-empty tags instead
     * surround this selection.
     *
     * @param  {String} aOpeningTagString the opening tag, or null if nothing should be inserted
     * @param  {String} aClosingTagString the closing tag, or null if an empty tag should be inserted
     * @return {Undefined} does not have a return value
     */
    finishPrompting: function (aOpeningTagString, aClosingTagString) {
        /* DEBUG */ dump("Yulup:guidedtaginserter.js:GuidedTagInserter:finishPrompting(\"" + aOpeningTagString + "\", \"" + aClosingTagString + "\") invoked\n");

        this.clearPromptBox();

        this.promptStage = this.PROMPT_STAGE_UNITIALISED;

        // check if we have something to insert
        if (aOpeningTagString) {
            if (aClosingTagString) {
                /* Check if we have a selection. If we have one, surround that
                 * selection by the new tag instead of overwriting it. */
                if (this.view.view.selection.isCollapsed) {
                    // selection is collaped, simply insert

                    //params = Components.classes["@mozilla.org/embedcomp/command-params;1"].createInstance(Components.interfaces.nsICommandParams);
                    //params.setStringValue("state_data", "foo");
                    //controller = this.editorElem.contentWindow.controllers.getControllerForCommand("cmd_insertText");

                    /* Insert text directly because doCommandParams is not exposed via
                     * XPConnect for this controller, and doCommand is not implemented. */
                    this.view.view.insertText(aOpeningTagString + aClosingTagString);

                    // move selection to the middle of the inserted element tuple
                    for (var i = 0; i < aClosingTagString.length; i++)
                        this.view.view.selectionController.characterMove(false, false);
                } else {
                    // selection is not collapsed, surround the selection
                    this.view.view.insertText(aOpeningTagString + this.view.view.selection + aClosingTagString);
                }
            } else {
                /* Ignore a possible selection and simply overwrite it,
                 * because with an empty tag we can't surround anything. */
                this.view.view.insertText(aOpeningTagString);
            }
        }

        // transfer focus back to editor
        this.view.editor.contentWindow.focus();
    },

    clearPromptBox: function () {
        this.promptContainer.setAttribute("hidden", "true");

        while(this.promptContainer.hasChildNodes())
            this.promptContainer.removeChild(this.promptContainer.firstChild);
    },

    createAbortButton: function () {
        var abortButton = null;

        abortButton = this.xulDocument.createElementNS(XUL_NAMESPACE_URI, "toolbarbutton");
        abortButton.setAttribute("class", "uiEditorFooterToolBarCloseButton");
        abortButton.setAttribute("tooltiptext", Editor.getStringbundleString("editorGuidedTagInserterAbortButton.tooltip"));
        abortButton.setAttribute("id", "uiPromptBoxAbortButton");
        abortButton.addEventListener("command", this, true);

        return abortButton;
    },

    handleEvent: function (aEvent) {
        var enteredText = null;

        /* DEBUG */ dump("Yulup:guidedtaginserter.js:GuidedTagInserter:handleEvent(\"" + aEvent + "\") invoked\n");

        if (aEvent.type == "keypress") {
            switch (aEvent.target.getAttribute("id")) {
                case "uiPromptBoxTextbox":
                    if (aEvent.keyCode == Components.interfaces.nsIDOMKeyEvent.DOM_VK_RETURN ||
                        aEvent.keyCode == Components.interfaces.nsIDOMKeyEvent.DOM_VK_ENTER) {
                        // get entered text
                        enteredText = this.promptTextBox.value;

                        // dispatch to next stage
                        switch (this.promptStage) {
                            case this.PROMPT_STAGE_TAGNAME:
                                // handle entered text
                                if (enteredText == "") {
                                    // nothing entered means directly abort prompting
                                    this.finishPrompting(null, null);
                                } else {
                                    // add it to the new tag string
                                    this.tagName  = enteredText;
                                    this.newTag  += "<" + enteredText;

                                    // enter next stage
                                    this.promptAttributeName();
                                }
                                break;
                            case this.PROMPT_STAGE_ATTRNAME:
                                // handle entered text
                                if (enteredText == "") {
                                    // nothing entered means abort prompting for attributes
                                    this.promptEmptyTag();
                                } else {
                                    // add it to the new tag string
                                    this.newTag += " " + enteredText + "=";

                                    // enter next stage
                                    this.promptAttributeValue();
                                }
                                break;
                            case this.PROMPT_STAGE_ATTRVALUE:
                                // handle entered text
                                this.newTag += "\"" + enteredText + "\"";

                                // enter next stage
                                this.promptAttributeName();
                                break;
                            default:
                        }
                    }
                    break;
                case "uiPromptBoxNonEmptyButton":
                    if (aEvent.keyCode == Components.interfaces.nsIDOMKeyEvent.DOM_VK_RETURN ||
                        aEvent.keyCode == Components.interfaces.nsIDOMKeyEvent.DOM_VK_ENTER) {
                        // emulate keyboard activation for platform Mac
                        aEvent.target.doCommand();
                    }
                    break;
                default:
            }
        } else if (aEvent.type == "command") {
            switch (aEvent.target.getAttribute("id")) {
                case "uiPromptBoxAbortButton":
                    this.finishPrompting(null, null);
                    break;
                case "uiPromptBoxNonEmptyButton":
                    this.newTag += ">";
                    this.finishPrompting(this.newTag, "</" + this.tagName + ">");
                    break;
                case "uiPromptBoxEmptyButton":
                    this.newTag += "/>";
                    this.finishPrompting(this.newTag, null);
                    break;
                default:
            }
        }
    }
};
