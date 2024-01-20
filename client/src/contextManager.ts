import { ExtensionContext } from 'vscode';

let extensionContext: ExtensionContext;

export function initGlobalStorage(context: ExtensionContext): void {
  extensionContext = context;
}

export function getGlobalValue<T>(key: string): T | undefined {
  return extensionContext.globalState.get<T>(key);
}

export async function setGlobalValue<T>(key: string, value: T): Promise<void> {
  await extensionContext.globalState.update(key, value);
}
