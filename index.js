// console.log('hello');
// const express = require('express');

// const app = express();

// app.use(express.json());

// app.get('/', (req, res) => {
//   return res.status(200).json('good');
// })

// app.listen(8000, () => {
//   console.log('running');
// })

console.log('starting');
const { google } = require('googleapis');
const fs = require('fs');
const readline = require('readline');

const cors = require('cors');
const express = require('express');

const app = express();

app.use(express.json())
app.use(cors({
  Credential: true,
  origin: ['https://vboard-vedant.vercel.app', 'http://localhost:5173']
}))

const { GoogleGenerativeAI } = require("@google/generative-ai");

// Specify the scope for Blogger API
const SCOPES = ['https://www.googleapis.com/auth/blogger'];
const TOKEN_PATH = 'token.json';
const aikey = 'AIzaSyBG6zjR6SAc2UfODa_8BIMvKmrfk8QT7hc';

const genAI = new GoogleGenerativeAI(aikey);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const prompt = "Write a 5-10 page detailed blog post on a unique and interesting scientific topic. The topic should explore a lesser-known scientific law, theory, or phenomenon. Make sure to cover the topic in-depth, including its historical context, key principles, real-world applications, and the impact it has had on science and technology. The blog should be engaging, informative, and suitable for a general audience. It should not repeat any topics that have been covered in previous blog postsFocus on topics related to various scientific fields, including physics, biology, chemistry, astronomy, and more. The blog should explore new and thought-provoking questions or discoveries in science. Do not repeat the same topic from previous blogs; each blog must be based on a fresh and exciting scientific law, theory, or question.Ensure the blog is around 5-10 pages in length, providing ample explanation, context, and examples. The tone should be informative yet approachable, with clear explanations for complex ideas.Please ensure that the blog is formatted in clean HTML. Use proper HTML tags like <h1>, <h2>, <p>, and <ul> for headings, paragraphs, and lists. Avoid using markdown symbols such as asterisks * or hashtags #. Ensure the blog is visually appealing when pasted into a blog editor, with clear, structured formatting for easy readability. do not make <html> and <head> and <body> tag only write content in between of the body tag";
const prompt1 = "write a 5-10 page blog on a different and interesting scientific law or question. dont repeat the topic of the blog."

app.get('/', (req, res) => {
  console.log('blogging');
  makeBlog();
  return res.status(200).json('good');
})

app.listen(8000, () => {
  console.log('Server is running on port 8000');
  makeBlog();
})

async function generateBlog() {
  try {
    result = await model.generateContent([prompt]);
    return result?.response?.text()
  } catch (error) {
    console.log(error);
  }
}

function makeBlog() {
  // Load client secrets from a file
  fs.readFile('cred.json', (err, content) => {
    if (err) return console.error('Error loading client secret file:', err);
    authorize(JSON.parse(content), createPost);
  });

  // setInterval(makeBlog(), 3600000);
}

/**
 * Authorize a client with credentials, then call the Blogger API.
 */
function authorize(credentials, callback) {
  const { client_secret, client_id, redirect_uris } = credentials.web;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  // Check if token already exists
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getAccessToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

/**
 * Get and store new token after prompting for user authorization.
 */
function getAccessToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this URL:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) console.error(err);
      });
      callback(oAuth2Client);
    });
  });
}

/**
 * Create a blog post.
 */
async function createPost(auth) {
  const blogger = google.blogger({ version: 'v3', auth });

  const content = await generateBlog();
  // const content = "blog";

  // console.log("blog: ", content, "done");

  const blogId = '5038220757806821788'; // Replace with your blog's ID
  const post = {
    content: content,
  };

  blogger.posts.insert(
    {
      blogId: blogId,
      requestBody: post,
    },
    (err, res) => {
      if (err) return console.error('The API returned an error: ' + err);
      console.log(`Post published: ${res.data.url}`);
    }
  );
}
