import ReactMarkdown from "react-markdown";

export default function MarkdownView({ content }: { content: string }) {
  return (
    <div className="prose prose-sm max-w-none overflow-auto h-full p-4">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}
