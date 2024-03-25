import * as vscode from "vscode";
import {
  debounce,
  isPresent,
  isTruthy,
  pearsonHash,
  scaleHash,
  splitString,
} from "./util";
import DecorationManager from "./decorationManager";
import { SemanticCodeToken } from "./type";
import {
  decorateWithMultiGradientColorsByWholeText,
  decorateWithMultiSolidColorsByFirstCharacterOfSubstring,
} from "./decorationProcessor";

const debouncedDecorateVariables = debounce(decorateVariables, 500);

export async function decorateVariables(editor: vscode.TextEditor | undefined) {
  if (editor === undefined) {
    return;
  }
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
  const variableTokens = result.filter((token) =>
    ["variable", "parameter", "property"].includes(token.tokenType),
  );

  const [resultDecorationTypes, resultDecorationRangesList] =
    decorateWithMultiGradientColorsByWholeText(variableTokens);
  for (let i = 0; i < resultDecorationTypes.length; i++) {
    editor.setDecorations(
      resultDecorationTypes[i],
      resultDecorationRangesList[i],
    );
  }
}

export async function activate(context: vscode.ExtensionContext) {
  console.log(
    'Congratulations, your extension "color-variable-alpha" is now active!',
  );
  await DecorationManager.getInstance().initialize();

  let disposable = vscode.commands.registerCommand(
    "color-variable-alpha.helloWorld",
    () => {
      vscode.window.showInformationMessage(
        "Hello World from Color Variable Alpha!",
      );
    },
  );

  context.subscriptions.push(disposable);
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((textDocumentChangeEvent) => {
      const fileName = textDocumentChangeEvent.document.fileName;

      const activeEditor = vscode.window.activeTextEditor;
      if (
        activeEditor &&
        activeEditor.document === textDocumentChangeEvent.document
      ) {
        debouncedDecorateVariables(activeEditor);
      }
    }),
  );
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(debouncedDecorateVariables),
  );
}

// This method is called when your extension is deactivated
export function deactivate() {}

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
