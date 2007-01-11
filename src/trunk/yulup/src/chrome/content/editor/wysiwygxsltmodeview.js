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
 * @author Thomas Comiotto
 *
 */

const SOURCETAGGER_CHROME_URI = "chrome://yulup/content/editor/sourcetagger.xsl";

const XSL_NAMESPACE_URI   = "http://www.w3.org/1999/XSL/Transform";
const YULUP_NAMESPACE_URI = "http://www.yulup.org/Editor/LocationPath";

/**
 * WYSIWYGXSLTModeView constructor. Instantiates a new object of
 * type WYSIWYGXSLTModeView.
 *
 * Subtype of type WYSIWYGModeView.
 *
 * @constructor
 * @param  {YulupEditStateController}   aEditorController  the editor's state machine
 * @param  {Model}                      aModel             the model associated with this view
 * @param  {Function}                   aShowViewCommand   a function to call to show the current view
 * @param  {Barrier}                    aBarrier           the barrier on which to synchronise after setUp()
 * @param  {XMLDocument}                aXMLStyleDocument  the style this view represents
 * @param  {XMLDocument}                aStyleTemplate     the style template
 * @param  {String}                     aStyleTemplateMode how the styleTemplate should be applied (pre/post transformation)
 * @return {WYSIWYGXSLTModeView}
 */
function WYSIWYGXSLTModeView(aEditorController, aModel, aShowViewCommand, aBarrier, aXMLStyleDocument, aStyleTemplate, aStyleTemplateMode) {
    /* DEBUG */ dump("Yulup:wysiwygxsltmodeview.js:WYSIWYGXSLTModeView(\"" + aEditorController + "\", \"" + aModel + "\", \"" + aShowViewCommand + "\", \"" + aBarrier + "\", \"" + aXMLStyleDocument + "\" , \"" + aStyleTemplate + "\") invoked.\n");

    /* DEBUG */ YulupDebug.ASSERT(aEditorController != null);
    /* DEBUG */ YulupDebug.ASSERT(aModel            != null);
    /* DEBUG */ YulupDebug.ASSERT(aShowViewCommand  != null);
    /* DEBUG */ YulupDebug.ASSERT(aXMLStyleDocument != null);
    /* DEBUG */ YulupDebug.ASSERT(aStyleTemplate ? aStyleTemplateMode != null : true);

    // call super constructor
    WYSIWYGModeView.call(this, aEditorController, aModel, aShowViewCommand, aBarrier);

    // Get xml serializer
    this.xmlSerializer = Components.classes["@mozilla.org/xmlextras/xmlserializer;1"].getService(Components.interfaces.nsIDOMSerializer);


    if (aStyleTemplate != null) {

        this.styleTemplate = Components.classes["@mozilla.org/xml/xml-document;1"].createInstance(Components.interfaces.nsIDOMXMLDocument);
        this.styleTemplate.async = false;

        if (!this.styleTemplate.load(aStyleTemplate.loadURI.spec)) {
            throw new YulupEditorException("wysiwygxsltmodeview.js:WYSIWYGXSLTModeView: loading style template \"" + aXMLStyleTemplate.loadURI.spec + "\" failed.");
        }
        this.styleTemplateMode = aStyleTemplateMode;
    }

    this.sourceTaggerXSL = Components.classes["@mozilla.org/xml/xml-document;1"].createInstance(Components.interfaces.nsIDOMXMLDocument);
    this.sourceTaggerXSL.async = false;

    if (!this.sourceTaggerXSL.load(SOURCETAGGER_CHROME_URI)) {
        throw new YulupEditorException("wysiwygxsltmodeview.js:WYSIWYGXSLTModeView: loading XSLT file \"" + SOURCETAGGER_CHROME_URI + "\" failed.");
    }

    this.documentXSL = Components.classes["@mozilla.org/xml/xml-document;1"].createInstance(Components.interfaces.nsIDOMXMLDocument);
    this.documentXSL.async = false;

    if (!this.documentXSL.load(aXMLStyleDocument.loadURI.spec)) {
        throw new YulupEditorException("wysiwygxsltmodeview.js:WYSIWYGXSLTModeView: loading XSLT file \"" + aXMLStyleDocument.loadURI.spec + "\" failed.");
    }

    this.patchDocumentStyle(this.documentXSL);
}

WYSIWYGXSLTModeView.prototype = {
    __proto__: WYSIWYGModeView.prototype,

    documentXSL               : null,
    defaultNamespace          : null,
    sourceTaggerXSL           : null,
    styleTemplate             : null,
    domDocument               : null,
    xhtmlDocument             : null,
    xmlSerializer             : null,
    xPathToolBarVisible       : true,
    isNamespaceAware          : true,
    currentSourceSelectionPath: null,
    currentXHTMLNode          : null,
    currentSourceNode         : null,
    nsAwareLocationPathCache  : null,
    nsUnawareLocationPathCache: null,

    /**
     * Initialise the current view.
     *
     * Note that nsIHTMLEditor is also an nsIPlaintextEditor.
     *
     * @return {Undefined} does not have a return value
     */
    setUp: function () {
        var wysiwygXSLTEditor      = null;
        var keyBinding             = null;
        var selectionChangeHandler = null;
        var commandController      = null;
        var commandTable           = null;

        /* DEBUG */ dump("Yulup:wysiwygxsltmodeview.js:WYSIWYGXSLTModeView.setUp() invoked\n");

        try {
            /* DEBUG */ dump("Yulup:wysiwygxsltmodeview.js:WYSIWYGXSLTModeView.setUp: this.editor = \"" + this.editor + "\"\n");
            wysiwygXSLTEditor = this.editor;
            wysiwygXSLTEditor.makeEditable("html", false);

            this.view = wysiwygXSLTEditor.getEditor(wysiwygXSLTEditor.contentWindow);
            this.view.QueryInterface(Components.interfaces.nsIEditor);

            // hook up DocumentStateListener
            this.view.addDocumentStateListener(new DocumentStateListener(this.model));

            // disable object resizing
            this.view.QueryInterface(Components.interfaces.nsIHTMLObjectResizer);
            this.view.objectResizingEnabled = false;

            // disable absolute positioning
            this.view.QueryInterface(Components.interfaces.nsIHTMLAbsPosEditor);
            this.view.absolutePositioningEnabled = false;

            // disable inline table editing
            this.view.QueryInterface(Components.interfaces.nsIHTMLInlineTableEditor);
            this.view.inlineTableEditingEnabled = false;

            this.view.QueryInterface(Components.interfaces.nsIHTMLEditor);

            // make the caret visible even if the current selection is not collapsed
            this.view.selectionController.setCaretVisibilityDuringSelection(true);

            // set editor attributes
            this.view.enableUndo(true);
            this.view.returnInParagraphCreatesNewParagraph = false;

            // set the document URI
            wysiwygXSLTEditor.docShell.setCurrentURI(this.model.documentReference.getLoadURI());

            /* Due to the implementation of updateBaseURL, this is not going to work as
             * is, so we need a C++ call here (see
             * http://lxr.mozilla.org/mozilla1.8.0/source/editor/libeditor/html/nsHTMLEditor.cpp#1209). */
            this.view.updateBaseURL();

            wysiwygXSLTEditor.contentWindow.addEventListener("keypress", new CommandKeyListener(), true);
            wysiwygXSLTEditor.contentWindow.addEventListener("keypress", new WYSIWYGXSLTKeyPressListener(this), true);

            wysiwygXSLTEditor.contentWindow.addEventListener("keyup", new WYSIWYGXSLTKeyUpListener(this), true);

            if ((keyBinding = YulupPreferences.getCharPref("editor.", "keybinding")) != null) {
                switch (keyBinding) {
                    case "readline":
                        wysiwygXSLTEditor.contentWindow.addEventListener("keypress", new ReadlineKeyBindingsListener(wysiwygXSLTEditor), true);
                        break;
                    case "none":
                    default:
                }
            } else {
                // default to readline
                wysiwygXSLTEditor.contentWindow.addEventListener("keypress", new ReadlineKeyBindingsListener(wysiwygXSLTEditor), true);
            }

            /* Prevent keypress events from bubbling to work around
             * bug https://bugzilla.mozilla.org/show_bug.cgi?id=304188
             * (prevent keypress events from invoking FAYT). */
            wysiwygXSLTEditor.contentWindow.addEventListener("keypress", function (aKeyEvent) {
                                                                 aKeyEvent.stopPropagation();
                                                             }, true);

            selectionChangeHandler = new WYSIWYGXSLTSelectionChangeHandler(this);

            // hook up selection listeners
            this.addSelectionListener(new CutCopySelectionListener(this));
            this.addSelectionListener(new LocationPathSelectionListener(selectionChangeHandler));

            var nsCheckbox = document.getElementById("uiYulupXPathToolBarNSAwareCheckbox");
            nsCheckbox.addEventListener('CheckboxStateChange', new NSCheckboxStateChangeListener(this), true);

            this.view.transactionManager.clear();

            // hook up undo/redo observer
            wysiwygXSLTEditor.commandManager.addCommandObserver(this.undoRedoObserver, "cmd_undo");
            wysiwygXSLTEditor.commandManager.addCommandObserver(this.undoRedoObserver, "cmd_redo");

            // hook up URI rewriter
            this.editor.contentDocument.addEventListener("DOMNodeInserted", this.uriRewriter, true);

            // add our own command handlers
            commandController = Components.classes["@mozilla.org/embedcomp/base-command-controller;1"].createInstance(Components.interfaces.nsIControllerContext);
            commandController.init(null);

            // the context set via setCommandContext is passed as the third argument to each doCommand* call
            commandController.setCommandContext(this.view);
            wysiwygXSLTEditor.contentWindow.controllers.insertControllerAt(0, commandController);

            commandTable = commandController.QueryInterface(Components.interfaces.nsIInterfaceRequestor).getInterface(Components.interfaces.nsIControllerCommandTable);

            commandTable.registerCommand("cmd_cut", new WYSIWYGXSLTCutCommand(this, selectionChangeHandler));
            commandTable.registerCommand("cmd_cutOrDelete", new WYSIWYGXSLTCutOrDeleteCommand(this, selectionChangeHandler));
            commandTable.registerCommand("cmd_paste", new WYSIWYGXSLTPasteCommand(this, selectionChangeHandler));

            /* DEBUG */ dump("Yulup:wysiwygxsltmodeview.js:WYSIWYGXSLTModeView.setUp: initialisation completed\n");
        } catch (exception) {
            /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:wysiwygxsltmodeview.js:WYSIWYGXSLTModeView.setUp", exception);
            Components.utils.reportError(exception);
            return;
        }

        /* DEBUG */ dump("%%%%%%%%%%%%%%% Yulup::wysiwygxsltmodeview.js:WYSIWYGXSLTModeView.setUp: arrive at view barrier (current thread count is \"" + this.barrier.noOfThreads + "\")\n");
        this.barrier.arrive();
    },

    /**
     * Serialise the document of the current view to a string.
     *
     * @return {String} current document of this view
     */
    contentToString: function () {
        serialisedDocument = this.xmlSerializer.serializeToString(this.domDocument);

        /* DEBUG */ dump("######## Yulup:wysiwygxsltmodeview.js:WYSIWYGXSLTModeView.contentToString: document to write back (xmlserializer) =\n" + serialisedDocument + "\n");

        return serialisedDocument;
    },


    /**
     * Fill this view with content from the associated model.
     *
     * @return {Boolean} returns true if successful, false otherwise
     */
    fillView: function () {
        var retVal        = false;
        var defaultNamespace = null;

        /* DEBUG */ dump("Yulup:wysiwygxsltmodeview.js:WYSIWYGXSLTModeView.fillView() invoked\n");

        this.domDocument = this.model.getDocumentDOM();
        this.domDocument.normalize();

        /* Lookup default namespace */
        var sourceElements = this.domDocument.getElementsByTagName("*");

        for (var i= 0; i < sourceElements.length; i++) {
            if (this.domDocument.documentElement.isDefaultNamespace(sourceElements.item(i).namespaceURI)) {
                defaultNamespace = sourceElements.item(i).namespaceURI;
                break;
            }
        }

        /* DEBUG */ dump("Yulup:wysiwygxsltmodeview.js:WYSIWYGXSLTModeView.fillView: default Namespace is: \"" + defaultNamespace + "\"\n");
        this.defaultNamespace = defaultNamespace;

        /* Lookup default namespace prefix. Needed for tagging the source with xpath compatible location paths.
        ** Note that the documentElement might not be prefixed. In fact no nodes at all might be prefixed.
        ** Since the mozilla implementation of node.lookupNamespacePrefix(ns) simply returns the prefix of
        ** the the first node within a given namespace (and the value "xmlns" if that node has no prefix),
        ** we do prefix lookup by hand and set a dummy prefix if no prefixed node can be found.
        **/
        var prefix = null;

        if (defaultNamespace != null) {
            var attrs = this.domDocument.documentElement.attributes;
            for (var i= 0; i < attrs.length; i++) {
                var attr = attrs.item(i);
                if (attr.nodeValue == defaultNamespace && attr.nodeName.indexOf(":") > 1) {
                    var delim = attr.nodeName.indexOf(":");
                    prefix = attr.nodeName.substr(delim + 1, attr.nodeName.length);
                }
            }

            /* DEBUG */ dump("Yulup:wysiwygxsltmodeview.js:WYSIWYGXSLTModeView.fillView: default namespace prefix is: \"" + prefix + "\"\n");
        }


        /* tag the qualified document source with _yulup-location-path attributes */
        var xsltProcessor = new XSLTProcessor();

        xsltProcessor.importStylesheet(this.sourceTaggerXSL);
        if (defaultNamespace != null && prefix != null) {
            xsltProcessor.setParameter(null, "default-namespace", defaultNamespace);
            xsltProcessor.setParameter(null, "default-prefix", prefix);
        }

        var taggedSourceDocument = xsltProcessor.transformToDocument(this.domDocument);

        /* DEBUG */ dump("Yulup:wysiwygxsltmodeview.js:WYSIWYGXSLTModeView.fillView: tagged source =\n" + this.xmlSerializer.serializeToString (taggedSourceDocument) + "\n");

        /* Apply a style template. Style templates provide a mechanism for aggregating multiple document
        ** sources before the xhml transformation step ( mode="pre" ) is applied, or for aggregating (transformed)
        ** xhtml view fragments (mode="post") whereas in the latter case the aggregated document is used as
        ** the views xhtmlDocument without further transformation steps. The aggregation points are marked by
        ** xi:include directives contained in the style template.
        */
        if (this.styleTemplate) {

            // Apply styleTemplate to the document before document styling by xslt
            if (this.styleTemplateMode == null || this.styleTemplateMode == "pre") {

                var styleTemplate = Components.classes["@mozilla.org/xml/xml-document;1"].createInstance(Components.interfaces.nsIDOMXMLDocument);
                var documentElement = styleTemplate.importNode(this.styleTemplate.documentElement, true);
                styleTemplate.appendChild(documentElement);

                // Import the tagged document source
                var sourceNode = styleTemplate.importNode(taggedSourceDocument.documentElement, true);

                // Lookup xi:include element and include source document
                var xincludeElem = styleTemplate.evaluate("//xi:include", styleTemplate, this.__xsltNSResolver, XPathResult.ANY_TYPE, null).iterateNext();
                xincludeElem.parentNode.replaceChild(sourceNode, xincludeElem);

                var serializedStyleTemplate = this.xmlSerializer.serializeToString(styleTemplate);

                /* DEBUG */ dump("Style Template + Source: " + serializedStyleTemplate);

                taggedSourceDocument = styleTemplate;
            } else {
                /** Not yet implemented **/

            }

        }

        /* Style the tagged source document by xslt. */
        var xhtmlDocument = this.xsltTransform(taggedSourceDocument, this.documentXSL);

        /* Remove extranous and adjacent Text nodes. */
        xhtmlDocument.normalize();

        // shuffle around _yulup-location-path attributes placed in yulup:substitute elements
        this.substitutePlaceholders(xhtmlDocument);

        /* Remove extranous and adjacent Text nodes. */
        xhtmlDocument.normalize();

        /* Serialize the xhtml document before filling the view */
        serializedDoc = this.xmlSerializer.serializeToString(xhtmlDocument);

        /* DEBUG */ dump("######## Yulup:wysiwygxsltmodeview.js:WYSIWYGXSLTModeView.fillView: transformed document =\n" + serializedDoc + "\n");

        this.model.preserveDirty = true;

        // initialise location path caches
        this.nsAwareLocationPathCache   = new Object;
        this.nsUnawareLocationPathCache = new Object;

        /* Fill the view */
        try {
            /* What about using this.editor.contentDocument.innerHTML = content, see
             * also https://bugzilla.mozilla.org/show_bug.cgi?id=314987#c2 */
            this.view.rebuildDocumentFromSource(serializedDoc);
            this.view.beginningOfDocument(); // FIXME: cursor should be set to first editable node!

            // rewrite URIs
            this.uriRewriter.rewriteURIs();

            /* View is now pristine again */
            this.view.resetModificationCount();

            /* Clear undo and redo stacks. Note that undo/redo is currently not implemented. */
            this.view.transactionManager.clear();

            /* Indicate that this view has content now */
            this.isFilled = true;

            retVal = true;
        } catch (exception) {
            // Cannot handle document content type
            /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:wysiwygxsltmodeview.js:WYSIWYGXSLTModeView.fillView", exception);
            Components.utils.reportError(exception);

            retVal = false;
        }

        this.model.preserveDirty = false;

        return retVal;
    },

    insertPlaceholder: function (aSelectorNode, aDocumentXSL) {
        var selector    = null;
        var path        = null;
        var subsElement = null;

        /* DEBUG */ YulupDebug.ASSERT(aSelectorNode != null);
        /* DEBUG */ YulupDebug.ASSERT(aDocumentXSL != null);

        selector = aSelectorNode.getAttribute("select");
        path     = null;

        /* Check if selector uses absolute node addressing. If so set _yulup-location-path to that
         * node. If relative addressing is used, concatenate _yulup-locatoin-path attribute selector
         * of the context node with the selected node. */
        if (selector.indexOf("/") == 0) {
            path = selector;
        } else {
            path = "{@_yulup-location-path}/" + selector;
        }

        subsElement = aDocumentXSL.createElementNS(YULUP_NAMESPACE_URI, "substitute");
        subsElement.setAttribute("_yulup-location-path", path);
        subsElement.appendChild(aSelectorNode.cloneNode(true));
        aSelectorNode.parentNode.replaceChild(subsElement, aSelectorNode);
    },

    substitutePlaceholders: function (aXHTMLDocument) {
        var subsElements = null;
        var subsElement  = null;
        var subsChildren = null;
        var isText       = null;

        /* DEBUG */ YulupDebug.ASSERT(aXHTMLDocument != null);

        subsElements = aXHTMLDocument.getElementsByTagNameNS(YULUP_NAMESPACE_URI, "substitute");

        /* Iterate over all yulup:substitute elements. The fact that NodeLists
         * are "live" and the removal of the element after processing guarantees
         * that the NodeList decreases strictly and the loop eventually terminates. */
        while (subsElements.length > 0) {
            subsElement = subsElements.item(0);
            isText      = false;

            /* DEBUG */ dump("Yulup:wysiwygxsltmodeview.js:WYSIWYGXSLTModeView.substitutePlaceholders: processing node \"" + subsElement + "\"\n");

            // check for parent node availability
            if (subsElement.parentNode) {
                // check if one of the child nodes of the yulup:substitute element is a text node
                subsChildren = subsElement.childNodes;

                for (var j = 0; j < subsChildren.length; j++) {
                    if (subsChildren.item(j).nodeType == Components.interfaces.nsIDOMNode.TEXT_NODE) {
                        isText = true;
                        break;
                    }
                }

                if (isText) {
                    /* DEBUG */ dump("Yulup:wysiwygxsltmodeview.js:WYSIWYGXSLTModeView.substitutePlaceholders: move location path to parent node\n");
                    // move _yulup-location-path attribute of the yulup:substitute element to the parent node
                    subsElement.parentNode.setAttribute("_yulup-location-path", subsElement.getAttribute("_yulup-location-path"));
                }

                // replace yulup:substitute element by its children
                while (subsElement.hasChildNodes()) {
                    subsElement.parentNode.insertBefore(subsElement.firstChild, subsElement);
                }

                // remove yulup:substitute element
                subsElement.parentNode.removeChild(subsElement);
            }

            /* DEBUG */ dump("Yulup:wysiwygxsltmodeview.js:WYSIWYGXSLTModeView.substitutePlaceholders: finished processing node \"" + subsElement + "\"\n");
        }
    },

    /** Returns a document style xslt that propagates "_yulup-location-path" attributes from a tagged
     ** document source to the transformed xhtmlDocument.
     **
     ** This is needed for mapping selections and text node changes from the xhtmlDocument contained in
     ** the view back to the underlying xml document (source).
     **
     ** A patched document style has
     ** <ul>
     ** <li>@_yulup-location-path attribute selectors pointing to the current context node in all
     ** parent nodes of templateSelectors (<xsl:apply-templates>). </li>
     ** <li>span tags with @_yulup-location-path attribute selectors surrounding nodeValue selection
     ** directives that point to the current context node (<xsl:value-of select="."/>).</li>
     ** <li>span tags with @_yulup-location-path attributes that concatenate a @_yulup-location-path
     ** selector of the current context node with the nodeValue selector, when pointing to a node relative
     ** to the current context node (<xsl:value-of select="foo/bar/@foo>").</li>
     ** <li>span tags with a @_yulup-location-path attribute that simply contains the select pattern of
     ** the contained nodeValue selector, when using absolute node addressing (<xsl:value-of select="/foo/bar">).</li>
     ** </ul>
     ** Note that selectors pointing to $variables are excluded from the patching process.
     **
     ** @param  {nsIDOMXMLDocument} aDocumentXSL the document style to patch
     ** @return {nsIDOMXMLDocument} the patched document style
     **/
    patchDocumentStyle: function (aDocumentXSL) {
        var outputMethodNode       = null;
        var templateSelectorNodes  = null;
        var parentNode             = null;
        var nodeValueSelectorNodes = null;

        /* DEBUG */ dump("Yulup:wysiwygxsltmodeview.js:WYSIWYGXSLTModeView.patchDocumentStyle(\"" + aDocumentXSL + "\") invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aDocumentXSL != null);

        /* Remove output method declarations to prevent mozilla from inserting crap into the generated xhtml.
        ** Note that this is for cosmetic reasons only and can be removed if experience should prove that
        ** documentStyling depends on the output method specified.
        */
        try {
            outputMethodNode = aDocumentXSL.evaluate("xsl:stylesheet/xsl:output", aDocumentXSL, this.__xsltNSResolver, XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null).iterateNext();
            if (outputMethodNode != null) {
                /* DEBUG */ dump("Yulup:wysiwygxsltmodeview.js:WYSIWYGXSLTModeView.patchDocumentStyle: removing <output> element \"" + outputMethodNode + "\"\n");
                outputMethodNode.parentNode.removeChild(outputMethodNode);
            }
        } catch (exception) {
            /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:wysiwygxsltmodeview.js:WYSIWYGXSLTModeView.patchDocumentStyle", exception);
            /* DEBUG */ Components.utils.reportError(exception);
        }

        /* Add _yulup-location-path attribute matcher to parent nodes of template selectors */
        try {
            templateSelectorNodes = aDocumentXSL.evaluate("xsl:stylesheet/*//xsl:apply-templates", aDocumentXSL, this.__xsltNSResolver, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
            for (var i=0; i< templateSelectorNodes.snapshotLength; i++) {
                parentNode = templateSelectorNodes.snapshotItem(i).parentNode;
                parentNode.setAttribute("_yulup-location-path", "{@_yulup-location-path}");
            }
        } catch (exception) {
            /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:wysiwygxsltmodeview.js:WYSIWYGXSLTModeView.patchDocumentStyle", exception);
            /* DEBUG */ Components.utils.reportError(exception);
        }

        /* Insert _yulup-location-path yulup:substitute node around xsl:value-of
         * nodeValue selectors. Note that for-each directives and $variable
         * selectors are not implemented yet. */
        try {
            nodeValueSelectorNodes = aDocumentXSL.evaluate("xsl:stylesheet//*/xsl:value-of[not(contains(@select, '$'))]", aDocumentXSL, this.__xsltNSResolver, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);

            for (var i=0; i< nodeValueSelectorNodes.snapshotLength; i++) {
                this.insertPlaceholder(nodeValueSelectorNodes.snapshotItem(i), aDocumentXSL);
            }
        } catch (exception) {
            /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:wysiwygxsltmodeview.js:WYSIWYGXSLTModeView.patchDocumentStyle", exception);
            /* DEBUG */ Components.utils.reportError(exception);
        }

        /* Insert _yulup-location-path yulup:substitute node around xsl:copy-of
         * nodeValue selectors. Note that for-each directives and $variable
         * selectors are not implemented yet. */
        try {
            nodeValueSelectorNodes = null;

            nodeValueSelectorNodes = aDocumentXSL.evaluate("xsl:stylesheet//*/xsl:copy-of[not(contains(@select, '$'))]", aDocumentXSL, this.__xsltNSResolver, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);

            for (var i=0; i< nodeValueSelectorNodes.snapshotLength; i++) {
                this.insertPlaceholder(nodeValueSelectorNodes.snapshotItem(i), aDocumentXSL);
            }
        } catch (exception) {
            /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:wysiwygxsltmodeview.js:WYSIWYGXSLTModeView.patchDocumentStyle", exception);
            /* DEBUG */ Components.utils.reportError(exception);
        }
    },

    /**
     * Transform document with supplied XSLT stylesheet.
     *
     * @param  {nsIDOMNode} aDocument            the document to transform
     * @param  {nsIDOMNode} aXStylesheetDocument the stylesheet to apply
     * @return {nsIDOMNode} returns a transformed document after applying the stylesheet
     */
    xsltTransform: function (aDocument, aXStylesheetDocument) {
        var xsltProcessor = null;

        /* DEBUG */ dump("Yulup:wysiwygxsltmodeview.js:WYSIWYGXSLTModeView.xsltTransform(\"" + aDocument + "\", \"" + aXStylesheetDocument + "\") invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aDocument            != null);
        /* DEBUG */ YulupDebug.ASSERT(aXStylesheetDocument != null);

        /* DEBUG */ // dump("Yulup:wysiwygxsltmodeview.js:WYSIWYGXSLTModeView.xsltTransform: applying stylesheet\n" + Components.classes["@mozilla.org/xmlextras/xmlserializer;1"].getService(Components.interfaces.nsIDOMSerializer).serializeToString(aXStylesheetDocument)  + "\nto document\n" + Components.classes["@mozilla.org/xmlextras/xmlserializer;1"].getService(Components.interfaces.nsIDOMSerializer).serializeToString(aDocument)  + "\n");

        xsltProcessor = new XSLTProcessor();

        xsltProcessor.importStylesheet(aXStylesheetDocument);

        return xsltProcessor.transformToDocument(aDocument);
    },


    /** Returns an XPath expression to find the source node in the document source
     ** corresponding to the passed xhtmlDocument node by looking up _yulup-location-path
     ** attributes in the ancestor-or-self axis and then issuing an xPath query based
     ** on the gathered location path data.
     **
     ** Supports two modes of operation: namespace aware/unware. This is needed for
     ** source documents that do not use namespaces in a standardized way (quite a lot in fact).
     ** Note that no fallback mechanism from namespace aware to unaware is implemented yet.
     **
     ** @param  {nsIDOMNode} aXHTMLNode        the currently selected node in the WYSIWYG view
     ** @param  {Boolean}    aIsNamespaceAware set to true if you would like namespace-aware evaluation of the query
     ** @return {String} returns the XPath expression to find the corresponding node in the XML source according to the passed in node, or null if none was found
     **/
    getSourceXPathForXHTMLNode: function (aXHTMLNode, aIsNamespaceAware) {
        var xPathToolBarLabel = null;
        var domDocument       = null;
        var xhtmlNode         = null;
        var xpathParseResult  = null;
        var locationPath      = null;
        var xPathExpr         = null;
        var astNode           = null;
        var localPart         = null;
        var sourceNode        = null;

        /* DEBUG */ YulupDebug.ASSERT(aXHTMLNode        != null);
        /* DEBUG */ YulupDebug.ASSERT(aIsNamespaceAware != null);

        domDocument = this.domDocument;
        xhtmlNode   = aXHTMLNode;

        /* Get a handle on the xPathToolBarLabel displaying a xpath expression for
        ** the current context node
        */
        xPathToolBarLabel = document.getElementById("uiYulupXPathToolBarXPathExpression");

        /** Look up location path by finding nearest _yulup-location-path attribute node.
         ** Note that _yulup-locaton-path values of elements with mixed content do not contain information
         ** about the actual text node selected. There is no way around this because marking source text nodes
         ** with location path information would break styling the document. Therefore text node constraints
         ** have to be estimated based on xhtml to source pattern matching.
         **/
        while (xhtmlNode.parentNode != null) {
            if (xhtmlNode.nodeType == Components.interfaces.nsIDOMNode.ELEMENT_NODE && xhtmlNode.getAttribute("_yulup-location-path") != null) {
                locationPath = xhtmlNode.getAttribute("_yulup-location-path");
                break;
            }
            xhtmlNode = xhtmlNode.parentNode;
        }

        /* DEBUG */ dump("Yulup:wysiwygxsltmodeview.js:WYSIWYGXSLTModeView.getSourceXPathForXHTMLNode: found location path: " + locationPath + "\n");

        /* No location path data found. Update toolbar and return null. */
        if (locationPath == null || locationPath == "" || locationPath == "undefined") {
            xPathToolBarLabel.value = "-";
            return null;
        }

        /* Query the source document for xPathExpr (the location path found) */
        if (!aIsNamespaceAware) {
            // check the cache (undefined means not cached, null means cached but not available)
            if (this.nsUnawareLocationPathCache[locationPath] == undefined) {
                xpathParseResult = this.parseLocationPath(locationPath);

                if (!xpathParseResult) {
                    xPathToolBarLabel.value = "Error parsing location path";

                    // cache it
                    this.nsUnawareLocationPathCache[locationPath] = null;

                    return null;
                }

                astNode = xpathParseResult;

                do {
                    if (astNode instanceof ASTNodeNameTest) {
                        localPart = astNode.getQName().getLocalPart();

                        if (localPart != "*") {
                            // replace name test by QName with prefix null and localname "*"
                            astNode.setQName(new ASTNodeQName(null, "*"));

                            // insert predicate [local-name()='nodename']
                            astNode.insert(new ASTNodeValue("[local-name()='" + localPart + "']"));
                        } else {
                            // replace name test by QName with prefix null and localname "*"
                            astNode.setQName(new ASTNodeQName(null, "*"));
                        }
                    }
                } while ((astNode = astNode.getNext()) != null);

                /* DEBUG */ dump("Yulup:wysiwygxsltmodeview.js:WYSIWYGXSLTModeView.getSourceXPathForXHTMLNode: rewritten XPath object representation:\n" + xpathParseResult.toObjectString() + "\n");

                // serialise XPath parser result
                xPathExpr = xpathParseResult.toString();

                // cache it
                this.nsUnawareLocationPathCache[locationPath] = xPathExpr;
            } else {
                xPathExpr = this.nsUnawareLocationPathCache[locationPath];

                /* DEBUG */ dump("Yulup:wysiwygxsltmodeview.js:WYSIWYGXSLTModeView.getSourceXPathForXHTMLNode: use namespace-unaware cached version: " + xPathExpr + "\n");

                if (!xPathExpr) {
                    xPathToolBarLabel.value = "Error parsing location path";
                    return null;
                }
            }

            /* DEBUG */ dump("Yulup:wysiwygxsltmodeview.js:WYSIWYGXSLTModeView.getSourceXPathForXHTMLNode: rewritten XPath: " + xPathExpr + "\n");

            try {
                sourceNode = domDocument.evaluate(xPathExpr, domDocument, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            } catch (exception) {
                /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:wysiwygxsltmodeview.js:WYSIWYGXSLTModeView.getSourceXPathForXHTMLNode", exception);
                /* DEBUG */ Components.utils.reportError(exception);
            }
        } else {
            // check the cache (undefined means not cached, null means cached but not available)
            if (this.nsAwareLocationPathCache[locationPath] == undefined) {
                xpathParseResult = this.parseLocationPath(locationPath);

                if (!xpathParseResult) {
                    xPathToolBarLabel.value = "Error parsing location path";

                    // cache it
                    this.nsAwareLocationPathCache[locationPath] = null;

                    return null;
                }

                // serialise XPath parser result
                xPathExpr = xpathParseResult.toString();

                // cache it
                this.nsAwareLocationPathCache[locationPath] = xPathExpr;
            } else {
                xPathExpr = this.nsAwareLocationPathCache[locationPath];

                /* DEBUG */ dump("Yulup:wysiwygxsltmodeview.js:WYSIWYGXSLTModeView.getSourceXPathForXHTMLNode: use namespace-aware cached version: " + xPathExpr + "\n");

                if (!xPathExpr) {
                    xPathToolBarLabel.value = "Error parsing location path";
                    return null;
                }
            }

            try {
                sourceNode = domDocument.evaluate(xPathExpr, domDocument, domDocument.createNSResolver(domDocument.documentElement), XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            } catch (exception) {
                // the namespace resolver does not seem to know a prefix used in the query
                /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:wysiwygxsltmodeview.js:WYSIWYGXSLTModeView.getSourceXPathForXHTMLNode", exception);
                /* DEBUG */ Components.utils.reportError(exception);
            }
        }

        /* DEBUG */ dump ("Yulup:wysiwygxsltmodeview.js:WYSIWYGXSLTModeView.getSourceXPathForXHTMLNode: XPath query returned source node: \"" + sourceNode + "\"\n");

        /** Do a xhtml to source node mapping to add text() constraints */

        /* No corresponding source node found. Return null. */
        if (sourceNode == null) {
            xPathToolBarLabel.value = "Error! No source node for " + xPathExpr;
            return null;
        }

        // Attribute or element node selected
        if (sourceNode.nodeType == Components.interfaces.nsIDOMNode.ATTRIBUTE_NODE || aXHTMLNode.nodeType == Components.interfaces.nsIDOMNode.ELEMENT_NODE) {
            xPathToolBarLabel.value = xPathExpr;
            return xPathExpr;
        }

        /* Find a source (text) node with a value equal to selected xhtml node and calculate text()
         * constraint.
         *
         * FIXME: Add support for static text generated by documentStyle.
         * Possibly extend documentXSLPatcher for that. */
        if (aXHTMLNode.nodeType == Components.interfaces.nsIDOMNode.TEXT_NODE) {
            var childNodes    = sourceNode.childNodes;
            var textNodeCount = 0;
            var selPosition   = null;

            for (var i=0; i < childNodes.length; i++) {
                var childNode = childNodes.item(i);
                if (childNode.nodeType == Components.interfaces.nsIDOMNode.TEXT_NODE) {
                    textNodeCount++;
                    if (childNode.nodeValue == aXHTMLNode.nodeValue) {
                        selPosition = textNodeCount;
                    }
                }
            }

            if (textNodeCount == 1) {
                xPathExpr = xPathExpr + "/text()";
            } else if (textNodeCount > 1 && selPosition != null) {
                xPathExpr = xPathExpr + "/text()[" + selPosition + "]";
            }

            xPathToolBarLabel.value = xPathExpr;

            return xPathExpr;
        }

        return null;
    },

    parseLocationPath: function (aLocationPath) {
        var xpathParseResult = null;

        /* DEBUG */ YulupDebug.ASSERT(aLocationPath != null);

        /* DEBUG */ dump("---------------------- start parsing found location path ----------------------\n");

        // parse found location path
        try {
            xpathParseResult = (new XPathParser(aLocationPath)).parse();

            /* DEBUG */ dump("Yulup:wysiwygxsltmodeview.js:WYSIWYGXSLTModeView.getSourceXPathForXHTMLNode: object XPath representation:\n" + xpathParseResult.toObjectString() + "\n");
            /* DEBUG */ dump("Yulup:wysiwygxsltmodeview.js:WYSIWYGXSLTModeView.getSourceXPathForXHTMLNode: parsed XPath: " + xpathParseResult.toString() + "\n");
        } catch (exception) {
            /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:wysiwygxsltmodeview.js:WYSIWYGXSLTModeView.getSourceXPathForXHTMLNode", exception);
            /* DEBUG */ Components.utils.reportError(exception);
        }

        /* DEBUG */ dump("\n---------------------- finished parsing found location path ----------------------\n");

        return xpathParseResult;
    },

    updateSource: function () {
        var textNodes = null;
        var aggrText  = null;

        /* DEBUG */ dump("Yulup:wysiwygxsltmodeview.js:WYSIWYGXSLTModeView.updateSource() invoked\n");

        if (this.currentSourceNode != null && (this.currentSourceNode.nodeType == Components.interfaces.nsIDOMNode.TEXT_NODE || this.currentSourceNode.nodeType == Components.interfaces.nsIDOMNode.ATTRIBUTE_NODE)) {
            /* DEBUG */ dump("Yulup:wysiwygxsltmodeview.js:WYSIWYGXSLTModeView.updateSource: nodeValue of currently selected node = \"" + this.currentXHTMLNode.nodeValue + "\"\n");

            if (this.currentXHTMLNode.nodeType == Components.interfaces.nsIDOMNode.TEXT_NODE) {
                // note that by the virtue of the location_path insertion, the parent node can only contain text nodes
                textNodes = this.currentXHTMLNode.parentNode.childNodes;

                aggrText = "";
                for (var i = 0; i < textNodes.length; i++) {
                    aggrText += textNodes.item(i).data;
                }

                /* DEBUG */ dump("Yulup:wysiwygxsltmodeview.js:WYSIWYGXSLTModeView.updateSource: propagating aggregated nodeValue = \"" + aggrText + "\"\n");

                this.currentSourceNode.nodeValue = aggrText;
            } else {
                /* DEBUG */ dump("Yulup:wysiwygxsltmodeview.js:WYSIWYGXSLTModeView.updateSource: propagating nodeValue = \"" + this.currentXHTMLNode.nodeValue + "\"\n");

                this.currentSourceNode.nodeValue = this.currentXHTMLNode.nodeValue;
            }
        }
    },

    /**
     * Resolve "xsl" and "xi" prefixes used in XPath expressions
     * to namespaces.
     *
     * @param  {String} aPrefix a namespace prefix, either "xsl" or "xi"
     * @return {String} the namespace associated with the passed in prefix
     */
    __xsltNSResolver: function (aPrefix) {
        var namespace = null;

        /* DEBUG */ dump("Yulup:wysiwygxsltmodeview.js:WYSIWYGXSLTModeView.__xsltNSResolver(\"" + aPrefix + "\") invoked\n");

        var namespace = {
            "xsl": "http://www.w3.org/1999/XSL/Transform",
            "xi" : "http://www.w3.org/2001/XInclude"
        };

        return namespace[aPrefix] || null;
    },

    enterView: function () {
        // show XPathToolBar
        document.getElementById("uiYulupXPathToolBar").hidden = false;
    },

    leaveView: function () {
        // hide XPathToolBar
        document.getElementById("uiYulupXPathToolBar").hidden = true;

        // clear the expression display
        document.getElementById("uiYulupXPathToolBarXPathExpression").value = "";
    },

    addSelectionListener: function (aSelectionListener) {
        var retval = false;

        /* DEBUG */ dump("Yulup:wysiwygxsltmodeview.js:WYSIWYGXSLTModeView.addSelectionListener() invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aSelectionListener != null);

        try {
            this.editor.contentWindow.getSelection().QueryInterface(Components.interfaces.nsISelectionPrivate).addSelectionListener(aSelectionListener);

            retval = true;
        } catch (exception) {
            /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:wysiwygxsltmodeview.js:WYSIWYGXSLTModeView.addSelectionListener", exception);
            Components.utils.reportError(exception);
        }

        return retval;
    },

    removeSelectionListener: function (aSelectionListener) {
        /* DEBUG */ dump("Yulup:wysiwygxsltmodeview.js:WYSIWYGXSLTModeView.removeSelectionListener() invoked\n");

        /* DEBUG */ YulupDebug.ASSERT(aSelectionListener != null);

        try {
            this.editor.contentWindow.getSelection().QueryInterface(Components.interfaces.nsISelectionPrivate).removeSelectionListener(aSelectionListener);
        } catch (exception) {
            /* DEBUG */ YulupDebug.dumpExceptionToConsole("Yulup:wysiwygxsltmodeview.js:WYSIWYGXSLTModeView.removeSelectionListener", exception);
            Components.utils.reportError(exception);
        }
    }
};


function WYSIWYGXSLTKeyPressListener(aView) {
    /* DEBUG */ YulupDebug.ASSERT(aView != null);

    this.__view = aView;
}

WYSIWYGXSLTKeyPressListener.prototype = {
    __view: null,

    handleEvent: function (aKeyEvent) {
        /* DEBUG */ dump("Yulup:wysiwygxsltmodeview.js:WYSIWYGXSLTKeyPressListener.handleEvent() invoked\n");

        switch (aKeyEvent.keyCode) {
            case Components.interfaces.nsIDOMKeyEvent.DOM_VK_RETURN:
            case Components.interfaces.nsIDOMKeyEvent.DOM_VK_ENTER:
                /* DEBUG */ dump("Yulup:wysiwygxsltmodeview.js:WYSIWYGXSLTKeyPressListener.handleEvent: DOM_VK_RETURN or DOM_VK_ENTER pressed, suppress this event.\n");

                // TODO: check keybindings for these keys and call paragraph inserter if needed

                // we consumed this event
                aKeyEvent.preventDefault();
                return;
                break;
            default:
        }
    }
};


function WYSIWYGXSLTKeyUpListener(aView) {
    /* DEBUG */ YulupDebug.ASSERT(aView != null);

    this.__view = aView;
}

WYSIWYGXSLTKeyUpListener.prototype = {
    __view: null,

    handleEvent: function (aKeyEvent) {
        /* DEBUG */ dump("Yulup:wysiwygxsltmodeview.js:WYSIWYGXSLTKeyUpListener.handleEvent() invoked\n");

        this.__view.updateSource();
    }
};


function LocationPathSelectionListener(aSelectionChangeHandler) {
    /* DEBUG */ YulupDebug.ASSERT(aSelectionChangeHandler != null);

    this.__selectionChangeHandler = aSelectionChangeHandler;
}

LocationPathSelectionListener.prototype = {
    __selectionChangeHandler: null,

    notifySelectionChanged: function (aDocument, aSelection, aReason) {
        /* DEBUG */ dump("Yulup:wysiwygxsltmodeview.js:LocationPathSelectionListener.notifySelectionChanged() invoked\n");

        this.__selectionChangeHandler.selectionChanged(aSelection);
    }
};


function WYSIWYGXSLTSelectionChangeHandler(aView) {
    /* DEBUG */ YulupDebug.ASSERT(aView != null);

    this.__view = aView;
}

WYSIWYGXSLTSelectionChangeHandler.prototype = {
    __view                : null,
    __prevNode            : null,
    __prevIsNamespaceAware: null,

    // TODO: we could also move this code directly into the XSLT mode view
    selectionChanged: function (aSelection) {
        var node        = null;
        var domDocument = null;
        var xpath       = null;
        var sourceNode  = null;

        /* DEBUG */ dump("Yulup:wysiwygxsltmodeview.js:WYSIWYGXSLTSelectionChangeHandler.selectionChanged() invoked\n");

        node        = aSelection.focusNode;
        domDocument = this.__view.domDocument;

        this.__view.currentXHTMLNode = node;

        // check if the current selection is at the same node as the previous selection
        if (this.__prevNode != node || this.__prevIsNamespaceAware != this.__view.isNamespaceAware) {
            this.__prevNode = node;
            this.__prevIsNamespaceAware = this.__view.isNamespaceAware;

            xpath = this.__view.getSourceXPathForXHTMLNode(node, this.__view.isNamespaceAware);

            if (xpath != null && xpath != this.__view.currentSourceSelectionPath) {
                /* DEBUG */ dump("Yulup:wysiwygxsltmodeview.js:WYSIWYGXSLTSelectionChangeHandler.selectionChanged: XPath of selected node is: \"" + xpath + "\"\n");

                sourceNode = domDocument.evaluate(xpath, domDocument, domDocument.createNSResolver(domDocument.documentElement), XPathResult.ANY_TYPE, null).iterateNext();

                if (sourceNode != null) {
                    /* DEBUG */ dump("Yulup:wysiwygxsltmodeview.js:WYSIWYGXSLTSelectionChangeHandler.selectionChanged: setting source node \"" + sourceNode + "\" (\"" + sourceNode.nodeValue + "\") with XPath \"" + xpath + "\" as new current node\n");
                    this.__view.currentSourceSelectionPath = xpath;
                    this.__view.currentSourceNode = sourceNode;

                } else {
                    this.__view.currentSourceSelectionPath = null;
                    this.__view.currentSourceNode = null;
                }
            }
        }

        /* DEBUG */ dump("Yulup:wysiwygxsltmodeview.js:WYSIWYGXSLTSelectionChangeHandler.selectionChanged: current source node is: \"" + this.__view.currentSourceNode + "\" (\"" + (this.__view.currentSourceNode ? this.__view.currentSourceNode.nodeValue : this.__view.currentSourceNode) + "\")\n");
    }
};


/**
 * WYSIWYGXSLTCutCommand constructor. Instantiates a new object of
 * type WYSIWYGXSLTCutCommand.
 *
 * Implements nsIControllerCommand.
 *
 * @constructor
 */
function WYSIWYGXSLTCutCommand(aView, aSelectionChangeHandler) {
    /* DEBUG */ YulupDebug.ASSERT(aView                   != null);
    /* DEBUG */ YulupDebug.ASSERT(aSelectionChangeHandler != null);

    this.__view                   = aView;
    this.__selectionChangeHandler = aSelectionChangeHandler;
}

WYSIWYGXSLTCutCommand.prototype = {
    __view                  : null,
    __selectionChangeHandler: null,

    doCommand: function (aCommandName, aCommandContext) {
        dump("Yulup:wysiwygxsltmodeview.js:WYSIWYGXSLTCutCommand.doCommand(\"" + aCommandName + "\", \"" + aCommandContext + "\") invoked\n");

        if ("cmd_cut" == aCommandName) {
            aCommandContext.cut();

            this.__selectionChangeHandler.selectionChanged(aCommandContext.selection);
            this.__view.updateSource();

            return true;
        } else {
            return false;
        }
    },

    doCommandParams: function (aCommandName, aParams, aCommandContext) {
        dump("Yulup:wysiwygxsltmodeview.js:WYSIWYGXSLTCutCommand.doCommandParams(\"" + aCommandName + "\", \"" + aParams + "\", \"" + aCommandContext + "\") invoked\n");

        return this.doCommand(aCommandName, aCommandContext);
    },

    getCommandStateParams: function (aCommandName, aParams, aCommandContext) {
        var canCut = false;

        dump("Yulup:wysiwygxsltmodeview.js:WYSIWYGXSLTCutCommand.getCommandStateParams(\"" + aCommandName + "\", \"" + aParams + "\", \"" + aCommandContext + "\") invoked\n");

        canCut = this.isCommandEnabled(aCommandName, aCommandContext);
        aParams.setBooleanValue("state_enabled", canCut);
    },

    isCommandEnabled: function (aCommandName, aCommandContext) {
        var retVal = false;

        dump("Yulup:wysiwygxsltmodeview.js:WYSIWYGXSLTCutCommand.isCommandEnabled(\"" + aCommandName + "\", \"" + aCommandContext + "\") invoked\n");

        if (aCommandName == "cmd_cut") {
            retVal = aCommandContext.canCut();
        }

        dump("Yulup:wysiwygxsltmodeview.js:WYSIWYGXSLTCutCommand.isCommandEnabled: " + aCommandName + " retVal = \"" + retVal + "\"\n");

        return retVal;
    }
};


/**
 * WYSIWYGXSLTCutOrDeleteCommand constructor. Instantiates a new object of
 * type WYSIWYGXSLTCutOrDeleteCommand.
 *
 * Implements nsIControllerCommand.
 *
 * @constructor
 */
function WYSIWYGXSLTCutOrDeleteCommand(aView, aSelectionChangeHandler) {
    /* DEBUG */ YulupDebug.ASSERT(aView                   != null);
    /* DEBUG */ YulupDebug.ASSERT(aSelectionChangeHandler != null);

    this.__view                   = aView;
    this.__selectionChangeHandler = aSelectionChangeHandler;
}

WYSIWYGXSLTCutOrDeleteCommand.prototype = {
    __view                  : null,
    __selectionChangeHandler: null,

    doCommand: function (aCommandName, aCommandContext) {
        dump("Yulup:wysiwygxsltmodeview.js:WYSIWYGXSLTCutOrDeleteCommand.doCommand(\"" + aCommandName + "\", \"" + aCommandContext + "\") invoked\n");

        if ("cmd_cutOrDelete" == aCommandName) {
            if (aCommandContext.selection && aCommandContext.selection.isCollapsed) {
                aCommandContext.deleteSelection(Components.interfaces.nsIEditor.eNext);
            } else {
                aCommandContext.cut();
            }

            this.__selectionChangeHandler.selectionChanged(aCommandContext.selection);
            this.__view.updateSource();

            return true;
        } else {
            return false;
        }
    },

    doCommandParams: function (aCommandName, aParams, aCommandContext) {
        dump("Yulup:wysiwygxsltmodeview.js:WYSIWYGXSLTCutOrDeleteCommand.doCommandParams(\"" + aCommandName + "\", \"" + aParams + "\", \"" + aCommandContext + "\") invoked\n");

        return this.doCommand(aCommandName, aCommandContext);
    },

    getCommandStateParams: function (aCommandName, aParams, aCommandContext) {
        var canCutOrDelete = false;

        dump("Yulup:wysiwygxsltmodeview.js:WYSIWYGXSLTCutOrDeleteCommand.getCommandStateParams(\"" + aCommandName + "\", \"" + aParams + "\", \"" + aCommandContext + "\") invoked\n");

        canCutOrDelete = this.isCommandEnabled(aCommandName, aCommandContext);
        aParams.setBooleanValue("state_enabled", canCutOrDelete);
    },

    isCommandEnabled: function (aCommandName, aCommandContext) {
        var retVal = false;

        dump("Yulup:wysiwygxsltmodeview.js:WYSIWYGXSLTCutOrDeleteCommand.isCommandEnabled(\"" + aCommandName + "\", \"" + aCommandContext + "\") invoked\n");

        if (aCommandName == "cmd_cutOrDelete") {
            retVal = aCommandContext.canCut();
        }

        dump("Yulup:wysiwygxsltmodeview.js:WYSIWYGXSLTCutOrDeleteCommand.isCommandEnabled: " + aCommandName + " retVal = \"" + retVal + "\"\n");

        return retVal;
    }
};


/**
 * WYSIWYGXSLTPasteCommand constructor. Instantiates a new object of
 * type WYSIWYGXSLTPasteCommand.
 *
 * Implements nsIControllerCommand.
 *
 * @constructor
 */
function WYSIWYGXSLTPasteCommand(aView, aSelectionChangeHandler) {
    /* DEBUG */ YulupDebug.ASSERT(aView                   != null);
    /* DEBUG */ YulupDebug.ASSERT(aSelectionChangeHandler != null);

    this.__view                   = aView;
    this.__selectionChangeHandler = aSelectionChangeHandler;
}

WYSIWYGXSLTPasteCommand.prototype = {
    __view                  : null,
    __selectionChangeHandler: null,

    doCommand: function (aCommandName, aCommandContext) {
        dump("Yulup:wysiwygxsltmodeview.js:WYSIWYGXSLTPasteCommand.doCommand(\"" + aCommandName + "\", \"" + aCommandContext + "\") invoked\n");

        if ("cmd_paste" == aCommandName) {
            /* Instead of pasting directly, we should take the contents of the
             * clipboard, extract the text and insert it afterwards. We don't want
             * to be able to paste XML into the view, only plaintext! */
            aCommandContext.paste(Components.interfaces.nsIClipboard.kGlobalClipboard);

            this.__selectionChangeHandler.selectionChanged(aCommandContext.selection);
            this.__view.updateSource();

            return true;
        } else {
            return false;
        }
    },

    doCommandParams: function (aCommandName, aParams, aCommandContext) {
        dump("Yulup:wysiwygxsltmodeview.js:WYSIWYGXSLTPasteCommand.doCommandParams(\"" + aCommandName + "\", \"" + aParams + "\", \"" + aCommandContext + "\") invoked\n");

        return this.doCommand(aCommandName, aCommandContext);
    },

    getCommandStateParams: function (aCommandName, aParams, aCommandContext) {
        var canPaste = false;

        dump("Yulup:wysiwygxsltmodeview.js:WYSIWYGXSLTPasteCommand.getCommandStateParams(\"" + aCommandName + "\", \"" + aParams + "\", \"" + aCommandContext + "\") invoked\n");

        canPaste = this.isCommandEnabled(aCommandName, aCommandContext);
        aParams.setBooleanValue("state_enabled", canPaste);
    },

    isCommandEnabled: function (aCommandName, aCommandContext) {
        var retVal = false;

        dump("Yulup:wysiwygxsltmodeview.js:WYSIWYGXSLTPasteCommand.isCommandEnabled(\"" + aCommandName + "\", \"" + aCommandContext + "\") invoked\n");

        if (aCommandName == "cmd_paste") {
            /* In addition to canPaste(), we should also look at the actual
             * clipboard contents to find out if it's in a format we can paste. */
            retVal = aCommandContext.canPaste(Components.interfaces.nsIClipboard.kGlobalClipboard);
        }

        dump("Yulup:wysiwygxsltmodeview.js:WYSIWYGXSLTPasteCommand.isCommandEnabled: " + aCommandName + " retVal = \"" + retVal + "\"\n");

        return retVal;
    }
};


function NSCheckboxStateChangeListener(aView) {
    /* DEBUG */ YulupDebug.ASSERT(aView != null);

    this.view = aView;
}

NSCheckboxStateChangeListener.prototype = {
    view: null,

    handleEvent: function (aNSCheckboxStateChangeEvent) {
        // hook up paragraph inserter
        if (this.view.isNamespaceAware) {
            this.view.isNamespaceAware = false;
        } else {
            this.view.isNamespaceAware = true;
        }
    }
};


/**
 * WYSIWYGXSLTDOMCleaner constructor. Instantiates a new object of
 * type WYSIWYGXSLTDOMCleaner.
 *
 * @constructor
 * @param  {nsIDOMDocument}        aRootNode the DOM document to clean
 * @return {WYSIWYGXSLTDOMCleaner}
 */
function WYSIWYGXSLTDOMCleaner(aRootNode) {
    /* DEBUG */ dump("Yulup:wysiwygxsltmodeview.js:WYSIWYGXSLTDOMCleaner(\"" + aRootNode + "\") invoked\n");

    /* DEBUG */ YulupDebug.ASSERT(aRootNode != null);

    this.rootNode = aRootNode;
}

WYSIWYGXSLTDOMCleaner.prototype = {
    rootNode:     null,

    /**
     * Clean the body of the DOM document which was set
     * by the constructor.
     *
     * @return {String} a cleaned document
     */
    cleanse: function () {
        var bodyNode = null;

        /* DEBUG */ dump("Yulup:wysiwygxsltmodeview.js:WYSIWYGXSLTDOMCleaner.cleanse() invoked\n");

        this.cleanseDOMTree(this.rootNode);

        return this.rootNode;
    },

    /**
     * Clean a node and its subtree.
     *
     * @param  {nsIDOMNode} aNode the node to serialise
     * @return {Undefined} does not have a return value
     */
    cleanseDOMTree: function (aNode) {
        var child = null;

        /* DEBUG */ YulupDebug.ASSERT(aNode != null);

        this.cleanseNode(aNode);

        for (child = aNode.firstChild; child != null; child = child.nextSibling) {
            this.cleanseDOMTree(child);
        }
    },

    /**
     * Clean the passed DOM node.
     *
     * This method should be called before the subtree of the
     * node is visited.
     *
     * @param  {nsIDOMNode} aNode the node to clean
     * @return {Undefined}  does not have a return value
     */
    cleanseNode: function (aNode) {
        /* DEBUG */ YulupDebug.ASSERT(aNode != null);

        switch (aNode.nodeType) {
            case Components.interfaces.nsIDOMNode.ELEMENT_NODE:
                if (aNode.hasAttribute("_yulup-location-path")) {
                    // remove it
                    aNode.removeAttribute("_yulup-location-path");
                }
                break;
            case Components.interfaces.nsIDOMNode.TEXT_NODE:
                break;
            case Components.interfaces.nsIDOMNode.PROCESSING_INSTRUCTION_NODE:
                break;
            case Components.interfaces.nsIDOMNode.COMMENT_NODE:
                break;
            case Components.interfaces.nsIDOMNode.DOCUMENT_NODE:
                break;
            case Components.interfaces.nsIDOMNode.DOCUMENT_TYPE_NODE:
                break;
            default:
                /* DEBUG */ dump("Yulup:wysiwygxsltmodeview.js:WYSIWYGXSLTDOMCleaner.cleanseNode: unknown node \"" + aNode.nodeName + "\" of node type \"" + aNode.nodeType + "\" encountered\n");
                throw new YulupEditorException("Yulup:wysiwygxsltmodeview.js:WYSIWYGXSLTDOMCleaner.cleanseNode: unknown node \"" + aNode.nodeName + "\" of node type \"" + aNode.nodeType + "\" encountered.");
        }
    }
};
