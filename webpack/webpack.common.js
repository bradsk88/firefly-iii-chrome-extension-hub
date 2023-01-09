const webpack = require("webpack");
const path = require("path");
const srcDir = path.join(__dirname, "..", "src");

module.exports = {
    entry: {
        background: path.join(srcDir, 'background.ts'),
        initialize: path.join(srcDir, 'initialize.tsx'),
        hub: path.join(srcDir, 'hub.tsx'),
    },
    output: {
        path: path.join(__dirname, "../dist"),
        filename: "[name].js",
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: "ts-loader",
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: [".ts", ".tsx", ".js"],
        preferRelative: true
    },
    target: ['node']
};