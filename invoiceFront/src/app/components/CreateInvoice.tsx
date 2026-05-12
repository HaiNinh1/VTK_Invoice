import CreateInvoiceRoleBased from './CreateInvoiceRoleBased';

interface CreateInvoiceProps {
  onBack?: () => void;
  requestId?: string;
  status?: 'draft' | 'pending' | 'approved' | 'rejected' | 'returned' | 'issued';
  isOwner?: boolean;
  ownerInfo?: {
    name: string;
    department: string;
    date: string;
  };
  rejectionReason?: string;
  returnReason?: string;
  onNavigateToView?: (view: string) => void;
}

export default function CreateInvoice({
  onBack,
  requestId,
  status = 'draft',
  isOwner = true,
  ownerInfo,
  rejectionReason,
  returnReason,
  onNavigateToView
}: CreateInvoiceProps) {
  return (
    <CreateInvoiceRoleBased
      onBack={onBack || (() => {})}
      requestId={requestId}
      status={status}
      isOwner={isOwner}
      ownerInfo={ownerInfo}
      rejectionReason={rejectionReason}
      returnReason={returnReason}
      onNavigateToView={onNavigateToView}
    />
  );
}