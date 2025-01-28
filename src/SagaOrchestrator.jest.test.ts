import SagaOrchestrator from './SagaOrchestrator';
import ISagaStep from './ISagaStep';
import TSagaContext from './TSagaContext';

type TStringArrayContext = TSagaContext & {
  payload: string[];
};
class NumberedStep implements ISagaStep<TStringArrayContext> {
  constructor(private key: string) {}
  getKey(): string {
    return this.key;
  }
  async execute(context: TStringArrayContext): Promise<TStringArrayContext> {
    context.payload.push(this.getKey());
    return context;
  }
  async rollback(context: TStringArrayContext): Promise<TStringArrayContext> {
    context.payload = context.payload.filter((e) => e !== this.getKey());
    return context;
  }
}
class ThrowingStep implements ISagaStep<TStringArrayContext> {
  constructor(private shouldRollback = false) {}
  getKey(): string {
    return 'throwing';
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async execute(context: TStringArrayContext): Promise<TStringArrayContext> {
    throw new Error('I always throw');
  }
  async rollback(context: TStringArrayContext): Promise<TStringArrayContext> {
    context.payload.push("I'm rolling myself back");
    return context;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  shouldRollbackSelf(context: TStringArrayContext): boolean {
    return this.shouldRollback;
  }
}
let saga: SagaOrchestrator<TStringArrayContext>;

describe('AbstractSaga', () => {
  beforeEach(() => {
    saga = new SagaOrchestrator<TStringArrayContext>({
      payload: [],
      log: { successes: [], errors: [] },
    });
  });
  it('should add a step', () => {
    saga.addStep(new NumberedStep('1'));
    const steps = saga.getSteps();
    expect(steps.length).toBe(1);
    expect(steps[0].getKey()).toBe('1');
  });
  it('should throw an error if adding a duplicate step', () => {
    saga.addStep(new NumberedStep('1'));
    expect(() => saga.addStep(new NumberedStep('1'))).toThrow('Duplicate step key: 1');
  });
  it('can find a step', () => {
    saga.addStep(new NumberedStep('1')).addStep(new NumberedStep('2'));
    const step = saga.findStep('2');
    expect(step).toBeDefined();
    expect(step?.getKey()).toBe('2');
  });
  it('executes steps in order', async () => {
    saga.addStep(new NumberedStep('1')).addStep(new NumberedStep('2'));
    const result = await saga.orchestrate();
    expect(result.payload).toEqual(['1', '2']);
  });
  describe('rollback', () => {
    it('if an error occurs, the Error objects gets pushed onto the stack', async () => {
      saga.addStep(new NumberedStep('1')).addStep(new ThrowingStep());
      const result = await saga.orchestrate();
      expect(result.log.errors.some((e) => e instanceof Error)).toBe(true);
    });
    it('rolls back steps in reverse order', async () => {
      saga
        .addStep(new NumberedStep('1'))
        .addStep(new NumberedStep('2'))
        .addStep(new ThrowingStep());
      const result = await saga.orchestrate();
      expect(result.payload).toEqual([]);
      expect(saga.getErrorMessageBySubstring('Error occured during step "throwing"'));
      expect(saga.getErrorMessageBySubstring('Rolling back step "2"'));
      expect(saga.getErrorMessageBySubstring('Rolling back step "1"'));
      expect(saga.getErrorMessageBySubstring('Rollback complete.'));
    });
    it('steps can mark themselves so they are also rolled back', async () => {
      saga
        .addStep(new NumberedStep('1'))
        .addStep(new NumberedStep('2'))
        .addStep(new ThrowingStep(true));
      const result = await saga.orchestrate();
      expect(saga.getErrorMessageBySubstring('Error occured during step "throwing"')).toBeDefined();
      expect(saga.getErrorMessageBySubstring('Rolling back step "throwing"')).toBeDefined();
      expect(saga.getErrorMessageBySubstring('Rolling back step "2"'));
      expect(saga.getErrorMessageBySubstring('Rolling back step "1"'));
      expect(saga.getErrorMessageBySubstring('Rollback complete.'));
      expect(result.payload).toContain("I'm rolling myself back");
    });
  });
});
