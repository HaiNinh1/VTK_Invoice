# VTK Invoice System - Signature Components Documentation

## Overview
Complete design system for account-linked digital signatures in the VTK Invoice System. All components use Vietnamese labels and follow the Viettel VTK brand identity (primary color: #EE0033).

## Component Library Location
All signature components are exported from `/src/app/components/UIStates.tsx`

## Components

### 1. SignaturePreview
**Purpose:** Display read-only signature preview in approval forms and commitment documents

**Variants:**
- `default` (200×60px) - Simple signature display with lock icon
- `with-info` (320×80px) - Signature + signer information panel

**Props:**
```typescript
interface SignaturePreviewProps {
  signatureName: string;      // Name to display in signature
  variant?: 'default' | 'with-info';
  userName?: string;           // Full name of signer
  userTitle?: string;          // Job title & department
  signedAt?: string;           // Timestamp "Ký lúc: DD/MM/YYYY HH:MM:SS"
  className?: string;
}
```

**Usage:**
```tsx
import { SignaturePreview } from './components/UIStates';

// Default variant
<SignaturePreview signatureName="Nguyễn Văn A" />

// With info variant
<SignaturePreview 
  variant="with-info"
  signatureName="Nguyễn Văn A"
  userName="Nguyễn Văn A"
  userTitle="Chuyên viên — P. Kỹ thuật Công nghệ"
  signedAt="Ký lúc: 13/03/2026 10:15:42"
/>
```

**Visual Specs:**
- Border: 1px #E5E7EB
- Border radius: 8px
- Background: White
- Lock icon: 12px, bottom-right corner, #D1D5DB
- Font: font-serif italic for signature name

---

### 2. SignatureStamp
**Purpose:** Compact signature display for timeline entries and audit trails

**Size:** 120×35px (compact)

**Props:**
```typescript
interface SignatureStampProps {
  signatureName: string;
  className?: string;
}
```

**Usage:**
```tsx
import { SignatureStamp } from './components/UIStates';

<SignatureStamp signatureName="Hoàng Văn E" />
```

**Visual Specs:**
- Height: 35px
- Padding: 4px horizontal, 2px vertical
- Background: #F9FAFB
- Border: 1px #E5E7EB
- Border radius: 6px
- Lock icon: 10px, #9CA3AF

**Use Cases:**
- Below timeline steps in approval workflows
- Inline in audit trail logs
- Quick signature references in lists

---

### 3. NoSignatureWarning
**Purpose:** Alert users when signature is not set up

**Variants:**
- `inline` - Single line warning with link
- `card` - Full card with message and CTA button (320×80px)
- `modal` - Modal blocker variant

**Props:**
```typescript
interface NoSignatureWarningProps {
  variant?: 'inline' | 'card' | 'modal';
  onSetup?: () => void;         // Callback for setup link/button
  className?: string;
}
```

**Usage:**
```tsx
import { NoSignatureWarning } from './components/UIStates';

// Inline variant
<NoSignatureWarning 
  variant="inline"
  onSetup={() => navigate('/settings/signature')}
/>

// Card variant
<NoSignatureWarning 
  variant="card"
  onSetup={() => navigate('/settings/signature')}
/>

// Modal blocker
<NoSignatureWarning variant="modal" />
```

**Visual Specs:**
- Colors: #FFFBEB background, #F59E0B border, #D97706 icon, #92400E text
- Warning icon: AlertTriangle from lucide-react
- Inline: Single line with "⚠ Chưa có chữ ký. [Thiết lập →]"
- Card: Full message + orange button
- Modal: Heading + description

---

### 4. SignatureSetupButton
**Purpose:** Action button for signature setup/change

**States:**
- No signature: Primary red button with pulse animation
- Has signature: Outline button

**Props:**
```typescript
interface SignatureSetupButtonProps {
  hasSignature: boolean;
  onClick?: () => void;
  className?: string;
}
```

**Usage:**
```tsx
import { SignatureSetupButton } from './components/UIStates';

// User has no signature
<SignatureSetupButton 
  hasSignature={false}
  onClick={() => setShowSignatureModal(true)}
/>

// User has signature
<SignatureSetupButton 
  hasSignature={true}
  onClick={() => setShowSignatureModal(true)}
/>
```

**Visual Specs:**
- Height: 40px (h-10)
- Icon: Edit3 (pen), 16px
- No signature state:
  - Background: #DC2626
  - Text: White
  - Animation: animate-pulse
  - Label: "Thiết lập chữ ký ngay"
- Has signature state:
  - Background: White
  - Border: 1px #D1D5DB
  - Text: #374151
  - Label: "Thay đổi chữ ký"

---

## Implementation Examples

### Example 1: Approval Modal with Auto-Signature
```tsx
const ApprovalModal = ({ hasSignature }: { hasSignature: boolean }) => {
  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-[#374151] mb-2">
        Chữ ký xác nhận <span className="text-[#DC2626]">*</span>
      </label>
      
      {hasSignature ? (
        <>
          <SignaturePreview 
            variant="with-info"
            signatureName="Hoàng Văn E"
            userName="Hoàng Văn E"
            userTitle="Trưởng phòng — P. Kế toán"
            signedAt="Sẽ ký vào: 13/03/2026 15:24"
          />
          <div className="flex items-center gap-1 text-[10px] text-[#9CA3AF] mt-2">
            🔒 Chữ ký được lấy từ tài khoản cá nhân
          </div>
          <button className="w-full h-11 bg-[#16A34A] text-white rounded-lg">
            Xác nhận phê duyệt
          </button>
        </>
      ) : (
        <>
          <NoSignatureWarning 
            variant="card"
            onSetup={() => navigate('/settings/signature')}
          />
          <button disabled className="w-full h-11 bg-[#E5E7EB] text-[#9CA3AF] rounded-lg cursor-not-allowed">
            Xác nhận phê duyệt (Cần thiết lập chữ ký trước)
          </button>
        </>
      )}
    </div>
  );
};
```

### Example 2: Timeline with Signature Stamps
```tsx
const ApprovalTimeline = () => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 bg-[#16A34A] rounded-full"></div>
        <div className="flex-1">
          <div className="text-sm text-[#374151]">Đã phê duyệt</div>
          <div className="text-xs text-[#6B7280] mt-1">13/03/2026 14:30</div>
          <div className="mt-2">
            <SignatureStamp signatureName="Hoàng Văn E" />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 bg-[#16A34A] rounded-full"></div>
        <div className="flex-1">
          <div className="text-sm text-[#374151]">Đã tạo cam kết</div>
          <div className="text-xs text-[#6B7280] mt-1">13/03/2026 10:15</div>
          <div className="mt-2">
            <SignatureStamp signatureName="Nguyễn Văn A" />
          </div>
        </div>
      </div>
    </div>
  );
};
```

### Example 3: Settings Page
```tsx
const SignatureSettings = ({ hasSignature }: { hasSignature: boolean }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-[#111827]">Chữ ký số</h3>
      <p className="text-sm text-[#6B7280]">
        Thiết lập chữ ký số của bạn. Chữ ký sẽ được tự động gắn khi phê duyệt hoặc tạo cam kết.
      </p>
      
      {hasSignature ? (
        <div className="space-y-3">
          <SignaturePreview signatureName="Nguyễn Văn A" />
          <div className="text-xs text-[#6B7280]">
            Đã thiết lập: 01/01/2026 09:00
          </div>
          <SignatureSetupButton 
            hasSignature={true}
            onClick={() => setShowModal(true)}
          />
        </div>
      ) : (
        <div className="space-y-3">
          <NoSignatureWarning variant="card" />
          <SignatureSetupButton 
            hasSignature={false}
            onClick={() => setShowModal(true)}
          />
        </div>
      )}
    </div>
  );
};
```

---

## Design Tokens

### Colors
- **Primary Red:** #EE0033 (Viettel Red)
- **Warning Amber:** #D97706, #FFFBEB (bg), #F59E0B (border)
- **Success Green:** #16A34A, #D1FAE5 (bg)
- **Error Red:** #DC2626, #FEE2E2 (bg)
- **Border:** #E5E7EB, #D1D5DB
- **Background:** #FFFFFF, #F9FAFB
- **Text:** #111827, #374151, #6B7280, #9CA3AF

### Typography
- **Signature font:** font-serif italic
- **Font sizes:** 10px, 11px, 12px, 13px, 14px, 16px, 18px
- **Font weights:** 400 (normal), 500 (medium), 600 (semibold), 700 (bold)

### Spacing
- **Component padding:** 8px, 12px, 16px, 24px
- **Border radius:** 6px (small), 8px (medium), 12px (large)
- **Icon sizes:** 10px, 12px, 14px, 16px, 18px, 20px

### Animations
- **Pulse:** animate-pulse (for setup button when no signature)
- **Transitions:** transition-colors, transition-all

---

## Integration Points

### 1. Settings > Chữ ký số
- Display current signature with SignaturePreview
- Show SignatureSetupButton
- Handle no-signature state with NoSignatureWarning

### 2. Approval Screen
- Auto-populate SignaturePreview with-info variant
- Block approval if no signature with NoSignatureWarning modal variant
- Display confirmation with lock icon

### 3. Create Invoice Form - Commitment Section
- Show SignaturePreview in read-only commitment card
- Display NoSignatureWarning inline if no signature
- Disable submit button when hasSignature=false

### 4. Commitment Tracking - View Modal
- Display SignaturePreview with-info showing snapshot signature
- Include timestamp: "Ký lúc: DD/MM/YYYY HH:MM:SS"
- Show lock icon message: "Chữ ký lấy từ tài khoản tại thời điểm tạo cam kết"

### 5. Timeline/Audit Trail
- Use SignatureStamp for compact display
- Place below timeline steps
- Show in gray-50 background

---

## Demo/Showcase

To view all signature components in action, import and render the SignatureShowcase component:

```tsx
import SignatureShowcase from './components/SignatureShowcase';

// Render in your dev/demo route
<SignatureShowcase />
```

The showcase includes:
- All 4 component variants
- Usage examples in real contexts
- Technical specifications table
- Design token reference
- Interactive examples with state toggles

---

## Best Practices

1. **Always check hasSignature state** before rendering signature-required UI
2. **Use variant="with-info"** for important confirmation screens
3. **Include lock icon messages** to indicate auto-signature from account
4. **Disable action buttons** when no signature exists
5. **Show clear warnings** with NoSignatureWarning when signature missing
6. **Use SignatureStamp** for space-constrained areas like timelines
7. **Snapshot vs Live:** Store signature snapshot at creation time, not live reference

---

## Accessibility

- All buttons have proper focus states
- Lock icons use semantic colors (#9CA3AF for info)
- Warning states use appropriate colors and icons
- Text contrast meets WCAG AA standards
- Vietnamese labels throughout for localization

---

## File Structure
```
/src/app/components/
  ├── UIStates.tsx              # All signature components + other UI states
  ├── SignatureShowcase.tsx     # Demo/documentation page
  ├── Settings.tsx              # Signature settings implementation
  ├── Approval.tsx              # Auto-signature approval modal
  ├── CreateInvoice.tsx         # Commitment with auto-signature
  └── CommitmentTracking.tsx    # View commitment with signature snapshot
```

---

## Version
VTK Invoice System v1.0  
Last updated: March 13, 2026  
Design System: Vietnamese labels, Viettel VTK branding
