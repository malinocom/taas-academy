type Props = {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
};
export default function Pagination({ page, pageSize, total, onPageChange }: Props): import("react/jsx-runtime").JSX.Element;
export {};
