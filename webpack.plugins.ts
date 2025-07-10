import type IForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import webpack from 'webpack';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const ForkTsCheckerWebpackPlugin: typeof IForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

export const plugins = [
  new ForkTsCheckerWebpackPlugin({
    logger: 'webpack-infrastructure',
  }),
  new webpack.EnvironmentPlugin({
    RG_HOST: 'https://lakeshoretranspo.routegenie.com:8000',
    RG_USER_ID: 37,
    RG_CLIENT_ID: '92ea6fd752687feb95325fd174370350a4553a0e',
    RG_CLIENT_SECRET: '75d92f1307e67a3ac3532d618be0b1e728cd9aa1890d39a13ac07de9f83ec508e000a2b7c6343b2608bcac0349cf8615abbe',
    QB_CLIENT_ID: 'ABL8qccvPdpBV59Sqv3pKeEvlCMbRbqYOw5V5bP7b4unXHfDoZ',
    QB_CLIENT_SECRET: 'r8TwvZVl5KaQ5FIIGkA5jrrfHokAxlKusPTaPxwE',
    QB_REDIRECT_URI: 'https://developer.intuit.com/v2/OAuth2Playground/RedirectUrl',
    AUTH_LINK: 'https://appcenter.intuit.com/connect/oauth2?client_id=ABL8qccvPdpBV59Sqv3pKeEvlCMbRbqYOw5V5bP7b4unXHfDoZ&redirect_uri=https://developer.intuit.com/v2/OAuth2Playground/RedirectUrl&response_type=code&scope=com.intuit.quickbooks.accounting&state=secureRandomState',
    QB_SB_CLIENT_ID: 'ABy8XnJ0uHgdIMVolVq0ppw4NpCSubgLGa1IRX34t2QjFd1Rw0',
    QB_SB_CLIENT_SECRET: 'Yqzisaf2Dal7H7Lc7UHfDTCLPL8W2z6p6rQv4s53',
    NODE_ENV: 'produuction',
    GOOGLE_MAPS_API_KEY: 'AIzaSyCJjLfrN7uBBlVb7FwvEQzN0hGqgQ3WCiM'
  }),
];
