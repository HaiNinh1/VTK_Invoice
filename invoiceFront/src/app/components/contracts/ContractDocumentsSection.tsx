import { useRef, useState } from 'react';
import { Download, FileText, Loader2, Trash2, Upload } from 'lucide-react';
import { Button } from '../ui/button';
import {
  useContractDocuments,
  useUploadContractDocument,
  useDeleteContractDocument,
} from '../../../lib/api/queries';
import { contractsApi } from '../../../lib/api/endpoints/masters';
import { ApiError } from '../../../lib/api/errors';

interface ContractDocumentsSectionProps {
  contractId: number;
  canManage: boolean;
}

interface DocRow {
  id: number;
  original_filename?: string;
  file_size?: number | string;
  mime_type?: string | null;
  kind?: string | null;
  document_type?: string | null;
  created_at?: string;
}

// Backend mime allow-list mirrors StoreContractDocumentRequest:
// pdf, doc, docx, xls, xlsx, jpg, jpeg, png. Max 10 MB.
const ACCEPT_EXT = '.pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png';
const ACCEPT_MIMES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/jpg',
  'image/png',
]);
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

function formatBytes(n: number | string | undefined): string {
  if (n == null) return '—';
  const num = typeof n === 'number' ? n : Number(n);
  if (!Number.isFinite(num)) return '—';
  if (num < 1024) return `${num} B`;
  if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
  return `${(num / (1024 * 1024)).toFixed(2)} MB`;
}

export default function ContractDocumentsSection({
  contractId,
  canManage,
}: ContractDocumentsSectionProps) {
  const listQuery = useContractDocuments(contractId);
  const uploadMut = useUploadContractDocument(contractId);
  const deleteMut = useDeleteContractDocument(contractId);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const docs: DocRow[] = ((listQuery.data ?? []) as unknown) as DocRow[];

  async function handleFile(file: File) {
    setUploadError(null);

    // Client-side validation mirroring backend rules.
    const isMimeOk = !file.type || ACCEPT_MIMES.has(file.type);
    const lower = file.name.toLowerCase();
    const hasOkExt = ACCEPT_EXT.split(',').some((ext) => lower.endsWith(ext));
    if (!isMimeOk || !hasOkExt) {
      setUploadError(
        'Định dạng file không hợp lệ. Chấp nhận: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG.'
      );
      return;
    }
    if (file.size > MAX_BYTES) {
      setUploadError('File vượt quá 10 MB.');
      return;
    }

    try {
      // Backend's StoreContractDocumentRequest validates `kind`; the frontend
      // hook currently forwards `document_type` which backend ignores, so the
      // server-side default `kind=contract` is applied. Don't expose this yet.
      await uploadMut.mutateAsync({ file, documentType: 'contract' });
    } catch (e) {
      const msg =
        e instanceof ApiError ? e.message : e instanceof Error ? e.message : 'Tải lên thất bại';
      setUploadError(msg);
    } finally {
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  async function handleDownload(doc: DocRow) {
    try {
      setDownloadingId(doc.id);
      await contractsApi.documents.download(contractId, doc.id);
    } catch (e) {
      const msg =
        e instanceof ApiError ? e.message : e instanceof Error ? e.message : 'Tải xuống thất bại';
      alert(msg);
    } finally {
      setDownloadingId(null);
    }
  }

  async function handleDelete(doc: DocRow) {
    if (!window.confirm(`Xoá tài liệu "${doc.original_filename ?? doc.id}"?`)) return;
    try {
      setDeletingId(doc.id);
      await deleteMut.mutateAsync(doc.id);
    } catch (e) {
      const msg =
        e instanceof ApiError ? e.message : e instanceof Error ? e.message : 'Xoá thất bại';
      alert(msg);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-[#111827]">
          Tài liệu hợp đồng ({docs.length})
        </h3>
        {canManage && (
          <>
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPT_EXT}
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleFile(f);
              }}
            />
            <Button
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                inputRef.current?.click();
              }}
              disabled={uploadMut.isPending}
              className="h-8 px-3 text-xs"
            >
              {uploadMut.isPending ? (
                <Loader2 size={14} className="mr-1 animate-spin" />
              ) : (
                <Upload size={14} className="mr-1" />
              )}
              Tải lên tài liệu
            </Button>
          </>
        )}
      </div>

      {uploadError && (
        <div className="bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-xs rounded-md px-3 py-2 mb-3">
          {uploadError}
        </div>
      )}

      {listQuery.isLoading && (
        <div className="py-6 flex items-center justify-center gap-2 text-[#6B7280] text-sm">
          <Loader2 size={16} className="animate-spin" />
          <span>Đang tải tài liệu...</span>
        </div>
      )}

      {!listQuery.isLoading && docs.length === 0 && (
        <div className="py-6 text-center text-sm text-[#6B7280]">
          Hợp đồng chưa có tài liệu nào.
        </div>
      )}

      <div className="space-y-2">
        {docs.map((doc) => (
          <div
            key={doc.id}
            className="flex items-center justify-between border border-[#E5E7EB] rounded-md px-3 py-2"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <FileText size={18} className="text-[#6B7280] shrink-0" />
              <div className="min-w-0">
                <div className="text-sm font-medium text-[#111827] truncate">
                  {doc.original_filename ?? `Tài liệu #${doc.id}`}
                </div>
                <div className="text-xs text-[#6B7280]">
                  {formatBytes(doc.file_size)}
                  {doc.kind ? ` · ${doc.kind}` : doc.document_type ? ` · ${doc.document_type}` : ''}
                  {doc.created_at ? ` · ${new Date(doc.created_at).toLocaleDateString('vi-VN')}` : ''}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  void handleDownload(doc);
                }}
                disabled={downloadingId === doc.id}
                className="h-8 px-2 text-xs"
              >
                {downloadingId === doc.id ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Download size={14} />
                )}
              </Button>
              {canManage && (
                <Button
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    void handleDelete(doc);
                  }}
                  disabled={deletingId === doc.id}
                  className="h-8 px-2 text-xs text-[#991B1B] border-[#FECACA] hover:bg-[#FEF2F2]"
                >
                  {deletingId === doc.id ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Trash2 size={14} />
                  )}
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
