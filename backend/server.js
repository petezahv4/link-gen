const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const firebaseAdmin = require('firebase-admin');
const { exec } = require('child_process');

const app = express();
const port = process.env.PORT || 3000;

// Firebase Admin Initialization
firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.cert({
    type: 'service_account',
    project_id: 'petezah-mothership',
    private_key_id: 'e5c3059d7f7ce069dde68910ba88f6bb19c48a7f',
    private_key: '-----BEGIN PRIVATE KEY-----\nMIIE... (your private key)\n-----END PRIVATE KEY-----\n',
    client_email: 'firebase-adminsdk-fbsvc@petezah-mothership.iam.gserviceaccount.com',
    client_id: '105110709930238648767',
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token',
    auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
    client_x509_cert_url: 'https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40petezah-mothership.iam.gserviceaccount.com'
  }),
  databaseURL: 'https://petezah-mothership.firebaseio.com'
});

// Middleware
app.use(cors());
app.use(bodyParser.json());

// API Route to handle the subdomain request
app.post('/generate-link', (req, res) => {
  const { subdomain } = req.body;

  if (!subdomain) {
    return res.status(400).json({ error: 'Subdomain is required' });
  }

  // Check if the subdomain is already taken (mock logic)
  exec(`firebase hosting:sites:list --project petezah-mothership`, (error, stdout, stderr) => {
    if (stderr) {
      return res.status(500).json({ error: 'Error checking subdomain availability' });
    }

    if (stdout.includes(`${subdomain}.web.app`)) {
      return res.status(400).json({ error: 'Subdomain already taken' });
    }

    // Clone the repository and deploy it
    exec(`git clone https://github.com/pineapple-petezah/pineapple-petezah.github.io.git && cd pineapple-petezah.github.io && firebase use --add && firebase deploy --only hosting --project petezah-mothership`, (error, stdout, stderr) => {
      if (error) {
        return res.status(500).json({ error: 'Error deploying to Firebase' });
      }

      return res.status(200).json({ message: 'Deployment successful!', url: `https://${subdomain}.web.app` });
    });
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
