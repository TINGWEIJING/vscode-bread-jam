import type { ExtensionContext, LogOutputChannel } from "vscode";
import { commands, window, workspace } from "vscode";
import {
  CONFIGURATION_KEYS,
  DEFAULT_SELECTED_RENDER_PATTERN,
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
        const currentRenderPatternLabel = context.workspaceState.get<string>(
          WORKSPACE_STATE_KEYS.SELECTED_RENDER_PATTERN,
        );
        // const selectedRenderPattern = workspace // TODO (WJ): Remove this and move to initial configuration?//
        //   .getConfiguration(EXTENSION_NAME)
        //   .get<string>(CONFIGURATION_KEYS.SELECTED_RENDER_PATTERN);
        // const currentRenderPatternLabel = (
        //   selectedRenderPattern || DEFAULT_SELECTED_RENDER_PATTERN
        // ).slice(3);

        const quickPick = window.createQuickPick();
        quickPick.items = QUICK_PICK_ITEMS.map((item) => ({
          ...item,
          picked: item.description === currentRenderPatternLabel,
        }));
        quickPick.matchOnDetail = true;
        quickPick.matchOnDescription = true;
        quickPick.ignoreFocusOut = true;
        quickPick.onDidChangeSelection((selections) => {
          // Trigger when user click on the item or press enter
          if (selections.length === 0) {
            return;
          }
          const selectedItem = selections[0];
          context.workspaceState.update(
            WORKSPACE_STATE_KEYS.SELECTED_RENDER_PATTERN,
            selectedItem.description,
          );
          workspace.getConfiguration(EXTENSION_NAME).update(
            CONFIGURATION_KEYS.SELECTED_RENDER_PATTERN,
            `${selectedItem.label} ${selectedItem.description}`, // NOTE: selectedItem.label is the index numbering, selectedItem.description is the render pattern label
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
      const newExtensionConfig = workspace
        .getConfiguration()
        .get<Partial<ExtensionConfig>>(EXTENSION_NAME);
      if (newExtensionConfig === undefined) {
        throw new Error("Unable to read configuration.");
      }
      console.log(newExtensionConfig.selectedRenderPattern); // TODO (WJ): remove
      // TODO (WJ): implement shouldSkipDueToSelectRenderPatternCommand
      // TODO (WJ): test change other config
      const currentRenderPatternLabel = context.workspaceState.get<string>(
        WORKSPACE_STATE_KEYS.SELECTED_RENDER_PATTERN,
      );
      const isRenderPatternSameAcrossWorkspaceStateAndConfig =
        currentRenderPatternLabel ===
        newExtensionConfig?.selectedRenderPattern?.slice(3);
      const previousExtensionConfig =
        DecorationManager.getInstance().extensionConfig;
      const isSelectedRenderPatternConfigChanged =
        previousExtensionConfig.selectedRenderPattern !==
        newExtensionConfig?.selectedRenderPattern;
      let configDifferentCount = 0;
      for (const key in previousExtensionConfig) {
        configDifferentCount +=
          (previousExtensionConfig as Record<string, any>)[key] !==
          (newExtensionConfig as Record<string, any>)[key]
            ? 1
            : 0;
      }
      console.log(
        "🚀 ~ workspace.onDidChangeConfiguration ~ isRenderPatternSameAcrossWorkspaceStateAndConfig:",
        isRenderPatternSameAcrossWorkspaceStateAndConfig,
      );
      console.log(
        "🚀 ~ workspace.onDidChangeConfiguration ~ isSelectedRenderPatternConfigChanged:",
        isSelectedRenderPatternConfigChanged,
      );
      console.log(
        "🚀 ~ workspace.onDidChangeConfiguration ~ configDifferentCount:",
        configDifferentCount,
      );
      if (
        isRenderPatternSameAcrossWorkspaceStateAndConfig &&
        configDifferentCount === 1 &&
        isSelectedRenderPatternConfigChanged
      ) {
        return;
      }

      // Update selected render pattern in workspace state
      const newSelectedRenderPatternLabel =
        newExtensionConfig?.selectedRenderPattern?.slice(3);
      if (
        isSelectedRenderPatternConfigChanged &&
        newSelectedRenderPatternLabel !== undefined
      ) {
        context.workspaceState.update(
          WORKSPACE_STATE_KEYS.SELECTED_RENDER_PATTERN,
          newSelectedRenderPatternLabel,
        );
      }

      const validatedExtensionConfig = validateExtensionConfig(
        newExtensionConfig,
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
