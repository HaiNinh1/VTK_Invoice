import ApprovalRoleBased from './ApprovalRoleBased';

interface ApprovalProps {
  userRole?: 'employee' | 'manager' | 'accountant' | 'director' | 'admin';
}

export default function Approval({ userRole = 'accountant' }: ApprovalProps) {
  return <ApprovalRoleBased userRole={userRole} />;
}