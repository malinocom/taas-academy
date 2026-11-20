import { Link } from "react-router-dom";
import Container from "../components/Container";
import Card from "../components/Card";

export default function NotFound() {
  return (
    <div className="py-14 page-enter">
      <Container>
        <div className="max-w-xl mx-auto">
          <Card className="text-center">
            <div className="text-7xl font-extrabold opacity-30">404</div>
            <div className="mt-3 text-xl font-bold">صفحه پیدا نشد</div>
            <p className="mt-3 text-sm text-muted leading-7">
              آدرسی که زدی وجود ندارد یا منتقل شده است.
            </p>
            <div className="mt-6">
              <Link to="/" className="btn-primary">
                بازگشت به خانه
              </Link>
            </div>
          </Card>
        </div>
      </Container>
    </div>
  );
}
