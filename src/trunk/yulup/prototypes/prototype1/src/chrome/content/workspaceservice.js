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

var WorkspaceService = {
    /**
     * Maps a URI to a location in the workspace.
     *
     * @param  {nsIURI}  aURI the URI
     * @return {nsIFile} the file the URI points to
     */
    __translateURI: function (aURI) {
        var url      = null;
        var hostname = null;
        var path     = null;
        var resource = null;

        url = aURI.QueryInterface(Components.interface.nsIURL);

        // extract domain
        hostname = aURI.host;

        // extract path and resource name
        path     = url.directory;
        resource = url.fileName;
    },

    /**
     * Change to the indicated directory and return
     * its file descriptor. If the directory does not
     * exists, it is created first.
     *
     * @param  {String}  aDirName the name of the directory to change to
     * @return {nsIFile} returns the changed to directory, or null if not succeeded
     */
    __changeOrCreate: function (aDirName) {

    },

    /**
     * Returns the path to the workspace.
     *
     * @return {String} the workspace path, or null if not available
     */
    getWorkspacePath: function () {
        var workspace = null;
        var fileURI   = null;
        var file      = null;
        var wsOk      = false;

        /* DEBUG */ dump("Yulup:workspaceservice.js:getWorkspacePath() invoked\n");

        if (((workspace = YulupPreferences.getCharPref("workspace.", "location")) != null) && workspace != "") {
            // check if workspace exists and is writable
            try {
                fileURI = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService).newURI(workspace, null, null);

                file = fileURI.QueryInterface(Components.interfaces.nsIFileURL).file;

                if (file.exists() && file.isDirectory() && file.isWritable()) {
                    /* DEBUG */ dump("Yulup:workspaceservice.js:getWorkspacePath: \"" + file.path + "\" is indeed a directory, exists and is writable\n");
                    wsOk = true;
                }
            } catch (exception) {
                /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:workspaceservice.js:getWorkspacePath", exception);
                /* DEBUG */ Components.utils.reportError(exception);
            }
        }

        return (wsOk ? workspace : null);
    },

    /**
     * Returns a file pointer to the resource in the
     * workspace for the given URI, or null if such a
     * resource does not exist.
     *
     * @param  {nsIURI}  aURI the URI
     * @return {nsIFile} the file the URI points to, or null, if no such resource exists
     */
    getResource: function (aURI) {

    },

    /**
     * Returns the metadata for a given resource, or null
     * if not existing.
     *
     * @param  {nsIURI} aURI the URI
     * @return {String} the metadata of the given resource, or null if non-existent
     */
    getResourceMetadata: function (aURI) {

    },

    /**
     * Add the resource with the given URI to the
     * workspace. If aDocument is null, then the resource
     * is retrieved from the given URI, otherwise the
     * document is stored for the given URI.
     *
     * @param  {nsIURI}  aURI      the URI
     * @param  {String}  aDocument the document to store, or null if the resource should be fetched from aURI
     * @param  {String}  aMetadata the document's metadata, or null if unavailable
     * @return {Boolean} returns true if the resouce was successfully added to the workspace, false otherwise
     */
    addResource: function (aURI, aDocument, aMetadata) {
        var target   = null;
        var document = null;

        // get target file descriptor
        target = PersistenceService.getFileDescriptor(WorkspaceService.__translateURI(aURI));

        if (!aDocument) {
            // fetch object first
        } else {
            document = aDocument;
        }

        PersistenceService.persistToFile(target, document);
    },

    /**
     * Removes the resource and its metadata (if existing) for
     * the given URI from the workspace.
     *
     * @param  {nsIURI}    aURI the URI
     * @return {Undefined} does not have a return value
     */
    removeResource: function (aURI) {

    }
}
