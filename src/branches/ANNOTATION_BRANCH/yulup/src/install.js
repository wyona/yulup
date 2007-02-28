var err = initInstall("Wyona Yulup Editor (Prototype 1)", "yulup-prototype-1@wyona.com", "0.1.8");
logComment("initInstall(): " + err);

var fProgram = getFolder("Program");

err = addDirectory("", "0.1.8", "chrome", fProgram, "chrome/yulup-prototype-1@wyona.com", true);
logComment("addDirectory() chrome: " + err);

registerChrome(CONTENT | DELAYED_CHROME, getFolder("Chrome"), "yulup-prototype-1@wyona.com/content/");
registerChrome(LOCALE | DELAYED_CHROME, getFolder("Chrome"), "yulup-prototype-1@wyona.com/locale/");
registerChrome(SKIN | DELAYED_CHROME, getFolder("Chrome"), "yulup-prototype-1@wyona.com/skin/");

if (err == SUCCESS) {
    performInstall();
    logComment("performInstall() returned: " + err);
} else {
    cancelInstall(err);
    logComment("cancelInstall() due to error: "+err);
}
