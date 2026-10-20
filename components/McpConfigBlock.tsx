export default function McpConfigBlock() {
  const config = `{
  "mcpServers": {
    "nutrient-dws": {
      "command": "npx",
      "args": ["-y", "@nutrient-sdk/dws-mcp-server", "--sandbox", "./documents"],
      "env": {
        "SANDBOX_PATH": "./documents",
        "NUTRIENT_DWS_API_KEY": "YOUR_KEY"
      }
    }
  }
}`;
  return (
    <pre className="bg-gray-900 text-green-400 p-4 rounded overflow-auto text-sm">
      <code>{config}</code>
    </pre>
  );
}
