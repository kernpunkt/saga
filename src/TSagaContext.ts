type TSagaContext = {
  log: {
    successes: string[];
    errors: (string | Error)[];
  };
};
export default TSagaContext;
