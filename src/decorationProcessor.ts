import * as vscode from "vscode";
import { REGEX_LITERAL, RENDER_PATTERN_LABEL } from "./constant";
import {
  DecorationProcessor,
  IDecorationManager,
  SemanticCodeToken,
} from "./type";
import {
  buildSetDecorationsFunctionParams,
  getPointerArray,
  pearsonHash,
  scaleHash,
  setRange3dArray,
  splitString,
} from "./util";

/* Variable naming / Term
 * - text
 * - subText
 * - token
 * - subToken
 * - *2dArray
 * - *3dArray
 */

export const renderPatternToDecorationProcessor: Record<
  string,
  DecorationProcessor | undefined
> = {
  [RENDER_PATTERN_LABEL[0]]: decorate_subText_fadeOutGradient_uniqueSubText,
  [RENDER_PATTERN_LABEL[1]]: decorate_subText_fadeOutGradient_uniqueText,
  [RENDER_PATTERN_LABEL[2]]: decorate_subText_fadeOutGradient_commonly,
  [RENDER_PATTERN_LABEL[3]]: decorate_subText_fadeInGradient_uniqueSubText,
  [RENDER_PATTERN_LABEL[4]]: decorate_subText_fadeInGradient_uniqueText,
  [RENDER_PATTERN_LABEL[5]]: decorate_subText_fadeInGradient_commonly,
  [RENDER_PATTERN_LABEL[6]]: decorate_firstCharacter_solidColor_uniqueSubText,
  [RENDER_PATTERN_LABEL[7]]: decorate_firstCharacter_solidColor_uniqueText,
  [RENDER_PATTERN_LABEL[8]]: decorate_firstCharacter_solidColor_commonly,
  [RENDER_PATTERN_LABEL[9]]: decorate_text_emoji,
  [RENDER_PATTERN_LABEL[10]]: decorate_subText_solidColor_uniqueSubText,
};

/**
 * 01. Whole sub text with fade out gradient color by hash for unique sub text
 */
export function decorate_subText_fadeOutGradient_uniqueSubText(
  codeTokens: SemanticCodeToken[],
  decorationManager: IDecorationManager,
): [vscode.TextEditorDecorationType[], vscode.Range[][]] {
  const gradientColorDecorationType2dArray =
    decorationManager.gradientColorDecorationType2dArray;
  const ignoreFirstSubToken =
    decorationManager.extensionConfig.ignoreFirstSubToken;

  const decorationRange3dArray: vscode.Range[][][] = Array.from(
    gradientColorDecorationType2dArray,
    (subArray) => Array.from(subArray, () => []),
  );
  // each token
  for (let i = 0; i < codeTokens.length; i++) {
    const token = codeTokens[i];
    const text = token.text;
    let subTextStartCounter = token.start;

    // each subText
    const subTextArr = splitString(text);
    for (let indexTwo = 0; indexTwo < subTextArr.length; indexTwo++) {
      const subText = subTextArr[indexTwo];
      const subTextLength = subText.length;
      if (
        (ignoreFirstSubToken && indexTwo === 0) ||
        subText.match(REGEX_LITERAL.UNWANTED_CHARACTERS)
      ) {
        subTextStartCounter = subTextStartCounter + subTextLength;
        continue;
      }

      const pearsonHashValue = pearsonHash(subText); // TODO (WJ): combine into one function
      const scaledHashValue = scaleHash(
        pearsonHashValue,
        gradientColorDecorationType2dArray.length - 1,
      );
      const selectedGradientColorDecorationTypes =
        gradientColorDecorationType2dArray[scaledHashValue];

      // each character
      const pointerArray = getPointerArray(subTextLength);
      for (let indexThree = 0; indexThree < subTextLength; indexThree++) {
        let gradientLevel = selectedGradientColorDecorationTypes.length - 1;
        if (indexThree < pointerArray.length) {
          gradientLevel = pointerArray[indexThree];
        }

        const range = new vscode.Range(
          token.line,
          subTextStartCounter + indexThree,
          token.line,
          subTextStartCounter + indexThree + 1,
        );
        decorationRange3dArray[scaledHashValue][gradientLevel].push(range);
      }
      subTextStartCounter = subTextStartCounter + subTextLength;
    }
  }

  const gradientColorDecorationTypes =
    gradientColorDecorationType2dArray.flat();
  const decorationRange2dArray = decorationRange3dArray.flat();
  return [gradientColorDecorationTypes, decorationRange2dArray];
}

/**
 * 02. Whole sub text with fade out gradient color by hash for unique text
 */
export function decorate_subText_fadeOutGradient_uniqueText(
  codeTokens: SemanticCodeToken[],
  decorationManager: IDecorationManager,
): [vscode.TextEditorDecorationType[], vscode.Range[][]] {
  const gradientColorDecorationType2dArray =
    decorationManager.gradientColorDecorationType2dArray;
  const ignoreFirstSubToken =
    decorationManager.extensionConfig.ignoreFirstSubToken;

  const decorationRange3dArray: vscode.Range[][][] = Array.from(
    gradientColorDecorationType2dArray,
    (subArray) => Array.from(subArray, () => []),
  );
  // each token
  for (let i = 0; i < codeTokens.length; i++) {
    const token = codeTokens[i];
    const text = token.text;
    let subTextStartCounter = token.start;
    const pearsonHashValue = pearsonHash(text);
    const scaledHashValue = scaleHash(
      pearsonHashValue,
      gradientColorDecorationType2dArray.length - 1,
    );
    const selectedGradientColorDecorationTypes =
      gradientColorDecorationType2dArray[scaledHashValue];

    // each subText
    const subTextArr = splitString(text);
    for (let indexTwo = 0; indexTwo < subTextArr.length; indexTwo++) {
      const subText = subTextArr[indexTwo];
      const subTextLength = subText.length;
      if (
        (ignoreFirstSubToken && indexTwo === 0) ||
        subText.match(REGEX_LITERAL.UNWANTED_CHARACTERS)
      ) {
        // TODO (WJ): update to using regex & cover "-"
        subTextStartCounter = subTextStartCounter + subTextLength;
        continue;
      }

      // each character
      const pointerArray = getPointerArray(subTextLength);
      for (let indexThree = 0; indexThree < subTextLength; indexThree++) {
        let gradientLevel = selectedGradientColorDecorationTypes.length - 1;
        if (indexThree < pointerArray.length) {
          gradientLevel = pointerArray[indexThree];
        }

        const range = new vscode.Range(
          token.line,
          subTextStartCounter + indexThree,
          token.line,
          subTextStartCounter + indexThree + 1,
        );
        decorationRange3dArray[scaledHashValue][gradientLevel].push(range);
      }
      subTextStartCounter = subTextStartCounter + subTextLength;
    }
  }

  const gradientColorDecorationTypes =
    gradientColorDecorationType2dArray.flat();
  const decorationRanges2dArray = decorationRange3dArray.flat();
  return [gradientColorDecorationTypes, decorationRanges2dArray];
}

/**
 * 03. Whole sub text with fade out gradient color commonly
 */
export function decorate_subText_fadeOutGradient_commonly(
  codeTokens: SemanticCodeToken[],
  decorationManager: IDecorationManager,
): [vscode.TextEditorDecorationType[], vscode.Range[][]] {
  const gradientCommonColorDecorationTypes =
    decorationManager.gradientCommonColorDecorationTypes;
  const ignoreFirstSubToken =
    decorationManager.extensionConfig.ignoreFirstSubToken;

  const decorationRange2dArray: vscode.Range[][] = Array.from(
    { length: gradientCommonColorDecorationTypes.length },
    () => [],
  );
  // each token
  for (let i = 0; i < codeTokens.length; i++) {
    const token = codeTokens[i];
    const text = token.text;
    let subTextStartCounter = token.start;

    // each subText
    const subTextArr = splitString(text);
    for (let indexTwo = 0; indexTwo < subTextArr.length; indexTwo++) {
      const subText = subTextArr[indexTwo];
      const subTextLength = subText.length;
      if (
        (ignoreFirstSubToken && indexTwo === 0) ||
        subText.match(REGEX_LITERAL.UNWANTED_CHARACTERS)
      ) {
        // TODO (WJ): update to using regex & cover "-"
        subTextStartCounter = subTextStartCounter + subTextLength;
        continue;
      }

      // each character
      const pointerArray = getPointerArray(subTextLength);
      for (let indexThree = 0; indexThree < subTextLength; indexThree++) {
        let gradientLevel = gradientCommonColorDecorationTypes.length - 1;
        if (indexThree < pointerArray.length) {
          gradientLevel = pointerArray[indexThree];
        }

        const range = new vscode.Range(
          token.line,
          subTextStartCounter + indexThree,
          token.line,
          subTextStartCounter + indexThree + 1,
        );
        decorationRange2dArray[gradientLevel].push(range);
      }
      subTextStartCounter = subTextStartCounter + subTextLength;
    }
  }

  return [gradientCommonColorDecorationTypes, decorationRange2dArray];
}

/**
 * 04. Whole sub text with fade in gradient color by hash for unique sub text
 */
export function decorate_subText_fadeInGradient_uniqueSubText(
  codeTokens: SemanticCodeToken[],
  decorationManager: IDecorationManager,
): [vscode.TextEditorDecorationType[], vscode.Range[][]] {
  const ignoreFirstSubToken =
    decorationManager.extensionConfig.ignoreFirstSubToken;

  const gradientColorSize = decorationManager.gradientColorSize;
  const gradientStepSize = decorationManager.fadeInGradientStepSize;
  const semanticToRange3dArray: Map<string, vscode.Range[][][]> = new Map();
  const semanticToDecorationType2dArray =
    decorationManager.semanticToFadeInGradientColorDecorationType2dArray;

  // each token
  for (let tokenIndex = 0; tokenIndex < codeTokens.length; tokenIndex++) {
    const token = codeTokens[tokenIndex];
    const text = token.text;
    const tokenType = token.tokenType;
    const modifiers = token.tokenModifiers;
    let subTextStartCounter = token.start;
    const [semanticKey, selectedDecorationType2dArray] =
      decorationManager.getKeyAndFadeInGradientColorDecorationType2dArray(
        tokenType,
        modifiers,
      );

    // each subText
    const subTextArr = splitString(text);
    for (
      let subTextIndex = 0;
      subTextIndex < subTextArr.length;
      subTextIndex++
    ) {
      const subText = subTextArr[subTextIndex];
      const subTextLength = subText.length;
      if (
        (ignoreFirstSubToken && subTextIndex === 0) ||
        subText.match(REGEX_LITERAL.UNWANTED_CHARACTERS)
      ) {
        subTextStartCounter = subTextStartCounter + subTextLength;
        continue;
      }

      const pearsonHashValue = pearsonHash(subText);
      const scaledHashValue = scaleHash(
        pearsonHashValue,
        gradientColorSize - 1,
      );
      const selectedColorDecorationTypes =
        selectedDecorationType2dArray[scaledHashValue];

      // each character
      const pointerArray = getPointerArray(subTextLength);
      for (let indexThree = 0; indexThree < subTextLength; indexThree++) {
        let gradientLevel = 0;
        if (indexThree < pointerArray.length) {
          gradientLevel =
            selectedColorDecorationTypes.length - pointerArray[indexThree] - 1;
        }
        const range = new vscode.Range(
          token.line,
          subTextStartCounter + indexThree,
          token.line,
          subTextStartCounter + indexThree + 1,
        );
        setRange3dArray(
          semanticToRange3dArray,
          semanticKey,
          scaledHashValue,
          gradientLevel,
          range,
          gradientColorSize,
          gradientStepSize,
        );
      }
      subTextStartCounter = subTextStartCounter + subTextLength;
    }
  }

  return buildSetDecorationsFunctionParams(
    semanticToDecorationType2dArray,
    semanticToRange3dArray,
    gradientColorSize,
    gradientStepSize,
  );
}

/**
 * 05. Whole sub text with fade in gradient color by hash for unique text
 */
export function decorate_subText_fadeInGradient_uniqueText(
  codeTokens: SemanticCodeToken[],
  decorationManager: IDecorationManager,
): [vscode.TextEditorDecorationType[], vscode.Range[][]] {
  const ignoreFirstSubToken =
    decorationManager.extensionConfig.ignoreFirstSubToken;

  const gradientColorSize = decorationManager.gradientColorSize;
  const gradientStepSize = decorationManager.fadeInGradientStepSize;
  const semanticToRange3dArray: Map<string, vscode.Range[][][]> = new Map();
  const semanticToDecorationType2dArray =
    decorationManager.semanticToFadeInGradientColorDecorationType2dArray;

  // each token
  for (let tokenIndex = 0; tokenIndex < codeTokens.length; tokenIndex++) {
    const token = codeTokens[tokenIndex];
    const text = token.text;
    const tokenType = token.tokenType;
    const modifiers = token.tokenModifiers;
    let subTextStartCounter = token.start;
    const [semanticKey, selectedDecorationType2dArray] =
      decorationManager.getKeyAndFadeInGradientColorDecorationType2dArray(
        tokenType,
        modifiers,
      );

    const pearsonHashValue = pearsonHash(text);
    const scaledHashValue = scaleHash(pearsonHashValue, gradientColorSize - 1);
    const selectedColorDecorationTypes =
      selectedDecorationType2dArray[scaledHashValue];

    // each subText
    const subTextArr = splitString(text);
    for (
      let subTextIndex = 0;
      subTextIndex < subTextArr.length;
      subTextIndex++
    ) {
      const subText = subTextArr[subTextIndex];
      const subTextLength = subText.length;
      if (
        (ignoreFirstSubToken && subTextIndex === 0) ||
        subText.match(REGEX_LITERAL.UNWANTED_CHARACTERS)
      ) {
        subTextStartCounter = subTextStartCounter + subTextLength;
        continue;
      }

      // each character
      const pointerArray = getPointerArray(subTextLength);
      for (let indexThree = 0; indexThree < subTextLength; indexThree++) {
        let gradientLevel = 0;
        if (indexThree < pointerArray.length) {
          gradientLevel =
            selectedColorDecorationTypes.length - pointerArray[indexThree] - 1;
        }
        const range = new vscode.Range(
          token.line,
          subTextStartCounter + indexThree,
          token.line,
          subTextStartCounter + indexThree + 1,
        );
        setRange3dArray(
          semanticToRange3dArray,
          semanticKey,
          scaledHashValue,
          gradientLevel,
          range,
          gradientColorSize,
          gradientStepSize,
        );
      }
      subTextStartCounter = subTextStartCounter + subTextLength;
    }
  }

  return buildSetDecorationsFunctionParams(
    semanticToDecorationType2dArray,
    semanticToRange3dArray,
    gradientColorSize,
    gradientStepSize,
  );
}

/**
 * 06. Whole sub text with fade in gradient color commonly
 */
export function decorate_subText_fadeInGradient_commonly(
  codeTokens: SemanticCodeToken[],
  decorationManager: IDecorationManager,
): [vscode.TextEditorDecorationType[], vscode.Range[][]] {
  const gradientCommonColorDecorationTypes =
    decorationManager.gradientCommonColorDecorationTypes;
  const ignoreFirstSubToken =
    decorationManager.extensionConfig.ignoreFirstSubToken;

  const decorationRange2dArray: vscode.Range[][] = Array.from(
    { length: gradientCommonColorDecorationTypes.length },
    () => [],
  );
  // each token
  for (let tokenIndex = 0; tokenIndex < codeTokens.length; tokenIndex++) {
    const token = codeTokens[tokenIndex];
    const text = token.text;
    let subTextStartCounter = token.start;

    // each subText
    const subTextArr = splitString(text);
    for (
      let subTextIndex = 0;
      subTextIndex < subTextArr.length;
      subTextIndex++
    ) {
      const subText = subTextArr[subTextIndex];
      const subTextLength = subText.length;
      if (
        (ignoreFirstSubToken && subTextIndex === 0) ||
        subText.match(REGEX_LITERAL.UNWANTED_CHARACTERS)
      ) {
        subTextStartCounter = subTextStartCounter + subTextLength;
        continue;
      }

      // each character
      const pointerArray = getPointerArray(subTextLength);
      for (let indexThree = 0; indexThree < subTextLength; indexThree++) {
        let gradientLevel = 0;
        if (indexThree < pointerArray.length) {
          gradientLevel =
            gradientCommonColorDecorationTypes.length -
            pointerArray[indexThree] -
            1;
        }
        const range = new vscode.Range(
          token.line,
          subTextStartCounter + indexThree,
          token.line,
          subTextStartCounter + indexThree + 1,
        );
        decorationRange2dArray[gradientLevel].push(range);
      }
      subTextStartCounter = subTextStartCounter + subTextLength;
    }
  }

  return [gradientCommonColorDecorationTypes, decorationRange2dArray];
}

/**
 * 07. First character of sub text with solid color by hash for unique sub text
 */
export function decorate_firstCharacter_solidColor_uniqueSubText(
  codeTokens: SemanticCodeToken[],
  decorationManager: IDecorationManager,
): [vscode.TextEditorDecorationType[], vscode.Range[][]] {
  const solidColorDecorationTypes = decorationManager.solidColorDecorationTypes;
  const ignoreFirstSubToken =
    decorationManager.extensionConfig.ignoreFirstSubToken;

  const decorationRange2dArray: vscode.Range[][] = Array.from(
    { length: solidColorDecorationTypes.length },
    () => [],
  );
  // each token
  for (let i = 0; i < codeTokens.length; i++) {
    const token = codeTokens[i];
    const text = token.text;
    let subTextStartCounter = token.start;

    // each subText
    const subTextArr = splitString(text);
    for (let indexTwo = 0; indexTwo < subTextArr.length; indexTwo++) {
      const subText = subTextArr[indexTwo];
      const subTextLength = subText.length;
      if (
        (ignoreFirstSubToken && indexTwo === 0) ||
        subText.match(REGEX_LITERAL.UNWANTED_CHARACTERS)
      ) {
        // TODO (WJ): update to using regex & cover "-"
        subTextStartCounter = subTextStartCounter + subTextLength;
        continue;
      }

      const pearsonHashValue = pearsonHash(subText);
      const scaledHashValue = scaleHash(
        pearsonHashValue,
        solidColorDecorationTypes.length - 1,
      );
      const range = new vscode.Range(
        token.line,
        subTextStartCounter,
        token.line,
        subTextStartCounter + 1,
      );
      decorationRange2dArray[scaledHashValue].push(range);

      subTextStartCounter = subTextStartCounter + subTextLength;
    }
  }

  return [solidColorDecorationTypes, decorationRange2dArray];
}

/**
 * 08. First character of sub text with solid color by hash for unique text
 */
export function decorate_firstCharacter_solidColor_uniqueText(
  codeTokens: SemanticCodeToken[],
  decorationManager: IDecorationManager,
): [vscode.TextEditorDecorationType[], vscode.Range[][]] {
  const solidColorDecorationTypes = decorationManager.solidColorDecorationTypes;

  const decorationRange2dArray: vscode.Range[][] = Array.from(
    { length: solidColorDecorationTypes.length },
    () => [],
  );
  // each token
  for (let i = 0; i < codeTokens.length; i++) {
    const token = codeTokens[i];
    const text = token.text;
    let subTextStartCounter = token.start;
    const pearsonHashValue = pearsonHash(text);
    const scaledHashValue = scaleHash(
      pearsonHashValue,
      solidColorDecorationTypes.length - 1,
    );

    // each subText
    const subTextArr = splitString(text);
    for (let indexTwo = 0; indexTwo < subTextArr.length; indexTwo++) {
      const subText = subTextArr[indexTwo];
      const subTextLength = subText.length;
      if (subText.match(REGEX_LITERAL.UNWANTED_CHARACTERS)) {
        // TODO (WJ): update to using regex & cover "-"
        subTextStartCounter = subTextStartCounter + subTextLength;
        continue;
      }

      const range = new vscode.Range(
        token.line,
        subTextStartCounter,
        token.line,
        subTextStartCounter + 1,
      );
      decorationRange2dArray[scaledHashValue].push(range);

      subTextStartCounter = subTextStartCounter + subTextLength;
    }
  }

  return [solidColorDecorationTypes, decorationRange2dArray];
}

/**
 * 09. First character of sub text with solid color commonly
 */
export function decorate_firstCharacter_solidColor_commonly(
  codeTokens: SemanticCodeToken[],
  decorationManager: IDecorationManager,
): [vscode.TextEditorDecorationType[], vscode.Range[][]] {
  const solidCommonColorDecorationType =
    decorationManager.solidCommonColorDecorationType;
  const ignoreFirstSubToken =
    decorationManager.extensionConfig.ignoreFirstSubToken;

  const decorationRanges: vscode.Range[] = [];
  // each token
  for (let i = 0; i < codeTokens.length; i++) {
    const token = codeTokens[i];
    const text = token.text;
    let subTextStartCounter = token.start;

    // each subText
    const subTextArr = splitString(text);
    for (let indexTwo = 0; indexTwo < subTextArr.length; indexTwo++) {
      const subText = subTextArr[indexTwo];
      const subTextLength = subText.length;
      if (
        (ignoreFirstSubToken && indexTwo === 0) ||
        subText.match(REGEX_LITERAL.UNWANTED_CHARACTERS)
      ) {
        // TODO (WJ): update to using regex & cover "-"
        subTextStartCounter = subTextStartCounter + subTextLength;
        continue;
      }

      const range = new vscode.Range(
        token.line,
        subTextStartCounter,
        token.line,
        subTextStartCounter + 1,
      );
      decorationRanges.push(range);

      subTextStartCounter = subTextStartCounter + subTextLength;
    }
  }

  return [[solidCommonColorDecorationType], [decorationRanges]];
}

/**
 * 11. Whole text with emoji prefix // TODO (WJ): change ordering to follow this
 */
export function decorate_text_emoji(
  codeTokens: SemanticCodeToken[],
  decorationManager: IDecorationManager,
): [vscode.TextEditorDecorationType[], vscode.Range[][]] {
  const decorationTypes = decorationManager.emojiDecorationTypes;

  const decorationRange2dArray: vscode.Range[][] = Array.from(
    { length: decorationTypes.length },
    () => [],
  );
  // each token
  for (let i = 0; i < codeTokens.length; i++) {
    const token = codeTokens[i];
    const text = token.text;

    // TODO (WJ): move into single function
    const pearsonHashValue = pearsonHash(text);
    const scaledHashValue = scaleHash(
      pearsonHashValue,
      decorationTypes.length - 1,
    );
    const textRange = new vscode.Range(
      token.line,
      token.start,
      token.line,
      token.start + 1,
    );
    decorationRange2dArray[scaledHashValue].push(textRange);
  }

  return [decorationTypes, decorationRange2dArray];
}

/**
 * 10. Whole sub text with solid color by hash for unique sub text
 */
export function decorate_subText_solidColor_uniqueSubText(
  codeTokens: SemanticCodeToken[],
  decorationManager: IDecorationManager,
): [vscode.TextEditorDecorationType[], vscode.Range[][]] {
  const solidColorDecorationTypes = decorationManager.solidColorDecorationTypes;
  const ignoreFirstSubToken =
    decorationManager.extensionConfig.ignoreFirstSubToken;

  const decorationRange2dArray: vscode.Range[][] = Array.from(
    { length: solidColorDecorationTypes.length },
    () => [],
  );
  // each token
  for (let i = 0; i < codeTokens.length; i++) {
    const token = codeTokens[i];
    const text = token.text;
    let subTextStartCounter = token.start;

    // each subText
    const subTextArr = splitString(text);
    for (let indexTwo = 0; indexTwo < subTextArr.length; indexTwo++) {
      const subText = subTextArr[indexTwo];
      const subTextLength = subText.length;
      if (
        (ignoreFirstSubToken && indexTwo === 0) ||
        subText.match(REGEX_LITERAL.UNWANTED_CHARACTERS)
      ) {
        // TODO (WJ): update to using regex & cover "-"
        subTextStartCounter = subTextStartCounter + subTextLength;
        continue;
      }

      const pearsonHashValue = pearsonHash(subText);
      const scaledHashValue = scaleHash(
        pearsonHashValue,
        solidColorDecorationTypes.length - 1,
      );
      const range = new vscode.Range(
        token.line,
        subTextStartCounter,
        token.line,
        subTextStartCounter + subTextLength,
      );
      decorationRange2dArray[scaledHashValue].push(range);

      subTextStartCounter = subTextStartCounter + subTextLength;
    }
  }

  return [solidColorDecorationTypes, decorationRange2dArray];
}
