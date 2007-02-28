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
 * @author Florian Fricker
 *
 * This file implements the Annotation class. The Annotation class
 * creates the annotation-protocol and handles the http-requests to
 * post the protocol.
 *
 */

const Annotation = {
    __editorController : null,
    __view             : null,
    __webBrowserFind   : null,
    __commandController: null,
    __inputString      : null,
    __TriggerURI       : null,
    __retValue                 : null,

    dialogFields: null,

    // Handles the CancelListener for the dialog
    onDialogCancelListener: function () {
        alert("You have cancled your annotation");
        return true;
    },

    // Handles the SaveListener for the dialog
    onDialogSaveListener: function () {

        // Check user information
        AnnotationValue = Annotation.checkUserValue(Annotation.dialogFields.nameStringTextbox.value, Annotation.dialogFields.subjectStringTextbox.value, Annotation.dialogFields.commentStringTextbox.value);

        // Check if the user values are valid
        if(AnnotationValue)
            {
                // Generate the Xpointer element string from the DOM-Tree
                xPointerElements = Annotation.generateXpointerElements(Annotation.__editorController.getSelection().focusNode, "");

                // Get the selected text from the html content
                xPointerString = Annotation.__editorController.getSelection().toString();

                // Get the Xpointer position
                xPointerPosition = Annotation.getXpointerPosition();

                // Generate the full Xpointer for the Annotation
                xPointerComplete = "#xpointer(string-range(/" + xPointerElements + ",\"" + xPointerString + "\"))[" + xPointerPosition + "]";

                // Generate the full Annotation protocol
                AnnotationProtocol = Annotation.writeAnnotationProtocol(Annotation.dialogFields.nameStringTextbox.value, Annotation.dialogFields.subjectStringTextbox.value, Annotation.dialogFields.commentStringTextbox.value, xPointerComplete);

                // Debug: Dump the Annotation protocol
                /* DEBUG */ dump("Full Annotation protocol: " + AnnotationProtocol);

                // Save the Annotation protocol to the Annotation.__retValue properties
                Annotation.__retValue.content = AnnotationProtocol;

                return true;
            }
        else
            {
                return false;
            }
    },

    /*
     * This function checks the user input value and stops the
     * process if a input value is broken.
     *
     */
    checkUserValue: function (name, subject, body) {

        // Set a flag to check the status
        var status = null;

        // Check if the user input is available
        if(name && subject && body)
            {
                return true;
            }
        // If no user input available, display a alert message and return false to the SaveListener
        else
            {
                // Check the name textbox
                if(!name) {
                    alert("Pleas enter your name!");
                    return false;
                }

                // Check the subject textbox
                if(!subject) {
                    alert("Pleas enter a subject!");
                    return false;
                }

                // Check the body textbox
                if(!body) {
                    alert("Pleas enter your comment!");
                    return false;
                }
            }
    },

    /*
     * This function gets the Xpointer position which is needed by the Xpointer
     * to select the right string
     */

    getXpointerPosition: function () {

        // Get the selected node value
        var nodeValue = Annotation.__editorController.getSelection().focusNode.textContent;

        // Get the selected string value
        var AnnotationString = Annotation.__editorController.getSelection().toString();

        var AnnotationStringLenght = AnnotationString.length;

        var nodeIndexCounter = new Array;

        var counter = 0;

        nodeIndexCounter.push(0);

        var position = 0;

        // Push all strings which matches with the selected string into an array
        while(nodeIndexCounter[counter] != -1)
            {
                nodeIndexCounter.push(nodeValue.indexOf(AnnotationString, nodeIndexCounter[counter] + 1));
                counter++;
            }

        counter = 0;

        //Delete first and last element in array (0 and -1)

        nodeIndexCounter.shift();

        // If the array has just one element, then the string won't match with the other part of the text
        if(nodeIndexCounter.length == 1)
            {
                position = 1;
            }
        else
            {
                // Check whitch position the selected string has in the whole text
                while(nodeIndexCounter[counter] != -1)
                    {

                        nodeIndexRightToLeft = nodeIndexCounter[counter];
                        nodeIndexLeftToRight = nodeIndexCounter[counter]  + AnnotationStringLenght;

                        // Check if the text is selected from the right or left side
                        if(Annotation.__editorController.getSelection().focusOffset == nodeIndexRightToLeft)
                            {
                                position = counter + 1;
                                break;
                            }
                        else if (Annotation.__editorController.getSelection().focusOffset == nodeIndexLeftToRight)
                            {
                                position = counter + 1;
                                break;
                            }
                        else
                            {
                                counter++;
                            }

                    }
            }
        // Return the text position of the selected string
        return position;

    },

    /*
     * This function gets the element string from
     * the DOM-Tree. The element string is used
     * for the Xpointer.
     * Exp. of a element string: "/html/body/h1/"
     */

    generateXpointerElements: function (currentNode, xpointerNode) {

        // Get the parent node
        parentNode = currentNode.parentNode;

        // When no parent node is available
        if(parentNode != null)
            {
                childNodes = parentNode.childNodes;

                var counter = 0;

                // Iterate trough the DOM-Tree
                for(;counter < childNodes.length;counter++)
                    {
                        // Check if the actual node is equal to the selected node
                        if(childNodes.item(counter) == currentNode)
                            {
                                break;
                            }
                    }

                // Save the actual node in lowercases
                xpointerNode = "/" + currentNode.nodeName.toLowerCase() + "[" + counter + "]" + xpointerNode;

                // Call the same function again to repeat the process until the parent node is reached
                xpointerNode = Annotation.generateXpointerElements(parentNode, xpointerNode)

                    }

        // Return the xpointerNode
        return xpointerNode;

    },

    /*
     * This function generates the whole Annotation string
     */

    writeAnnotationProtocol: function(name, subject, comment, xpointer) {

        // Get the current date
        var date = Date();

        var finalString = "<?xml version=\"1.0\" ?>"
        + "<r:RDF xmlns:r=\"http://www.w3.org/1999/02/22-rdf-syntax-ns#\""
        + "xmlns:a=\"http://www.w3.org/2000/10/annotation-ns#\""
        + "xmlns:d=\"http://purl.org/dc/elements/1.1/\""
        + "xmlns:h=\"http://www.w3.org/1999/xx/http#\">"
        + "<r:Description>"
        + "<r:type r:resource=\"http://www.w3.org/2000/10/annotation-ns#Annotation\"/>"
        + "<r:type r:resource=\"http://www.w3.org/2000/10/annotationType#Comment\"/>"
        + "<a:annotates r:resource=\"" + Annotation.__TriggerURI + "\"/>"
        + "<a:context>" + Annotation.__TriggerURI + xpointer + "</a:context>"
        + "<d:title>" + subject + "</d:title>"
        + "<d:creator>" + name + "</d:creator>"
        + "<a:created>" + date + "</a:created>"
        + "<d:date>" + date + "</d:date>"
        + "<a:body>"
        + "<r:Description>"
        + "<h:ContentType>text/html</h:ContentType>"
        + "<h:Body r:parseType=\"Literal\">"
        + "<html xmlns=\"http://www.w3.org/1999/xhtml\">"
        + "<body>" + Annotation + "</body>"
        + "</html>"
        + "</h:Body>"
        + "</r:Description>"
        + "</a:body>"
        + "</r:Description>"
        + "</r:RDF>"

        // Debug: Dump the Annotation string
        dump("Final Annotation string: " + finalString);

        // Return the Annotation string
        return finalString;

    },

    /*
     * This function checks if the input string is
     * longer than 50 signs. If it is longer the it
     * cuts the string to 50 signs.
     */

    checkInputString: function (aString) {

        // Check the length, slice it when necessary and return the string
        if(aString.length < "50")
            {
                return aString;
            }
        return aString.slice(0, 46) + "...";
    },

    /* This function is called when the dialog is loaded.
     * It initialize the XUL elements and display the selected
     * text on a label.
     */

    onLoadListener: function () {

        // Initialize the window controllers
        Annotation.__editorController = window.arguments[0];
        Annotation.__TriggerURI = window.arguments[0].location.toString();
        Annotation.__retValue = window.arguments[1];

        // Initialize the XUL elements
        Annotation.dialogFields = {
            nameStringTextbox           : document.getElementById("uiAutorNameStringTextbox"),
            subjectStringTextbox            : document.getElementById("uiAnnotationTitleStringTextbox"),
            commentStringTextbox            : document.getElementById("uiAnnotationCommentStringTextbox"),
            pointerStringLabel          : document.getElementById("uiPointerStringLabel"),
        };

        // Get the selected text range as a string
        Annotation.__inputString = Annotation.__editorController.getSelection().toString();

        /*
         * Set the label value with the selected text range (Call
         * the function "checkInputStream" to check the length of
         * the string) otherwise the label could get overflowed.
         */

        Annotation.dialogFields.pointerStringLabel.value = Annotation.checkInputString(Annotation.__editorController.getSelection().toString());

    },

};
