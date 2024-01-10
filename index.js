var fs = require('fs')

/*
arijitx/wav2vec2-xls-r-300m-bengali
https://huggingface.co/arijitx/wav2vec2-xls-r-300m-bengali
*/

async function transcribe(filename) {	
	// Change filename to a buffer like <Buffer 52 49 46 ... 3213123 more bytes>
	const data = fs.readFileSync(filename);
    console.log(data);
	const response = await fetch(
		"https://api-inference.huggingface.co/models/arijitx/wav2vec2-large-xlsr-bengali",
		{
			headers: { Authorization: "Bearer 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" },
			method: "POST",
			body: data,
		}
	);
	const result = await response.json();
	return result;
}


transcribe("test.wav").then((response) => {
	console.log(JSON.stringify(response));
});

/*
bengaliAI/BanglaConformer
https://huggingface.co/bengaliAI/BanglaConformer
*/
// async function query(filename) {
// 	const data = fs.readFileSync(filename);
// 	const response = await fetch(
// 		"https://api-inference.huggingface.co/models/bengaliAI/BanglaConformer",
// 		{
// 			headers: { Authorization: "Bearer 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" },
// 			method: "POST",
// 			body: data,
// 		}
// 	);
// 	const result = await response.json();
// 	return result;
// }

// query("test.wav").then((response) => {
// 	console.log(JSON.stringify(response));
// });

/*
bangla-speech-processing/BanglaASR
https://huggingface.co/bangla-speech-processing/BanglaASR
*/
// async function query(filename) {
// 	const data = fs.readFileSync(filename);
// 	const response = await fetch(
// 		"https://api-inference.huggingface.co/models/bangla-speech-processing/BanglaASR",
// 		{
// 			headers: { Authorization: "Bearer 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" },
// 			method: "POST",
// 			body: data,
// 		}
// 	);
// 	const result = await response.json();
// 	return result;
// }

// query("callTest.wav").then((response) => {
// 	console.log(JSON.stringify(response));
// });