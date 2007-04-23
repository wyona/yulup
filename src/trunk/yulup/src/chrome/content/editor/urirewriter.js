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

/**
 * URIRewriter constructor. Instantiates a new object of
 * type URIRewriter.
 *
 * Rewrites URIs on the go as DOM nodes are created as
 * well as on request.
 *
 * Note that this type implements the nsIDOMEventListener
 * interface.
 *
 * @constructor
 * @param  {View}        aView the view to operate on
 * @return {URIRewriter}
 */
function URIRewriter(aView) {
    /* DEBUG */ YulupDebug.ASSERT(aView != null);
    /* DEBUG */ YulupDebug.ASSERT(aView instanceof View);

    this.__view = aView;

    this.__ioService = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);
};

URIRewriter.prototype = {
    __view     : null,
    __ioService: null,

    /**
     * Rewrite image URIs to display images which are
     * referenced relatively to the current location.
     *
     * Adds a __yulupOriginalURI property which
     * contains the original URI of the image.
     *
     * @return {Undefined} does not have a return value
     */
    rewriteURIs: function() {
        var targetNodes = null;
        var baseURI     = null;

        /* DEBUG */ dump("Yulup:urirewriter.js:URIRewriter.rewriteURIs() invoked\n");

        // TODO: nsIHTMLEditor.getLinkedObjects() may prodive us with a more extensive link list

        if (this.__view.model.documentReference && (baseURI = this.__view.model.documentReference.getBaseURI()) != null) {
            // image URI rewriting
            targetNodes = this.__view.editor.contentDocument.images;

            for (var i = 0; i < targetNodes.length; i++) {
                this.__rewriteImgURI(targetNodes.item(i), baseURI);
            }

            // anchor URI rewriting
            /*
            targetNodes = this.__view.editor.contentDocument.links;

            for (var i = 0; i < targetNodes.length; i++) {
                this.__rewriteAURI(targetNodes.item(i), baseURI);
            }
            */

            // link URI rewriting
            targetNodes = this.__view.editor.contentDocument.getElementsByTagName("link");

            for (var i = 0; i < targetNodes.length; i++) {
                this.__rewriteLinkURI(targetNodes.item(i), baseURI);
            }
        }
    },

    handleEvent: function (aEvent) {
        var baseURI     = null;

        /* DEBUG */ dump("Yulup:urirewriter.js:URIRewriter.handleEvent(\"" + aEvent.target + "\") invoked\n");

        if (this.__view.model.documentReference && (baseURI = this.__view.model.documentReference.getBaseURI()) != null) {
            if (aEvent.target instanceof HTMLImageElement) {
                this.__rewriteImgURI(aEvent.target, baseURI);
            } else if (aEvent.target instanceof HTMLAnchorElement) {
                this.__rewriteAURI(aEvent.target, baseURI);
            }
        }
    },

    __rewriteImgURI: function(aNode, aBaseURI) {
        var originalURI = null;
        var newURI      = null;

        originalURI = aNode.getAttribute("src");

        /* DEBUG */ dump("Yulup:urirewriter.js:URIRewriter.__rewriteImgURI: rewriting image URI \"" + originalURI + "\"\n");

        try {
            newURI = this.__ioService.newURI(originalURI, null, aBaseURI);

            aNode.setAttribute("src", encodeURI(newURI.spec));
            aNode.__yulupOriginalURI = encodeURI(originalURI);

            /* DEBUG */ dump("Yulup:urirewriter.js:URIRewriter.__rewriteImgURI: new image URI is \"" + aNode.getAttribute("src") + "\"\n");
        } catch (exception) {
            /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:urirewriter.js:URIRewriter.__rewriteImgURI", exception);
        }
    },

    __rewriteAURI: function(aNode, aBaseURI) {
        var originalURI = null;
        var newURI      = null;

        // TODO: don't rewrite links
        return;

        originalURI = aNode.getAttribute("href");

        /* DEBUG */ dump("Yulup:urirewriter.js:URIRewriter.__rewriteAURI: rewriting anchor URI \"" + originalURI + "\"\n");

        // check if this anchor is used as a link or a target
        if (originalURI) {
            try {
                newURI = this.__ioService.newURI(originalURI, null, aBaseURI);

                aNode.setAttribute("href", encodeURI(newURI.spec));
                aNode.__yulupOriginalURI = encodeURI(originalURI);

                /* DEBUG */ dump("Yulup:urirewriter.js:URIRewriter.__rewriteAURI: new anchor URI is \"" + aNode.getAttribute("href") + "\"\n");
            } catch (exception) {
                /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:urirewriter.js:URIRewriter.__rewriteAURI", exception);
            }
        }
    },

    __rewriteLinkURI: function(aNode, aBaseURI) {
        var originalURI = null;
        var newURI      = null;

        originalURI = aNode.getAttribute("href");

        /* DEBUG */ dump("Yulup:urirewriter.js:URIRewriter.__rewriteLinkURI: rewriting link URI \"" + originalURI + "\"\n");

        try {
            newURI = this.__ioService.newURI(originalURI, null, aBaseURI);

            aNode.setAttribute("href", encodeURI(newURI.spec));
            aNode.__yulupOriginalURI = encodeURI(originalURI);

            /* DEBUG */ dump("Yulup:urirewriter.js:URIRewriter.__rewriteLinkURI: new link URI is \"" + aNode.getAttribute("href") + "\"\n");
        } catch (exception) {
            /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:urirewriter.js:URIRewriter.__rewriteLinkURI", exception);
        }
    }
};
