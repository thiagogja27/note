const { FlatCompat } = require("@eslint/eslintrc");
const nextPlugin = require("@next/eslint-plugin-next");

const compat = new FlatCompat();

module.exports = [
  {
    plugins: {
      "@next/next": nextPlugin,
    },
  },
  ...compat.extends("next"),
];
