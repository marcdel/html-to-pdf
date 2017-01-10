var wkhtmltopdf = require('wkhtmltopdf');
var MemoryStream = require('memorystream');
var AWS = require('aws-sdk');

process.env['PATH'] = process.env['PATH'] + ':' + process.env['LAMBDA_TASK_ROOT'];

exports.handler = function(event, context) {
	var memStream = new MemoryStream();
	var html_utf8 = new Buffer(event.html_base64, 'base64').toString('utf8');
	wkhtmltopdf(html_utf8, event.options, function(code, signal) {
		var pdf = memStream.read();

		var s3 = new AWS.S3();
		var params = {
			Bucket : "truecar-billing-pdf",
			Key : "test.pdf",
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
};
