import * as vscode from "vscode";
import { EMOJIS } from "./constant";
import { colorAlphaMixing, readJsonFileInAssets } from "./util";

class DecorationManager {
  private static instance: DecorationManager;
  public static readonly EXPERIMENT_DECORATION_OPTION: vscode.ThemableDecorationRenderOptions =
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
  public static readonly SAMPLE_DECORATION_OPTION: vscode.ThemableDecorationRenderOptions =
    {
      color: "#FF4500", // Orange text color
      // backgroundColor: "rgba(255, 255, 0, 0.3)", // Yellow with transparency
      overviewRulerColor: "rgba(124, 58, 237, 0.8)", // A semi-transparent purple
      // before: {
      //   contentText: "🧶",
      //   margin: "0 px 0 0", // Margin around the 'before' content
      // },
    };
  public experimentDecorationType: vscode.TextEditorDecorationType;
  public sampleDecorationType: vscode.TextEditorDecorationType;
  public decorationTypes: vscode.TextEditorDecorationType[] = [];
  public emojiDecorationTypes: vscode.TextEditorDecorationType[] = [];
  public solidColorDecorationTypes: vscode.TextEditorDecorationType[] = [];
  public gradientColorDecorationTypesList: vscode.TextEditorDecorationType[][] =
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
        this.gradientColorDecorationTypesList = Array.from(
          { length: colors.length },
          () => [],
        );

        for (let i = 0; i < colors.length; i++) {
          const colorDecorationOption: vscode.ThemableDecorationRenderOptions =
            {
              color: colors[i],
            };
          this.solidColorDecorationTypes.push(
            vscode.window.createTextEditorDecorationType(colorDecorationOption),
          );

          for (let j = 0; j < 10; j++) {
            // TODO (WJ): convert to predefined 0, 0.1, 0.2
            // const alpha = (10 - j) / 10;
            const alpha = j / 10;
            const mixedColor = colorAlphaMixing(colors[i], "#FFFFFF", alpha); // TODO (WJ): dynamic 2nd color
            if (mixedColor !== null) {
              const colorDecorationOption: vscode.ThemableDecorationRenderOptions =
                {
                  color: mixedColor,
                };
              this.gradientColorDecorationTypesList[i].push(
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
