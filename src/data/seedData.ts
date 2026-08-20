import { AuditLog, CitizenReport, User } from '../types';

// Login demo accounts - legitimate interactive app state, not GIS analytics data.
export const DEMO_USERS: User[] = [
  {
    id: 'usr-off-1',
    name: 'Dr. Rajeshwar Sharma, IAS',
    email: 'rajeshwar.sharma@glis.gov.in',
    role: 'official',
    designation: 'District Development Officer (DDO)',
    department: 'Urban Development & Infrastructure Board',
    jurisdiction: 'Ahmedabad District',
    district: 'Ahmedabad',
    state: 'Gujarat',
    phone: '+91 98765 43210',
  },
  {
    id: 'usr-cit-1',
    name: 'Kavita Patel',
    email: 'kavita.patel@citizen.in',
    role: 'citizen',
    district: 'Ahmedabad',
    state: 'Gujarat',
    phone: '+91 98111 22334',
  },
  {
    id: 'usr-adm-1',
    name: 'Ananya Deshmukh',
    email: 'admin@glis.gov.in',
    role: 'admin',
    designation: 'Chief Geospatial Data Administrator',
    department: 'National Land Records & GIS Directorate',
    jurisdiction: 'National & State Level Operations',
    state: 'Gujarat',
    phone: '+91 98222 33445',
  },
];

// Citizen grievances are submitted by users at runtime - start empty rather
// than backfilled with invented reports.
export const CITIZEN_REPORTS: CitizenReport[] = [];

// Audit logs record real actions taken in the running app - start empty.
export const AUDIT_LOGS: AuditLog[] = [];
