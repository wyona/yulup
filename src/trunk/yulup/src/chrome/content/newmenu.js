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

const YulupMenuBuilder = {
    /**
     * Converts a mime-type to a entity.
     *
     * @param  {String} aContext  the context of the mime-type related resource (e.g new, delete)
     * @param  {String} aType     the requested entity type (e.g tooltip or label)
     * @param  {String} aMimeType the mime-type identifier
     * @return {String}           the entity name belonging to this mime-type
     */
    mimeTypeToEntity: function (aContext, aType, aMimeType) {
        var entity = null;

        /* DEBUG */ dump("Yulup:newmenu.js:mimeTypeToEntity() invoked\n");

        return aContext + "." + aMimeType.replace(/\//g, ".").replace(/\+/g, ".") + "." + aType;
    },

    buildNewMenu: function (aTemplatesArray, aMenuPopup, aMenu, aCommand) {
        var menuItem = null;

        /* DEBUG */ dump("Yulup:newmenu.js:Yulup.buildNewMenu() invoked\n");

        if (aTemplatesArray.length > 0) {
            for (var i = 0; i < aTemplatesArray.length; i++) {
                menuItem = document.createElementNS(NAMESPACE_XUL, "menuitem");

                menuItem.setAttribute("label", document.getElementById("uiYulupEditorStringbundle").getString(this.mimeTypeToEntity("new", "label", aTemplatesArray[i].mimeType)));
                menuItem.setAttribute("tooltiptext", document.getElementById("uiYulupEditorStringbundle").getString(this.mimeTypeToEntity("new", "tooltip", aTemplatesArray[i].mimeType)));
                menuItem.setAttribute("disabled", "false");
                menuItem.setAttribute("oncommand", aCommand + "(\"" + aTemplatesArray[i].name + "\")");

                aMenuPopup.appendChild(menuItem);
            }

            aMenu.setAttribute("disabled", "false");
        } else {
            aMenu.setAttribute("disabled", "true");
        }
    }
};
