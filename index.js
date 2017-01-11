var wkhtmltopdf = require('wkhtmltopdf');
var MemoryStream = require('memorystream');
var AWS = require('aws-sdk');

process.env['PATH'] = process.env['PATH'] + ':' + process.env['LAMBDA_TASK_ROOT'];

var convertToPdf = function(htmlUtf8, event, callback) {
	var memStream = new MemoryStream();
	wkhtmltopdf(htmlUtf8, event.options, function(code, signal) {
		callback(memStream.read());
	}).pipe(memStream);
}

exports.handler = function(event, context) {
	if(event.Records) {
		var bucketName = event.Records[0].s3.bucket.name;
		var fileName = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, " "));

		var params = {
			Bucket: bucketName,
			Key: fileName
		};

		var s3 = new AWS.S3();
		s3.getObject(params, function(err, data) {
			var htmlUtf8 = data.Body.toString('utf8');
			convertToPdf(htmlUtf8, event, function(pdf) {
				params.Body = pdf;
				params.Key = params.Key + ".pdf";
				s3.putObject(params, function(err, data) {
					if (err) {
						console.log(err)
					} else {
						context.done(null, { pdf_base64: pdf.toString('base64') });
					}
				})
			});
		});
	}
};
