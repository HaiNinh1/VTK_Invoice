import { Routes, Route } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import ViecCanLam from '@/pages/ViecCanLam'
import HopDong    from '@/pages/HopDong'
import DeNghi     from '@/pages/DeNghi'
import DeNghiForm from '@/pages/DeNghiForm'
import PhapLy     from '@/pages/PhapLy'
import PheDuyet   from '@/pages/PheDuyet'
import SInvoice   from '@/pages/SInvoice'
import CaiDat     from '@/pages/CaiDat'
import NotFound   from '@/pages/NotFound'

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/"          element={<ViecCanLam />} />
        <Route path="/hop-dong"  element={<HopDong    />} />
        <Route path="/hop-dong/:id" element={<HopDong />} />
        <Route path="/hop-dong/moi" element={<HopDong />} />
        <Route path="/de-nghi"        element={<DeNghi     />} />
        <Route path="/de-nghi/moi"    element={<DeNghiForm />} />
        <Route path="/de-nghi/:id"    element={<DeNghiForm />} />
        <Route path="/phap-ly"   element={<PhapLy     />} />
        <Route path="/phe-duyet" element={<PheDuyet   />} />
        <Route path="/phe-duyet/:id" element={<PheDuyet />} />
        <Route path="/s-invoice" element={<SInvoice   />} />
        <Route path="/cai-dat"   element={<CaiDat     />} />
        <Route path="*"          element={<NotFound   />} />
      </Route>
    </Routes>
  )
}
