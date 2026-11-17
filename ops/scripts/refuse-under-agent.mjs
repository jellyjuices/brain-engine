const agentVariables = ["CLAUDECODE", "CLAUDE_CODE_ENTRYPOINT"];
const runningUnderAgent = agentVariables.some((name) => process.env[name]);

if (runningUnderAgent) {
  console.error(
    "Deploy refused: an AI helper is running this. A deploy is public. The owner runs it.",
  );
  process.exit(1);
}
