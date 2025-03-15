const express = require('express');
const bodyParser = require('body-parser');
const { exec } = require('child_process');

const app = express();
const port = 3000;

// Middleware to parse JSON requests
app.use(bodyParser.json());

// Route to handle subdomain submission and deployment
app.post('/generate-link', (req, res) => {
    const { subdomain } = req.body;

    if (!subdomain || subdomain.length < 3 || subdomain.length > 30 || /[^a-z0-9-]/.test(subdomain)) {
        return res.json({ success: false, message: 'Invalid subdomain name' });
    }

    // Check if the subdomain is available by trying to create a Firebase project
    const projectName = `${subdomain}-project`;

    // Check if the subdomain is already in use by trying to create a project on Firebase
    exec(`firebase projects:create ${projectName}`, (err, stdout, stderr) => {
        if (err) {
            console.error(`Error creating Firebase project: ${stderr}`);
            if (stderr.includes('already exists')) {
                return res.json({ success: false, message: 'Subdomain already taken' });
            }
            return res.json({ success: false, message: 'Error creating Firebase project' });
        }

        console.log('Project created:', stdout);

        // Initialize Firebase Hosting for the created project
        exec(`firebase init hosting --project ${projectName}`, (err, stdout, stderr) => {
            if (err) {
                console.error('Error initializing hosting:', stderr);
                return res.json({ success: false, message: 'Error initializing Firebase Hosting' });
            }

            console.log('Hosting initialized:', stdout);

            // Clone the GitHub repository and deploy it
            exec(`git clone https://github.com/pineapple-petezah/pineapple-petezah.github.io.git`, (err, stdout, stderr) => {
                if (err) {
                    console.error('Error cloning GitHub repo:', stderr);
                    return res.json({ success: false, message: 'Error cloning GitHub repository' });
                }

                console.log('GitHub repository cloned:', stdout);

                // Change directory to the cloned repo and deploy it to Firebase Hosting
                exec(`cd pineapple-petezah.github.io && firebase deploy --project ${projectName}`, (err, stdout, stderr) => {
                    if (err) {
                        console.error('Error deploying to Firebase:', stderr);
                        return res.json({ success: false, message: 'Error deploying Firebase Hosting' });
                    }

                    console.log('Deploy successful:', stdout);
                    res.json({ success: true, link: `https://${subdomain}.web.app` });
                });
            });
        });
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
