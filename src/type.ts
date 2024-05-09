import type { Range, TextEditorDecorationType } from "vscode";

export type DecorationProcessor = (
  codeTokens: SemanticCodeToken[],
  decorationManager: IDecorationManager,
) => [TextEditorDecorationType[], Range[][]];

export interface IDecorationManager {
  extensionConfig: Partial<ExtensionConfig>;
  // * Fade Out
  semanticToFadeOutGradientColorDecorationType2dArray: Map<
    string,
    TextEditorDecorationType[][]
  >;
  semanticToFadeOutGradientCommonColorDecorationTypes: Map<
    string,
    TextEditorDecorationType[]
  >;

  // * Fade In
  semanticToFadeInGradientColorDecorationType2dArray: Map<
    string,
    TextEditorDecorationType[][]
  >;
  semanticToFadeInGradientCommonColorDecorationTypes: Map<
    string,
    TextEditorDecorationType[]
  >;

  // * First Character & Subtext - Solid Color
  solidColorDecorationTypes: TextEditorDecorationType[];
  solidCommonColorDecorationType: TextEditorDecorationType;

  // * Emoji
  emojiDecorationTypes: TextEditorDecorationType[];

  gradientColorSize: number;
  fadeOutGradientStepSize: number;
  fadeInGradientStepSize: number;

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
  ignoreFirstSubToken: boolean;
  excludeFileExtensions: string[];
  defaultPattern: string;
  solidColors: string[];
  gradientColors: string[];
  commonColor: string;
  fadeInGradientSteps: number[];
  fadeOutGradientSteps: number[];
  targetedSemanticTokenTypes: string[];
  semanticForegroundColors: { [key: string]: string };
  defaultSemanticForegroundColor: string;
}
