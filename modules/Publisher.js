//@include "json2.js"
//@include "api.js"
//@include "Builder.js"

var Publisher = function(canvasflowSettings, host, builder, canvasflowApi, logger) {
    var $ = this;
    $.baseDirectory = '';
    $.filePath = '';
    $.uuid = '';
    $.host = host;
    $.canvasflowApi = null;
    $.dialog = {};
    $.pagesRange = null;
    $.builder = builder;
    $.boundary = Math.random().toString().substr(2);

    $.savedSettings = canvasflowSettings.getSavedSettings();

    $.createTextFormParam = function(property, value){
        return '--' + $.boundary + '\r\n'
            + 'Content-Disposition: form-data; name="' + property +'"\r\n'
            + '\r\n'
            + value + '\r\n'
            + '\r\n';
    }

    $.getTextFormParams = function(textProperties) {
        var response = [];
        for(var property in textProperties) {
            response.push($.createTextFormParam(property, textProperties[property]))
        }
        return response;
    }

    $.createFileFormParam = function(property, fileName, fileContent){
        return '--' + $.boundary + '\r\n'
            + 'Content-Disposition: form-data; name="' + property + '"; filename="' + fileName +'"\r\n'
            + 'Content-Type: application/octet-stream\r\n'
            + '\r\n'
            + fileContent + '\r\n'
            + '\r\n';
    }

    $.getFileFormParams = function(fileProperties) {
        var response = [];
        for(var property in fileProperties) {
            var file = fileProperties[property];
            response.push($.createFileFormParam(property, file.name, file.content))
        }
        return response;
    }

    $.uploadZip = function(filepath) {
        var conn = new Socket;
    
        var reply = '';
        var host = $.host + ':80'
    
        var f = File (filepath);
        var filename = f.name
        f.encoding = 'BINARY';
        f.open('r');
        var fContent = f.read();
        f.close();

        var articleName = f.displayName.replace('.zip', '');
    
        apiKey = $.savedSettings.apiKey;
        var PublicationID = $.savedSettings.PublicationID;
        var IssueID = $.savedSettings.IssueID;
        var StyleID = $.savedSettings.StyleID;
        var creationMode = $.savedSettings.creationMode || 'document';
        var contentOrder = $.savedSettings.contentOrder || 'natural';
    
        if(conn.open(host, 'BINARY')) {
            conn.timeout = 20000;
    
            $.boundary = Math.random().toString().substr(2);

            $.uuid = $.builder.getDocumentID();

            var form = {
                file: {
                    contentFile: {
                        name: filename,
                        content: fContent
                    }
                },
                text: {
                    secretKey: apiKey,
                    creationMode: creationMode,
                    contentOrder: contentOrder,
                    articleName: articleName,
                    publicationId: PublicationID,
                    issueId: IssueID,
                    styleId: StyleID,
                    contentType: 'indesign',
                    articleId: $.uuid
                }
            }

            var content = $.getFileFormParams(form.file)
                .concat($.getTextFormParams(form.text))
                .concat(['--' + $.boundary + '--\r\n\r'])
                .join('');
    
            var cs = 'POST /v1/index.cfm?endpoint=/article HTTP/1.1\r\n'
            + 'Content-Length: ' + content.length + '\r\n'
            + 'Content-Type: multipart/form-data; boundary=' + $.boundary + '\r\n'
            + 'Host: '+ host + '\r\n'
            + 'Authorization: ' + apiKey + '\r\n'
            + 'Accept: */*\r\n'
            + '\r\n'
            + content;
    
            conn.write(cs);
    
            reply = conn.read();
            conn.close();
    
            if (reply.indexOf('200') > 0) {
                // var data = reply.substring(reply.indexOf("{"), reply.length);
                // alert(reply);
                // var response = JSON.parse(data);
                return true;
            } else {
                alert(reply);
                return false;
            }
        } else {
            alert('I couldn\'t connect to the server');
            return false;
        }
    }

    $.getPublication = function() {
        var apiKey = $.savedSettings.apiKey;
        var PublicationID = $.savedSettings.PublicationID;

        var publications = $.canvasflowApi.getPublications(apiKey);
        var matches = publications.filter(function(publication) {
            return publication.id == PublicationID;
        });
        return !!matches.length ? matches[0] : null;
    }

    $.getIssue = function() {
        var apiKey = $.savedSettings.apiKey;
        var PublicationID = $.savedSettings.PublicationID;
        var IssueID = $.savedSettings.IssueID;

        var issues = $.canvasflowApi.getIssues(apiKey, PublicationID);
        var matches = issues.filter(function(issue) {
            return issue.id == IssueID;
        });
        return !!matches.length ? matches[0] : null;
    }

    $.getStyle = function() {
        var apiKey = $.savedSettings.apiKey;
        var PublicationID = $.savedSettings.PublicationID;
        var StyleID = $.savedSettings.StyleID;

        var styles = $.canvasflowApi.getStyles(apiKey, PublicationID);
        var matches = styles.filter(function(style) {
            return style.id == StyleID;
        });
        return !!matches.length ? matches[0] : null;
    }

    $.displayConfirmDialog = function() {
        var dialog = new Window('dialog', 'Publish to Canvasflow', undefined, {closeButton: false});
        dialog.orientation = 'column';
        dialog.alignment = 'right';
        dialog.preferredSize = [300,100];

        var valuesWidth = 200;
        var labelWidth = 150;

        var defaultLabelDim = [0, 0, labelWidth, 20];
        var defaultValueDim = [0, 0, labelWidth, 20];

        var endpoint = $.savedSettings.endpoint;

        $.canvasflowApi = new CanvasflowApi('http://' + endpoint + '/v2');

        // Intro
        var intro = 'You are about to publish the current document to Canvasflow. \n\nPlease confirm the following details are correct:';
        dialog.introGroup = dialog.add('statictext', [0, 0, valuesWidth * 1.5, 70], intro, {multiline: true});
        dialog.introGroup.orientation = 'row:top';
        dialog.introGroup.alignment = 'left';

        // External ID
        dialog.externalIDGroup = dialog.add('group');
        dialog.externalIDGroup.orientation = 'row';
        dialog.externalIDGroup.add('statictext', defaultLabelDim, 'ID');
        dialog.externalIDGroup.add('statictext', defaultValueDim, $.builder.getDocumentID());

        // Publication
        var publication = $.getPublication();
        dialog.publicationGroup = dialog.add('group');
        dialog.publicationGroup.orientation = 'row';
        dialog.publicationGroup.add('statictext', defaultLabelDim, 'Publication');
        dialog.publicationGroup.add('statictext', defaultValueDim, publication.name);

        // Issue
        if(publication.type === 'issue') {
            var issue = $.getIssue();
            dialog.issueGroup = dialog.add('group');
            dialog.issueGroup.orientation = 'row';
            dialog.issueGroup.add('statictext', defaultLabelDim, 'Issue');
            dialog.issueGroup.add('statictext', defaultValueDim, issue.name);
        }
        
        // Style
        var style = $.getStyle();
        dialog.styleGroup = dialog.add('group');
        dialog.styleGroup.orientation = 'row';
        dialog.styleGroup.add('statictext', defaultLabelDim, 'Style');
        dialog.styleGroup.add('statictext', defaultValueDim, style.name);

        // Creation Mode
        dialog.creationModeGroup = dialog.add('group');
        dialog.creationModeGroup.orientation = 'row';
        dialog.creationModeGroup.add('statictext', defaultLabelDim, 'Article Creation');
        var creationMode = $.savedSettings.creationMode[0].toUpperCase() +  $.savedSettings.creationMode.slice(1); 
        dialog.creationModeGroup.add('statictext', defaultValueDim, creationMode);

        dialog.buttonsBarGroup = dialog.add('group');
        dialog.buttonsBarGroup.orientation = 'row';
        dialog.buttonsBarGroup.alignChildren = 'bottom';    
        dialog.buttonsBarGroup.cancelBtn = dialog.buttonsBarGroup.add('button', undefined, 'Cancel');
        dialog.buttonsBarGroup.saveBtn = dialog.buttonsBarGroup.add('button', undefined, 'OK');

        dialog.buttonsBarGroup.saveBtn.onClick = function() {
            dialog.close(1);
        }

        dialog.buttonsBarGroup.cancelBtn.onClick = function() {
            dialog.close(0);
        }
    
        return dialog.show();
    }

    $.publish = function() {
        if(canvasflowApi.getHealth() === null) {
            throw new Error('Canvasflow Service not currently available');
        }

        if (app.documents.length != 0){
            var zipFilePath = '';
            var response = $.displayConfirmDialog();
            if(!!response) {
                var baseDirectory = app.activeDocument.filePath + '/';
                $.filePath = baseDirectory + app.activeDocument.name;
                var ext = app.activeDocument.name.split('.').pop();
                $.baseDirectory = baseDirectory + app.activeDocument.name.replace('.' + ext, '');
                zipFilePath = builder.build();
                if(!builder.isBuildSuccess) {
                    alert('Build cancelled');
                    return;
                }
                var now = new Date();
                var publishStartTime = now.getTime();
                if($.uploadZip(zipFilePath)) {
                    new File(zipFilePath).remove()
                    now = new Date();
                    alert('Success \nThe file has been published to Canvasflow');
                    logger.log('Publishing time: ' + (now.getTime() - publishStartTime) / 1000 + ' seconds', 'timestamp')
                } else {
                    now = new Date();
                    logger.log('Publishing with error: ' + (now.getTime() - publishStartTime) / 1000 + ' seconds', 'timestamp')
                    throw new Error('Error uploading the content, please try again');
                }
            }
        }
        else{
            alert ('Please select an article to Publish');
        }
    }
}