import type { ICompanySupport, ICompanySupportBody } from '@/redux/api/supportApi'

export interface OrgSettings {
  name: string
  supportEmail: string
  helplinePhone: string
  dispatcherPhone: string
  emergencyPhone: string
  generalPhone: string
  address: string
  timezone: string
  status: string
}

export const defaultOrgSettings = (): OrgSettings => ({
  name: '',
  supportEmail: '',
  helplinePhone: '',
  dispatcherPhone: '',
  emergencyPhone: '',
  generalPhone: '',
  address: '',
  timezone: 'Eastern Time (ET)',
  status: 'Operational',
})

export const mapApiCompanySupportToOrg = (record?: ICompanySupport | null): OrgSettings => ({
  ...defaultOrgSettings(),
  name: record?.organizationName || '',
  supportEmail: record?.supportEmail || '',
  helplinePhone: record?.helplineNumber || '',
  dispatcherPhone: record?.dispatcherDirectLine || '',
  emergencyPhone: record?.emergencyHotline || '',
  generalPhone: record?.generalOfficeLine || '',
  address: record?.headquartersAddress || '',
})

export const mapOrgSettingsToApiBody = (org: OrgSettings): ICompanySupportBody => ({
  organizationName: org.name.trim(),
  supportEmail: org.supportEmail.trim(),
  helplineNumber: org.helplinePhone.trim(),
  dispatcherDirectLine: org.dispatcherPhone.trim(),
  emergencyHotline: org.emergencyPhone.trim(),
  generalOfficeLine: org.generalPhone.trim(),
  headquartersAddress: org.address.trim(),
})
