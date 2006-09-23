
/**
 * Converts a mime-type to a entity.
 *
 * @param  {String} aContext  the context of the mime-type related resource (e.g new, delete)
 * @param  {String} aType     the requested entity type (e.g tooltip or label)
 * @param  {String} aMimeType the mime-type identifier
 * @return {String}           the entity name belonging to this mime-type 
 */
function mimeTypeToEntity(aContext, aType, aMimeType) {
    var entity = null;

    /* DEBUG */ dump("Yulup:newmenu.js:mimeTypeToEntity() invoked\n");

    return aContext + "." + aMimeType.replace(/\//g, ".").replace(/\+/g, ".") + "." + aType;
}


function buildNewMenu(aTemplatesArray, aMenuPopup, aMenu, aCommand) {
    var menuItem = null;

    /* DEBUG */ dump("Yulup:newmenu.js:Yulup.buildNewMenu() invoked\n");

    if (aTemplatesArray.length > 0) {

        for (var i = 0; i < aTemplatesArray.length; i++) {
            menuItem = document.createElementNS(NAMESPACE_XUL, "menuitem");

            menuItem.setAttribute("label", document.getElementById("uiYulupEditorStringbundle").getString(mimeTypeToEntity("new", "label", aTemplatesArray[i].mimeType)));
            menuItem.setAttribute("tooltiptext", document.getElementById("uiYulupEditorStringbundle").getString(mimeTypeToEntity("new", "tooltip", aTemplatesArray[i].mimeType)));
            menuItem.setAttribute("disabled", "false");
            menuItem.setAttribute("oncommand", aCommand + "(\"" + aTemplatesArray[i].name + "\")");

            aMenuPopup.appendChild(menuItem);
        }

        aMenu.setAttribute("disabled", "false");

    } else {

        aMenu.setAttribute("disabled", "true");

    }
}