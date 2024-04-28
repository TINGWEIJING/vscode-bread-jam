import * as vscode from "vscode";

export type DecorationProcessor = (
  codeTokens: SemanticCodeToken[],
  decorationManager?: IDecorationManager,
) => [vscode.TextEditorDecorationType[], vscode.Range[][]];

export interface IDecorationManager {
  solidColorDecorationTypes: vscode.TextEditorDecorationType[];
  solidCommonColorDecorationType: vscode.TextEditorDecorationType;
  emojiDecorationTypes: vscode.TextEditorDecorationType[];
}

export interface SemanticCodeToken {
  line: number; // zero-based
  start: number; // zero-based
  length: number;
  text: string;
  tokenType: string;
  tokenModifiers: string[];
}

// NOTE: Always refer package.json for the latest configuration
export interface ExtensionConfig {
  renderDelay: number;
  ignoreFirstSubToken: boolean;
  excludeFileExtensions: string[];
  defaultPattern: string;
  solidColors: string[];
  gradientColors: string[];
  commonColor: string;
  fadeInGradientSteps: number[];
  targetedSemanticTokenTypes: string[];
  semanticForegroundColors: { [key: string]: string };
}
