import { useState, useRef, useEffect } from 'react';
import { Check, Upload, Edit3, Undo2, Trash2, ArrowRight, Lock } from 'lucide-react';

export default function FirstTimeSignatureSetup() {
  const [activeTab, setActiveTab] = useState<'draw' | 'text' | 'upload'>('draw');
  const [selectedFont, setSelectedFont] = useState<'script' | 'serif' | 'handwritten' | 'sans'>('script');
  const [textSignature, setTextSignature] = useState('Nguyễn Văn A');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [penSize, setPenSize] = useState(2);
  const [penColor, setPenColor] = useState('#000000');

  // Drawing functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setHasSignature(true);
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.strokeStyle = penColor;
    ctx.lineWidth = penSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  // Font style mapping
  const fontStyles = {
    script: { name: 'Chữ ký nghệ thuật', font: 'Brush Script MT, cursive', preview: 'Nguyễn Văn A' },
    serif: { name: 'Trang trọng', font: 'Georgia, serif', preview: 'Nguyễn Văn A' },
    handwritten: { name: 'Viết tay', font: 'Comic Sans MS, cursive', preview: 'Nguyễn Văn A' },
    sans: { name: 'Hiện đại', font: 'Arial, sans-serif', preview: 'Nguyễn Văn A' }
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImage(event.target?.result as string);
        setHasSignature(true);
      };
      reader.readAsDataURL(file);
    }
  };

  // Check if signature is created based on active tab
  const isSignatureComplete = () => {
    if (activeTab === 'draw') return hasSignature;
    if (activeTab === 'text') return textSignature.trim().length > 0;
    if (activeTab === 'upload') return uploadedImage !== null;
    return false;
  };

  const handleComplete = () => {
    alert('Chữ ký đã được thiết lập thành công! Chuyển đến trang chủ...');
    // In real app: save signature and navigate to dashboard
  };

  return (
    <div 
      className="min-h-screen w-full flex items-center justify-center p-6 relative overflow-hidden" 
      style={{ 
        width: '1440px', 
        height: '900px', 
        background: 'linear-gradient(180deg, #FFFFFF 0%, #F9FAFB 100%)'
      }}
    >
      {/* Background Pattern - Viettel Red geometric pattern */}
      <div 
        className="absolute top-0 right-0 w-96 h-96 opacity-5"
        style={{
          backgroundImage: `
            repeating-linear-gradient(45deg, #EE0033 0px, #EE0033 2px, transparent 2px, transparent 20px),
            repeating-linear-gradient(-45deg, #EE0033 0px, #EE0033 2px, transparent 2px, transparent 20px)
          `
        }}
      />

      <div className="w-full md:w-[640px] mx-auto relative z-10">
        {/* TOP CENTER: Logo and subtitle */}
        <div className="text-center mb-8 md:mb-12">
          <div className="flex items-center justify-center mb-3">
            <div className="w-20 md:w-[120px] h-[30px] md:h-[40px] bg-[#EE0033] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl md:text-2xl">VTK</span>
            </div>
          </div>
          <div className="text-xs md:text-sm text-[#6B7280]">Hệ thống Quản lý Xuất Hoá đơn</div>
        </div>

        {/* MAIN CARD - 640px wide */}
        <div className="bg-white rounded-2xl shadow-xl border border-[#E5E7EB] p-4 md:p-10">
          {/* STEP INDICATOR */}
          <div className="mb-8">
            <div className="flex items-center justify-center gap-3 mb-3">
              {/* Step 1 - Completed */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#16A34A] flex items-center justify-center">
                  <Check size={16} className="text-white" strokeWidth={3} />
                </div>
                <span className="text-xs font-medium text-[#6B7280]">Đăng nhập</span>
              </div>
              
              {/* Connecting line */}
              <div className="w-16 h-0.5 bg-[#DC2626]"></div>
              
              {/* Step 2 - Current */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#DC2626] flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-white"></div>
                </div>
                <span className="text-xs font-medium text-[#DC2626]">Chữ ký</span>
              </div>
            </div>
            <div className="text-center text-[13px] text-[#6B7280]">
              Bước 2/2 — Thiết lập chữ ký xác nhận
            </div>
          </div>

          {/* WELCOME TEXT */}
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-[#111827] mb-2">
              Xin chào, Nguyễn Văn A
            </h1>
            <p className="text-sm text-[#6B7280] mb-2">
              Để sử dụng hệ thống, bạn cần thiết lập chữ ký cá nhân.
            </p>
            <p className="text-sm text-[#6B7280]">
              Chữ ký này sẽ tự động được sử dụng khi bạn phê duyệt, từ chối, hoặc tạo cam kết trên hệ thống.
            </p>
          </div>

          {/* 3 METHOD TABS */}
          <div className="border-b border-[#E5E7EB] mb-6">
            <div className="flex -mb-px" style={{ height: '48px' }}>
              <button
                onClick={() => setActiveTab('draw')}
                className={`flex-1 px-4 text-sm font-medium transition-all relative ${
                  activeTab === 'draw'
                    ? 'text-[#DC2626]'
                    : 'text-[#6B7280] hover:text-[#374151]'
                }`}
              >
                <div className="flex items-center justify-center gap-2 h-full">
                  <Edit3 size={16} />
                  <span>Vẽ tay</span>
                </div>
                {activeTab === 'draw' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#DC2626]"></div>
                )}
              </button>
              <button
                onClick={() => setActiveTab('text')}
                className={`flex-1 px-4 text-sm font-medium transition-all relative ${
                  activeTab === 'text'
                    ? 'text-[#DC2626]'
                    : 'text-[#6B7280] hover:text-[#374151]'
                }`}
              >
                <div className="flex items-center justify-center gap-2 h-full">
                  <span className="text-lg">Aa</span>
                  <span>Nhập tên</span>
                </div>
                {activeTab === 'text' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#DC2626]"></div>
                )}
              </button>
              <button
                onClick={() => setActiveTab('upload')}
                className={`flex-1 px-4 text-sm font-medium transition-all relative ${
                  activeTab === 'upload'
                    ? 'text-[#DC2626]'
                    : 'text-[#6B7280] hover:text-[#374151]'
                }`}
              >
                <div className="flex items-center justify-center gap-2 h-full">
                  <Upload size={16} />
                  <span>Tải ảnh lên</span>
                </div>
                {activeTab === 'upload' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#DC2626]"></div>
                )}
              </button>
            </div>
          </div>

          {/* TAB CONTENT */}
          <div className="mb-6">
            {/* DRAW TAB - 540x180px canvas */}
            {activeTab === 'draw' && (
              <div className="space-y-4">
                <div className="relative">
                  <canvas
                    ref={canvasRef}
                    width={540}
                    height={180}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    className="w-full border-2 border-dashed border-[#D1D5DB] rounded-xl bg-white cursor-crosshair"
                    style={{ touchAction: 'none' }}
                  />
                  {!hasSignature && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <Edit3 size={40} className="text-[#D1D5DB] mb-3" />
                      <div className="text-sm text-[#9CA3AF]">
                        Dùng chuột hoặc bút cảm ứng để vẽ chữ ký tại đây
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Controls below canvas */}
                <div className="flex items-center justify-between" style={{ gap: '8px' }}>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={clearCanvas}
                      className="h-9 px-3 bg-white border border-[#D1D5DB] text-[#374151] rounded-lg text-sm font-medium hover:bg-[#F9FAFB] flex items-center gap-2"
                    >
                      <Trash2 size={14} />
                      <span>Xoá</span>
                    </button>
                    <button
                      className="h-9 px-3 bg-white border border-[#D1D5DB] text-[#374151] rounded-lg text-sm font-medium hover:bg-[#F9FAFB] flex items-center gap-2"
                    >
                      <Undo2 size={14} />
                      <span>Hoàn tác</span>
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-[#6B7280]">Độ dày nét:</span>
                      <input
                        type="range"
                        min="1"
                        max="3"
                        value={penSize}
                        onChange={(e) => setPenSize(Number(e.target.value))}
                        className="w-20"
                      />
                    </div>
                    <div 
                      className="w-6 h-6 rounded-full border-2 border-[#E5E7EB]" 
                      style={{ backgroundColor: penColor }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TEXT TAB */}
            {activeTab === 'text' && (
              <div className="space-y-4">
                {/* Input field */}
                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-2">
                    Họ tên hiển thị
                  </label>
                  <input
                    type="text"
                    value={textSignature}
                    onChange={(e) => {
                      setTextSignature(e.target.value);
                      setHasSignature(e.target.value.trim().length > 0);
                    }}
                    placeholder="Nguyễn Văn A"
                    className="w-full h-11 px-4 border border-[#D1D5DB] rounded-lg text-sm text-[#374151] focus:outline-none focus:ring-2 focus:ring-[#DC2626] focus:border-transparent"
                  />
                </div>

                {/* Font style selector - 2x2 grid */}
                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-3">
                    Chọn kiểu chữ
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {(Object.keys(fontStyles) as Array<keyof typeof fontStyles>).map((key) => (
                      <button
                        key={key}
                        onClick={() => setSelectedFont(key)}
                        className={`h-16 border-2 rounded-lg transition-all flex flex-col items-center justify-center ${
                          selectedFont === key
                            ? 'border-[#DC2626] bg-[#FEF2F2]'
                            : 'border-[#E5E7EB] bg-white hover:border-[#D1D5DB]'
                        }`}
                      >
                        <div
                          className="text-lg text-[#111827] mb-1"
                          style={{ 
                            fontFamily: fontStyles[key].font
                          }}
                        >
                          {textSignature || fontStyles[key].preview}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className={`w-3 h-3 rounded-full border-2 flex items-center justify-center ${
                            selectedFont === key
                              ? 'border-[#DC2626]'
                              : 'border-[#D1D5DB]'
                          }`}>
                            {selectedFont === key && (
                              <div className="w-1.5 h-1.5 rounded-full bg-[#DC2626]"></div>
                            )}
                          </div>
                          <span className="text-xs text-[#6B7280]">{fontStyles[key].name}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* UPLOAD TAB */}
            {activeTab === 'upload' && (
              <div className="space-y-4">
                {!uploadedImage ? (
                  <label className="block">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <div 
                      className="border-2 border-dashed border-[#D1D5DB] rounded-xl bg-white flex flex-col items-center justify-center cursor-pointer hover:border-[#DC2626] hover:bg-[#FEF2F2] transition-all"
                      style={{ height: '160px' }}
                    >
                      <Upload size={40} className="text-[#D1D5DB] mb-3" />
                      <div className="text-sm text-[#6B7280] mb-1">
                        Kéo thả hoặc nhấn để tải ảnh chữ ký
                      </div>
                      <div className="text-xs text-[#9CA3AF]">
                        PNG nền trong suốt, tối đa 2MB
                      </div>
                    </div>
                  </label>
                ) : (
                  <div className="space-y-3">
                    <div 
                      className="border border-[#E5E7EB] rounded-xl bg-white flex items-center justify-center p-4"
                      style={{ height: '160px' }}
                    >
                      <img
                        src={uploadedImage}
                        alt="Uploaded signature"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setUploadedImage(null);
                          setHasSignature(false);
                        }}
                        className="h-9 px-4 bg-white border border-[#D1D5DB] text-[#374151] rounded-lg text-sm font-medium hover:bg-[#F9FAFB] flex items-center gap-2"
                      >
                        <Trash2 size={14} />
                        Xoá
                      </button>
                      <label className="h-9 px-4 bg-white border border-[#D1D5DB] text-[#374151] rounded-lg text-sm font-medium hover:bg-[#F9FAFB] flex items-center gap-2 cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                        Thay ảnh khác
                      </label>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* PREVIEW SECTION */}
          <div className="mb-6">
            {/* Separator */}
            <div className="h-px bg-[#E5E7EB] mb-6"></div>
            
            <div className="text-[13px] font-medium text-[#6B7280] mb-4">
              Xem trước chữ ký trên tài liệu:
            </div>
            
            {/* Preview card */}
            <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg p-4">
              <div className="flex items-center gap-4">
                {/* Signature Preview - 180x50px */}
                <div 
                  className="border border-[#E5E7EB] rounded bg-white flex items-center justify-center flex-shrink-0"
                  style={{ width: '180px', height: '50px' }}
                >
                  {activeTab === 'draw' && hasSignature && canvasRef.current ? (
                    <canvas
                      ref={(canvas) => {
                        if (canvas && canvasRef.current) {
                          const ctx = canvas.getContext('2d');
                          if (ctx) {
                            ctx.clearRect(0, 0, 180, 50);
                            ctx.drawImage(canvasRef.current, 0, 0, 540, 180, 0, 0, 180, 50);
                          }
                        }
                      }}
                      width={180}
                      height={50}
                      className="max-w-full max-h-full"
                    />
                  ) : activeTab === 'text' && textSignature.trim() ? (
                    <div
                      className="text-base text-[#111827] px-2"
                      style={{
                        fontFamily: fontStyles[selectedFont].font
                      }}
                    >
                      {textSignature}
                    </div>
                  ) : activeTab === 'upload' && uploadedImage ? (
                    <img
                      src={uploadedImage}
                      alt="Signature preview"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <div className="text-xs text-[#D1D5DB] italic">[Chữ ký]</div>
                  )}
                </div>

                {/* Right column - Signer Info */}
                <div className="flex-1 space-y-1">
                  <div className="text-sm font-medium text-[#111827]">Nguyễn Văn A</div>
                  <div className="text-[13px] text-[#6B7280]">Kế toán viên — P. Tài chính Kế toán</div>
                  <div className="text-xs text-[#9CA3AF]">13/03/2026 09:30:00</div>
                  <div className="flex items-center gap-1.5 text-[11px] text-[#9CA3AF] pt-1">
                    <Lock size={12} className="text-[#9CA3AF]" />
                    <span>Chữ ký được lưu vào tài khoản</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* BOTTOM ACTIONS */}
          <button
            onClick={handleComplete}
            disabled={!isSignatureComplete()}
            className={`w-full h-12 rounded-lg text-base font-semibold flex items-center justify-center gap-2 transition-all ${
              isSignatureComplete()
                ? 'bg-[#DC2626] text-white hover:bg-[#B91C1C] cursor-pointer shadow-sm'
                : 'bg-[#D1D5DB] text-[#6B7280] cursor-not-allowed'
            }`}
          >
            <span>Hoàn tất thiết lập</span>
            <ArrowRight size={16} />
          </button>

          {/* Below button text */}
          <div className="text-center text-xs text-[#9CA3AF] mt-4">
            Bạn có thể thay đổi chữ ký sau trong Cài đặt &gt; Chữ ký số
          </div>
        </div>
      </div>
    </div>
  );
}