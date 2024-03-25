import * as vscode from "vscode";

export type DecorationProcessor = (
  codeTokens: SemanticCodeToken[],
) => [vscode.TextEditorDecorationType[], vscode.Range[][]];

export interface SemanticCodeToken {
  line: number; // zero-based
  start: number; // zero-based
  length: number;
  text: string;
  tokenType: string;
  tokenModifiers: string[];
}
