import { useState } from "react";

type Props = {
  url: string;
  className?: string;
};

/**
 * Use the browser's native PDF viewer instead of a remote PDF.js worker.
 * This avoids version mismatches, CDN worker failures and blank canvases on mobile.
 */
export default function PdfReader({ url, className = "" }: Props) {
  const [failed, setFailed] = useState(false);

  if (!url) {
    return (
      <div className={`pdf-reader-empty ${className}`} role="status">
        فایل PDF برای این بخش ثبت نشده است.
      </div>
    );
  }

  return (
    <div className={`pdf-reader ${className}`}>
      <div className="pdf-reader-toolbar">
        <span>نمایش فایل PDF</span>
        <div className="flex items-center gap-2">
          <a className="btn-ghost" href={url} target="_blank" rel="noreferrer">باز کردن در صفحه جدید</a>
          <a className="btn-primary" href={url} target="_blank" rel="noreferrer" download>دانلود PDF</a>
        </div>
      </div>
      {!failed ? (
        <iframe
          key={url}
          src={`${url}${url.includes("#") ? "&" : "#"}toolbar=1&navpanes=0&view=FitH`}
          title="نمایشگر فایل PDF"
          className="pdf-reader-frame"
          loading="lazy"
          onError={() => setFailed(true)}
          allow="fullscreen"
        />
      ) : null}
      <div className="pdf-reader-fallback">
        اگر پیش‌نمایش در دستگاه شما باز نشد، از دکمه «باز کردن در صفحه جدید» یا «دانلود PDF» استفاده کنید.
      </div>
    </div>
  );
}
