const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = {
    entry: {
        process: './src/lcr/process/index.ts'
    },
    target: 'node',
    externals: [nodeExternals()],
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].js',
        library: {
            type: 'commonjs2'
        }
    },
    resolve: {
        extensions: ['.ts', '.js']
    },
    module: {
        rules: [
            {
                test: /\.(ts)$/,
                exclude: /node_modules/,
                use: {
                    loader: 'swc-loader',
                    options: {
                        jsc: {
                            parser: {
                                syntax: "typescript",
                                decorators: true
                            },
                            transform: {
                                legacyDecorator: true,
                                decoratorMetadata: true
                            }
                        }
                    }
                }
            }
        ]
    }
};
