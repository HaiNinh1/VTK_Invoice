import { 
  SignaturePreview, 
  SignatureStamp, 
  NoSignatureWarning, 
  SignatureSetupButton 
} from './signature';

export default function SignatureShowcase() {
  // Sample signature URL for demonstration
  const sampleSignatureUrl = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYwIiBoZWlnaHQ9IjYwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Ik0yMCAzMCBRIDQwIDEwLCA2MCAzMCBUIjgwIDQwIEwgMTAwIDIwIE0gMTA1IDMwIEwgMTQwIDMwIiBzdHJva2U9IiMwMDAiIHN0cm9rZS13aWR0aD0iMiIgZmlsbD0ibm9uZSIvPjwvc3ZnPg==';

  return (
    <div className="p-8 space-y-12 bg-[#F9FAFB] min-h-screen">
      <div>
        <h1 className="text-2xl font-semibold text-[#111827] mb-2">Hệ thống chữ ký số</h1>
        <p className="text-sm text-[#6B7280]">Bộ component chữ ký số cho VTK Invoice System</p>
      </div>

      {/* 1. SIGNATURE PREVIEW */}
      <section className="bg-white rounded-xl border border-[#E5E7EB] p-6">
        <h2 className="text-lg font-semibold text-[#111827] mb-4">1. Signature Preview</h2>
        <p className="text-sm text-[#6B7280] mb-6">
          Hiển thị chữ ký chỉ đọc trong phê duyệt và cam kết
        </p>

        <div className="space-y-6">
          <div>
            <div className="text-sm font-medium text-[#374151] mb-3">Variant: Default (200×60px)</div>
            <SignaturePreview signatureUrl={sampleSignatureUrl} />
          </div>

          <div>
            <div className="text-sm font-medium text-[#374151] mb-3">Variant: With Info (320×80px)</div>
            <SignaturePreview 
              variant="with-info"
              signatureUrl={sampleSignatureUrl}
              signerName="Nguyễn Văn A"
              signerTitle="Chuyên viên"
              signerDepartment="P. Kỹ thuật Công nghệ"
              timestamp="13/03/2026 10:15:42"
            />
          </div>

          <div>
            <div className="text-sm font-medium text-[#374151] mb-3">Without signature (empty state)</div>
            <SignaturePreview variant="default" />
          </div>
        </div>
      </section>

      {/* 2. SIGNATURE STAMP */}
      <section className="bg-white rounded-xl border border-[#E5E7EB] p-6">
        <h2 className="text-lg font-semibold text-[#111827] mb-4">2. Signature Stamp</h2>
        <p className="text-sm text-[#6B7280] mb-6">
          Dấu chữ ký nhỏ gọn dùng trong timeline/audit trail (120×35px)
        </p>

        <div className="flex flex-wrap gap-3">
          <SignatureStamp signatureUrl={sampleSignatureUrl} />
          <SignatureStamp signatureUrl={sampleSignatureUrl} />
          <SignatureStamp signatureUrl={sampleSignatureUrl} />
        </div>

        <div className="mt-6 p-4 bg-[#F9FAFB] rounded-lg">
          <div className="text-xs font-semibold text-[#6B7280] mb-3 uppercase">Ví dụ sử dụng trong timeline</div>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-[#16A34A] rounded-full"></div>
              <div className="flex-1">
                <div className="text-sm text-[#374151]">Đã phê duyệt</div>
                <div className="text-xs text-[#6B7280] mt-1">13/03/2026 14:30</div>
                <div className="mt-2">
                  <SignatureStamp signatureUrl={sampleSignatureUrl} />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-[#16A34A] rounded-full"></div>
              <div className="flex-1">
                <div className="text-sm text-[#374151]">Đã tạo cam kết</div>
                <div className="text-xs text-[#6B7280] mt-1">13/03/2026 10:15</div>
                <div className="mt-2">
                  <SignatureStamp signatureUrl={sampleSignatureUrl} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. NO-SIGNATURE WARNING */}
      <section className="bg-white rounded-xl border border-[#E5E7EB] p-6">
        <h2 className="text-lg font-semibold text-[#111827] mb-4">3. No-Signature Warning</h2>
        <p className="text-sm text-[#6B7280] mb-6">
          Cảnh báo khi người dùng chưa thiết lập chữ ký
        </p>

        <div className="space-y-6">
          <div>
            <div className="text-sm font-medium text-[#374151] mb-3">Variant: Inline (single line)</div>
            <NoSignatureWarning 
              variant="inline"
              onSetup={() => alert('Chuyển đến trang thiết lập chữ ký')}
            />
          </div>

          <div>
            <div className="text-sm font-medium text-[#374151] mb-3">Variant: Card (320×80px với CTA)</div>
            <NoSignatureWarning 
              variant="card"
              onSetup={() => alert('Chuyển đến trang thiết lập chữ ký')}
            />
          </div>

          <div>
            <div className="text-sm font-medium text-[#374151] mb-3">Variant: Modal Blocker</div>
            <NoSignatureWarning 
              variant="modal"
            />
          </div>
        </div>
      </section>

      {/* 4. SIGNATURE SETUP BUTTON */}
      <section className="bg-white rounded-xl border border-[#E5E7EB] p-6">
        <h2 className="text-lg font-semibold text-[#111827] mb-4">4. Signature Setup Button</h2>
        <p className="text-sm text-[#6B7280] mb-6">
          Nút thiết lập/thay đổi chữ ký với 2 trạng thái
        </p>

        <div className="space-y-6">
          <div>
            <div className="text-sm font-medium text-[#374151] mb-3">State: Chưa có chữ ký (primary + pulse)</div>
            <SignatureSetupButton 
              hasSignature={false}
              onClick={() => alert('Mở modal thiết lập chữ ký')}
            />
          </div>

          <div>
            <div className="text-sm font-medium text-[#374151] mb-3">State: Đã có chữ ký (outline)</div>
            <SignatureSetupButton 
              hasSignature={true}
              onClick={() => alert('Mở modal thay đổi chữ ký')}
            />
          </div>
        </div>
      </section>

      {/* USAGE EXAMPLES */}
      <section className="bg-white rounded-xl border border-[#E5E7EB] p-6">
        <h2 className="text-lg font-semibold text-[#111827] mb-4">Ví dụ sử dụng kết hợp</h2>
        <p className="text-sm text-[#6B7280] mb-6">
          Các component phối hợp trong các trường hợp thực tế
        </p>

        <div className="space-y-8">
          {/* Example 1: Approval Modal */}
          <div className="border border-[#E5E7EB] rounded-lg p-6">
            <div className="text-sm font-semibold text-[#374151] mb-4">Phê duyệt đề nghị</div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-2">
                  Chữ ký xác nhận <span className="text-[#DC2626]">*</span>
                </label>
                <SignaturePreview 
                  variant="with-info"
                  signatureUrl={sampleSignatureUrl}
                  signerName="Hoàng Văn E"
                  signerTitle="Trưởng phòng"
                  signerDepartment="P. Kế toán"
                  timestamp="Sẽ ký vào: 13/03/2026 15:24"
                />
                <div className="flex items-center gap-1 text-[10px] text-[#9CA3AF] mt-2">
                  <span>🔒 Chữ ký được lấy từ tài khoản cá nhân</span>
                </div>
              </div>
              <button className="w-full h-11 bg-[#16A34A] text-white rounded-lg text-sm font-medium hover:bg-[#15803D]">
                Xác nhận phê duyệt
              </button>
            </div>
          </div>

          {/* Example 2: No Signature State */}
          <div className="border border-[#E5E7EB] rounded-lg p-6">
            <div className="text-sm font-semibold text-[#374151] mb-4">Chưa có chữ ký số</div>
            <div className="space-y-4">
              <NoSignatureWarning 
                variant="card"
                onSetup={() => alert('Chuyển đến trang thiết lập')}
              />
              <button 
                disabled
                className="w-full h-11 bg-[#E5E7EB] text-[#9CA3AF] rounded-lg text-sm font-medium cursor-not-allowed"
              >
                Xác nhận phê duyệt (Cần thiết lập chữ ký trước)
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* TECHNICAL SPECS */}
      <section className="bg-white rounded-xl border border-[#E5E7EB] p-6">
        <h2 className="text-lg font-semibold text-[#111827] mb-4">Thông số kỹ thuật</h2>
        
        <div className="space-y-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E5E7EB]">
                  <th className="text-left py-3 px-4 font-semibold text-[#374151]">Component</th>
                  <th className="text-left py-3 px-4 font-semibold text-[#374151]">Size</th>
                  <th className="text-left py-3 px-4 font-semibold text-[#374151]">Props</th>
                  <th className="text-left py-3 px-4 font-semibold text-[#374151]">Usage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                <tr>
                  <td className="py-3 px-4 font-medium text-[#111827]">SignaturePreview</td>
                  <td className="py-3 px-4 text-[#6B7280]">200×60px / 320×80px</td>
                  <td className="py-3 px-4 text-[#6B7280]">variant, signatureUrl, signerName, signerTitle, signerDepartment, timestamp</td>
                  <td className="py-3 px-4 text-[#6B7280]">Approval, commitment forms</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-[#111827]">SignatureStamp</td>
                  <td className="py-3 px-4 text-[#6B7280]">120×35px</td>
                  <td className="py-3 px-4 text-[#6B7280]">signatureUrl</td>
                  <td className="py-3 px-4 text-[#6B7280]">Timeline, audit trail</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-[#111827]">NoSignatureWarning</td>
                  <td className="py-3 px-4 text-[#6B7280]">Variable / 320×80px</td>
                  <td className="py-3 px-4 text-[#6B7280]">variant, onSetup</td>
                  <td className="py-3 px-4 text-[#6B7280]">Warnings, alerts</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-[#111827]">SignatureSetupButton</td>
                  <td className="py-3 px-4 text-[#6B7280]">Auto (h-10)</td>
                  <td className="py-3 px-4 text-[#6B7280]">hasSignature, onClick</td>
                  <td className="py-3 px-4 text-[#6B7280]">Settings page</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="bg-[#F9FAFB] rounded-lg p-4">
            <div className="text-xs font-semibold text-[#374151] mb-2 uppercase">Design Tokens</div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[#6B7280]">Border radius:</span>
                <span className="ml-2 font-mono text-[#111827]">6px - 8px</span>
              </div>
              <div>
                <span className="text-[#6B7280]">Lock icon size:</span>
                <span className="ml-2 font-mono text-[#111827]">10px - 12px</span>
              </div>
              <div>
                <span className="text-[#6B7280]">Font family:</span>
                <span className="ml-2 font-mono text-[#111827]">font-serif italic</span>
              </div>
              <div>
                <span className="text-[#6B7280]">Warning color:</span>
                <span className="ml-2 font-mono text-[#111827]">#D97706</span>
              </div>
              <div>
                <span className="text-[#6B7280]">Border color:</span>
                <span className="ml-2 font-mono text-[#111827]">#E5E7EB / #D1D5DB</span>
              </div>
              <div>
                <span className="text-[#6B7280]">Background:</span>
                <span className="ml-2 font-mono text-[#111827]">#FFFFFF / #F9FAFB</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}