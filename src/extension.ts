import * as vscode from "vscode"; // TODO (WJ): avoid import all
import DecorationManager from "./decorationManager";
import {
  decorate_subText_fadeInGradient_commonly,
  decorate_subText_fadeOutGradient_commonly,
} from "./decorationProcessor";
import { SemanticCodeToken } from "./type";
import { debounce } from "./util";
import { QUICK_PICK_ITEMS } from "./constant";

const debouncedDecorateVariables = debounce(decorateVariables, 500); // TODO (WJ): move into decoration manager

export async function decorateVariables(editor: vscode.TextEditor | undefined) {
  if (editor === undefined) {
    return;
  }

  console.time("decorate");
  const uri = editor.document.uri;

  const [legend, semanticTokens] = await Promise.all([
    vscode.commands.executeCommand<vscode.SemanticTokensLegend | undefined>(
      "vscode.provideDocumentSemanticTokensLegend",
      uri,
    ),
    vscode.commands.executeCommand<vscode.SemanticTokens | undefined>(
      "vscode.provideDocumentSemanticTokens",
      uri,
    ),
  ]);
  if (legend === undefined || semanticTokens === undefined) {
    return;
  }

  const result = decodeSemanticTokensData(
    legend,
    semanticTokens.data,
    editor.document,
  );

  // filter out the tokens that are not variables
  const variableTokens = result.filter(
    (token) => ["variable", "parameter", "property"].includes(token.tokenType), // TODO (WJ): make into configuration
  );

  const [resultDecorationTypes, resultDecorationRange2dArray] =
    decorate_subText_fadeOutGradient_commonly(variableTokens);
  for (let i = 0; i < resultDecorationTypes.length; i++) {
    editor.setDecorations(
      resultDecorationTypes[i],
      resultDecorationRange2dArray[i],
    );
  }
  console.timeEnd("decorate");
}

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
      // quickPick.selectedItems = [quickPickItems[2]];
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
        debouncedDecorateVariables(activeEditor);
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
        debouncedDecorateVariables(activeEditor);
      }
    }),
  );
  context.subscriptions.push(
    // vscode.window.onDidChangeActiveTextEditor(debouncedDecorateVariables), // TODO (WJ): use back this
    vscode.window.onDidChangeActiveTextEditor((e) => {
      console.log("-> Active Text Editor Changed");
      debouncedDecorateVariables(e);
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
      debouncedDecorateVariables(activeEditor);
    }),
  );

  // Run decorate variables on activation
  const activeEditor = vscode.window.activeTextEditor;
  if (activeEditor !== undefined) {
    console.log("-> First Run");
    debouncedDecorateVariables(activeEditor);
  }
}

// This method is called when your extension is deactivated
export function deactivate() {
  DecorationManager.clear();
}

export function decodeSemanticTokensData(
  legend: vscode.SemanticTokensLegend,
  data: Uint32Array,
  document: vscode.TextDocument,
): SemanticCodeToken[] {
  const documentText = document.getText();
  const tokens: SemanticCodeToken[] = [];
  let lineCounter = 0;
  let characterPositionCounter = 0;
  for (let i = 0; i < data.length; i += 5) {
    const deltaLine = data[i];
    const deltaStart = data[i + 1];
    const length = data[i + 2];
    const tokenTypeIndex = data[i + 3];
    const encodedTokenModifiers = data[i + 4];

    // Calculate the line and start character for the current token
    if (deltaLine === 0) {
      // If on the same line, adjust the start character
      characterPositionCounter += deltaStart;
    } else {
      // Move to the new line and set the start character
      lineCounter += deltaLine;
      characterPositionCounter = deltaStart;
    }

    const tokenType = legend.tokenTypes[tokenTypeIndex];
    const tokenModifiers = decodeTokenModifiers(encodedTokenModifiers, legend);
    const range = new vscode.Range(
      lineCounter,
      characterPositionCounter,
      lineCounter,
      characterPositionCounter + length,
    );
    tokens.push({
      line: lineCounter,
      start: characterPositionCounter,
      length,
      tokenType,
      tokenModifiers,
      text: documentText.substring(
        document.offsetAt(range.start),
        document.offsetAt(range.end),
      ),
    });
  }
  return tokens;
}

function decodeTokenModifiers(
  encodedTokenModifiers: number,
  legend: vscode.SemanticTokensLegend,
) {
  const modifiers = [];

  for (let i = 0; i < legend.tokenModifiers.length; i++) {
    const mask = 1 << i; // Calculate the bitmask for the current modifier
    if ((encodedTokenModifiers & mask) === mask) {
      // If the bitmask is set in tokenModifiers, add the modifier to the list
      modifiers.push(legend.tokenModifiers[i]);
    }
  }

  return modifiers;
}
