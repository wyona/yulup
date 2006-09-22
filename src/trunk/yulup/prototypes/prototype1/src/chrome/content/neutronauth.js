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
 * This module contains code implementing the Neutron-Auth
 * specification (see http://www.wyona.org/osr-101/osr-101.xhtml).
 */

const NEUTRON_AUTH_10_NAMESPACE = "http://www.wyona.org/neutron/1.0";

var NeutronAuth = {
    /**
     * Authenticate using the Neutron-Auth authentication
     * scheme.
     *
     * @param  {String}      aChallenge    the authentication challenge
     * @param  {HTTPRequest} aRequest      the request which triggered authentication
     * @param  {Boolean}     aFirstAttempt is this the first authentication attempt in a logical transaction
     * @return {Undefined} does not have a return value
     * @throws {NeutronAuthException}
     */
    authenticate: function (aChallenge, aRequest, aFirstAttempt) {
        var challenge   = null;
        var credentials = null;
        var response    = null;
        var context     = null;

        /* DEBUG */ dump("Yulup:neutronauth.js:NeutronAuth.authenticate(\"" + aChallenge + "\", \"" + aRequest + "\", \"" + aFirstAttempt + "\") invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aChallenge    != null);
        /* DEBUG */ YulupDebug.ASSERT(aRequest      != null);
        /* DEBUG */ YulupDebug.ASSERT(aRequest      instanceof HTTPRequest);
        /* DEBUG */ YulupDebug.ASSERT(aFirstAttempt != null);

        challenge = NeutronAuth.__parseChallenge(aChallenge);

        /* Inform the user about the failed authentication attempt if this
         * is not the first attempt from the user point-of-view of a logical
         * transaction. */
        if (!aFirstAttempt)
            Authentication.reportAuthenticationFailure(challenge.realm, challenge.message);

        if ((credentials = Authentication.showAuthenticationDialog(challenge)) != null) {
            response = NeutronAuth.__constructResponse(challenge, credentials);

            context = {
                request  : aRequest,
                message  : challenge.message,
                realm    : challenge.realm,
                logoutURI: challenge.logoutUrl
            };

            /* POSTing credentials. The trick is to disable authentication in this
             * request in order to come back here directly. Enable header passing,
             * because we might need them if this authentication attempt fails. */
            NetworkService.httpRequestPOST(challenge.url, null, response, "text/xml", NeutronAuth.__requestFinishedHandler, context, true, false);
        } else {
            // user did not want to authenticate
            /* DEBUG */ dump("Yulup:neutronauth.js:NeutronAuth.authenticate: user didn't want to authenticate\n");

            throw new YulupException("Yulup:neutronauth.js:NeutronAuth.authenticate: authentication aborted.");
        }
    },

    __requestFinishedHandler: function (aDocumentData, aResponseStatusCode, aContext, aResponseHeaders) {
        /* DEBUG */ dump("Yulup:neutronauth.js:NeutronAuth.__requestFinishedHandler() invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aResponseStatusCode != null);
        /* DEBUG */ YulupDebug.ASSERT(aContext            != null);
        /* DEBUG */ YulupDebug.ASSERT(aContext.request    != null);
        /* DEBUG */ YulupDebug.ASSERT(aContext.realm      != null);
        /* DEBUG */ YulupDebug.ASSERT(aContext.logoutURI  != null);

        try {
            if (aResponseStatusCode == 200) {
                Authentication.addRealmToYulupMenu(aContext.realm, aContext.logoutURI);

                // success, we are authenticated, restart initial request
                NetworkService.performHTTPRequest(aContext.request);
            } else {
                // retry authentication with new challenge (may not be Neutron-Auth this time)
                NetworkService.authenticate(aContext.request, aResponseHeaders, aDocumentData, false);
            }
        } catch (exception) {
            /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:neutronauth.js:NeutronAuth.__requestFinishedHandler", exception);
            // initial request failed to restart or authentication could not be initiated, report this to the creator of the original request
            aContext.request.requestFinishedCallback(aDocumentData, aResponseStatusCode, aContext.request.context, null, exception);
        }
    },

    __constructResponse: function (aChallenge, aCredentials) {
        var field    = null;
        var respBody = "";

        /* DEBUG */ YulupDebug.ASSERT(aChallenge   != null);
        /* DEBUG */ YulupDebug.ASSERT(aCredentials != null);

        respBody += "<?xml version=\"1.0\"?> \n<authentication xmlns=\"" + NEUTRON_AUTH_10_NAMESPACE + "\"> \n";

        for (field in aCredentials) {
            respBody += "  <param name=\"" + field + "\"" + ">" + aCredentials[field] + "</param> \n";
        }

        respBody += "  <original-request url=\"" + aChallenge.originalUrl + "\"/>\n";
        respBody += "</authentication>\n";

        /* DEBUG */ dump("Yulup:neutronauth.js:NeutronAuth.__constructResponse: respBody =\n" + respBody + "\n");

        return respBody;
    },

    /**
     * Parse a Neutron-Auth challenge.
     *
     * @param  {String}    aChallenge a Neutron-Auth challenge as delivered by a request response
     * @return {Undefined} does not have a return value
     */
    __parseChallenge: function (aChallenge) {
        var xmlDocument  = null;
        var documentRoot = null;
        var challenge    = null;

        /* DEBUG */ dump("Yulup:neutronauth.js:NeutronAuth.__parseChallenge(\"" + aChallenge + "\") invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aChallenge != null);

        // parse XML message to DOM
        xmlDocument = (new DOMParser()).parseFromString(aChallenge, "text/xml");

        documentRoot = xmlDocument.documentElement;
        if ((documentRoot.tagName == "parserError") || (documentRoot.namespaceURI == "http://www.mozilla.org/newlayout/xml/parsererror.xml")) {
            // problem parsing the challenge
            throw new NeutronAuthException("Yulup:neutronauth.js:NeutronAuth.__parseChallenge: Neutron-Auth challenge not well-formed. The challenge string was = \"" + aChallenge + "\".");
        } else {
            // challenge ok, pass it on to the Neutron-Auth parser
            challenge = NeutronAuth.__parserFactory(xmlDocument, null).parseChallenge();
        }

        return challenge;
    },

    /**
     * Instantiates a parser corresponding to the Neutron-Auth version
     * used.
     *
     * @param  {nsIDOMXMLDocument} aDocument the Neutron-Auth document to parse
     * @return {NeutronAuthParser} the Neutron-Auth parser best matching the used Neutron-Auth version
     * @throws {NeutronAuthException}
     */
    __parserFactory: function (aDocument) {
        var namespace         = null;
        var neutronAuthParser = null;

        /* DEBUG */ dump("Yulup:neutronauth.js:NeutronAuth.__parserFactory(\"" + aDocument + "\") invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aDocument != null);

        // extract Neutron-Auth version
        switch (aDocument.documentElement.namespaceURI) {
            case NEUTRON_AUTH_10_NAMESPACE:
                // instantiate Neutron-Auth 1.0 parser
                neutronAuthParser = new NeutronAuthParser10(aDocument);
                break;
            default:
                // no parser available for this version
                throw new NeutronAuthException("Yulup:neutronauth.js:NeutronAuth.__parserFactory: Neutron-Auth version \"" + aDocument.documentElement.namespaceURI + "\" not supported.");
        }

        return neutronAuthParser;
    }
};


/**
 * NeutronAuthException constructor. Instantiates a new object of
 * type NeutronAuthException.
 *
 * Exceptions of this type are not exceptions as thrown by the
 * server, but signal error conditions in the actual parser
 * or helper functions.
 *
 * @constructor
 * @param  {String}               aMessage a descriptive error message
 * @return {NeutronAuthException}
 */
function NeutronAuthException(aMessage) {
    this.message = aMessage;
    this.name    = "NeutronAuthException";
}

NeutronAuthException.prototype.__proto__ = Error.prototype;


/**
 * NeutronAuthChallenge constructor. Instantiates a new object of
 * type NeutronAuthChallenge.
 *
 * @constructor
 * @param  {String}               aMessage a descriptive message
 * @return {NeutronAuthChallenge}
 */
function NeutronAuthChallenge(aMessage) {
    /* DEBUG */ dump("Yulup:neutronparser10.js:NeutronAuthChallenge(\"" + aMessage + "\") invoked\n");

    this.message = aMessage;
}

/**
 * @field {String} message     a textual description of the authentication reason
 * @field {String} url         the URI which triggered this authentication request
 * @field {String} originalUrl the original documentURI, MAY differ from url
 * @field {String} logoutUrl   the URI to terminate the session
 * @field {Array}  params      array of the login form fields
 * @field {String} infoMessage a textual description of what the user is expected to do
 * @field {String} realm       the realm
 */
NeutronAuthChallenge.prototype = {
    message    : null,
    url        : null,
    originalUrl: null,
    logoutUrl  : null,
    params     : null,
    infoMessage: null,
    realm      : null
};


/**
 * NeutronAuthParser constructor. Instantiates a new object of
 * type NeutronAuthParser.
 *
 * Base class for versioned Neutron-Auth parsers.
 *
 * @constructor
 * @return {NeutronAuthParser}
 */
function NeutronAuthParser() {}
