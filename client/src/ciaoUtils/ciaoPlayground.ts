'use strict';

import { window } from 'vscode';
import { getActiveCiaoFileContent } from './ciaoFile';

/**
 * @returns URL that contains the current **Ciao Prolog** file
 * as a queryParam.
 * E.g.
 * `https://ciao-lang.org/playground/?code={FILE_CONTENT}.`
 *
 * This URL can be used to open a **Ciao Playground** window to test the code on the fly.
 */
export function createPlaygroundURL(): string | undefined {
  const code: string | undefined = getActiveCiaoFileContent();
  if (!code) return;
  const maxUrlLength = 2048;
  const url = `https://ciao-lang.org/playground/?code=${encodeURIComponent(
    code
  )}`;
  if (url.length <= maxUrlLength) {
    return url;
  }
  window.showErrorMessage(
    `ERROR: The file length exceds the maximum limit accepted by most browsers: ${maxUrlLength}.`
  );
}
