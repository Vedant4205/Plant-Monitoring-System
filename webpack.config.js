const path = require('path');

module.exports = {
    entry: './src/client/script.ts', // ✅ Adjust this if your entry file has a different name
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist/client'), // ✅ Output for client-side
    },
    resolve: {
        extensions: ['.ts', '.js'],
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            }
        ],
    },
    mode: 'development', // Change to 'production' for minified version
    devtool: 'source-map', // Helpful for debugging TypeScript
};
