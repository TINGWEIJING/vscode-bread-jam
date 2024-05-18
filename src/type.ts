import type { Range, TextEditorDecorationType } from "vscode";

export type DecorationProcessor = (
  codeTokens: SemanticCodeToken[],
  decorationManager: IDecorationManager,
) => [TextEditorDecorationType[], Range[][]];

export interface IDecorationManager {
  extensionConfig: ExtensionConfig;
  gradientColorSize: number;
  fadeOutGradientStepSize: number;
  fadeInGradientStepSize: number;

  // * Fade In
  semanticToFadeInGradientColorDecorationType2dArray: Map<
    string,
    TextEditorDecorationType[][]
  >;
  semanticToFadeInGradientCommonColorDecorationTypes: Map<
    string,
    TextEditorDecorationType[]
  >;

  // * Fade Out
  semanticToFadeOutGradientColorDecorationType2dArray: Map<
    string,
    TextEditorDecorationType[][]
  >;
  semanticToFadeOutGradientCommonColorDecorationTypes: Map<
    string,
    TextEditorDecorationType[]
  >;

  // * First Character & Subtext - Solid Color
  solidColorDecorationTypes: TextEditorDecorationType[];
  solidCommonColorDecorationType: TextEditorDecorationType;

  // * Emoji
  emojiDecorationTypes: TextEditorDecorationType[];

  getHash(text: string, max: number): number;
  getKeyAndFadeOutGradientColorDecorationType2dArray(
    tokenType: string,
    modifiers: string[],
  ): [string, TextEditorDecorationType[][]];
  getKeyAndFadeInGradientColorDecorationType2dArray(
    tokenType: string,
    modifiers: string[],
  ): [string, TextEditorDecorationType[][]];
  getKeyAndFadeOutGradientCommonColorDecorationTypes(
    tokenType: string,
    modifiers: string[],
  ): [string, TextEditorDecorationType[]];
  getKeyAndFadeInGradientCommonColorDecorationTypes(
    tokenType: string,
    modifiers: string[],
  ): [string, TextEditorDecorationType[]];
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
  ignoreFirstSubtoken: boolean;
  semanticForegroundColors: { [key: string]: string };
  defaultSemanticForegroundColor: string;
  commonColor: string;
  gradientColors: string[];
  solidColors: string[];
  fadeInGradientSteps: number[];
  fadeOutGradientSteps: number[];
  emojis: string[];
  targetedSemanticTokenTypes: string[];
  permutationTable: number[];
}
