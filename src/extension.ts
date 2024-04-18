import * as vscode from "vscode"; // TODO (WJ): avoid import all
import { QUICK_PICK_ITEMS } from "./constant";
import DecorationManager from "./decorationManager";
import { SemanticCodeToken } from "./type";

export async function activate(context: vscode.ExtensionContext) {
  console.log(
    'Congratulations, your extension "color-variable-alpha" is now active!',
  );
  DecorationManager.initialize();

  let disposable = vscode.commands.registerCommand(
    "color-variable-alpha.helloWorld",
    () => {
      vscode.window.showInformationMessage(
        "Hello World from Color Variable Alpha!",
      );
    },
  );
  let promptRenderPatternSelectionCommand = vscode.commands.registerCommand(
    "colorVariableAlpha.promptRenderPatternSelection",
    () => {
      const quickPick = vscode.window.createQuickPick();
      // TODO (WJ): update picked
      // QUICK_PICK_ITEMS[0].picked = true;
      quickPick.items = QUICK_PICK_ITEMS;
      quickPick.matchOnDetail = true;
      quickPick.matchOnDescription = true;
      quickPick.ignoreFocusOut = true;
      quickPick.onDidChangeSelection((selection) => {
        console.log(
          "🚀 ~ quickPick.onDidChangeSelection ~ selection:",
          selection,
        );
      });
      quickPick.onDidHide(() => quickPick.dispose());
      quickPick.show();
    },
  );
  const clearDecorationsTemporarilyCommand = vscode.commands.registerCommand(
    "colorVariableAlpha.clearDecorationsTemporarily",
    async () => {
      DecorationManager.clear();
      DecorationManager.initialize();
    },
  );
  const reloadDecorationsDiposable = vscode.commands.registerCommand(
    "colorVariableAlpha.reloadDecorations",
    async () => {
      DecorationManager.clear();
      DecorationManager.initialize();

      const activeEditor = vscode.window.activeTextEditor;
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
    vscode.workspace.onDidChangeTextDocument((textDocumentChangeEvent) => {
      const activeEditor = vscode.window.activeTextEditor;
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
    // vscode.window.onDidChangeActiveTextEditor(debouncedDecorateVariables), // TODO (WJ): use back this
    vscode.window.onDidChangeActiveTextEditor((e) => {
      console.log("-> Active Text Editor Changed");
      DecorationManager.debouncedDecorateVariables(e);
    }),
  );
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((configurationChangeEvent) => {
      const configurationChanged =
        configurationChangeEvent.affectsConfiguration("colorVariableAlpha");
      if (!configurationChanged) {
        return;
      }
      DecorationManager.clear();
      DecorationManager.initialize();
      const activeEditor = vscode.window.activeTextEditor;
      if (activeEditor === undefined) {
        return;
      }
      console.log("-> Configuration Changed");
      DecorationManager.debouncedDecorateVariables(activeEditor);
    }),
  );

  // Run decorate variables on activation
  const activeEditor = vscode.window.activeTextEditor;
  if (activeEditor !== undefined) {
    console.log("-> First Run");
    DecorationManager.debouncedDecorateVariables(activeEditor);
  }
}

// This method is called when your extension is deactivated
export function deactivate() {
  DecorationManager.clear();
}
