
function buildNewMenu(aTemplatesArray, aMenuPopup, aMenu, aCommand) {
    var menuItem = null;

    /* DEBUG */ dump("Yulup:newmenu.js:Yulup.buildNewMenu() invoked\n");

    if (aTemplatesArray.length > 0) {

        for (var i = 0; i < aTemplatesArray.length; i++) {
            menuItem = document.createElementNS(NAMESPACE_XUL, "menuitem");

            menuItem.setAttribute("label", aTemplatesArray[i].name);
            menuItem.setAttribute("tooltiptext", aTemplatesArray[i].name);
            menuItem.setAttribute("disabled", "false");
            menuItem.setAttribute("oncommand", aCommand + "(\"" + aTemplatesArray[i].name + "\")");

            aMenuPopup.appendChild(menuItem);
        }

        aMenu.setAttribute("disabled", "false");

    } else {

        aMenu.setAttribute("disabled", "true");

    }
}