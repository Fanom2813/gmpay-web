const browserify = require('browserify');
const fs = require('fs');
const rimraf = require('rimraf');
const esmify = require('esmify');
const watchify = require('watchify');
const { minify } = require('terser');

const cssify = require('cssify'); // Include the cssify plugin

// Input file (your entry point)
const entryFile = './src/index.js';

// Output folder (where you want to save the bundled code)
const outputFolder = './dist';

// Output file (full path to the bundle)
const outputFile = `${outputFolder}/bundle.js`;

// Ensure the 'dist' folder exists, create it if not
if (!fs.existsSync(outputFolder)) {
    fs.mkdirSync(outputFolder);
} else {
    // If it exists, clean it
    rimraf.sync(outputFolder + '/*');
}

// Create a Browserify instance
const b = browserify(entryFile, { standalone: 'GMPay' });


// Use the esify plugin
b.plugin(esmify, { globalName: 'GMPay' });

// Use cssify to bundle CSS
b.transform(cssify);


// Use watchify for watching and rebuilding
const w = watchify(b);

// When a change is detected, trigger a rebuild
w.on('update', function () {
    console.log('File changes detected. Rebuilding...');
    bundle();
});

function bundle() {
    // Bundle the code
    w.bundle()
        .on('error', function (err) {
            console.error(err.toString());
        })
        .pipe(fs.createWriteStream(outputFile))
        .on('finish', function () {
            console.log('Bundle created successfully!');
            // Minify the output using terser
            minifyFile(outputFile);
        });
}

async function minifyFile(file) {
    try {
        const inputCode = fs.readFileSync(file, 'utf8');
        const result = await minify(inputCode, {
            compress: true,
            mangle: true,
        });

        if (result.error) {
            console.error(result.error);
        } else {
            // Save the minified code back to the output file
            fs.writeFileSync(file, result.code, 'utf8');
            console.log('Minification complete!');
        }
    } catch (error) {
        console.error('Error reading or minifying the file:', error);
    }
}

// Initial bundle
bundle();