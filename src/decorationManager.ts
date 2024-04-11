import * as vscode from "vscode";
import { ALPHA_MIXING_VALUES, EMOJIS } from "./constant";
import { colorAlphaMixing, readJsonFileInAssets } from "./util";
import { ExtensionConfig } from "./type";

class DecorationManager {
  private static instance: DecorationManager;
  public extensionConfig: Partial<ExtensionConfig> = {};
  // public static readonly EXPERIMENT_DECORATION_OPTION: vscode.ThemableDecorationRenderOptions = // TODO (WJ): remove
  //   {
  //     backgroundColor: "rgba(255, 255, 0, 0.3)", // Yellow with transparency
  //     outline: "2px solid red",
  //     outlineColor: "red",
  //     outlineStyle: "solid",
  //     outlineWidth: "2px",
  //     border: "1px dashed blue",
  //     borderColor: new vscode.ThemeColor("editor.foreground"), // Using ThemeColor reference
  //     borderRadius: "4px",
  //     borderSpacing: "2px",
  //     borderStyle: "dashed",
  //     borderWidth: "1px",
  //     fontStyle: "italic",
  //     fontWeight: "bold",
  //     textDecoration: "underline overline dotted green",
  //     cursor: "pointer",
  //     color: "#FF4500", // Orange text color
  //     opacity: "0.8",
  //     letterSpacing: "0.5em",
  //     // gutterIconPath: vscode.Uri.file("/path/to/icon.png"), // Absolute path to a gutter icon
  //     // gutterIconSize: "contain",
  //     overviewRulerColor: "rgba(124, 58, 237, 0.8)", // A semi-transparent purple
  //     before: {
  //       contentText: "🧶",
  //       color: "darkgreen",
  //       margin: "0 px 0 0", // Margin around the 'before' content
  //       textDecoration: "none",
  //     },
  //     after: {
  //       contentText: "»",
  //       color: "darkred",
  //       margin: "0 0 0 -5px", // Margin around the 'after' content
  //       textDecoration: "none",
  //     },
  //   };
  public emojiDecorationTypes: vscode.TextEditorDecorationType[] = [];
  public solidColorDecorationTypes: vscode.TextEditorDecorationType[] = [];
  public solidCommonColorDecorationType: vscode.TextEditorDecorationType =
    vscode.window.createTextEditorDecorationType({});
  public gradientColorDecorationType2dArray: vscode.TextEditorDecorationType[][] =
    [];
  public semanticTokenTypesToGradientColorDecorationType2dArray: {
    [key: string]: vscode.TextEditorDecorationType[][];
  } = {};
  public semanticTokenTypesToGradientCommonColorDecorationTypes: {
    [key: string]: vscode.TextEditorDecorationType[];
  } = {};

  private constructor() {}

  public static getInstance(): DecorationManager {
    if (!DecorationManager.instance) {
      DecorationManager.instance = new DecorationManager();
    }
    return DecorationManager.instance;
  }

  public async initialize() {
    this.extensionConfig = vscode.workspace
      .getConfiguration()
      .get<Partial<ExtensionConfig>>("colorVariableAlpha")!; // TODO (WJ): update configuration key
    const solidColors = this.extensionConfig.solidColors ?? [];
    let gradientColors = this.extensionConfig.gradientColors;
    if (gradientColors === undefined || gradientColors.length === 0) {
      gradientColors = solidColors;
    }
    let commonColor = this.extensionConfig.commonColor;
    if (commonColor === undefined && solidColors.length > 0) {
      commonColor = solidColors[0];
    } else if (commonColor === undefined) {
      throw new Error("No common color is provided!");
      // TODO (WJ): add notification
    }

    // Initialize emoji decoration types
    for (let i = 0; i < EMOJIS.length; i++) {
      const emojiDecorationOption: vscode.ThemableDecorationRenderOptions = {
        before: {
          contentText: EMOJIS[i],
          margin: "0 2px 0 0",
        },
      };
      this.emojiDecorationTypes.push(
        vscode.window.createTextEditorDecorationType(emojiDecorationOption),
      );
    }

    // Initialize solid color decoration types
    for (let i = 0; i < solidColors.length; i++) {
      const colorDecorationOption: vscode.ThemableDecorationRenderOptions = {
        color: solidColors[i],
      };
      this.solidColorDecorationTypes.push(
        vscode.window.createTextEditorDecorationType(colorDecorationOption),
      );
    }

    // Initialize solid common color decoration type
    this.solidCommonColorDecorationType =
      vscode.window.createTextEditorDecorationType({ color: commonColor });

    // Initialize gradient color decoration types
    this.gradientColorDecorationType2dArray = Array.from(
      { length: gradientColors.length },
      () => [],
    );
    for (let i = 0; i < gradientColors.length; i++) {
      for (let j = 0; j < ALPHA_MIXING_VALUES.length; j++) {
        const alpha = ALPHA_MIXING_VALUES[j];
        const mixedColor = colorAlphaMixing(
          gradientColors[i],
          "#9CDCFE",
          alpha,
        ); // TODO (WJ): dynamic 2nd color
        if (mixedColor !== null) {
          const colorDecorationOption: vscode.ThemableDecorationRenderOptions =
            {
              color: mixedColor,
            };
          this.gradientColorDecorationType2dArray[i].push(
            vscode.window.createTextEditorDecorationType(colorDecorationOption),
          );
        }
      }
    }

    // TODO (WJ): Initialize semantic token types to gradient color decoration types

    // TODO (WJ): Initialize semantic token types to gradient common color decoration types

    console.log("Decoration Manager initialized!"); // TODO (WJ): move to output channel
  }

  public dispose() {
    // Clear emoji decoration types
    for (const decorationType of this.emojiDecorationTypes) {
      decorationType.dispose();
    }
    this.emojiDecorationTypes = [];

    // Clear solid color decoration types
    for (const decorationType of this.solidColorDecorationTypes) {
      decorationType.dispose();
    }
    this.solidColorDecorationTypes = [];

    // Clear solid common color decoration type
    this.solidCommonColorDecorationType.dispose();
    this.solidCommonColorDecorationType =
      vscode.window.createTextEditorDecorationType({});

    // Clear gradient color decoration types
    for (const decorationTypeArray of this.gradientColorDecorationType2dArray) {
      for (const decorationType of decorationTypeArray) {
        decorationType.dispose();
      }
    }
    this.gradientColorDecorationType2dArray = [];

    // Clear semantic token types to gradient color decoration types
    for (const key in this
      .semanticTokenTypesToGradientColorDecorationType2dArray) {
      for (const decorationTypeArray of this
        .semanticTokenTypesToGradientColorDecorationType2dArray[key]) {
        for (const decorationType of decorationTypeArray) {
          decorationType.dispose();
        }
      }
    }
    this.semanticTokenTypesToGradientColorDecorationType2dArray = {};

    // Clear semantic token types to gradient common color decoration types
    for (const key in this
      .semanticTokenTypesToGradientCommonColorDecorationTypes) {
      for (const decorationType of this
        .semanticTokenTypesToGradientCommonColorDecorationTypes[key]) {
        decorationType.dispose();
      }
    }
    this.semanticTokenTypesToGradientCommonColorDecorationTypes = {};
  }
}

export default DecorationManager;
