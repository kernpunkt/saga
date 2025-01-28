/**
 * Interface for a saga step
 *
 * @author Joern Meyer <joern.meyer@kernpunkt.de>
 */
interface ISagaStep<T> {
  /**
   * Provide a string identifying your step
   * @returns string
   */
  getKey: () => string;
  /**
   * Do something with the context and return it
   */
  execute: (context: T) => Promise<T>;
  /**
   * Undo the steps of the execute method
   */
  rollback: (context: T) => Promise<T>;
  /**
   * Provide a function that returns a boolean to determine whether this
   * step should be rolled back if an error occurs during it, or just the previous steps.
   *
   * @param context
   * @returns boolean
   */
  shouldRollbackSelf?: (context: T) => boolean;
}
export default ISagaStep;
