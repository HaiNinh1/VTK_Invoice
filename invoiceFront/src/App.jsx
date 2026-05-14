import { Routes, Route } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import ViecCanLam   from '@/pages/ViecCanLam'
import HopDong      from '@/pages/HopDong'
import HopDongDetail from '@/pages/HopDongDetail'
import HopDongForm  from '@/pages/HopDongForm'
import DeNghi       from '@/pages/DeNghi'
import DeNghiForm   from '@/pages/DeNghiForm'
import PheDuyet     from '@/pages/PheDuyet'
import SInvoice     from '@/pages/SInvoice'
import CaiDat       from '@/pages/CaiDat'
import ThongBao     from '@/pages/ThongBao'
import HoSoCaNhan   from '@/pages/HoSoCaNhan'
import Login        from '@/pages/Login'
import NotFound     from '@/pages/NotFound'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<AppShell />}>
        <Route path="/"             element={<ViecCanLam />} />
        <Route path="/hop-dong"     element={<HopDong />} />
        <Route path="/hop-dong/moi"     element={<HopDongForm />} />
        <Route path="/hop-dong/:id"     element={<HopDongDetail />} />
        <Route path="/hop-dong/:id/sua" element={<HopDongForm />} />
        <Route path="/de-nghi"        element={<DeNghi     />} />
        <Route path="/de-nghi/moi"    element={<DeNghiForm />} />
        <Route path="/de-nghi/:id"    element={<DeNghiForm />} />
        <Route path="/phe-duyet" element={<PheDuyet   />} />
        <Route path="/phe-duyet/:id" element={<PheDuyet />} />
        <Route path="/s-invoice" element={<SInvoice   />} />
        <Route path="/cai-dat"   element={<CaiDat     />} />
        <Route path="/thong-bao" element={<ThongBao   />} />
        <Route path="/ho-so-ca-nhan" element={<HoSoCaNhan />} />
        <Route path="*"          element={<NotFound   />} />
      </Route>
    </Routes>
  )
}
