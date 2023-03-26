const path = require('path');
const webpack = require('webpack');
const nodeExternals = require('webpack-node-externals');

module.exports = {
    entry: {
        algorithm: './src/lcr/process/algorithm/index.ts',
        crud: './src/lcr/crud/index.ts',
        save: './src/lcr/process/save/index.ts',
        transform: './src/lcr/process/transform/index.ts'
    },
    mode: 'development',
    target: 'node',
    externals: [nodeExternals({
        allowlist: ['@nestjs/core', '@redis/client', '@vendia/serverless-express', 'nanoid']
    })],
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
    plugins: [
        new webpack.IgnorePlugin({
            checkResource(resource) {
                const lazyImports = ['@nestjs/microservices', '@nestjs/platform-express', '@nestjs/websockets/socket-module', '@nestjs/microservices/microservices-module', '@nestjs/grahpql', 'cache-manager', 'class-validator', 'class-transformer', 'graphql'];
                if (!lazyImports.includes(resource)) {
                    return false;
                }
                try {
                    require.resolve(resource);
                } catch (err) {
                    return true;
                }
                return false;
            },
        }),
    ],
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
