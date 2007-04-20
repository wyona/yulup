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

// for definitions of constants, see http://lxr.mozilla.org/mozilla1.8.0/source/nsprpub/pr/include/prio.h
const PR_RDONLY      = 0x01;
const PR_WRONLY      = 0x02;
const PR_RDWR        = 0x04;
const PR_CREATE_FILE = 0x08;
const PR_APPEND      = 0x10;
const PR_TRUNCATE    = 0x20;
const PR_SYNC        = 0x40;
const PR_EXCL        = 0x80;

const PERMS_FILE = 0644;

var PersistenceService = {
    FILETYPE_TEXT  : 0,
    FILETYPE_BINARY: 1,

    /**
     * Return a file descriptor for a given platform-specific
     * path.
     *
     * @param  {String}       aFilePath the platform-specific path to the file to return
     * @return {nsILocalFile}           returns a file descriptor or null on error
     */
    getFileDescriptor: function (aFilePath) {
        var localFile = null;

        /* DEBUG */ dump("Yulup:persistenceservice.js:PersistenceService.getFileDescriptor(\"" + aFilePath + "\") invoked\n");

        try {
            localFile = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
            localFile.initWithPath(aFilePath);

            return localFile;
        } catch (exception) {
            /* DEBUG */ dump("Yulup:persistenceservice.js:PersistenceService.getFileDescriptor: cannot retrieve file descriptor for path \"" + aFilePath + "\".\n");
            /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:persistenceservice.js:PersistenceService.getFileDescriptor", exception);

            return null;
        }
    },

    /**
     * Open a file picker dialog to open a file from the file system.
     *
     * @param  {Number} aFileType  the file type to open (FILETYPE_TEXT or FILETYPE_BINARY, or null)
     * @return {nsIFileURL} returns the selected URI or null if selection was aborted
     */
    queryOpenFileURI: function (aFileType) {
        var documentURI   = null;
        var nsIFilePicker = null;
        var filePicker    = null;

        /* DEBUG */ dump("Yulup:persistenceservice.js:PersistenceService.queryOpenFileURI() invoked\n");

        // open file picker dialog for local file system
        nsIFilePicker = Components.interfaces.nsIFilePicker;
        filePicker    = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);

        filePicker.init(window, document.getElementById("uiYulupEditorStringbundle").getString("editorFilePickerOpen.label"), nsIFilePicker.modeOpen);

        if (aFileType != null) {
            switch (aFileType) {
                case PersistenceService.FILETYPE_TEXT:
                    filePicker.appendFilters(nsIFilePicker.filterHTML | nsIFilePicker.filterXML | nsIFilePicker.filterXUL | nsIFilePicker.filterText);
                    filePicker.appendFilter("XHTML Files", "*.xhtml; *.html");
                    break;
                case PersistenceService.FILETYPE_BINARY:
                    filePicker.appendFilters(nsIFilePicker.filterImages | nsIFilePicker.filterApps);
                    break;
                default:
            }
        }

        filePicker.appendFilters(nsIFilePicker.filterAll);

        if (filePicker.show() == nsIFilePicker.returnOK) {
            // cast nsIFileURL to nsIURI
            documentURI = filePicker.fileURL;
            documentURI.QueryInterface(Components.interfaces.nsIURI);

            /* DEBUG */ dump("Yulup:persistenceservice.js:PersistenceService.queryOpenFileURI: selected documentURI: \"" + documentURI.spec + "\"\n");

            return documentURI;
        }

        // user aborted
        return null;
    },

    /**
     * Open a file picker dialog to open a file from the CMS.
     *
     * @return {nsIURI} returns the selected URI or null if selection was aborted
     */
    queryOpenCMSURI: function () {
        /* DEBUG */ dump("Yulup:persistenceservice.js:PersistenceService.queryOpenCMSURI() invoked\n");

        throw Components.results.NS_ERROR_NOT_IMPLEMENTED;

        return null;
    },

    /**
     * Open a file picker dialog to save to a file in the file system.
     *
     * @param  {String}       aDocument       the base name of the document to save
     * @param  {String}       aDocumentSuffix the extension of the document to save
     * @return {nsILocalFile}                 returns the selected file or null if selection was aborted
     */
    querySaveAsFileURI: function (aDocumentName, aDocumentSuffix) {
        var nsIFilePicker    = null;
        var filePicker       = null;
        var filePickerResult = null;

        /* DEBUG */ dump("Yulup:persistenceservice.js:PersistenceService.querySaveAsFileURI() invoked\n");

        nsIFilePicker = Components.interfaces.nsIFilePicker;
        filePicker    = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);

        filePicker.init(window, document.getElementById("uiYulupEditorStringbundle").getString("editorFilePickerSaveAs.label"), nsIFilePicker.modeSave);

        // query model for file name and suffix
        if (aDocumentName && aDocumentSuffix) {
            // document already has a file name
            filePicker.defaultString = aDocumentName + "." + aDocumentSuffix;
        }

        if (aDocumentSuffix) {
            // set appropriate default extension if available
            filePicker.defaultExtension = aDocumentSuffix;
        }

        filePickerResult = filePicker.show();

        if (filePickerResult == nsIFilePicker.returnOK || filePickerResult == nsIFilePicker.returnReplace) {
            // user selected a file to save to
            return filePicker.file;
        }

        // user aborted
        /* DEBUG */ dump("Yulup:persistenceservice.js:PersistenceService.querySaveAsFileURI: user aborted selection");

        return null;
    },

    /**
     * Open a file picker dialog to save to a file in the CMS.
     *
     * @return {nsIURI} returns the selected file or null if selection was aborted
     */
    querySaveAsCMSURI: function () {
        /* DEBUG */ dump("Yulup:persistenceservice.js:PersistenceService.querySaveAsCMSURI() invoked\n");

        throw Components.results.NS_ERROR_NOT_IMPLEMENTED;

        return null;
    },

    /**
     * Save a document to the file system.
     *
     * @param  {nsILocalFile} aFile     the file to save to
     * @param  {String}       aDocument the document to save
     * @return {Boolean}                returns true if document could be saved, false otherwise
     */
    persistToFile: function (aFile, aDocument) {
        var fileStream       = null;
        var unicodeConverter = null;
        var unicodeDoc       = null;

        /* DEBUG */ dump("Yulup:persistenceservice.js:PersistenceService.persistToFile(\"" + aFile + "\", \"" + aDocument + "\") invoked\n");

        /* NOTE: as long as we use a text document as a model, use
         * this routine to save the document. When switching to a
         * DOM based representation, use nsIWebBrowserPersist to
         * directly save the DOM and related files like images
         * to disk. */
        try {
            fileStream       = Components.classes["@mozilla.org/network/safe-file-output-stream;1"].createInstance(Components.interfaces.nsIFileOutputStream);
            unicodeConverter = Components.classes["@mozilla.org/intl/scriptableunicodeconverter"].createInstance(Components.interfaces.nsIScriptableUnicodeConverter);

            fileStream.init(aFile, PR_WRONLY | PR_CREATE_FILE | PR_TRUNCATE, PERMS_FILE, 0);

            fileStream.QueryInterface(Components.interfaces.nsISafeOutputStream);

            unicodeConverter.charset = "UTF-8";
            unicodeDoc  = unicodeConverter.ConvertFromUnicode(aDocument);
            unicodeDoc += unicodeConverter.Finish();

            fileStream.write(unicodeDoc, unicodeDoc.length);
            fileStream.flush();
            fileStream.finish();

            /* DEBUG */ dump("Yulup:persistenceservice.js:PersistenceService.persistToFile: finished saving document to file \"" + aFile.path + "\".\n");

            return true;
        } catch (exception) {
            /* DEBUG */ dump("Yulup:persistenceservice.js:PersistenceService.persistToFile: failed to save document to file \"" + aFile.path + "\".\n");

            /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:persistenceservice.js:PersistenceService.persistToFile", exception);

            alert("Unable to save document to file \"" + aFile.path + "\".");

            return false;
        }
    }
}
