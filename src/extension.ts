import type { ExtensionContext } from "vscode";
import { commands, window, workspace } from "vscode";
import {
  EXTENSION_COMMANDS,
  EXTENSION_NAME,
  QUICK_PICK_ITEMS,
  WORKSPACE_STATE_KEYS,
} from "./constant";
import DecorationManager from "./decorationManager";

export async function activate(context: ExtensionContext) {
  console.log(
    'Congratulations, your extension "color-variable-alpha" is now active!',
  );
  DecorationManager.initialize(context);

  let disposable = commands.registerCommand(
    // TODO (WJ): remove
    "color-variable-alpha.helloWorld",
    () => {
      window.showInformationMessage("Hello World from Color Variable Alpha!");
    },
  );
  let promptRenderPatternSelectionCommand = commands.registerCommand(
    EXTENSION_COMMANDS.PROMPT_RENDER_PATTERN_SELECTION,
    () => {
      const currentRenderPattern = context.workspaceState.get<
        string | undefined
      >(WORKSPACE_STATE_KEYS.SELECTED_RENDER_PATTERN);

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
        console.log(
          "🚀 ~ quickPick.onDidChangeSelection ~ selection:",
          selections,
        );
        if (selections.length === 0) {
          return;
        }
        context.workspaceState.update(
          WORKSPACE_STATE_KEYS.SELECTED_RENDER_PATTERN,
          selections[0].description,
        );
        quickPick.hide();
      });
      quickPick.onDidAccept((e) => {
        // Trigger when any selection is accepted
        console.log("🚀 ~ quickPick.onDidAccept ~ e:", e);
      });
      quickPick.onDidChangeActive((selections) => {
        // Trigger when user click on the item or use arrow key to navigate
        console.log("🚀 ~ quickPick.onDidChangeActive ~ e:", selections);
        if (
          selections.length !== 1 ||
          selections[0].description === undefined
        ) {
          return;
        }
        DecorationManager.previewRenderPattern(selections[0].description);
      });
      quickPick.onDidHide((e) => {
        console.log("🚀 ~ quickPick.onDidHide ~ e:", e);
        DecorationManager.clear();
        DecorationManager.initialize(context);
        const activeEditor = window.activeTextEditor;
        if (activeEditor !== undefined) {
          console.log("-> Render Pattern Selection Confirmed");
          DecorationManager.debouncedDecorateVariables(activeEditor);
        }
        quickPick.dispose();
      });
      quickPick.show();
    },
  );
  const clearDecorationsTemporarilyCommand = commands.registerCommand(
    EXTENSION_COMMANDS.CLEAR_DECORATIONS_TEMPORARILY,
    async () => {
      DecorationManager.clear();
      DecorationManager.initialize();
    },
  );
  const reloadDecorationsDiposable = commands.registerCommand(
    EXTENSION_COMMANDS.RELOAD_DECORATIONS,
    async () => {
      DecorationManager.clear();
      DecorationManager.initialize();

      const activeEditor = window.activeTextEditor;
      if (activeEditor !== undefined) {
        console.log("-> Reload");
        DecorationManager.debouncedDecorateVariables(activeEditor);
      }
    },
  );

  context.subscriptions.push(disposable);
  context.subscriptions.push(clearDecorationsTemporarilyCommand);
  context.subscriptions.push(promptRenderPatternSelectionCommand);
  context.subscriptions.push(reloadDecorationsDiposable);
  context.subscriptions.push(
    workspace.onDidChangeTextDocument((textDocumentChangeEvent) => {
      const activeEditor = window.activeTextEditor;
      if (
        activeEditor &&
        activeEditor.document === textDocumentChangeEvent.document
      ) {
        console.log("-> Text Document Changed");
        DecorationManager.debouncedDecorateVariables(activeEditor);
      }
    }),
  );
  context.subscriptions.push(
    // window.onDidChangeActiveTextEditor(debouncedDecorateVariables), // TODO (WJ): use back this
    window.onDidChangeActiveTextEditor((e) => {
      console.log("-> Active Text Editor Changed");
      DecorationManager.debouncedDecorateVariables(e);
    }),
  );
  context.subscriptions.push(
    workspace.onDidChangeConfiguration((configurationChangeEvent) => {
      const configurationChanged =
        configurationChangeEvent.affectsConfiguration(EXTENSION_NAME);
      if (!configurationChanged) {
        return;
      }
      DecorationManager.clear();
      DecorationManager.initialize();
      const activeEditor = window.activeTextEditor;
      if (activeEditor === undefined) {
        return;
      }
      console.log("-> Configuration Changed");
      DecorationManager.debouncedDecorateVariables(activeEditor);
    }),
  );

  // Run decorate variables on activation
  const activeEditor = window.activeTextEditor;
  if (activeEditor !== undefined) {
    console.log("-> First Run");
    DecorationManager.debouncedDecorateVariables(activeEditor);
  }
}

// This method is called when your extension is deactivated
export function deactivate() {
  DecorationManager.clear();
}
