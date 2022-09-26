import type { ClassNames } from '@livekit/components-styles/dist/types/styles.css';

/**
 * Base interface for component setup functions.
 */
interface BaseSetupReturnType {
  /**
   * CSS class name to pass to the HTML element.
   */
  className: ClassNames;
}

export { BaseSetupReturnType };
