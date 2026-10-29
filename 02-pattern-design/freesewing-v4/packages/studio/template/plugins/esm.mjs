export function esmPlugin() {
  return {
    name: 'esm-plugin',
    configureWebpack() {
      return {
        module: {
          rules: [
            {
              test: /\.mjs$/,
              include: /node_modules\/@freesewing/,
              use: {
                loader: 'babel-loader',
                options: {
                  presets: [
                    ['@babel/preset-react', { runtime: 'automatic' }],
                    ['@babel/preset-env', { modules: false }],
                  ],
                },
              },
            },
            {
              test: /\.mjs$/,
              include: /node_modules/,
              exclude: /node_modules\/@freesewing/,
              type: 'javascript/auto',
            },
            {
              test: /\.mjs$/,
              exclude: /node_modules/,
              use: {
                loader: 'babel-loader',
                options: {
                  presets: [
                    ['@babel/preset-react', { runtime: 'automatic' }],
                    ['@babel/preset-env', { modules: false }],
                  ],
                },
              },
            },
          ],
        },
      }
    },
  }
}
