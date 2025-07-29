/**
 * Author: Gailad Chesa
 * Created: 2024-01-01
 * Description: _app - handles backend functionality
 */

import type { AppProps } from 'next/app';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}