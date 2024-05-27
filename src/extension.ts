import type { ExtensionContext, LogOutputChannel } from "vscode";
import { commands, window, workspace } from "vscode";
import {
  EXTENSION_COMMANDS,
  EXTENSION_NAME,
  QUICK_PICK_ITEMS,
  WORKSPACE_STATE_KEYS,
} from "./constant";
import DecorationManager from "./decorationManager";
import type { ExtensionConfig } from "./type";
import { validateExtensionConfig } from "./util";

let logChannel: LogOutputChannel;

export async function activate(context: ExtensionContext) {
  const isExtensionOn = context.workspaceState.get<boolean>(
    WORKSPACE_STATE_KEYS.IS_EXTENSION_ON,
  );
  if (isExtensionOn === undefined) {
    context.workspaceState.update(WORKSPACE_STATE_KEYS.IS_EXTENSION_ON, true);
  }

  const extensionConfig = workspace
    .getConfiguration()
    .get<Partial<ExtensionConfig>>(EXTENSION_NAME);
  if (extensionConfig === undefined) {
    throw new Error("Unable to read configuration.");
  }
  const validatedExtensionConfig = validateExtensionConfig(
    extensionConfig,
    (message) => window.showErrorMessage(message),
  );

  logChannel = window.createOutputChannel(`${EXTENSION_NAME} Log`, {
    log: true,
  });
  logChannel.clear();
  DecorationManager.construct(
    validatedExtensionConfig,
    context,
    (message) => logChannel.appendLine(message),
    (message) => window.showErrorMessage(message),
  );
  DecorationManager.initialize();

  const promptRenderPatternSelectionCommandDisposable =
    commands.registerCommand(
      EXTENSION_COMMANDS.PROMPT_RENDER_PATTERN_SELECTION,
      () => {
        const isExtensionOn = checkIfExtensionIsOn(context);
        if (!isExtensionOn) {
          return;
        }

        const currentRenderPattern = context.workspaceState.get<string>(
          WORKSPACE_STATE_KEYS.SELECTED_RENDER_PATTERN,
        );

        const quickPick = window.createQuickPick();
        quickPick.items = QUICK_PICK_ITEMS.map((item) => ({
          ...item,
          picked: item.description === currentRenderPattern,
        }));
        quickPick.matchOnDetail = true;
        quickPick.matchOnDescription = true;
        quickPick.ignoreFocusOut = true;
        quickPick.onDidChangeSelection((selections) => {
          // Trigger when user click on the item or press enter
          if (selections.length === 0) {
            return;
          }
          context.workspaceState.update(
            WORKSPACE_STATE_KEYS.SELECTED_RENDER_PATTERN,
            selections[0].description,
          );
          quickPick.hide();
        });
        quickPick.onDidChangeActive((selections) => {
          // Trigger when user click on the item or use arrow key to navigate
          if (
            selections.length !== 1 ||
            selections[0].description === undefined
          ) {
            return;
          }
          DecorationManager.previewRenderPattern(selections[0].description);
        });
        quickPick.onDidHide((e) => {
          DecorationManager.clear();
          DecorationManager.initialize();
          const activeEditor = window.activeTextEditor;
          if (activeEditor !== undefined) {
            DecorationManager.debouncedDecorateVariables(activeEditor);
          }
          quickPick.dispose();
        });
        quickPick.show();
      },
    );
  const clearRendingTemporarilyCommandDisposable = commands.registerCommand(
    EXTENSION_COMMANDS.CLEAR_RENDERINGS_TEMPORARILY,
    () => {
      const isExtensionOn = checkIfExtensionIsOn(context);
      if (!isExtensionOn) {
        return;
      }

      DecorationManager.clear();
      DecorationManager.initialize();
    },
  );
  const reloadRenderingsCommandDisposable = commands.registerCommand(
    EXTENSION_COMMANDS.RELOAD_RENDERINGS,
    () => {
      const isExtensionOn = checkIfExtensionIsOn(context);
      if (!isExtensionOn) {
        return;
      }

      DecorationManager.clear();
      DecorationManager.initialize();

      const activeEditor = window.activeTextEditor;
      if (activeEditor !== undefined) {
        DecorationManager.debouncedDecorateVariables(activeEditor);
      }
    },
  );
  const turnOnOrOffCommandDisposable = commands.registerCommand(
    EXTENSION_COMMANDS.TURN_ON_OR_OFF,
    () => {
      const isExtensionOn = getIsExtensionOn(context);
      context.workspaceState.update(
        WORKSPACE_STATE_KEYS.IS_EXTENSION_ON,
        !Boolean(isExtensionOn),
      );
      if (!isExtensionOn) {
        DecorationManager.clear();
        DecorationManager.initialize();
        const activeEditor = window.activeTextEditor;
        if (activeEditor !== undefined) {
          DecorationManager.debouncedDecorateVariables(activeEditor);
        }
      } else {
        DecorationManager.clear();
      }
    },
  );

  context.subscriptions.push(promptRenderPatternSelectionCommandDisposable);
  context.subscriptions.push(clearRendingTemporarilyCommandDisposable);
  context.subscriptions.push(reloadRenderingsCommandDisposable);
  context.subscriptions.push(turnOnOrOffCommandDisposable);
  context.subscriptions.push(
    workspace.onDidChangeTextDocument((textDocumentChangeEvent) => {
      const isExtensionOn = getIsExtensionOn(context);
      const activeEditor = window.activeTextEditor;
      if (
        activeEditor &&
        activeEditor.document === textDocumentChangeEvent.document &&
        isExtensionOn
      ) {
        DecorationManager.debouncedDecorateVariables(activeEditor);
      }
    }),
  );
  context.subscriptions.push(
    window.onDidChangeActiveTextEditor((textEditor) => {
      const isExtensionOn = getIsExtensionOn(context);
      if (!isExtensionOn) {
        return;
      }
      DecorationManager.debouncedDecorateVariables(textEditor);
    }),
  );
  context.subscriptions.push(
    workspace.onDidChangeConfiguration((configurationChangeEvent) => {
      const isExtensionOn = getIsExtensionOn(context);
      const isConfigurationChanged =
        configurationChangeEvent.affectsConfiguration(EXTENSION_NAME);
      if (!isConfigurationChanged) {
        return;
      }
      const extensionConfig = workspace
        .getConfiguration()
        .get<Partial<ExtensionConfig>>(EXTENSION_NAME);
      if (extensionConfig === undefined) {
        throw new Error("Unable to read configuration.");
      }
      const validatedExtensionConfig = validateExtensionConfig(
        extensionConfig,
        (message) => window.showErrorMessage(message),
      );
      DecorationManager.clear();
      DecorationManager.updateExtensionConfig(validatedExtensionConfig);
      DecorationManager.initialize();
      const activeEditor = window.activeTextEditor;
      if (activeEditor === undefined || !isExtensionOn) {
        return;
      }
      DecorationManager.debouncedDecorateVariables(activeEditor);
    }),
  );

  // Run decorate variables on activation
  const activeEditor = window.activeTextEditor;
  if (activeEditor !== undefined && isExtensionOn) {
    DecorationManager.debouncedDecorateVariables(activeEditor);
  }
}

// This method is called when your extension is deactivated
export function deactivate() {
  logChannel.clear();
  logChannel.dispose();
  DecorationManager.clear();
}

function getIsExtensionOn(context: ExtensionContext) {
  return Boolean(
    context.workspaceState.get<boolean>(WORKSPACE_STATE_KEYS.IS_EXTENSION_ON),
  );
}

function checkIfExtensionIsOn(context: ExtensionContext) {
  const isExtensionOn = getIsExtensionOn(context);
  if (!isExtensionOn) {
    window.showInformationMessage(
      `${EXTENSION_NAME} extension has not been turned on.`,
    );
  }
  return isExtensionOn;
}
