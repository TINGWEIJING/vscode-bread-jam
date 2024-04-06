import * as vscode from "vscode";
import { ALPHA_MIXING_VALUES, EMOJIS } from "./constant";
import { colorAlphaMixing, readJsonFileInAssets } from "./util";

class DecorationManager {
  private static instance: DecorationManager;
  public static readonly EXPERIMENT_DECORATION_OPTION: vscode.ThemableDecorationRenderOptions = // TODO (WJ): remove
    {
      backgroundColor: "rgba(255, 255, 0, 0.3)", // Yellow with transparency
      outline: "2px solid red",
      outlineColor: "red",
      outlineStyle: "solid",
      outlineWidth: "2px",
      border: "1px dashed blue",
      borderColor: new vscode.ThemeColor("editor.foreground"), // Using ThemeColor reference
      borderRadius: "4px",
      borderSpacing: "2px",
      borderStyle: "dashed",
      borderWidth: "1px",
      fontStyle: "italic",
      fontWeight: "bold",
      textDecoration: "underline overline dotted green",
      cursor: "pointer",
      color: "#FF4500", // Orange text color
      opacity: "0.8",
      letterSpacing: "0.5em",
      // gutterIconPath: vscode.Uri.file("/path/to/icon.png"), // Absolute path to a gutter icon
      // gutterIconSize: "contain",
      overviewRulerColor: "rgba(124, 58, 237, 0.8)", // A semi-transparent purple
      before: {
        contentText: "🧶",
        color: "darkgreen",
        margin: "0 px 0 0", // Margin around the 'before' content
        textDecoration: "none",
      },
      after: {
        contentText: "»",
        color: "darkred",
        margin: "0 0 0 -5px", // Margin around the 'after' content
        textDecoration: "none",
      },
    };
  public static readonly SAMPLE_DECORATION_OPTION: vscode.ThemableDecorationRenderOptions = // TODO (WJ): remove
    {
      color: "#FF4500", // Orange text color
      // backgroundColor: "rgba(255, 255, 0, 0.3)", // Yellow with transparency
      overviewRulerColor: "rgba(124, 58, 237, 0.8)", // A semi-transparent purple
      // before: {
      //   contentText: "🧶",
      //   margin: "0 px 0 0", // Margin around the 'before' content
      // },
    };
  public experimentDecorationType: vscode.TextEditorDecorationType; // TODO (WJ): remove
  public sampleDecorationType: vscode.TextEditorDecorationType; // TODO (WJ): remove
  public decorationTypes: vscode.TextEditorDecorationType[] = []; // TODO (WJ): remove
  public emojiDecorationTypes: vscode.TextEditorDecorationType[] = [];
  public solidColorDecorationTypes: vscode.TextEditorDecorationType[] = [];
  public gradientColorDecorationType2dArray: vscode.TextEditorDecorationType[][] =
    [];

  private constructor() {
    this.experimentDecorationType =
      vscode.window.createTextEditorDecorationType(
        DecorationManager.EXPERIMENT_DECORATION_OPTION,
      );
    this.sampleDecorationType = vscode.window.createTextEditorDecorationType(
      DecorationManager.SAMPLE_DECORATION_OPTION,
    );
    for (let i = 0; i < EMOJIS.length; i++) {
      const emojiDecorationOption: vscode.ThemableDecorationRenderOptions = {
        before: {
          contentText: EMOJIS[i],
          margin: "0 2px 0 0", // Margin around the 'before' content
        },
      };
      this.emojiDecorationTypes.push(
        vscode.window.createTextEditorDecorationType(emojiDecorationOption),
      );
    }
  }

  public static getInstance(): DecorationManager {
    if (!DecorationManager.instance) {
      DecorationManager.instance = new DecorationManager();
      readJsonFileInAssets("colors.json").then((colors) => {
        console.log(
          "🚀 ~ file: decorationManager.ts ~ line 93 ~ readJsonFileInAssets ~ colors",
          colors,
        );
      });
    }
    return DecorationManager.instance;
  }

  public async initialize() {
    readJsonFileInAssets<string[]>("colors.json").then((colors) => {
      if (colors !== null) {
        this.gradientColorDecorationType2dArray = Array.from(
          { length: colors.length },
          () => [],
        );

        for (let i = 0; i < colors.length; i++) {
          // Create solid color decoration types
          const colorDecorationOption: vscode.ThemableDecorationRenderOptions =
            {
              color: colors[i],
            };
          this.solidColorDecorationTypes.push(
            vscode.window.createTextEditorDecorationType(colorDecorationOption),
          );

          // Create gradient color decoration types
          for (let j = 0; j < ALPHA_MIXING_VALUES.length; j++) {
            const alpha = ALPHA_MIXING_VALUES[j];
            const mixedColor = colorAlphaMixing(colors[i], "#9CDCFE", alpha); // TODO (WJ): dynamic 2nd color
            if (mixedColor !== null) {
              const colorDecorationOption: vscode.ThemableDecorationRenderOptions =
                {
                  color: mixedColor,
                };
              this.gradientColorDecorationType2dArray[i].push(
                vscode.window.createTextEditorDecorationType(
                  colorDecorationOption,
                ),
              );
            }
          }
        }
      }
    });
    console.log("Decoration Manager initialized!");
  }
}

export default DecorationManager;
