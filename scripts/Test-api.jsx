//@include "json2.js"

var host = "api.cflowdev.com"
var port = "80";
var apiKey = "12345";
var settingsFilePath = "~/canvaflow_settings.json";

var HTTPFile = function (url,port) {
    if (arguments.length == 1) {
        url = arguments[0];
        port = 80;
    };

    this.url = url;
    this.port = port;
    this.httpPrefix = this.url.match(/http:\/\//);
    this.domain = this.httpPrefix == null ? this.url.split("/")[0]+":"+this.port :this.url.split("/")[2]+":"+this.port;
    this.call = "GET "+ (this.httpPrefix == null ? "http://"+this.url : this.url)+" HTTP/1.0\r\nHost:" +(this.httpPrefix == null ? this.url.split("/")[0] :this.url.split("/")[2])+"\r\nConnection: close\r\n\r\n";
    this.reply = new String();
    this.conn = new Socket();
    this.conn.encoding = "binary";

    HTTPFile.prototype.getResponse = function(f) {
        var typeMatch = this.url.match(/(\.)(\w{3,4}\b)/g);
        if (this.conn.open(this.domain,"binary")) {
            this.conn.write(this.call);
            this.reply = this.conn.read(9999999999);
            this.conn.close();
        } else {
            this.reply = "";
        }
        return this.reply.substr(this.reply.indexOf("\r\n\r\n")+4);;
    };
}

var CanvasflowApi = function (host, apiKey) {
    this.host = host;

    CanvasflowApi.prototype.getPublications = function(apiKey) {
        var reply = new HTTPFile(host + "/publications?secretkey=" + apiKey);
        return reply.getResponse();
    };

    CanvasflowApi.prototype.validate = function(apiKey) {
        var reply = new HTTPFile(host + "/info?secretkey=" + apiKey);
        return reply.getResponse();
    };

    CanvasflowApi.prototype.getIssues = function(apiKey, PublicationID) {
        var reply = new HTTPFile(host + "/issues?secretkey=" + apiKey + "&publicationId=" + PublicationID);
        return reply.getResponse();
    };

    CanvasflowApi.prototype.getStyles = function(apiKey, PublicationID) {
        var reply = new HTTPFile(host + "/styles?secretkey=" + apiKey + "&publicationId=" + PublicationID);
        return reply.getResponse();
    };
}

var host = "http://api.cflowdev.com/v1/index.cfm";
var apiKey = "12345";

var canvasflowApi = new CanvasflowApi(host, apiKey);

settingsDialog();

function writeContent(content) {
    var fileObj = new File("/Users/jjzcru/Desktop/api.txt");

    fileObj.encoding = "UTF-8";  
    fileObj.open("w");  
    fileObj.write(content);  
    fileObj.close();  
}

function settingsDialog() {
    var apiKeyExist = false;
    var savedSettings = getSettings();
    var settingsDialog = new Window('dialog', 'Settings');
    settingsDialog.orientation = 'column';
    settingsDialog.alignment = 'right';
    settingsDialog.preferredSize = [200,100];

    var valuesWidth = 200;
    var labelWidth = 80;

    var publications = [];
    var selectedPublication;
    var publicationType = '';

    var issues = [];
    var selectedIssue;

    var styles = [];
    var selectedStyle;
    
    //Add Api Key
    settingsDialog.apiKeyGroup = settingsDialog.add('group');
    settingsDialog.apiKeyGroup.orientation = 'row';
    settingsDialog.apiKeyGroup.add('statictext', [0, 0, labelWidth, 20], "Api Key");
    settingsDialog.apiKeyGroup.apiKey = settingsDialog.apiKeyGroup.add('edittext', [0, 0, valuesWidth, 20], savedSettings.apiKey)
    
    if(!!savedSettings.apiKey) {
        apiKeyExist = true
        //Add Publication list
        publications = getPublications(savedSettings.apiKey);
        settingsDialog.publicationDropDownGroup = settingsDialog.add('group');
        settingsDialog.publicationDropDownGroup.orientation = 'row';
        settingsDialog.publicationDropDownGroup.add('statictext', [0, 0, labelWidth, 20], "Publications");
        settingsDialog.publicationDropDownGroup.dropDown = settingsDialog.publicationDropDownGroup.add('dropdownlist', [0, 0, valuesWidth, 20], undefined, {items:getPublicationsName(publications)})
        
        if(!!savedSettings.PublicationID) {
            selectedPublication = getPublicationByID(publications, savedSettings.PublicationID);
            settingsDialog.publicationDropDownGroup.dropDown.selection = getPublicationIndexByID(publications, savedSettings.PublicationID)
        } else {
            selectedPublication = publications[0];
            settingsDialog.publicationDropDownGroup.dropDown.selection = 0;
        }

        publicationType = selectedPublication.type;

        // Check if publication is an issue
        if(publicationType === 'issue') {
            issues = getIssues(savedSettings.apiKey, selectedPublication.id);
            settingsDialog.issueDropDownGroup = settingsDialog.add('group');
            settingsDialog.issueDropDownGroup.orientation = 'row';
            settingsDialog.issueDropDownGroup.add('statictext', [0, 0, labelWidth, 20], "Issues");
            settingsDialog.issueDropDownGroup.dropDown = settingsDialog.issueDropDownGroup.add('dropdownlist', [0, 0, valuesWidth, 20], undefined, {items:getIssuesNames(issues)})

            if(!!savedSettings.IssueID) {
                selectedIssue = getIssueByID(issues, savedSettings.IssueID);
                settingsDialog.issueDropDownGroup.dropDown.selection = getIssueIndexByID(issues, savedSettings.IssueID)
            } else {
                selectedIssue = issues[0];
                settingsDialog.issueDropDownGroup.dropDown.selection = 0;
            }
        }

        // Select styles
        styles = getStyles(savedSettings.apiKey, selectedPublication.id);
        settingsDialog.styleDropDownGroup = settingsDialog.add('group');
        settingsDialog.styleDropDownGroup.orientation = 'row';
        settingsDialog.styleDropDownGroup.add('statictext', [0, 0, labelWidth, 20], "Styles");
        settingsDialog.styleDropDownGroup.dropDown = settingsDialog.styleDropDownGroup.add('dropdownlist', [0, 0, valuesWidth, 20], undefined, {items:getIssuesNames(styles)})

        if(!!savedSettings.StyleID) {
            selectedStyle = getIssueByID(styles, savedSettings.StyleID);
            settingsDialog.styleDropDownGroup.dropDown.selection = getIssueIndexByID(styles, savedSettings.StyleID)
        } else {
            selectedStyle = styles[0];
            settingsDialog.styleDropDownGroup.dropDown.selection = 0;
        }
    } else {
        apiKeyExist = false;
    }

    // Panel buttons
    settingsDialog.buttonsBarGroup = settingsDialog.add('group');
    settingsDialog.buttonsBarGroup.orientation = 'row';
    settingsDialog.buttonsBarGroup.alignChildren = 'bottom';    
    settingsDialog.buttonsBarGroup.cancelBtn = settingsDialog.buttonsBarGroup.add('button', undefined, 'Cancel');
    settingsDialog.buttonsBarGroup.saveBtn = settingsDialog.buttonsBarGroup.add('button', undefined, 'OK');
    
    settingsDialog.buttonsBarGroup.saveBtn.onClick = function() {
        // var selectedPublication = settingsDialog.publicationDropDownGroup.dropDown.selection;
        if(!apiKeyExist) {
            var reply = canvasflowApi.validate(settingsDialog.apiKeyGroup.apiKey.text);
            var response = JSON.parse(reply);
            if(response.isValid) {
                if(savedSettings.apiKey !== settingsDialog.apiKeyGroup.apiKey.text) {
                    savedSettings.PublicationID = '';
                    savedSettings.IssueID = '';
                    savedSettings.StyleID = '';    
                }
                savedSettings.apiKey = settingsDialog.apiKeyGroup.apiKey.text;
                saveSettings(savedSettings);
                settingsDialog.destroy();
            } else {
                alert(reply.replace(/(")/gi, ''));
            }
        } else {
            // The api key was already validated
            if(savedSettings.apiKey !== settingsDialog.apiKeyGroup.apiKey.text) {
                var reply = canvasflowApi.validate(settingsDialog.apiKeyGroup.apiKey.text);
                var response = JSON.parse(reply);
                if(response.isValid) {
                    savedSettings.apiKey = settingsDialog.apiKeyGroup.apiKey.text;
                    savedSettings.PublicationID = '';
                    savedSettings.IssueID = '';
                    savedSettings.StyleID = '';    
                    saveSettings(savedSettings);
                    settingsDialog.destroy();
                } else {
                    alert(reply.replace(/(")/gi, ''));
                }
            } else {
                savedSettings.apiKey = settingsDialog.apiKeyGroup.apiKey.text;
                savedSettings.PublicationID = publications[settingsDialog.publicationDropDownGroup.dropDown.selection.index].id;
                
                saveSettings(savedSettings);
                settingsDialog.destroy();
            }
        } 
    }

    settingsDialog.buttonsBarGroup.cancelBtn.onClick = function() {
        settingsDialog.destroy();
    }
    settingsDialog.show();
}

function getPublications(apiKey) {
    var reply = canvasflowApi.getPublications(apiKey);
    return JSON.parse(reply);
}



function getPublicationsName(publications) {
    var response = [];
    for(var i = 0; i< publications.length; i++) {
        response.push(publications[i].name);
    }
    return response;
}

function getPublicationByID(publications, id) {
    for(var i = 0; i< publications.length; i++) {
        if(publications[i].id == id) {
            return publications[i];
        }
    }
    return null;
}

function getPublicationIndexByID(publications, id) {
    for(var i = 0; i< publications.length; i++) {
        if(publications[i].id == id) {
            return i;
        }
    }
}

function getIssues(apiKey, PublicationID) {
    var reply = canvasflowApi.getIssues(apiKey, PublicationID);
    return JSON.parse(reply);
}

function getIssuesNames(issues) {
    var response = [];
    for(var i = 0; i< issues.length; i++) {
        response.push(issues[i].name);
    }
    return response;
}

function getIssueByID(issues, id) {
    for(var i = 0; i< issues.length; i++) {
        if(issues[i].id == id) {
            return issues[i];
        }
    }
    return null;
}

function getIssueIndexByID(issues, id) {
    for(var i = 0; i< issues.length; i++) {
        if(issues[i].id == id) {
            return i;
        }
    }
}

function getStyles(apiKey, PublicationID) {
    var reply = canvasflowApi.getStyles(apiKey, PublicationID);
    return JSON.parse(reply);
}

function getSettings() {
    var file = new File(settingsFilePath);
    if(file.exists) {
        file.open('r');
        return JSON.parse(file.read());
    } else {
        var file = new File(settingsFilePath);
        file.encoding = 'UTF-8';
        file.open('w');
        file.write('{"apiKey":"", "PublicationID": "", "IssueID": "", "StyleID": ""}');
        file.close();

        return getSettings();
    }
}

function saveSettings(settings) {
    var file = new File(settingsFilePath);
    file.encoding = 'UTF-8';
    file.open('w');
    file.write('{"apiKey":"' + settings.apiKey + '", "PublicationID": "' + settings.PublicationID + '", "IssueID":"' + settings.IssueID + '", "StyleID": "' + settings.StyleID + '"}');
    file.close();
}