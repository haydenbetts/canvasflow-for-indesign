//@include "./../modules/logger.js"

var logFilePath = "~/canvaflow_debug_log.log";

var logger = new CanvasflowLogger(logFilePath, true);
logger.log((new Date()).getTime(), 'test func');
logger.log((new Date()).getTime(), 'test func2');
alert('Done')
