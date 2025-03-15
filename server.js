const express = require("express");
const bodyParser = require("body-parser");
const { exec } = require("child_process");

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static("public"));

// Route to handle the subdomain link generation
app.post("/generate-link", (req, res) => {
    const { subdomain } = req.body;

    // First, ensure that the subdomain is valid and doesn't contain illegal characters
    if (!subdomain || subdomain.length < 3 || subdomain.length > 30 || /[^a-z0-9-]/.test(subdomain)) {
        return res.json({ success: false, message: "Invalid subdomain name" });
    }

    // Firebase project creation and hosting initialization
    const projectName = `${subdomain}-project`;

    // Create the Firebase project
    exec(`firebase projects:create ${projectName}`, (err, stdout, stderr) => {
        if (err) {
            console.error("Error creating Firebase project:", stderr);
            return res.json({ success: false, message: "Error creating Firebase project" });
        }

        console.log("Project created:", stdout);

        // Initialize Firebase hosting
        exec("firebase init hosting --project " + projectName, (err, stdout, stderr) => {
            if (err) {
                console.error("Error initializing hosting:", stderr);
                return res.json({ success: false, message: "Error initializing Firebase Hosting" });
            }

            console.log("Hosting initialized:", stdout);

            // Deploy content (dummy deployment for the link generation)
            exec("firebase deploy --project " + projectName, (err, stdout, stderr) => {
                if (err) {
                    console.error("Error deploying:", stderr);
                    return res.json({ success: false, message: "Error deploying Firebase Hosting" });
                }

                console.log("Deploy successful:", stdout);
                res.json({ success: true });
            });
        });
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
