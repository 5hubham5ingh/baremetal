function NativeFunctions() {
  const args = Array.from(arguments);

  // Return different implementations based on instantiation context
  return args.map((functionName) =>
    createFunctionWrapper(
      functionName,
      crypto.randomUUID(),
      !(this instanceof NativeFunctions),
    )
  );
}
