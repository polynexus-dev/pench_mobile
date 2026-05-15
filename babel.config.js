module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './src',
            '@features': './src/features',
            '@shared': './src/shared',
            '@store': './src/store',
            '@services': './src/services',
            '@roles': './src/roles',
            '@config': './src/config',
            '@constants': './src/constants',
            '@utils': './src/utils',
            '@hooks': './src/hooks',
            '@types': './src/types',
            '@assets': './src/assets',
            '@errors': './src/errors', 
          },
        },
      ],
       'react-native-reanimated/plugin',
    ],
  };
};