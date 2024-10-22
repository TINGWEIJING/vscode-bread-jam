import type {
  ExtensionContext,
  TextEditor,
  TextEditorDecorationType,
  ThemableDecorationRenderOptions,
} from "vscode";
import { window } from "vscode";
import {
  DEFAULT_SELECTED_RENDER_PATTERN,
  DEFAULT_SEMANTIC_KEY,
  WORKSPACE_STATE_KEYS,
} from "./constant";
import { renderPatternLabelToDecorationProcessor } from "./decorationProcessor";
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
  getDecorationTypeByKey,
  parseSemanticCode,
  pearsonHash,
  scaleHash,
} from "./util";

class DecorationManager implements IDecorationManager {
  private static instance: DecorationManager;
  public static isConstructed: boolean = false;
  public static isInitialized: boolean = false;

  /* Variables below need to be initialized in constructor only */
  public extensionConfig: ExtensionConfig;
  private context: ExtensionContext;
  private log: (message: string) => void;
  private error: (message: string) => void;

  /* Variables below need to be initialized in initialize() */
  public gradientColorSize: number = 0;
  public fadeOutGradientStepSize: number = 0;
  public fadeInGradientStepSize: number = 0;
  public currentRenderPatternLabel: string =
    DEFAULT_SELECTED_RENDER_PATTERN.slice(3);
  public debouncedDecorateVariables: (editor: TextEditor | undefined) => void =
    () => {};
  public debouncedPreviewDecorateVariables: (
    editor: TextEditor | undefined,
    decorationProcessor: DecorationProcessor,
  ) => void = () => {};

  // * Fade In
  public semanticToFadeInGradientColorDecorationType2dArray = new Map<
    string,
    TextEditorDecorationType[][]
  >();
  private defaultFadeInGradientColorDecorationType2dArray: TextEditorDecorationType[][] =
    [];
  public semanticToFadeInGradientCommonColorDecorationTypes = new Map<
    string,
    TextEditorDecorationType[]
  >();
  private defaultFadeInGradientCommonColorDecorationTypes: TextEditorDecorationType[] =
    [];

  // * Fade Out
  public semanticToFadeOutGradientColorDecorationType2dArray = new Map<
    string,
    TextEditorDecorationType[][]
  >();
  private defaultFadeOutGradientColorDecorationType2dArray: TextEditorDecorationType[][] =
    [];
  public semanticToFadeOutGradientCommonColorDecorationTypes = new Map<
    string,
    TextEditorDecorationType[]
  >();
  private defaultFadeOutGradientCommonColorDecorationTypes: TextEditorDecorationType[] =
    [];

  // * First Character & Subtext - Solid Color
  public solidColorDecorationTypes: TextEditorDecorationType[] = [];
  public solidCommonColorDecorationType: TextEditorDecorationType =
    window.createTextEditorDecorationType({});

  // * Emoji
  public emojiDecorationTypes: TextEditorDecorationType[] = [];

  private hashingCache: Map<string, number> = new Map();

  private constructor(
    extensionConfig: ExtensionConfig,
    context: ExtensionContext,
    log: (message: string) => void,
    error: (message: string) => void,
  ) {
    this.extensionConfig = extensionConfig;
    this.context = context;
    this.log = log;
    this.error = error;
  }

  public static construct(
    extensionConfig: ExtensionConfig,
    context: ExtensionContext,
    log: (message: string) => void,
    error: (message: string) => void,
  ) {
    if (this.isConstructed) {
      throw new Error("DecorationManager is already constructed.");
    }
    const instance = new DecorationManager(
      extensionConfig,
      context,
      log,
      error,
    );
    this.isConstructed = true;
    DecorationManager.instance = instance;
  }

  public static getInstance(): DecorationManager {
    if (!this.isConstructed) {
      throw new Error("DecorationManager is not constructed yet.");
    }
    return DecorationManager.instance;
  }

  public static previewRenderPattern(renderPatternLabel: string) {
    DecorationManager.getInstance().previewRenderPattern(renderPatternLabel);
  }

  public static initialize() {
    if (this.isInitialized) {
      throw new Error("DecorationManager is already initialized.");
    }
    DecorationManager.getInstance().initialize();
    this.isInitialized = true;
  }

  public static cleanDecorations(editor: TextEditor) {
    DecorationManager.getInstance().cleanDecorations(editor);
  }

  public static clear() {
    console.log("DecorationManager.clear()");
    DecorationManager.getInstance().clear();
    this.isInitialized = false;
  }

  public static debouncedDecorateVariables(editor?: TextEditor) {
    DecorationManager.getInstance().debouncedDecorateVariables(editor);
  }

  public static updateExtensionConfig(extensionConfig: ExtensionConfig) {
    DecorationManager.getInstance().updateExtensionConfig(extensionConfig);
  }

  public getHash(text: string, max: number): number {
    const cachedHash = this.hashingCache.get(text);
    if (cachedHash !== undefined) {
      return scaleHash(cachedHash, max);
    }
    const hashValue = pearsonHash(text, this.extensionConfig.permutationTable!);
    this.hashingCache.set(text, hashValue);
    return scaleHash(hashValue, max);
  }

  public getKeyAndFadeOutGradientColorDecorationType2dArray(
    tokenType: string,
    modifiers: string[],
  ): [string, TextEditorDecorationType[][]] {
    return getDecorationTypeByKey(
      tokenType,
      modifiers,
      this.semanticToFadeOutGradientColorDecorationType2dArray,
      this.defaultFadeOutGradientColorDecorationType2dArray,
    );
  }

  public getKeyAndFadeInGradientColorDecorationType2dArray(
    tokenType: string,
    modifiers: string[],
  ): [string, TextEditorDecorationType[][]] {
    return getDecorationTypeByKey(
      tokenType,
      modifiers,
      this.semanticToFadeInGradientColorDecorationType2dArray,
      this.defaultFadeInGradientColorDecorationType2dArray,
    );
  }

  public getKeyAndFadeOutGradientCommonColorDecorationTypes(
    tokenType: string,
    modifiers: string[],
  ): [string, TextEditorDecorationType[]] {
    return getDecorationTypeByKey(
      tokenType,
      modifiers,
      this.semanticToFadeOutGradientCommonColorDecorationTypes,
      this.defaultFadeOutGradientCommonColorDecorationTypes,
    );
  }

  public getKeyAndFadeInGradientCommonColorDecorationTypes(
    tokenType: string,
    modifiers: string[],
  ): [string, TextEditorDecorationType[]] {
    return getDecorationTypeByKey(
      tokenType,
      modifiers,
      this.semanticToFadeInGradientCommonColorDecorationTypes,
      this.defaultFadeInGradientCommonColorDecorationTypes,
    );
  }

  private previewRenderPattern(renderPatternLabel: string) {
    const decorationProcessor =
      renderPatternLabelToDecorationProcessor[renderPatternLabel];

    if (decorationProcessor === undefined) {
      throw new Error("Decoration processor not found");
    }

    const activeEditor = window.activeTextEditor;

    if (activeEditor !== undefined) {
      this.cleanDecorations(activeEditor);
      this.debouncedPreviewDecorateVariables(activeEditor, decorationProcessor);
    }
  }

  private updateExtensionConfig(extensionConfig: ExtensionConfig) {
    this.extensionConfig = extensionConfig;
  }

  private initialize() {
    // Update current render pattern
    const workspaceStateRenderPatternLabel =
      this.context.workspaceState.get<string>(
        WORKSPACE_STATE_KEYS.SELECTED_RENDER_PATTERN,
      );
    if (workspaceStateRenderPatternLabel !== undefined) {
      this.currentRenderPatternLabel = workspaceStateRenderPatternLabel;
    } else {
      this.context.workspaceState.update(
        WORKSPACE_STATE_KEYS.SELECTED_RENDER_PATTERN,
        this.currentRenderPatternLabel,
      );
    }

    this.gradientColorSize = this.extensionConfig.gradientColors.length;
    this.fadeOutGradientStepSize =
      this.extensionConfig.fadeOutGradientSteps.length;
    this.fadeInGradientStepSize =
      this.extensionConfig.fadeInGradientSteps.length;

    // * Fade In & Fade Out Gradient Color
    this._initializeFadeInGradientColor();
    this._initializeFadeOutGradientColor();

    // * Fade In & Fade Out Gradient Common Color
    this._initializeFadeInGradientCommonColor();
    this._initializeFadeOutGradientCommonColor();

    // * Solid Color
    this._initializeSolidColor();

    // * Solid Common Color
    this._initializeSolidCommonColor();

    // * Emoji
    this._initializeEmoji();

    // Initialize debounced decorate variables function
    const decorationProcessor =
      renderPatternLabelToDecorationProcessor[this.currentRenderPatternLabel];
    if (decorationProcessor === undefined) {
      throw new Error(
        `decorationProcessor is undefined. this.currentRenderPatternLabel: ${this.currentRenderPatternLabel}`,
      );
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

    this.log("Decoration Manager initialized!");
    this.log(JSON.stringify(this.extensionConfig, null, 2));
  }

  private cleanDecorations(editor: TextEditor) {
    [
      // * Fade In
      ...Array.from(
        this.semanticToFadeInGradientColorDecorationType2dArray.values(),
      ).flat(2),
      ...this.defaultFadeInGradientColorDecorationType2dArray.flat(),
      ...Array.from(
        this.semanticToFadeInGradientCommonColorDecorationTypes.values(),
      ).flat(),
      ...this.defaultFadeInGradientCommonColorDecorationTypes,

      // * Fade Out
      ...Array.from(
        this.semanticToFadeOutGradientColorDecorationType2dArray.values(),
      ).flat(2),
      ...this.defaultFadeOutGradientColorDecorationType2dArray.flat(),
      ...Array.from(
        this.semanticToFadeOutGradientCommonColorDecorationTypes.values(),
      ).flat(),
      ...this.defaultFadeOutGradientCommonColorDecorationTypes,

      // * First Character & Subtext - Solid Color
      ...this.solidColorDecorationTypes,
      this.solidCommonColorDecorationType,

      // * Emoji
      ...this.emojiDecorationTypes,
    ].forEach((decorationType) => {
      editor.setDecorations(decorationType, []);
    });
  }

  /**
   * NOTE: Make sure all decoration types are disposed before clearing
   */
  private clear() {
    [
      // * Fade In
      ...Array.from(
        this.semanticToFadeInGradientColorDecorationType2dArray.values(),
      ).flat(2),
      ...this.defaultFadeInGradientColorDecorationType2dArray.flat(),
      ...Array.from(
        this.semanticToFadeInGradientCommonColorDecorationTypes.values(),
      ).flat(),
      ...this.defaultFadeInGradientCommonColorDecorationTypes,

      // * Fade Out
      ...Array.from(
        this.semanticToFadeOutGradientColorDecorationType2dArray.values(),
      ).flat(2),
      ...this.defaultFadeOutGradientColorDecorationType2dArray.flat(),
      ...Array.from(
        this.semanticToFadeOutGradientCommonColorDecorationTypes.values(),
      ).flat(),
      ...this.defaultFadeOutGradientCommonColorDecorationTypes,

      // * First Character & Subtext - Solid Color
      ...this.solidColorDecorationTypes,
      this.solidCommonColorDecorationType,

      // * Emoji
      ...this.emojiDecorationTypes,
    ].forEach((decorationType) => {
      decorationType.dispose();
    });

    // * Fade In
    this.semanticToFadeInGradientColorDecorationType2dArray.clear();
    this.defaultFadeInGradientColorDecorationType2dArray = [];
    this.semanticToFadeInGradientCommonColorDecorationTypes.clear();
    this.defaultFadeInGradientCommonColorDecorationTypes = [];

    // * Fade Out
    this.semanticToFadeOutGradientColorDecorationType2dArray.clear();
    this.defaultFadeOutGradientColorDecorationType2dArray = [];
    this.semanticToFadeOutGradientCommonColorDecorationTypes.clear();
    this.defaultFadeOutGradientCommonColorDecorationTypes = [];

    // * First Character & Subtext - Solid Color
    this.solidColorDecorationTypes = [];
    this.solidCommonColorDecorationType = window.createTextEditorDecorationType(
      {},
    );

    // * Emoji
    this.emojiDecorationTypes = [];

    // Clear debounced decorate variables function
    this.debouncedDecorateVariables = () => {};

    // Clear preview debounce decoration variables function
    this.debouncedPreviewDecorateVariables = () => {};

    // Clear hashing cache
    this.hashingCache.clear();
  }

  private _initializeFadeInGradientColor() {
    const fadeInGradientSteps = this.extensionConfig.fadeInGradientSteps;
    const gradientColors = this.extensionConfig.gradientColors;
    const semanticForegroundColors =
      this.extensionConfig.semanticForegroundColors;
    const defaultSemanticForegroundColor =
      this.extensionConfig.defaultSemanticForegroundColor;

    // each semantic token type & modifiers to foreground color
    for (const semanticCode in semanticForegroundColors) {
      const foregroundColor = semanticForegroundColors[semanticCode];
      const [tokenType, modifiers] = parseSemanticCode(semanticCode);
      if (tokenType === null) {
        continue;
      }
      const semanticKey = buildSemanticKey(tokenType, modifiers);

      const fadeInGradientColorDecorationType2dArray = Array.from<
        TextEditorDecorationType,
        TextEditorDecorationType[]
      >({ length: gradientColors.length }, () => []);
      // each gradient color
      for (
        let colorIndex = 0;
        colorIndex < gradientColors.length;
        colorIndex++
      ) {
        // each fade in alpha value
        for (
          let stepIndex = 0;
          stepIndex < fadeInGradientSteps.length;
          stepIndex++
        ) {
          const alpha = fadeInGradientSteps[stepIndex];
          let mixedColor = colorAlphaMixing(
            gradientColors[colorIndex],
            foregroundColor,
            alpha,
          );
          if (mixedColor === null) {
            const errorMessage = `Mixed color is null. Generated from ${gradientColors[colorIndex]} and ${foregroundColor} with alpha ${alpha}.`;
            this.error(errorMessage);
            mixedColor = "#FF0000";
          }
          const colorDecorationOption: ThemableDecorationRenderOptions = {
            color: mixedColor,
          };
          fadeInGradientColorDecorationType2dArray[colorIndex].push(
            window.createTextEditorDecorationType(colorDecorationOption),
          );
        }
      }
      this.semanticToFadeInGradientColorDecorationType2dArray.set(
        semanticKey,
        fadeInGradientColorDecorationType2dArray,
      );
    }
    // default semantic gradient color
    this.defaultFadeInGradientColorDecorationType2dArray = Array.from<
      TextEditorDecorationType,
      TextEditorDecorationType[]
    >({ length: gradientColors.length }, () => []);
    // each gradient color
    for (let colorIndex = 0; colorIndex < gradientColors.length; colorIndex++) {
      // each fade in alpha value
      for (
        let stepIndex = 0;
        stepIndex < fadeInGradientSteps.length;
        stepIndex++
      ) {
        const alpha = fadeInGradientSteps[stepIndex];
        let mixedColor = colorAlphaMixing(
          gradientColors[colorIndex],
          defaultSemanticForegroundColor,
          alpha,
        );
        if (mixedColor === null) {
          const errorMessage = `Mixed color is null. Generated from ${gradientColors[colorIndex]} and ${defaultSemanticForegroundColor} with alpha ${alpha}.`;
          this.error(errorMessage);
          mixedColor = "#FF0000";
        }
        const colorDecorationOption: ThemableDecorationRenderOptions = {
          color: mixedColor,
        };
        this.defaultFadeInGradientColorDecorationType2dArray[colorIndex].push(
          window.createTextEditorDecorationType(colorDecorationOption),
        );
      }
    }
    this.semanticToFadeInGradientColorDecorationType2dArray.set(
      DEFAULT_SEMANTIC_KEY,
      this.defaultFadeInGradientColorDecorationType2dArray,
    );
  }

  private _initializeFadeOutGradientColor() {
    const fadeOutGradientSteps = this.extensionConfig.fadeOutGradientSteps;
    const gradientColors = this.extensionConfig.gradientColors;
    const semanticForegroundColors =
      this.extensionConfig.semanticForegroundColors;
    const defaultSemanticForegroundColor =
      this.extensionConfig.defaultSemanticForegroundColor;

    // each semantic token type & modifiers to foreground color
    for (const semanticCode in semanticForegroundColors) {
      const foregroundColor = semanticForegroundColors[semanticCode];
      const [tokenType, modifiers] = parseSemanticCode(semanticCode);
      if (tokenType === null) {
        continue;
      }
      const semanticKey = buildSemanticKey(tokenType, modifiers);

      const fadeOutGradientColorDecorationType2dArray = Array.from<
        TextEditorDecorationType,
        TextEditorDecorationType[]
      >({ length: gradientColors.length }, () => []);
      // each gradient color
      for (
        let colorIndex = 0;
        colorIndex < gradientColors.length;
        colorIndex++
      ) {
        // each fade out alpha value
        for (
          let stepIndex = 0;
          stepIndex < fadeOutGradientSteps.length;
          stepIndex++
        ) {
          const alpha = fadeOutGradientSteps[stepIndex];
          let mixedColor = colorAlphaMixing(
            gradientColors[colorIndex],
            foregroundColor,
            alpha,
          );
          if (mixedColor === null) {
            const errorMessage = `Mixed color is null. Generated from ${gradientColors[colorIndex]} and ${foregroundColor} with alpha ${alpha}.`;
            this.error(errorMessage);
            mixedColor = "#FF0000";
          }
          const colorDecorationOption: ThemableDecorationRenderOptions = {
            color: mixedColor,
          };
          fadeOutGradientColorDecorationType2dArray[colorIndex].push(
            window.createTextEditorDecorationType(colorDecorationOption),
          );
        }
      }
      this.semanticToFadeOutGradientColorDecorationType2dArray.set(
        semanticKey,
        fadeOutGradientColorDecorationType2dArray,
      );
    }
    // default semantic gradient color
    this.defaultFadeOutGradientColorDecorationType2dArray = Array.from<
      TextEditorDecorationType,
      TextEditorDecorationType[]
    >({ length: gradientColors.length }, () => []);
    // each gradient color
    for (let colorIndex = 0; colorIndex < gradientColors.length; colorIndex++) {
      // each fade out alpha value
      for (
        let stepIndex = 0;
        stepIndex < fadeOutGradientSteps.length;
        stepIndex++
      ) {
        const alpha = fadeOutGradientSteps[stepIndex];
        let mixedColor = colorAlphaMixing(
          gradientColors[colorIndex],
          defaultSemanticForegroundColor,
          alpha,
        );
        if (mixedColor === null) {
          const errorMessage = `Mixed color is null. Generated from ${gradientColors[colorIndex]} and ${defaultSemanticForegroundColor} with alpha ${alpha}.`;
          this.error(errorMessage);
          mixedColor = "#FF0000";
        }
        const colorDecorationOption: ThemableDecorationRenderOptions = {
          color: mixedColor,
        };
        this.defaultFadeOutGradientColorDecorationType2dArray[colorIndex].push(
          window.createTextEditorDecorationType(colorDecorationOption),
        );
      }
    }
    this.semanticToFadeOutGradientColorDecorationType2dArray.set(
      DEFAULT_SEMANTIC_KEY,
      this.defaultFadeOutGradientColorDecorationType2dArray,
    );
  }

  private _initializeFadeInGradientCommonColor() {
    const fadeInGradientSteps = this.extensionConfig.fadeInGradientSteps;
    const commonColor = this.extensionConfig.commonColor;
    const semanticForegroundColors =
      this.extensionConfig.semanticForegroundColors;
    const defaultSemanticForegroundColor =
      this.extensionConfig.defaultSemanticForegroundColor;

    // each semantic token type & modifiers to foreground color
    for (const semanticCode in semanticForegroundColors) {
      const foregroundColor = semanticForegroundColors[semanticCode];
      const [tokenType, modifiers] = parseSemanticCode(semanticCode);
      if (tokenType === null) {
        continue;
      }
      const semanticKey = buildSemanticKey(tokenType, modifiers);

      const fadeInGradientCommonColorDecorationTypes: TextEditorDecorationType[] =
        [];
      // each fade in alpha value
      for (
        let stepIndex = 0;
        stepIndex < fadeInGradientSteps.length;
        stepIndex++
      ) {
        const alpha = fadeInGradientSteps[stepIndex];
        let mixedColor = colorAlphaMixing(commonColor, foregroundColor, alpha);
        if (mixedColor === null) {
          const errorMessage = `Mixed color is null. Generated from ${commonColor} and ${foregroundColor} with alpha ${alpha}.`;
          this.error(errorMessage);
          mixedColor = "#FF0000";
        }
        const colorDecorationOption: ThemableDecorationRenderOptions = {
          color: mixedColor,
        };
        fadeInGradientCommonColorDecorationTypes.push(
          window.createTextEditorDecorationType(colorDecorationOption),
        );
      }
      this.semanticToFadeInGradientCommonColorDecorationTypes.set(
        semanticKey,
        fadeInGradientCommonColorDecorationTypes,
      );
    }

    // default semantic gradient common color
    this.defaultFadeInGradientCommonColorDecorationTypes = [];
    // each fade in alpha value
    for (
      let stepIndex = 0;
      stepIndex < fadeInGradientSteps.length;
      stepIndex++
    ) {
      const alpha = fadeInGradientSteps[stepIndex];
      let mixedColor = colorAlphaMixing(
        commonColor,
        defaultSemanticForegroundColor,
        alpha,
      );
      if (mixedColor === null) {
        const errorMessage = `Mixed color is null. Generated from ${commonColor} and ${defaultSemanticForegroundColor} with alpha ${alpha}.`;
        this.error(errorMessage);
        mixedColor = "#FF0000";
      }
      const colorDecorationOption: ThemableDecorationRenderOptions = {
        color: mixedColor,
      };
      this.defaultFadeInGradientCommonColorDecorationTypes.push(
        window.createTextEditorDecorationType(colorDecorationOption),
      );
    }
    this.semanticToFadeInGradientCommonColorDecorationTypes.set(
      DEFAULT_SEMANTIC_KEY,
      this.defaultFadeInGradientCommonColorDecorationTypes,
    );
  }

  private _initializeFadeOutGradientCommonColor() {
    const fadeOutGradientSteps = this.extensionConfig.fadeOutGradientSteps;
    const commonColor = this.extensionConfig.commonColor;
    const semanticForegroundColors =
      this.extensionConfig.semanticForegroundColors;
    const defaultSemanticForegroundColor =
      this.extensionConfig.defaultSemanticForegroundColor;

    // each semantic token type & modifiers to foreground color
    for (const semanticCode in semanticForegroundColors) {
      const foregroundColor = semanticForegroundColors[semanticCode];
      const [tokenType, modifiers] = parseSemanticCode(semanticCode);
      if (tokenType === null) {
        continue;
      }
      const semanticKey = buildSemanticKey(tokenType, modifiers);

      const fadeOutGradientCommonColorDecorationTypes: TextEditorDecorationType[] =
        [];
      // each fade out alpha value
      for (
        let stepIndex = 0;
        stepIndex < fadeOutGradientSteps.length;
        stepIndex++
      ) {
        const alpha = fadeOutGradientSteps[stepIndex];
        let mixedColor = colorAlphaMixing(commonColor, foregroundColor, alpha);
        if (mixedColor === null) {
          const errorMessage = `Mixed color is null. Generated from ${commonColor} and ${foregroundColor} with alpha ${alpha}.`;
          this.error(errorMessage);
          mixedColor = "#FF0000";
        }
        const colorDecorationOption: ThemableDecorationRenderOptions = {
          color: mixedColor,
        };
        fadeOutGradientCommonColorDecorationTypes.push(
          window.createTextEditorDecorationType(colorDecorationOption),
        );
      }
      this.semanticToFadeOutGradientCommonColorDecorationTypes.set(
        semanticKey,
        fadeOutGradientCommonColorDecorationTypes,
      );
    }

    // default semantic gradient common color
    this.defaultFadeOutGradientCommonColorDecorationTypes = [];
    // each fade out alpha value
    for (
      let stepIndex = 0;
      stepIndex < fadeOutGradientSteps.length;
      stepIndex++
    ) {
      const alpha = fadeOutGradientSteps[stepIndex];
      let mixedColor = colorAlphaMixing(
        commonColor,
        defaultSemanticForegroundColor,
        alpha,
      );
      if (mixedColor === null) {
        const errorMessage = `Mixed color is null. Generated from ${commonColor} and ${defaultSemanticForegroundColor} with alpha ${alpha}.`;
        this.error(errorMessage);
        mixedColor = "#FF0000";
      }
      const colorDecorationOption: ThemableDecorationRenderOptions = {
        color: mixedColor,
      };
      this.defaultFadeOutGradientCommonColorDecorationTypes.push(
        window.createTextEditorDecorationType(colorDecorationOption),
      );
    }
    this.semanticToFadeOutGradientCommonColorDecorationTypes.set(
      DEFAULT_SEMANTIC_KEY,
      this.defaultFadeOutGradientCommonColorDecorationTypes,
    );
  }

  private _initializeSolidColor() {
    const solidColors = this.extensionConfig.solidColors;
    for (let i = 0; i < solidColors.length; i++) {
      const colorDecorationOption: ThemableDecorationRenderOptions = {
        color: solidColors[i],
      };
      this.solidColorDecorationTypes.push(
        window.createTextEditorDecorationType(colorDecorationOption),
      );
    }
  }

  private _initializeSolidCommonColor() {
    const commonColor = this.extensionConfig.commonColor;
    const colorDecorationOption: ThemableDecorationRenderOptions = {
      color: commonColor,
    };
    this.solidCommonColorDecorationType = window.createTextEditorDecorationType(
      colorDecorationOption,
    );
  }

  private _initializeEmoji() {
    const emojis = this.extensionConfig.emojis;
    for (let i = 0; i < emojis.length; i++) {
      const emojiDecorationOption: ThemableDecorationRenderOptions = {
        before: {
          contentText: emojis[i],
          margin: "0 2px 0 0",
        },
      };
      this.emojiDecorationTypes.push(
        window.createTextEditorDecorationType(emojiDecorationOption),
      );
    }
  }
}

export default DecorationManager;
