# @djthoms/pika-plugin-build-web

> **Note:** this plugin in intended to be used with `@pika/plugin-ts-standard-pkg`. If you're using `@pika/plugin-standard-pkg` see the section for how you can configure that pipeline.

> A [@pika/pack](https://github.com/pikapkg/pack) build plugin.
> Adds a Node.js distribution to your package, built & optimized to run on [Node.js](https://nodejs.org/). If no other distribution is included with your package, many other tools & bundlers can understand this format as well.

In addition to all the great things pika offers, this plugin is a super set of the `@pika/plugin-bundle-node` plugin, providing bundle support for JSON files and offering you the ability to add extra rollup plugins to the build flow for your CJS modules.

## Motivation

The main motivation is to support JSON bundling and provide a way to add extra rollup plugins.

1. Importing and bundling JSON files leads to failure before `@pika/plugin-bundle-node` can execute
2. I just want JSON files to be bundled, I don't need the every node module injected to `dist-node/index.js`
3. No way to control which rollup plugins are executed by pika

## Install

```sh
# npm:
npm install @pika/pack @pika/plugin-build-web @djthoms/pika-plugin-build-web --save-dev
# yarn:
yarn add @pika/pack @pika/plugin-build-web @djthoms/pika-plugin-build-web --dev
```

Note: `@pika/pack` and `@pika/plugin-build-web` are peer dependencies -- you need to install these for this plugin to work.

## Usage

> Disclaimer: This plugin is for advanced usage only. Consider alternatives before resorting to this plugin. Refrain from overriding the default babel settings unless absolutely necessary.

```jsonc
{
    "name": "example-package-json",
    "version": "1.0.0",
    "@pika/pack": {
        "pipeline": [
            ["@pika/plugin-ts-standard-pkg"],
            [
                "@djthoms/pika-plugin-build-web", // calls @pika/plugin-build-node internally
                {
                    "plugins": [
                        "@rollup/plugin-beep",
                        [
                            // configure plugins using duples -- kind of like how we configure @babel/preset-env ;)
                            "@rollup/plugin-strip",
                            {
                                "sourceMap": false
                            }
                        ]
                    ],
                    "jsonConfig": {
                        "preferConst": true
                    }
                }
            ]
        ]
    }
}
```

For more information about @pika/pack & help getting started, [check out the main project repo](https://github.com/pikapkg/pack).

## Options

All options are optional.

| Option             | Type               | Default Value       | Description                                                                                                                                                                                        |
| ------------------ | ------------------ | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"sourcemap"`      | boolean            | `true`              | Adds a [source map](https://www.html5rocks.com/en/tutorials/developertools/sourcemaps/) for this build.                                                                                            |
| `"minNodeVersion"` | string             | `"8"`               | This plugin will build your package for the current minimum [Node.js LTS](https://github.com/nodejs/Release) major version. This option allows you to target later versions of Node.js only.       |
| `"entrypoint"`     | string             | `"main"`            | Customize the package.json manifest entrypoint set by this plugin. Accepts either a string, an array of strings, or `null` to disable entrypoint. Changing this is not recommended for most usage. |
| `"plugins"`        | string[]           | `[]`                | Configure rollup by adding extra plugins. Be sure to install all related rollup plugins otherwise the build will fail!                                                                             |
| `"debug"`          | boolean \| 'trace' |                     | Set true to enable debugging info on build failures                                                                                                                                                |
| `"jsonConfig"`     | object             | `{ compact: true }` | Customize the JSON plugin by passing in your own config                                                                                                                                            |

## ES2020 Target Build Issues

There are some known issues with supporting optional chaining and other ES2020 features when using `@pika/plugin-build-web`. Since there is no `babel` task in the web builder, you need to override the target in the standard ts builder:

```json
{
    "@pika/pack": {
        "pipeline": [
            [
                "@pika/plugin-ts-standard-pkg",
                {
                    "args": ["--target", "es2019"]
                }
            ],
            ["@djthoms/pika-plugin-build-web"]
        ]
    }
}
```

## Result

1. Adds a Node.js distribution to your built package: `dist-node/index.js`
2. Common.js (CJS) Module Syntax
3. Bundles all JSON files by default
4. Transpiled to run on Node.js LTS (Currently, supports Node.js version v6+)
5. Adds a "main" entrypoint to your built `package.json` manifest.

## Using with `@pika/plugin-standard-pkg`

`@djthoms/pika-plugin-build-web` is not intended to be used with `@pika/plugin-standard-pkg`. If you want to import JSON files, for example, you can accomplish this by tweaking your pipeline and `.babelrc`:

```json
{
    "plugins": ["babel-plugin-inline-json-import"]
}
```

[`babel-plugin-inline-json-import`](https://www.npmjs.com/package/babel-plugin-inline-json-import) is a small babel plugin that works with babel 6/7 and in-lines your JSON files. Heed caution when using this since it will blindly import **everything** and bundle it inside your source!

and in your `package.json`

```json
{
    "@pika/pack": {
        "pipeline": [
            [
                "@pika/plugin-standard-pkg",
                {
                    "exclude": ["**/*.json"]
                }
            ],
            ["@pika/plugin-build-web"]
        ]
    }
}
```

We want to be sure we _ignore_ all json files otherwise `@pika/plugin-build-web` will try and resolve them during the rollup process.
