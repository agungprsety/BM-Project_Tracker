import Jimp from 'jimp';

async function removeWhiteBg(inputPath, outputPath) {
    console.log(`Processing ${inputPath}...`);
    try {
        const image = await Jimp.read(inputPath);

        // Settings for feathering the alpha channel
        const whitePoint = 240; // Anything lighter than this is fully transparent
        const blackPoint = 130; // Anything darker than this is fully opaque

        image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
            const r = this.bitmap.data[idx + 0];
            const g = this.bitmap.data[idx + 1];
            const b = this.bitmap.data[idx + 2];

            // Use the maximum color value to determine how close to white it is.
            // Or better, use min(r,g,b) to only affect pixels that are light in all channels
            const minRGB = Math.min(r, g, b);

            let alpha = 255;
            if (minRGB >= whitePoint) {
                alpha = 0;
            } else if (minRGB > blackPoint) {
                // Calculate gradient alpha
                const ratio = (minRGB - blackPoint) / (whitePoint - blackPoint);
                // Non-linear falloff for smoother edges
                alpha = Math.round(255 * (1 - Math.pow(ratio, 1.5)));
            }

            this.bitmap.data[idx + 3] = alpha;
            // Optionally premultiply? Let's just set alpha. 
            // In browser, blending with a dark bg might look weird if the color is still white, 
            // but brightness-0 invert makes it all perfect anyway.
        });

        await image.writeAsync(outputPath);
        console.log(`Saved ${outputPath}`);
    } catch (e) {
        console.error(e);
    }
}

async function main() {
    await removeWhiteBg("public/sigi_s.png", "public/sigi_s_transparent.png");
    await removeWhiteBg("public/sigi_margafull.png.jpg", "public/sigi_margafull_transparent.png");
}

main();
