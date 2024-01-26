import { ExtensionContext } from 'vscode';

let extensionContext: ExtensionContext;

export function initGlobalStorage(context: ExtensionContext): void {
  extensionContext = context;
}

export function getGlobalValue<T>(key: string, defaultValue: T): T {
  return extensionContext.globalState.get<T>(key) ?? defaultValue;
}

export async function setGlobalValue<T>(key: string, value: T): Promise<void> {
  await extensionContext.globalState.update(key, value);
}
