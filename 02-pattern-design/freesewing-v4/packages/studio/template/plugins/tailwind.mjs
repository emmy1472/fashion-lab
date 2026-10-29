import tailwindPostcss from '@tailwindcss/postcss'
import autoprefixer from 'autoprefixer'

export async function tailwindPlugin() {
  return {
    name: 'tailwind-plugin',
    configurePostCss(postcssOptions) {
      // Appends TailwindCSS and AutoPrefixer.
      postcssOptions.plugins.push(tailwindPostcss)
      postcssOptions.plugins.push(autoprefixer)
      return postcssOptions
    },
  }
}
