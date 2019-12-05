module.exports = {
    env: {
        node: true,
        es6: true,
    },
    extends: [
        '@djthoms/eslint-config',
        '@djthoms/eslint-config/typescript',
    ],
    rules: {
        '@typescript-eslint/explicit-function-return-type': 0,
        '@typescript-eslint/no-var-requires': 0,
        '@typescript-eslint/ban-ts-ignore': 'warn',
        '@typescript-eslint/no-this-alias': 'warn',
    },
};
