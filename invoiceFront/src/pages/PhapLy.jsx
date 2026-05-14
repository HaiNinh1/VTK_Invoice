import { BookOpen, FileText, ExternalLink, AlertTriangle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

/* -----------------------------------------------------------------------
 * Page: "Pháp lý" — Spec: Prompt 16.
 *
 * Static information hub. Three sections:
 *   1. Văn bản pháp luật áp dụng  (NĐ123, TT78, NĐ132, ...)
 *   2. Hướng dẫn nội bộ            (quy trình lập đề nghị, ký số, lưu trữ)
 *   3. Cảnh báo / lưu ý             (sai sót thường gặp, mức phạt)
 * --------------------------------------------------------------------- */

const LAWS = [
  {
    code: 'NĐ 123/2020/NĐ-CP',
    title: 'Quy định về hoá đơn, chứng từ',
    note: 'Hiệu lực 01/07/2022. Khung pháp lý chính cho HĐ điện tử.',
    url: 'https://thuvienphapluat.vn/',
  },
  {
    code: 'TT 78/2021/TT-BTC',
    title: 'Hướng dẫn thực hiện NĐ 123 về hoá đơn điện tử',
    note: 'Quy định mẫu, ký hiệu, định dạng XML, mã CQT.',
    url: 'https://thuvienphapluat.vn/',
  },
  {
    code: 'NĐ 132/2020/NĐ-CP',
    title: 'Quản lý thuế đối với giao dịch liên kết',
    note: 'Lưu ý khi xuất HĐ giữa các đơn vị thuộc Viettel Group.',
    url: 'https://thuvienphapluat.vn/',
  },
  {
    code: 'Luật Quản lý thuế 38/2019/QH14',
    title: 'Quy định chung về quản lý thuế',
    note: 'Cơ sở pháp lý cao nhất cho nghiệp vụ thuế.',
    url: 'https://thuvienphapluat.vn/',
  },
]

const INTERNAL_GUIDES = [
  'Quy trình lập đề nghị xuất HĐ — VTK-QT-01',
  'Quy định ký số và lưu trữ HĐĐT — VTK-QT-02',
  'Hướng dẫn xử lý HĐ sai sót (thay thế/điều chỉnh) — VTK-HD-03',
  'Danh mục hồ sơ pháp lý theo từng loại dịch vụ — VTK-DM-04',
]

const WARNINGS = [
  'Không xuất HĐ trước khi nghiệm thu khối lượng có chữ ký CĐT.',
  'Sai sót về MST hoặc tên người mua bắt buộc xử lý theo HĐ thay thế / điều chỉnh, không huỷ tuỳ tiện.',
  'Hồ sơ phải bổ sung trong vòng 30 ngày kể từ ngày cam kết — chậm sẽ bị cảnh báo lên cấp quản lý.',
]

export default function PhapLy() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Pháp lý &amp; Hướng dẫn</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tổng hợp văn bản pháp luật, quy trình nội bộ và lưu ý quan trọng khi
          làm việc với hoá đơn điện tử tại Viettel Construction.
        </p>
      </div>

      {/* Văn bản pháp luật */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <BookOpen className="h-5 w-5 text-primary" aria-hidden />
          Văn bản pháp luật áp dụng
        </h2>
        <div className="grid gap-3 md:grid-cols-2">
          {LAWS.map(l => (
            <Card key={l.code}>
              <CardContent className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Badge variant="secondary">{l.code}</Badge>
                    <div className="mt-1 font-medium">{l.title}</div>
                  </div>
                  <a
                    href={l.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-muted-foreground hover:text-primary"
                    aria-label={`Mở ${l.code}`}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
                <p className="text-sm text-muted-foreground">{l.note}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Separator />

      {/* Hướng dẫn nội bộ */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <FileText className="h-5 w-5 text-primary" aria-hidden />
          Hướng dẫn nội bộ
        </h2>
        <Card>
          <CardContent className="p-4">
            <ul className="space-y-2 text-sm">
              {INTERNAL_GUIDES.map(g => (
                <li key={g} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
                  <span>{g}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>

      <Separator />

      {/* Cảnh báo */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <AlertTriangle className="h-5 w-5 text-amber-600" aria-hidden />
          Lưu ý quan trọng
        </h2>
        <Card>
          <CardContent className="p-4">
            <ul className="space-y-2 text-sm">
              {WARNINGS.map(w => (
                <li key={w} className="rounded-md border-l-4 border-amber-400 bg-amber-50/60 px-3 py-2 text-amber-900">
                  {w}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
