export function esmPlugin() {
  return {
    name: 'esm-plugin',
    configureWebpack() {
      return {
        module: {
          rules: [
            {
              test: /\.mjs$/,
              include: /node_modules/,
              type: 'javascript/auto',
            },
            {
              test: /\.mjs$/,
              exclude: /node_modules/,
              use: {
                loader: 'babel-loader',
                options: {
                  presets: ['@babel/preset-react'],
                },
              },
            },
          ],
        },
      }
    },
  }
}
