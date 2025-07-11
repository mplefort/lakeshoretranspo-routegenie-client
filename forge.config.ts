import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerRpm } from '@electron-forge/maker-rpm';
import { MakerDMG } from '@electron-forge/maker-dmg';
import { AutoUnpackNativesPlugin } from '@electron-forge/plugin-auto-unpack-natives';
import { WebpackPlugin } from '@electron-forge/plugin-webpack';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { FuseV1Options, FuseVersion } from '@electron/fuses';
import { PublisherGithub } from '@electron-forge/publisher-github';


import { mainConfig } from './webpack.main.config';
import { rendererConfig } from './webpack.renderer.config';

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
     ignore: [
            /node_modules\/(?!(better-sqlite3|bindings|file-uri-to-path)\/)/,
      ],
     extraResource: [
       'package.json',
       'mappings',
       'reports'
     ],
     icon: process.platform === 'darwin' ? 'src/img/LST_icon_mac' : 'src/img/LST_icon_win'
  },
  rebuildConfig: {},
  makers: [
    new MakerSquirrel({
      setupIcon: 'src/img/LST_icon_win.ico'
    }), 
    new MakerZIP({}, ['darwin']), 
    new MakerDMG({
      icon: 'src/img/LST_icon_mac.icns'
    }, ['darwin']),
    new MakerRpm({}), 
    new MakerDeb({
      options: {
        icon: 'src/img/LST_icon_win.ico'
      }
    })
  ],
  publishers: [
    new PublisherGithub({
      repository: {
        owner: 'mplefort',
        name: 'lakeshoretranspo-routegenie-client'
      },
      prerelease: false,
      draft: true
    })
  ],
  plugins: [
    new AutoUnpackNativesPlugin({}),
    new WebpackPlugin({
      mainConfig,
      renderer: {
        config: rendererConfig,
        entryPoints: [
          {
            html: './src/index.html',
            js: './src/renderer.ts',
            name: 'main_window',
            preload: {
              js: './src/preload.ts',
            },
          },
        ],
      },
    }),
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};

export default config;
