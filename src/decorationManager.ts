import * as vscode from "vscode";
import {
  DEFAULT_SEMANTIC_KEY,
  EMOJIS,
  EXTENSION_NAME,
  RENDER_PATTERN_LABEL,
  WORKSPACE_STATE_KEYS,
} from "./constant";
import { renderPatternToDecorationProcessor } from "./decorationProcessor";
import type {
  DecorationProcessor,
  ExtensionConfig,
  IDecorationManager,
} from "./type";
import {
  buildDebouncedDecorateVariablesFunction,
  buildPreviewDebouncedDecorateVariablesFunction,
  buildSemanticKey,
  colorAlphaMixing,
  flattenComplexArray,
  parseSemanticCode,
} from "./util";

class DecorationManager implements IDecorationManager {
  private static instance: DecorationManager;
  public extensionConfig: Partial<ExtensionConfig> = {};
  public currentRenderPattern: string = RENDER_PATTERN_LABEL[0];
  public debouncedDecorateVariables: (
    editor: vscode.TextEditor | undefined,
  ) => void = () => {};
  public debouncedPreviewDecorateVariables: (
    editor: vscode.TextEditor | undefined,
    decorationProcessor: DecorationProcessor,
  ) => void = () => {};

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
  public gradientCommonColorDecorationTypes: vscode.TextEditorDecorationType[] =
    [];
  public gradientColorDecorationType2dArray: vscode.TextEditorDecorationType[][] =
    [];
  public semanticToFadeInGradientColorDecorationType2dArray = new Map<
    string,
    vscode.TextEditorDecorationType[][]
  >();
  private defaultFadeInGradientColorDecorationType2dArray: vscode.TextEditorDecorationType[][] =
    []; // TODO (WJ): implement clear and dispose
  public flatFadeInGradientColorDecorationTypes: vscode.TextEditorDecorationType[] = // TODO (WJ): remove
    [];
  public semanticTokenTypesToGradientCommonColorDecorationTypes: {
    [key: string]: vscode.TextEditorDecorationType[];
  } = {};

  public gradientColorSize: number = 0;
  public fadeOutGradientStepSize: number = 0;
  public fadeInGradientStepSize: number = 0;

  private constructor() {}

  public static getInstance(): DecorationManager {
    if (!DecorationManager.instance) {
      DecorationManager.instance = new DecorationManager();
    }
    return DecorationManager.instance;
  }

  public static previewRenderPattern(renderPatternLabel: string) {
    DecorationManager.getInstance().previewRenderPattern(renderPatternLabel);
  }

  public static initialize(context?: vscode.ExtensionContext) {
    DecorationManager.getInstance().initialize(context);
  }

  public static cleanDecorations(editor: vscode.TextEditor) {
    DecorationManager.getInstance().cleanDecorations(editor);
  }

  public static clear() {
    DecorationManager.getInstance().clear();
  }

  public static debouncedDecorateVariables(editor?: vscode.TextEditor) {
    DecorationManager.getInstance().debouncedDecorateVariables(editor);
  }

  public getKeyAndFadeInGradientColorDecorationType2dArray(
    tokenType: string,
    modifiers: string[],
  ): [string, vscode.TextEditorDecorationType[][]] {
    let key = buildSemanticKey(tokenType, modifiers);
    let decorationType2dArray =
      this.semanticToFadeInGradientColorDecorationType2dArray.get(key);
    if (decorationType2dArray === undefined) {
      key = tokenType;
      decorationType2dArray =
        this.semanticToFadeInGradientColorDecorationType2dArray.get(key);
    }
    if (decorationType2dArray === undefined) {
      key = DEFAULT_SEMANTIC_KEY;
      // Directly assign the default one despite can be accessed by DEFAULT_SEMANTIC_KEY key (premature optimization)
      decorationType2dArray =
        this.defaultFadeInGradientColorDecorationType2dArray;
    }
    if (decorationType2dArray === undefined) {
      throw new Error("Decoration type not found");
    }

    return [key, decorationType2dArray];
  }

  private previewRenderPattern(renderPatternLabel: string) {
    const decorationProcessor =
      renderPatternToDecorationProcessor[renderPatternLabel];

    if (decorationProcessor === undefined) {
      throw new Error("Decoration processor not found");
    }

    const activeEditor = vscode.window.activeTextEditor;

    if (activeEditor !== undefined) {
      console.log("-> Preview");
      this.cleanDecorations(activeEditor);
      this.debouncedPreviewDecorateVariables(activeEditor, decorationProcessor);
    }
  }

  private initialize(context?: vscode.ExtensionContext) {
    const extensionConfig = vscode.workspace
      .getConfiguration()
      .get<Partial<ExtensionConfig>>(EXTENSION_NAME); // TODO (WJ): update configuration key
    if (extensionConfig === undefined) {
      throw new Error("Unable to read configuration.");
      // TODO (WJ): add notification
    }

    this.extensionConfig = extensionConfig;

    // Update current render pattern only when context is provided
    if (context !== undefined) {
      const workspaceStateRenderPattern = context.workspaceState.get<
        string | undefined
      >(WORKSPACE_STATE_KEYS.SELECTED_RENDER_PATTERN);

      if (workspaceStateRenderPattern !== undefined) {
        this.currentRenderPattern = workspaceStateRenderPattern;
      } else {
        context.workspaceState.update(
          WORKSPACE_STATE_KEYS.SELECTED_RENDER_PATTERN,
          this.currentRenderPattern,
        );
      }
    }

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
    const alphaMixingValues = this.extensionConfig.fadeInGradientSteps ?? [];
    this.gradientColorDecorationType2dArray = Array.from(
      { length: gradientColors.length },
      () => [],
    );
    for (let i = 0; i < gradientColors.length; i++) {
      for (let j = 0; j < alphaMixingValues.length; j++) {
        const alpha = alphaMixingValues[j];
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

    // Initialize gradient common color decoration types
    for (let i = 0; i < alphaMixingValues.length; i++) {
      const alpha = alphaMixingValues[i];
      const mixedColor = colorAlphaMixing(commonColor, "#9CDCFE", alpha); // TODO (WJ): dynamic 2nd color
      if (mixedColor !== null) {
        const colorDecorationOption: vscode.ThemableDecorationRenderOptions = {
          color: mixedColor,
        };
        this.gradientCommonColorDecorationTypes.push(
          vscode.window.createTextEditorDecorationType(colorDecorationOption),
        );
      }
    }

    // TODO (WJ): Initialize semantic to gradient color decoration types
    this.gradientColorSize = this.extensionConfig.gradientColors?.length ?? 0;
    this.fadeOutGradientStepSize =
      this.extensionConfig.fadeOutGradientSteps?.length ?? 0;
    this.fadeInGradientStepSize =
      this.extensionConfig.fadeInGradientSteps?.length ?? 0;

    const semanticForegroundColors =
      this.extensionConfig.semanticForegroundColors || {};
    const defaultSemanticForegroundColor =
      this.extensionConfig.defaultSemanticForegroundColor;
    if (defaultSemanticForegroundColor === undefined) {
      throw new Error("Default semantic foreground color is not provided");
    }

    const fadeInGradientSteps = this.extensionConfig.fadeInGradientSteps || [];
    // each semantic token type & modifiers to foreground color
    for (const semanticCode in semanticForegroundColors) {
      const foregroundColor = semanticForegroundColors[semanticCode];
      const [tokenType, modifiers] = parseSemanticCode(semanticCode);
      if (tokenType === null) {
        continue;
      }
      const semanticKey = buildSemanticKey(tokenType, modifiers);

      // each gradient color
      const gradientColorDecorationType2dArray = Array.from<
        vscode.TextEditorDecorationType,
        vscode.TextEditorDecorationType[]
      >({ length: gradientColors.length }, () => []);
      for (
        let colorIndex = 0;
        colorIndex < gradientColors.length;
        colorIndex++
      ) {
        // each alpha value
        for (
          let stepIndex = 0;
          stepIndex < fadeInGradientSteps.length;
          stepIndex++
        ) {
          const alpha = fadeInGradientSteps[stepIndex];
          const mixedColor = colorAlphaMixing(
            gradientColors[colorIndex],
            foregroundColor,
            alpha,
          );
          if (mixedColor === null) {
            throw new Error("Mixed color is null");
          }
          const colorDecorationOption: vscode.ThemableDecorationRenderOptions =
            {
              color: mixedColor,
            };
          gradientColorDecorationType2dArray[colorIndex].push(
            vscode.window.createTextEditorDecorationType(colorDecorationOption),
          );
        }
      }

      this.semanticToFadeInGradientColorDecorationType2dArray.set(
        semanticKey,
        gradientColorDecorationType2dArray,
      );
    }
    // default semantic gradient color
    // each gradient color
    this.defaultFadeInGradientColorDecorationType2dArray = Array.from<
      vscode.TextEditorDecorationType,
      vscode.TextEditorDecorationType[]
    >({ length: gradientColors.length }, () => []);
    for (let colorIndex = 0; colorIndex < gradientColors.length; colorIndex++) {
      // each alpha value
      for (
        let stepIndex = 0;
        stepIndex < fadeInGradientSteps.length;
        stepIndex++
      ) {
        const alpha = fadeInGradientSteps[stepIndex];
        const mixedColor = colorAlphaMixing(
          gradientColors[colorIndex],
          defaultSemanticForegroundColor,
          alpha,
        );
        if (mixedColor === null) {
          throw new Error("Mixed color is null");
        }
        const colorDecorationOption: vscode.ThemableDecorationRenderOptions = {
          color: mixedColor,
        };
        this.defaultFadeInGradientColorDecorationType2dArray[colorIndex].push(
          vscode.window.createTextEditorDecorationType(colorDecorationOption),
        );
      }
    }
    this.semanticToFadeInGradientColorDecorationType2dArray.set(
      DEFAULT_SEMANTIC_KEY,
      this.defaultFadeInGradientColorDecorationType2dArray,
    );

    this.flatFadeInGradientColorDecorationTypes = flattenComplexArray(
      // TODO (WJ): remove
      this.semanticToFadeInGradientColorDecorationType2dArray,
    );

    // TODO (WJ): Initialize semantic token types to gradient common color decoration types

    // Initialize debounced decorate variables function
    const decorationProcessor =
      renderPatternToDecorationProcessor[this.currentRenderPattern];
    if (decorationProcessor === undefined) {
      throw new Error("Decoration processor not found"); // TODO (WJ): add notification
    }
    this.debouncedDecorateVariables = buildDebouncedDecorateVariablesFunction(
      decorationProcessor,
      this,
      this.extensionConfig,
    );

    // Initialize preview debounce decoration variables function
    this.debouncedPreviewDecorateVariables =
      buildPreviewDebouncedDecorateVariablesFunction(
        this,
        this.extensionConfig,
      );

    console.log("Decoration Manager initialized!"); // TODO (WJ): move to output channel
    console.log(this.extensionConfig); // TODO (WJ): move to output channel
  }

  private cleanDecorations(editor: vscode.TextEditor) {
    // Clean emoji decoration types
    for (const decorationType of this.emojiDecorationTypes) {
      editor.setDecorations(decorationType, []);
    }

    // Clean solid color decoration types
    for (const decorationType of this.solidColorDecorationTypes) {
      editor.setDecorations(decorationType, []);
    }

    // Clean solid common color decoration type
    editor.setDecorations(this.solidCommonColorDecorationType, []);

    // Clean gradient color decoration types
    for (const decorationTypeArray of this.gradientColorDecorationType2dArray) {
      for (const decorationType of decorationTypeArray) {
        editor.setDecorations(decorationType, []);
      }
    }

    // Clean gradient common color decoration types
    for (const decorationType of this.gradientCommonColorDecorationTypes) {
      editor.setDecorations(decorationType, []);
    }

    // Clean semantic to gradient color decoration types
    for (const [_, value] of this
      .semanticToFadeInGradientColorDecorationType2dArray) {
      for (const decorationTypeArray of value) {
        for (const decorationType of decorationTypeArray) {
          editor.setDecorations(decorationType, []);
        }
      }
    }

    // Clean semantic token types to gradient common color decoration types
    for (const key in this
      .semanticTokenTypesToGradientCommonColorDecorationTypes) {
      for (const decorationType of this
        .semanticTokenTypesToGradientCommonColorDecorationTypes[key]) {
        editor.setDecorations(decorationType, []);
      }
    }
  }

  /**
   * NOTE: Make sure all decoration types are disposed before clearing
   */
  private clear() {
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

    // Clear gradient common color decoration types
    for (const decorationType of this.gradientCommonColorDecorationTypes) {
      decorationType.dispose();
    }
    this.gradientCommonColorDecorationTypes = [];

    // Clear semantic to gradient color decoration types
    for (const [_, value] of this
      .semanticToFadeInGradientColorDecorationType2dArray) {
      for (const decorationTypeArray of value) {
        for (const decorationType of decorationTypeArray) {
          decorationType.dispose();
        }
      }
    }
    this.semanticToFadeInGradientColorDecorationType2dArray.clear();

    // Clear semantic token types to gradient common color decoration types
    for (const key in this
      .semanticTokenTypesToGradientCommonColorDecorationTypes) {
      for (const decorationType of this
        .semanticTokenTypesToGradientCommonColorDecorationTypes[key]) {
        decorationType.dispose();
      }
    }
    this.semanticTokenTypesToGradientCommonColorDecorationTypes = {};

    // Clear debounced decorate variables function
    this.debouncedDecorateVariables = () => {};

    // Clear preview debounce decoration variables function
    this.debouncedPreviewDecorateVariables = () => {};
  }
}

export default DecorationManager;
