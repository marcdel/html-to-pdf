var wkhtmltopdf = require('wkhtmltopdf');
var MemoryStream = require('memorystream');
var AWS = require('aws-sdk');

process.env['PATH'] = process.env['PATH'] + ':' + process.env['LAMBDA_TASK_ROOT'];

var convertToPdf = function(html_utf8, file_name, event, context, s3) {
	var memStream = new MemoryStream();
	wkhtmltopdf(html_utf8, event.options, function(code, signal) {
		var pdf = memStream.read();

		var params = {
			Bucket : "tc-html-to-pdf",
			Key : file_name + ".pdf",
			Body : pdf
		}

		s3.putObject(params, function(err, data) {
			if (err) {
				console.log(err)
			} else {
				context.done(null, { pdf_base64: pdf.toString('base64') });
			}
		});
	}).pipe(memStream);
}

exports.handler = function(event, context) {
	var s3 = new AWS.S3();
	var html_utf8;
	var file_name;

	console.log(event);
	if(event.Records) {
		var srcBucket = event.Records[0].s3.bucket.name;
    file_name = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, " "));
		s3.getObject({
			Bucket: srcBucket,
			Key: file_name
		}, function(err, data){
			html_utf8 = data.Body.toString('utf8');
			convertToPdf(html_utf8, file_name, event, context, s3);
		});
	} else if(event.html_base64) {
		html_utf8 = new Buffer(event.html_base64, 'base64').toString('utf8');
		file_name = event.file_name
		convertToPdf(html_utf8, file_name, event, context, s3);
	}
};
