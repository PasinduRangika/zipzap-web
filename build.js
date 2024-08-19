const fs = require("fs");
const path = require("path");
const CleanCSS = require("clean-css");
const https = require("https");

const args = process.argv;
const vIndex = args.indexOf("-a");

// const SITE_URL = 'https://codimite.ai';
const SITE_URL = "https://codimite.flywheelstaging.com";

const CSS_DESCRIPTION = `@charset "UTF-8";

/*
Theme Name: Twenty Nineteen Child
Theme URI: https://wordpress.org/themes/twentynineteen/
Description: Twenty Nineteen Child Theme
Author: Codimite
Author URI: https://wordpress.org/
Template: twentynineteen
Version: 1.0.0
*/
`;

const cssFiles = [
  "public/css/xxl.css",
  "public/css/lg.css",
  "public/css/md.css",
  "public/css/sm.css",
  "public/css/xs.css",
];

const excludeFiles = ["blog-articles.php", "blog-articles.html"];

// Directory where your HTML files are located
const htmlDirectory = "./public/";

const directory = __dirname;

// Directory where the PHP files will be saved
const phpDirectory = "./.build/pages/";

// Function to delete all files in a directory
function deleteFilesInDirectory(directory) {
  fs.readdir(directory, (err, files) => {
    if (err) {
      console.error(`Error reading directory ${directory}:`, err);
      return;
    }

    files.forEach((file) => {
      const filePath = path.join(directory, file);
      if (excludeFiles.includes(file)) return;
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error(`Error deleting file ${filePath}:`, err);
        } else {
          console.log(`Deleted ${filePath}`);
        }
      });
    });
  });
}

// Delete all files in the .build directory
deleteFilesInDirectory(phpDirectory);

function combineCSS() {
  let combinedCSS = "";
  cssFiles.forEach((file) => {
    const filePath = path.join(directory, file);
    const cssContent = fs.readFileSync(filePath, "utf8");
    combinedCSS += cssContent + "\n";
  });
  fs.writeFileSync(path.join(directory, ".build/combined.css"), combinedCSS);
  minifyCSS(".build/combined.css");
}

function minifyCSS(file) {
  const filePath = path.join(directory, file);
  const outputFile = path.join(directory, ".build/combined.min.css");
  const cssContent = fs.readFileSync(filePath, "utf8");
  const minifiedCSS = new CleanCSS().minify(cssContent).styles;
  fs.writeFileSync(outputFile, CSS_DESCRIPTION + "\n" + minifiedCSS);
  console.log("Combined CSS file has been minified successfully.");
}

combineCSS();

// Read the HTML directory
fs.readdir(htmlDirectory, (err, files) => {
  if (err) {
    console.error("Error reading directory:", err);
    return;
  }

  // Loop through all files in the directory
  files.forEach((file) => {
    if (file !== "." && file !== "..") {
      if (excludeFiles.includes(file)) return;
      // Read the content of the HTML file
      fs.readFile(path.join(htmlDirectory, file), "utf8", (err, data) => {
        if (err) {
          return;
        }

        let htmlContent = "";
        // Crop the content from <header> to <footer>
        if (file !== "index.html") {
          const startPos = data.indexOf("</header>") + 10;
          const endPos = data.indexOf("<footer ");

          if (startPos !== -1 && endPos !== -1) {
            htmlContent = data.substring(startPos, endPos);
          }
        } else {
          htmlContent = data;
        }

        // Replace "./wp-content/uploads/" with "/wp-content/uploads/"
        htmlContent = htmlContent.replace(/\.\/wp-content\/uploads\//g, "/wp-content/uploads/");

        // Replace multiple newlines with a single newline
        htmlContent = htmlContent
          .split("\n")
          .map((line) => line.trim())
          .join("\n");
        htmlContent = htmlContent.replace(/\n{2,}/g, "\n");

        // Create the PHP file name by replacing .html with .php
        const phpFileName = file.replace(".html", ".php");

        // Ensure that the directory exists or create it
        const destinationDirectory = path.join(phpDirectory, path.dirname(phpFileName));
        if (!fs.existsSync(destinationDirectory)) {
          fs.mkdirSync(destinationDirectory, { recursive: true });
        }

        // Save the processed content to the PHP file
        fs.writeFile(path.join(phpDirectory, phpFileName), htmlContent, "utf8", (err) => {
          if (err) {
            console.error(`Error writing file ${phpFileName}:`, err);
            return;
          }
          console.log(`Processed ${file} and saved as ${phpFileName}`);
        });
      });
    }
  });
});
