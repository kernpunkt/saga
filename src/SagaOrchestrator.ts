import ISagaStep from './ISagaStep';
import TSagaContext from './TSagaContext';

/**
 * SagaOrchestrator manages the execution of a series of steps (sagas) in a defined order.
 * It ensures that each step is executed in sequence and handles errors by attempting to rollback the executed steps.
 * When instancing, you must provide the initial context for the saga, which will hold all information needed by 
 * or produced by the steps.
 *
 * @author Joern Meyer <joern.meyer@kernpunkt.de>
 */
export default class SagaOrchestrator<T extends TSagaContext> {
  /**
   * The steps to be executed by the orchestrator.
   */
  protected steps: ISagaStep<T>[] = [];

  /**
   * The current step being executed.
   */
  protected currentStep: ISagaStep<T> | undefined;

  /**
   * @param context
   */
  constructor(protected context: T) {}

  /**
   * Add a step to the saga. Will throw an error if a step with the same key already exists.
   * 
   * @param step ISagaStep
   * @returns 
   */
  public addStep(step: ISagaStep<T>): SagaOrchestrator<T> {
    if (this.findStep(step.getKey())) {
      throw new Error(`Duplicate step key: ${step.getKey()}`);
    }
    this.steps.push(step);
    return this;
  }

  /**
   * @returns ISagaStep<T>[]
   */
  public getSteps(): ISagaStep<T>[] {
    return this.steps;
  }

  /**
   * @param key string
   * @returns ISagaStep<T> | undefined
   */
  public findStep(key: string): ISagaStep<T> | undefined {
    return this.steps.find((step) => step.getKey() === key);
  }

  /**
   * Pass the context to each step in turn, executing the step's execute method.
   * If an error occurs, it gets added the log, and the orchestrator will attempt to rollback the executed steps.
   * 
   * @returns Promise<T>
   */
  async orchestrate(): Promise<T> {
    try {
      for (const step of this.steps) {
        this.currentStep = step;
        this.context = await step.execute(this.context);
        this.context.log.successes.push(`Step ${step.getKey()} completed successfully.`);
      }
    } catch (e: any) {
      if (this.currentStep) {
        this.context.log.errors.push(
          `Error occured during step "${this.currentStep.getKey()}": ${e.message} Attempting rollbacks...`,
        );
        this.context.log.errors.push(e);
        const currentIndex = [...this.steps].indexOf(this.currentStep);
        const index =
          typeof this.currentStep.shouldRollbackSelf === 'function' &&
          this.currentStep.shouldRollbackSelf(this.context)
            ? currentIndex + 1
            : currentIndex;

        const stepsToRollback = [...this.steps].slice(0, index).reverse();
        stepsToRollback.forEach(async (step) => {
          this.context.log.errors.push(`Rolling back step "${step.getKey()}"`);
          try {
            this.context = await step.rollback(this.context);
          } catch (e) {
            this.context.log.errors.push(`Error occured during rollback of step ${step.getKey()}`);
          }
        });
        this.context.log.errors.push('Rollback complete.');
      } else {
        throw e;
      }
    }
    return this.context;
  }

  /**
   * Helper function.
   * 
   * @param substring string
   * @returns string | undefined
   */
  public getErrorMessageBySubstring(substring: string): string | undefined {
    return this.context.log.errors.find((error) => error.toString().includes(substring)) as
      | string
      | undefined;
  }
}
