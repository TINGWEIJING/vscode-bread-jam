import type { Range, TextEditor, TextEditorDecorationType } from "vscode";

export type DecorationProcessor = (
  codeTokens: SemanticCodeToken[],
  decorationManager: IDecorationManager,
) => [TextEditorDecorationType[], Range[][]];

export interface IDecorationManager {
  extensionConfig: Partial<ExtensionConfig>;
  solidColorDecorationTypes: TextEditorDecorationType[];
  solidCommonColorDecorationType: TextEditorDecorationType;
  gradientCommonColorDecorationTypes: TextEditorDecorationType[];
  gradientColorDecorationType2dArray: TextEditorDecorationType[][];
  emojiDecorationTypes: TextEditorDecorationType[];
  semanticToFadeInGradientColorDecorationType2dArray: Map<
    string,
    TextEditorDecorationType[][]
  >;
  flatFadeInGradientColorDecorationTypes: TextEditorDecorationType[];
  semanticTokenTypesToGradientCommonColorDecorationTypes: Record<
    string,
    TextEditorDecorationType[]
  >;

  gradientColorSize: number;
  fadeOutGradientStepSize: number;
  fadeInGradientStepSize: number;

  getKeyAndFadeInGradientColorDecorationType2dArray(
    tokenType: string,
    modifiers: string[],
  ): [string, TextEditorDecorationType[][]];
  debouncedDecorateVariables(editor: TextEditor | undefined): void;
  debouncedPreviewDecorateVariables(
    editor: TextEditor | undefined,
    decorationProcessor: DecorationProcessor,
  ): void;
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
