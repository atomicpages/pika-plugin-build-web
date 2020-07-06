import path from 'path';

import { rollup } from 'rollup';
import json, { RollupJsonOptions } from '@rollup/plugin-json';

import { BuilderOptions as PikaBuilderOptions } from '@pika/types';

export { manifest } from '@pika/plugin-build-web';

type BuilderOptions = Omit<PikaBuilderOptions, 'options'> & {
    options: {
        sourcemap?: boolean;
        plugins?: Plugins;
        debug?: boolean | 'trace';
        jsonConfig?: RollupJsonOptions;
    };
};

type ComplexPlugin = [string, Record<string, unknown>];
type Plugins = string[] | ComplexPlugin[];

function processPlugins(plugins?: Plugins) {
    if (!plugins) {
        return [];
    }

    return (plugins as unknown[]).map((plugin: string | ComplexPlugin) => {
        let m: Function;

        if (typeof plugin === 'string') {
            m = require(plugin)();
        } else if (Array.isArray(plugin) && plugin.length === 2) {
            m = require(plugin[0])(plugin[1]);
        } else {
            throw new Error('Expected string or config array (i.e. ["name", {/* config*/ }])');
        }

        return m;
    });
}

export async function build({ out, options = {}, reporter }: BuilderOptions): Promise<void> {
    const writeToWeb = path.join(out, 'dist-web', 'index.js');
    const plugins = processPlugins(options.plugins);

    try {
        const result = await rollup({
            input: path.join(out, 'dist-src/index.js'),
            plugins: [
                json({
                    compact: true,
                    ...options.jsonConfig,
                }),
                ...plugins,
            ],
            onwarn: (warning, defaultOnWarnHandler) => {
                // Unresolved external imports are expected
                if (
                    warning.code === 'UNRESOLVED_IMPORT' &&
                    !(warning.source.startsWith('./') || warning.source.startsWith('../'))
                ) {
                    return;
                }

                defaultOnWarnHandler(warning);
            },
        });

        await result.write({
            file: writeToWeb,
            format: 'esm',
            exports: 'named',
            sourcemap: options.sourcemap === undefined ? true : options.sourcemap,
        });

        reporter.created(writeToWeb, 'module');
    } catch (e) {
        if (options.debug) {
            console.error(options.debug === 'trace' ? e : e.message);
        }

        process.exit(1);
    }
}
