import type {
  ExtensionContext,
  TextEditor,
  TextEditorDecorationType,
  ThemableDecorationRenderOptions,
} from "vscode";
import { window, workspace } from "vscode";
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
  getDecorationTypeByKey,
  parseSemanticCode,
  pearsonHash,
  scaleHash,
} from "./util";

class DecorationManager implements IDecorationManager {
  private static instance: DecorationManager;
  public extensionConfig: Partial<ExtensionConfig> = {};
  public currentRenderPattern: string = RENDER_PATTERN_LABEL[0];
  public debouncedDecorateVariables: (editor: TextEditor | undefined) => void =
    () => {};
  public debouncedPreviewDecorateVariables: (
    editor: TextEditor | undefined,
    decorationProcessor: DecorationProcessor,
  ) => void = () => {};

  // TODO (WJ): change order of fade in and fade out?
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

  public gradientColorSize: number = 0;
  public fadeOutGradientStepSize: number = 0;
  public fadeInGradientStepSize: number = 0;

  private hashingCache: Map<string, number> = new Map();

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

  public static initialize(context?: ExtensionContext) {
    DecorationManager.getInstance().initialize(context);
  }

  public static cleanDecorations(editor: TextEditor) {
    DecorationManager.getInstance().cleanDecorations(editor);
  }

  public static clear() {
    DecorationManager.getInstance().clear();
  }

  public static debouncedDecorateVariables(editor?: TextEditor) {
    DecorationManager.getInstance().debouncedDecorateVariables(editor);
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
      renderPatternToDecorationProcessor[renderPatternLabel];

    if (decorationProcessor === undefined) {
      throw new Error("Decoration processor not found");
    }

    const activeEditor = window.activeTextEditor;

    if (activeEditor !== undefined) {
      this.cleanDecorations(activeEditor);
      this.debouncedPreviewDecorateVariables(activeEditor, decorationProcessor);
    }
  }

  private initialize(context?: ExtensionContext) {
    // TODO (WJ): split into smaller functions
    const extensionConfig = workspace
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
      const emojiDecorationOption: ThemableDecorationRenderOptions = {
        before: {
          contentText: EMOJIS[i],
          margin: "0 2px 0 0",
        },
      };
      this.emojiDecorationTypes.push(
        window.createTextEditorDecorationType(emojiDecorationOption),
      );
    }

    // Initialize solid color decoration types
    for (let i = 0; i < solidColors.length; i++) {
      const colorDecorationOption: ThemableDecorationRenderOptions = {
        color: solidColors[i],
      };
      this.solidColorDecorationTypes.push(
        window.createTextEditorDecorationType(colorDecorationOption),
      );
    }

    // Initialize solid common color decoration type
    this.solidCommonColorDecorationType = window.createTextEditorDecorationType(
      { color: commonColor },
    );

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

    // * Fade Out & Fade In Gradient Color
    const fadeOutGradientSteps =
      this.extensionConfig.fadeOutGradientSteps || [];
    const fadeInGradientSteps = this.extensionConfig.fadeInGradientSteps || [];
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
        // each fade out alpha value
        for (
          let stepIndex = 0;
          stepIndex < fadeOutGradientSteps.length;
          stepIndex++
        ) {
          const alpha = fadeOutGradientSteps[stepIndex];
          const mixedColor = colorAlphaMixing(
            gradientColors[colorIndex],
            foregroundColor,
            alpha,
          );
          if (mixedColor === null) {
            throw new Error("Mixed color is null");
          }
          const colorDecorationOption: ThemableDecorationRenderOptions = {
            color: mixedColor,
          };
          fadeOutGradientColorDecorationType2dArray[colorIndex].push(
            window.createTextEditorDecorationType(colorDecorationOption),
          );
        }
        // each fade in alpha value
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
          const colorDecorationOption: ThemableDecorationRenderOptions = {
            color: mixedColor,
          };
          fadeInGradientColorDecorationType2dArray[colorIndex].push(
            window.createTextEditorDecorationType(colorDecorationOption),
          );
        }
      }

      this.semanticToFadeOutGradientColorDecorationType2dArray.set(
        semanticKey,
        fadeOutGradientColorDecorationType2dArray,
      );
      this.semanticToFadeInGradientColorDecorationType2dArray.set(
        semanticKey,
        fadeInGradientColorDecorationType2dArray,
      );
    }
    // default semantic gradient color
    this.defaultFadeOutGradientColorDecorationType2dArray = Array.from<
      TextEditorDecorationType,
      TextEditorDecorationType[]
    >({ length: gradientColors.length }, () => []);
    this.defaultFadeInGradientColorDecorationType2dArray = Array.from<
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
        const mixedColor = colorAlphaMixing(
          gradientColors[colorIndex],
          defaultSemanticForegroundColor,
          alpha,
        );
        if (mixedColor === null) {
          throw new Error("Mixed color is null");
        }
        const colorDecorationOption: ThemableDecorationRenderOptions = {
          color: mixedColor,
        };
        this.defaultFadeOutGradientColorDecorationType2dArray[colorIndex].push(
          window.createTextEditorDecorationType(colorDecorationOption),
        );
      }
      // each fade in alpha value
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
        const colorDecorationOption: ThemableDecorationRenderOptions = {
          color: mixedColor,
        };
        this.defaultFadeInGradientColorDecorationType2dArray[colorIndex].push(
          window.createTextEditorDecorationType(colorDecorationOption),
        );
      }
    }
    this.semanticToFadeOutGradientColorDecorationType2dArray.set(
      DEFAULT_SEMANTIC_KEY,
      this.defaultFadeOutGradientColorDecorationType2dArray,
    );
    this.semanticToFadeInGradientColorDecorationType2dArray.set(
      DEFAULT_SEMANTIC_KEY,
      this.defaultFadeInGradientColorDecorationType2dArray,
    );

    // * Fade Out & Fade In Gradient Common Color
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
      const fadeInGradientCommonColorDecorationTypes: TextEditorDecorationType[] =
        [];
      // each fade out alpha value
      for (
        let stepIndex = 0;
        stepIndex < fadeOutGradientSteps.length;
        stepIndex++
      ) {
        const alpha = fadeOutGradientSteps[stepIndex];
        const mixedColor = colorAlphaMixing(
          commonColor,
          foregroundColor,
          alpha,
        );
        if (mixedColor === null) {
          throw new Error("Mixed color is null");
        }
        const colorDecorationOption: ThemableDecorationRenderOptions = {
          color: mixedColor,
        };
        fadeOutGradientCommonColorDecorationTypes.push(
          window.createTextEditorDecorationType(colorDecorationOption),
        );
      }
      // each fade in alpha value
      for (
        let stepIndex = 0;
        stepIndex < fadeInGradientSteps.length;
        stepIndex++
      ) {
        const alpha = fadeInGradientSteps[stepIndex];
        const mixedColor = colorAlphaMixing(
          commonColor,
          foregroundColor,
          alpha,
        );
        if (mixedColor === null) {
          throw new Error("Mixed color is null");
        }
        const colorDecorationOption: ThemableDecorationRenderOptions = {
          color: mixedColor,
        };
        fadeInGradientCommonColorDecorationTypes.push(
          window.createTextEditorDecorationType(colorDecorationOption),
        );
      }

      this.semanticToFadeOutGradientCommonColorDecorationTypes.set(
        semanticKey,
        fadeOutGradientCommonColorDecorationTypes,
      );
      this.semanticToFadeInGradientCommonColorDecorationTypes.set(
        semanticKey,
        fadeInGradientCommonColorDecorationTypes,
      );
    }

    // default semantic gradient common color
    this.defaultFadeOutGradientCommonColorDecorationTypes = [];
    this.defaultFadeInGradientCommonColorDecorationTypes = [];
    // each fade out alpha value
    for (
      let stepIndex = 0;
      stepIndex < fadeOutGradientSteps.length;
      stepIndex++
    ) {
      const alpha = fadeOutGradientSteps[stepIndex];
      const mixedColor = colorAlphaMixing(
        commonColor,
        defaultSemanticForegroundColor,
        alpha,
      );
      if (mixedColor === null) {
        throw new Error("Mixed color is null");
      }
      const colorDecorationOption: ThemableDecorationRenderOptions = {
        color: mixedColor,
      };
      this.defaultFadeOutGradientCommonColorDecorationTypes.push(
        window.createTextEditorDecorationType(colorDecorationOption),
      );
    }
    // each fade in alpha value
    for (
      let stepIndex = 0;
      stepIndex < fadeInGradientSteps.length;
      stepIndex++
    ) {
      const alpha = fadeInGradientSteps[stepIndex];
      const mixedColor = colorAlphaMixing(
        commonColor,
        defaultSemanticForegroundColor,
        alpha,
      );
      if (mixedColor === null) {
        throw new Error("Mixed color is null");
      }
      const colorDecorationOption: ThemableDecorationRenderOptions = {
        color: mixedColor,
      };
      this.defaultFadeInGradientCommonColorDecorationTypes.push(
        window.createTextEditorDecorationType(colorDecorationOption),
      );
    }
    this.semanticToFadeOutGradientCommonColorDecorationTypes.set(
      DEFAULT_SEMANTIC_KEY,
      this.defaultFadeOutGradientCommonColorDecorationTypes,
    );
    this.semanticToFadeInGradientCommonColorDecorationTypes.set(
      DEFAULT_SEMANTIC_KEY,
      this.defaultFadeInGradientCommonColorDecorationTypes,
    );

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

  private cleanDecorations(editor: TextEditor) {
    [
      // * Fade Out
      ...Array.from(
        this.semanticToFadeOutGradientColorDecorationType2dArray.values(),
      ).flat(2),
      ...this.defaultFadeOutGradientColorDecorationType2dArray.flat(),
      ...Array.from(
        this.semanticToFadeOutGradientCommonColorDecorationTypes.values(),
      ).flat(),
      ...this.defaultFadeOutGradientCommonColorDecorationTypes,

      // * Fade In
      ...Array.from(
        this.semanticToFadeInGradientColorDecorationType2dArray.values(),
      ).flat(2),
      ...this.defaultFadeInGradientColorDecorationType2dArray.flat(),
      ...Array.from(
        this.semanticToFadeInGradientCommonColorDecorationTypes.values(),
      ).flat(),
      ...this.defaultFadeInGradientCommonColorDecorationTypes,

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
}

export default DecorationManager;
