type Props = {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    rows?: number;
};
export default function RichTextEditor({ label, value, onChange, placeholder, rows }: Props): import("react/jsx-runtime").JSX.Element;
export {};
