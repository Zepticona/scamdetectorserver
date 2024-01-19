import fs from "fs"
import express from "express"
import bodyParser from "body-parser"
import OpenAI from "openai"
import cors from "cors"
import multer from "multer"
import dotenv from "dotenv"
import { WavRecorder, getWaveBlob, downloadWav } from "webm-to-wav-converter"
dotenv.config()
// const speech = require('@google-cloud/speech'); // Import the Google Cloud Speech library.
import speech from "@google-cloud/speech"

process.env.GOOGLE_APPLICATION_CREDENTIALS = 'scam-detector-408617-214613d9f26e.json'; // Set the path to your Google Cloud service account key.

// const {db} = require('./firebase')
import {db, storage, ref, uploadBytes, doc, setDoc} from "./firebase.js"


const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // defaults to process.env["OPENAI_API_KEY"]
});
const upload = multer({
  storage: multer.memoryStorage(), // Store files in memory, you can change it based on your needs
  fileFilter: (req, file, cb) => {
    //Add file type filtering logic here
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only audio files are allowed.'));
    }
  }
});

const app = express();
const PORT = 8081;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false })); // Add this line for form data
app.use(cors());


// Sample data (for demonstration purposes)
let data = [
  { id: 1, name: 'Item 1' },
  { id: 2, name: 'Item 2' },
  { id: 3, name: 'Item 3' }
];

async function convertWebmToMp3() {
  const ffmpeg = createFFmpeg({ log: false });
  await ffmpeg.load();

  const inputName = 'input.webm';
  const outputName = 'output.mp3';

  ffmpeg.FS('writeFile', inputName, await fetch(webmBlob).then((res) => res.arrayBuffer()));

  await ffmpeg.run('-i', inputName, outputName);

  const outputData = ffmpeg.FS('readFile', outputName);
  const outputBlob = new Blob([outputData.buffer], { type: 'audio/mp3' });

  return outputBlob;
}

const blobToBuffer = async (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const buffer = Buffer.from(reader.result);
      resolve(buffer);
    };

    reader.onerror = (error) => {
      reject(error);
    };

    reader.readAsArrayBuffer(blob);
  });
};

// CRUD Endpoints
async function transcribe(dataBuffer) {	
	// Change filename to a buffer like <Buffer 52 49 46 ... 3213123 more bytes>
	const data = dataBuffer;
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

// transcribe("test.wav").then((response) => {
// 	console.log(JSON.stringify(response));
// });

app.get('/checkScam/:buffer', async (req, res) => {
    try {
      const modelResponse = await transcribe("scamsample1.wav");
      const transcription = JSON.stringify(modelResponse);
      console.log(transcription)
      
      const buffer = req.params.buffer;
      console.log(buffer);

      const completion = await openai.chat.completions.create({
          messages: [
              {role: "system", content: "Your name is Feluda AI. You are an excellent detective. You are a Bangladeshi citizen, and your mother tounge is Bengali. You have studied many cases of phone call scams. So if you read the Bengali text of someone, you can judge if they are a scam or not. Whenever you're given a Bengali sentance, you only respond with two words. The first one is always 'Scam'. And the send one is a percentage. It is the percentage of how certain you are that this sentance is a scam or not. Apart from that, if you find gibberish words or sentances that don't make any sense, you say that the percentange is 39%. "},
              {role: "user", content: transcription}
              
          ],
          model: "gpt-3.5-turbo",
      });
      // res.json(completion.choices[0].message.content);
      res.json({
        verdict: completion.choices[0].message.content,
        transcripted: transcription
      })
      console.log(completion.choices[0].message.content);
    } catch(err) {
        console.log(err)
        res.json(err)
    }    
    
  });



// Read (GET)
app.get('/api/items', (req, res) => {
  res.json(data);
});


// Handle FormData with multer
app.post('/sendAudio', upload.any(), async (req, res) => {
  try {
      console.log(req.body.userEmail);
      const speechClient = new speech.SpeechClient();
      
      // Access form data here
      // console.log(req.body.buffer); // The files array contains the Blob data
      // const { firstName, lastName } = req.body
      
      // const buffer = req.files[0].buffer ? 'Audio buffer not found' : req.body.buffer
      const file = req.files[0].buffer;
      const modelResponse = await transcribe(file);
      const transcriptionHuggingface = JSON.stringify(modelResponse);
      // const blob = new Blob([file]); // JavaScript Blob

      const files = req.files.map(file => ({
        fieldname: file.fieldname,
        originalname: file.originalname,
        encoding: file.encoding,
        mimetype: file.mimetype,
        buffer: file.buffer,
      }));
      console.log(files);

      
      const audioBytes = file.toString('base64');
      // downloadWav(audioBytes, false)
      const audio = {
        content: audioBytes
      };
      const config = {
        encoding: 'WEBM_OPUS',   // Audio encoding (change if needed). FLAC/LINEAR16/AMR_WB
        sampleRateHertz: 48000, // Audio sample rate in Hertz (change if needed).
        languageCode: 'bn-BD',   // Language code for the audio (change if needed).
      };
      const data = await speechClient.recognize({audio, config})
      const transcriptionGoogle = data[0].results.map(r => r.alternatives[0].transcript).join("\n");
      

    //   const completion = await openai.chat.completions.create({
    //     messages: [
    //         {role: "system", content: "Your name is Feluda AI. You  are an excellent detective. You are a Bangladeshi citizen, and your mother tounge is Bengali. You have studied many cases of phone call scams. So if you read the Bengali text of someone, you can judge if they are a scam or not. Whenever you're given a Bengali sentance, you only respond with two words. The first one is always 'Scam'. And the send one is a percentage. It is the percentage of how certain you are that this sentance is a scam or not. Apart from that, if you find gibberish words or sentances that don't make any sense, you say that the percentange is 00%. "},
    //         {role: "user", content: transcription}            
    //     ],
    //     model: "gpt-3.5-turbo",
    // });

    // const transcription = await openai.audio.transcriptions.create({
    //   file: req.files[0],
    //   model:"whisper-1"
    // })

    // const recordingNumber = `recording${1}`
    // const userRef = doc(db, 'users', 'isakil416@gmail.com')

    // const dbData = await setDoc(userRef, { recordingNumber: {transcriptedText: 'Eita transcription', verdict: 'Scam. 99%'} }, { merge: true })
    // const peopleRef = db.collection('users').doc('isakil416@gmail.com')
    

    

    res.json({
      // verdict: completion.choices[0].message.content,
      transcriptionGoogle: transcriptionGoogle,
      transcriptionHuggingface: transcriptionHuggingface,
      userEmail: req.body.userEmail
      // rawTrans: data
    })
  } catch(err) {
    console.log(err);
    res.send(err);
  }

  

  // const responseData = {
  //   body: req.body,
  //   files: files,
  // };

  // const recordingsRef = ref(storage, "recordings")
  

  // // const audioRef = ref(storage, `recordings/${req.files[0].originalname}`);


  // const metadata = {
  //   contentType: req.files[0].mimetype,
  //   encoding: req.files[0].encoding,
  //   fieldname: req.files[0].fieldname
  // };
  // // const snapshot = await uploadBytes(audioRef, files, metadata)
  // // console.log('Uplaoded to firebase!')

  // // const peopleRef = db.collection('users').doc('isakil416@gmail.com')
  // // const res2 = await peopleRef.set(files);
  

  // //res.status(200).send(responseData);
  // //res.json(req.body)
  // const buffer = files[0].buffer;
  // try {
  //   const modelResponse = await transcribe(buffer);

  //   console.log(modelResponse.text)
  //   const transcription = JSON.stringify(modelResponse.text);
  //   console.log(transcription)

  //   const completion = await openai.chat.completions.create({
  //       messages: [
  //           {role: "system", content: "Your name is Feluda AI. You are an excellent detective. You are a Bangladeshi citizen, and your mother tounge is Bengali. You have studied many cases of phone call scams. So if you read the Bengali text of someone, you can judge if they are a scam or not. Whenever you're given a Bengali sentance, you only respond with two words. The first one is always 'Scam'. And the send one is a percentage. It is the percentage of how certain you are that this sentance is a scam or not. Apart from that, if you find gibberish words or sentances that don't make any sense, you say that the percentange is 00%. "},
  //           {role: "user", content: transcription}            
  //       ],
  //       model: "gpt-3.5-turbo",
  //   });
  //   // res.json(completion.choices[0].message.content);
  //   res.json({
  //     verdict: completion.choices[0].message.content,
  //     transcripted: modelResponse.text
  //   })
  //   console.log(completion.choices[0].message.content);
  // } catch(err) {
  //     console.log(err)
  //     res.json(err)
  // }
});

// async function useGoogleSpeechToText(audioName) {
//     try {
//         // Initialize a SpeechClient from the Google Cloud Speech library.
//         const speechClient = new speech.SpeechClient();

//         // Read the binary audio data from the specified file.
//         const file = fs.readFileSync(audioName);
//         const audioBytes = file.toString('base64');
//         console.log(file);
//         // Create an 'audio' object with the audio content in base64 format.
//         const audio = {
//             content: audioBytes
//         };

//         // // Define the configuration for audio encoding, sample rate, and language code.
//         const config = {
//             encoding: 'LINEAR16',   // Audio encoding (change if needed).
//             sampleRateHertz: 48000, // Audio sample rate in Hertz (change if needed).
//             languageCode: 'bn-BD'   // Language code for the audio (change if needed).
//         };

//         // // Return a Promise for the transcription result.
//         return new Promise((resolve, reject) => {
//             // Use the SpeechClient to recognize the audio with the specified config.
//             speechClient.recognize({ audio, config })
//                 .then(data => {
//                     resolve(data); // Resolve the Promise with the transcription result.
//                 })
//                 .catch(err => {
//                     reject(err); // Reject the Promise if an error occurs.
//                 });
//         });
//     } catch (error) {
//         console.error('Error:', error);
//     }
// }
// app.get('/transcribeUsingGoogle', async (req, res) => {
//   try {
//     // Call the transcribeAudio function to transcribe 'output.mp3'.
//     const text = await useGoogleSpeechToText('sj2samp1.aac');

//     // Log the entire response object (for debugging purposes).
  

//     res.send('success')
//     // Extract and log the transcribed text from the response.
//     console.log(text[0].results.map(r => r.alternatives[0].transcript).join("\n"));
//     res.send(text[0].results.map(r => r.alternatives[0].transcript).join("\n"))
//   }catch(err) {
//     res.send(err);
//   }
// })
// (async () => {
//     // Call the transcribeAudio function to transcribe 'output.mp3'.
//     const text = await useGoogleSpeechToText('output.mp3');

//     // Log the entire response object (for debugging purposes).
//     console.log(text);

//     // Extract and log the transcribed text from the response.
//     console.log(text[0].results.map(r => r.alternatives[0].transcript).join("\n"));
// })();

// Read single item (GET)
app.get('/api/items/:id', (req, res) => {
  const itemId = parseInt(req.params.id);
  const item = data.find(item => item.id === itemId);

  if (item) {
    res.json(item);
  } else {
    res.status(404).json({ error: 'Item not found' });
  }
});

// Create (POST)
app.post('/api/items', (req, res) => {
  const newItem = req.body;
  newItem.id = data.length + 1;
  data.push(newItem);
  res.status(201).json(newItem);
});

// Update (PUT)
app.put('/api/items/:id', (req, res) => {
  const itemId = parseInt(req.params.id);
  const updatedItem = req.body;
  const index = data.findIndex(item => item.id === itemId);

  if (index !== -1) {
    data[index] = { ...data[index], ...updatedItem };
    res.json(data[index]);
  } else {
    res.status(404).json({ error: 'Item not found' });
  }
});

// Delete (DELETE)
app.delete('/api/items/:id', (req, res) => {
  const itemId = parseInt(req.params.id);
  data = data.filter(item => item.id !== itemId);
  res.json({ message: 'Item deleted successfully' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
